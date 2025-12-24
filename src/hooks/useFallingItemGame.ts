import { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, GameState, FallingItem, FloatingScore } from '@/types/gameTypes';
import { useToast } from '@/hooks/use-toast';
import { useScoreboard } from '@/hooks/useScoreboard';
import { trackGameStart, trackGameEnd, trackScoreSubmit } from '@/lib/analytics';
import { getNicknameFromUrlOrStorage } from '@/lib/utils';
import { detectNativeApp, requestGameStart, listenToNative, notifyGameEnd, NativeMessage } from '@/lib/nativeCommunication';
import { REQUIRE_NATIVE_APP } from '@/config/gameConfig';
import { generateSessionId, resetSessionId, checkAndLogAnomalies, logUnexpectedGameOver } from '@/lib/errorLogger';

export function useFallingItemGame<T extends FallingItem = FallingItem>(
  config: GameConfig<T>
) {
  const [gameState, setGameState] = useState<GameState<T>>({
    items: [],
    score: 0,
    timeLeft: config.timeLimit,
    gameOver: false,
    gameStarted: false,
    countdown: null,
    showNativeMessage: false,
    startButtonEnabled: true,
    isProcessingStart: false,
  });

  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [nativeAppInfo] = useState(detectNativeApp());
  const [floatingScore, setFloatingScore] = useState<FloatingScore | null>(null);
  const gameLoopRef = useRef<number>();
  const sequentialSpawnTimeoutRef = useRef<NodeJS.Timeout>();
  const fullyVisibleItemIdsRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  const { checkQualifiesForTop10, submitScore } = useScoreboard();

  // 아이템 생성 함수
  const spawnItem = useCallback(() => {
    setGameState((prev) => {
      const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);
      // 좌우 10px 간격 유지 (텍스트 박스 중앙 기준으로 배치)
      // 박스 너비를 고려하여 중앙점이 배치될 수 있는 범위 설정
      const minXPercent = 10;  // 최소 10px 간격 (좌측 여백 + 박스 절반)
      const maxXPercent = 90;  // 최소 10px 간격 (우측 여백 + 박스 절반)
      const minHorizontalGap = config.spawnSpacing?.minHorizontalGap ?? 12;
      const minVerticalGap = config.spawnSpacing?.minVerticalGap ?? 10;
      const maxAttempts = config.spawnSpacing?.maxAttempts ?? 10;
      const maxVerticalShift = config.spawnSpacing?.maxVerticalShift ?? 60;
      const randomX = () =>
        clamp(Math.random() * (maxXPercent - minXPercent) + minXPercent, minXPercent, maxXPercent);

      let baseItem: T;

      if (config.customSpawnItem) {
        baseItem = config.customSpawnItem(
          config.data,
          config.colors,
          config.correctProbability,
          config.speedRange
        );
      } else {
        const dataItem = config.data[Math.floor(Math.random() * config.data.length)];
        const isCorrect = Math.random() < config.correctProbability;

        baseItem = {
          id: `${Date.now()}-${Math.random()}`,
          text: dataItem.name,
          isCorrect: isCorrect,
          color: config.colors[Math.floor(Math.random() * config.colors.length)],
          x: randomX(),
          y: -10,
          speed:
            config.speedRange.min +
            Math.random() * (config.speedRange.max - config.speedRange.min),
        } as T;
      }

      const overlaps = (candidateX: number, candidateY: number) =>
        prev.items.some((item) => {
          const horizontalDistance = Math.abs(item.x - candidateX);
          const verticalDistance = Math.abs(item.y - candidateY);
          // 수직 간격을 엄격하게 체크: 박스가 절대 같은 높이에서 시작하지 않도록
          // 수직 거리가 minVerticalGap 미만이면 무조건 겹침으로 간주
          if (verticalDistance < minVerticalGap) {
            return true;
          }
          // 수평 거리도 체크
          return horizontalDistance < minHorizontalGap && verticalDistance < minVerticalGap * 1.5;
        });

      let resolvedX = clamp(baseItem.x ?? randomX(), minXPercent, maxXPercent);
      let resolvedY = baseItem.y ?? -10;

      let attempt = 0;
      while (attempt < maxAttempts && overlaps(resolvedX, resolvedY)) {
        resolvedX = randomX();
        attempt++;
      }

      if (overlaps(resolvedX, resolvedY)) {
        let verticalShift = minVerticalGap;
        const minAllowedY = -maxVerticalShift;
        while (verticalShift <= maxVerticalShift) {
          const shiftedY = Math.max(resolvedY - verticalShift, minAllowedY);
          if (!overlaps(resolvedX, shiftedY)) {
            resolvedY = shiftedY;
            break;
          }
          verticalShift += minVerticalGap;
        }
      }

      const uniformSpeed =
        config.uniformSpeed ??
        baseItem.speed ??
        (config.speedRange.min + config.speedRange.max) / 2;

      const newItem: T = {
        ...baseItem,
        x: resolvedX,
        y: resolvedY,
        speed: uniformSpeed,
      };

      return {
        ...prev,
        items: [...prev.items, newItem],
      };
    });
  }, [config]);

  // 아이템 클릭 핸들러
  const handleItemClick = useCallback(
    (item: T) => {
      let newScore: number;
      let pointChange: number;

      if (config.customHandleItemClick) {
        const result = config.customHandleItemClick(item, gameState.score);
        newScore = result.newScore;
        pointChange = result.pointChange;
      } else {
        pointChange = item.isCorrect ? config.correctPoints : config.incorrectPoints;
        newScore = Math.max(0, gameState.score + pointChange);
      }

      // 점수 애니메이션 표시
      setFloatingScore({
        id: `${Date.now()}-${Math.random()}`,
        isCorrect: item.isCorrect,
        points: pointChange,
      });

      // 애니메이션 제거
      setTimeout(() => {
        setFloatingScore(null);
      }, 1000);

      setGameState((prev) => ({
        ...prev,
        score: newScore,
        items: prev.items.filter((i) => i.id !== item.id),
      }));
    },
    [gameState.score, config]
  );

  // 아이템 이동 (delta time 기반)
  const lastTimeRef = useRef<number>(0);
  const TARGET_FPS = 60;
  const TARGET_FRAME_TIME = 1000 / TARGET_FPS; // 약 16.67ms

  const moveItems = useCallback((currentTime: number) => {
    const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : TARGET_FRAME_TIME;
    lastTimeRef.current = currentTime;

    // delta time을 기준 프레임 시간으로 정규화 (60fps 기준)
    const deltaMultiplier = deltaTime / TARGET_FRAME_TIME;

    setGameState((prev) => {
      if (!prev.gameStarted || prev.gameOver) return prev;

      const updatedItems = prev.items
        .map((item) => ({
          ...item,
          y: item.y + item.speed * deltaMultiplier,
        }))
        .filter((item) => item.y < 100); // 화면을 벗어난 아이템 제거

      return {
        ...prev,
        items: updatedItems,
      };
    });
  }, []);

  // 게임 리셋
  const resetGame = useCallback(() => {
    // 세션 ID 리셋 (새 게임은 새 세션으로 기록)
    resetSessionId();

    if (sequentialSpawnTimeoutRef.current) {
      clearTimeout(sequentialSpawnTimeoutRef.current);
      sequentialSpawnTimeoutRef.current = undefined;
    }
    fullyVisibleItemIdsRef.current.clear();
    setGameState({
      items: [],
      score: 0,
      timeLeft: config.timeLimit,
      gameOver: false,
      gameStarted: false,
      countdown: null,
      showNativeMessage: false,
      startButtonEnabled: true,
      isProcessingStart: false,
    });
    setScoreSubmitted(false);
    setFloatingScore(null);
  }, [config.timeLimit]);

  // 게임 직접 시작 (Native 앱 승인 후)
  const startGameDirectly = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      countdown: 3,
      showNativeMessage: false,
      isProcessingStart: false,
    }));
    trackGameStart();
  }, []);

  // 게임 시작 (Native 앱 체크 포함)
  const startGame = useCallback(() => {
    // 버튼이 비활성화되어 있거나 이미 처리 중이면 무시
    if (!gameState.startButtonEnabled || gameState.isProcessingStart) return;

    // 새 세션 ID 생성 (에러 로깅 시 세션 추적용)
    generateSessionId();

    // 처리 중 상태로 변경
    setGameState(prev => ({
      ...prev,
      isProcessingStart: true,
      startButtonEnabled: false,
    }));

    // localhost나 REQUIRE_NATIVE_APP이 false일 때 바로 시작
    if (window.location.hostname === 'localhost' || !REQUIRE_NATIVE_APP) {
      startGameDirectly();
    } else if (nativeAppInfo.isNative) {
      // Native 앱에서는 승인 요청
      requestGameStart();
    } else {
      // Native 앱이 아니면 메시지 표시
      setGameState(prev => ({
        ...prev,
        showNativeMessage: true,
        isProcessingStart: false,
      }));
    }
  }, [nativeAppInfo.isNative, startGameDirectly, gameState.startButtonEnabled, gameState.isProcessingStart]);

  // 자동 점수 제출
  const handleAutoSubmitScore = useCallback(
    async (score: number) => {
      if (scoreSubmitted || score === 0) return;

      setScoreSubmitted(true);
      const playerName = getNicknameFromUrlOrStorage();
      const result = await submitScore(score);

      if (result.success) {
        trackScoreSubmit(score, playerName);
        // Navigate to leaderboard
        setTimeout(() => {
          window.location.href = '/scoreboard';
        }, 1500);
      } else if (result.shouldShowError) {
        toast({
          title: 'Submission Failed',
          description: 'Please try again later',
          variant: 'destructive',
        });
      }
    },
    [scoreSubmitted, submitScore, toast]
  );

  // 카운트다운 로직
  useEffect(() => {
    if (gameState.countdown !== null && gameState.countdown > 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => {
          // null 체크: countdown이 이미 null이면 상태 변경하지 않음
          if (prev.countdown === null || prev.countdown <= 0) {
            return prev;
          }
          return {
            ...prev,
            countdown: prev.countdown - 1,
          };
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.countdown === 0) {
      // 게임 시작: gameStarted를 true로 설정
      setGameState((prev) => {
        // 이미 게임이 시작되었거나 countdown이 변경되었으면 무시
        if (prev.gameStarted || prev.countdown !== 0) {
          return prev;
        }
        return {
          ...prev,
          gameStarted: true,
          countdown: null,
        };
      });
    }
  }, [gameState.countdown]);

  // 방어 로직: countdown이 비정상적인 상태(음수 등)이거나,
  // countdown이 null인데 gameStarted가 false이고 isProcessingStart가 false인 경우 복구
  useEffect(() => {
    // countdown이 음수가 된 경우 (버그 상황) - 게임 시작으로 복구
    if (gameState.countdown !== null && gameState.countdown < 0) {
      // 로깅: 카운트다운 이상 감지
      checkAndLogAnomalies({
        gameStarted: gameState.gameStarted,
        gameOver: gameState.gameOver,
        countdown: gameState.countdown,
        timeLeft: gameState.timeLeft,
        score: gameState.score,
      });

      setGameState(prev => ({
        ...prev,
        gameStarted: true,
        countdown: null,
      }));
    }
  }, [gameState.countdown, gameState.gameStarted, gameState.gameOver, gameState.timeLeft, gameState.score]);

  // 게임 루프 (아이템 이동)
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      lastTimeRef.current = 0; // 게임 시작 시 초기화

      gameLoopRef.current = window.requestAnimationFrame(function animate(currentTime: number) {
        moveItems(currentTime);
        gameLoopRef.current = window.requestAnimationFrame(animate);
      });

      return () => {
        if (gameLoopRef.current) {
          window.cancelAnimationFrame(gameLoopRef.current);
        }
      };
    }
  }, [gameState.gameStarted, gameState.gameOver, moveItems]);

  // 최소 1개의 아이템을 유지
  useEffect(() => {
    if (
      gameState.gameStarted &&
      !gameState.gameOver &&
      gameState.items.length === 0 &&
      !sequentialSpawnTimeoutRef.current
    ) {
      spawnItem();
    }
  }, [
    gameState.gameStarted,
    gameState.gameOver,
    gameState.items.length,
    spawnItem,
  ]);

  // 아이템을 순차적으로 생성하되 완전히 노출되면 다음 아이템이 등장
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) {
      if (sequentialSpawnTimeoutRef.current) {
        clearTimeout(sequentialSpawnTimeoutRef.current);
        sequentialSpawnTimeoutRef.current = undefined;
      }
      fullyVisibleItemIdsRef.current.clear();
      return;
    }

    const delay = Math.max(0, (config.itemSpawnDelay ?? 0) * 0.01);
    const hasScheduledSpawn = Boolean(sequentialSpawnTimeoutRef.current);

    const fullyVisibleItems = gameState.items.filter((item) => item.y >= 0);
    const currentItemIds = new Set(gameState.items.map((item) => item.id));

    // remove ids that no longer exist to avoid leak
    fullyVisibleItemIdsRef.current.forEach((id) => {
      if (!currentItemIds.has(id)) {
        fullyVisibleItemIdsRef.current.delete(id);
      }
    });

    if (!hasScheduledSpawn) {
      const triggerItem = fullyVisibleItems.find(
        (item) => !fullyVisibleItemIdsRef.current.has(item.id)
      );

      if (triggerItem) {
        fullyVisibleItemIdsRef.current.add(triggerItem.id);
        sequentialSpawnTimeoutRef.current = setTimeout(() => {
          spawnItem();
          sequentialSpawnTimeoutRef.current = undefined;
        }, delay);
      }
    }
  }, [
    gameState.gameStarted,
    gameState.gameOver,
    gameState.items,
    spawnItem,
    config.itemSpawnDelay,
  ]);

  useEffect(() => {
    return () => {
      if (sequentialSpawnTimeoutRef.current) {
        clearTimeout(sequentialSpawnTimeoutRef.current);
        sequentialSpawnTimeoutRef.current = undefined;
      }
    };
  }, []);

  // 게임 타이머
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver && gameState.timeLeft > 0) {
      const timer = setInterval(() => {
        setGameState((prev) => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            return { ...prev, timeLeft: 0, gameOver: true };
          }

          // 게임 중간에 예기치 않게 종료되는 경우 감지 (timeLeft가 갑자기 크게 감소)
          if (prev.timeLeft - newTimeLeft > 2) {
            logUnexpectedGameOver(`Time jumped from ${prev.timeLeft} to ${newTimeLeft}`, {
              gameStarted: true,
              gameOver: false,
              countdown: null,
              timeLeft: newTimeLeft,
              score: prev.score,
            });
          }

          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.gameStarted, gameState.gameOver, gameState.timeLeft]);

  // Native 앱 메시지 처리
  useEffect(() => {
    const handleNativeMessage = (message: NativeMessage) => {
      switch (message.type) {
        case 'GAME_START_APPROVED':
          startGameDirectly();
          break;
        case 'ACTIVATE_START_BUTTON':
          // 카운트다운 중이거나 게임이 이미 시작된 경우 무시
          setGameState(prev => {
            if (prev.countdown !== null || prev.gameStarted) {
              return prev;
            }
            return {
              ...prev,
              startButtonEnabled: true,
              isProcessingStart: false,
            };
          });
          break;
        case 'GAME_PAUSE':
          // Handle game pause if needed
          break;
        case 'GAME_RESUME':
          // Handle game resume if needed
          break;
        case 'GAME_END':
          // Handle game end notification
          break;
      }
    };

    const cleanup = listenToNative(handleNativeMessage);
    return cleanup;
  }, [startGameDirectly]);

  // 게임 오버 처리
  useEffect(() => {
    const handleGameOver = async () => {
      if (gameState.gameOver && gameState.gameStarted) {
        // Track game end
        trackGameEnd(gameState.score);

        // Only notify native app and submit score if score is 0 or higher
        if (gameState.score > 0) {
          // Notify native app about game end
          notifyGameEnd(gameState.score);

          const qualifies = await checkQualifiesForTop10(gameState.score);
          if (qualifies) {
            handleAutoSubmitScore(gameState.score);
          }
        }
      }
    };

    handleGameOver();
  }, [gameState.gameOver, gameState.gameStarted, gameState.score, checkQualifiesForTop10, handleAutoSubmitScore]);

  return {
    gameState,
    floatingScore,
    handleItemClick,
    resetGame,
    startGame,
  };
}
