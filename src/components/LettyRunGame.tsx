import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useScoreboard } from "@/hooks/useScoreboard";
import { trackGameStart, trackGameEnd, trackScoreSubmit } from "@/lib/analytics";
import { getNicknameFromUrlOrStorage } from "@/lib/utils";
import { detectNativeApp, requestGameStart, listenToNative, notifyGameEnd, NativeMessage } from "@/lib/nativeCommunication";
import { REQUIRE_NATIVE_APP } from "@/config/gameConfig";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/hooks/useLocale";

interface GameState {
  score: number;
  stage: number;
  speedMult: number;
  running: boolean;
  gameOver: boolean;
  showStart: boolean;
  showNativeMessage: boolean;
  startButtonEnabled: boolean;
  isProcessingStart: boolean;
}

const LettyRunGame = () => {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    score: 0,
    stage: 0,
    speedMult: 1.0,
    running: false,
    gameOver: false,
    showStart: true,
    showNativeMessage: false,
    startButtonEnabled: true,
    isProcessingStart: false,
  });

  const [uiState, setUiState] = useState<GameState>(gameStateRef.current);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Images
  const lettyImgRef = useRef<HTMLImageElement | null>(null);
  const riniImgRef = useRef<HTMLImageElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // Game objects refs
  const playerRef = useRef({
    x: 90,
    y: 0,
    w: 56,
    h: 62,
    vy: 0,
    jumpCount: 0,
    maxJump: 3,
    wasOnGround: true,
  });

  const obstaclesRef = useRef<Array<{ x: number; y: number; w: number; h: number; scale: number }>>([]);
  const heartsRef = useRef<Array<{ x: number; y: number; taken: boolean }>>([]);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; r: number; alpha: number }>>([]);
  const bgXRef = useRef({ x1: 0, x2: 0, x3: 0 });
  const spawnTimerRef = useRef(0.9);
  const consecutiveRef = useRef(0);
  const speedUpRef = useRef({ active: false, x: 0, y: 0, life: 0 });

  const [nativeAppInfo] = useState(detectNativeApp());
  const { toast } = useToast();
  const { checkQualifiesForTop10, submitScore } = useScoreboard();
  const scoreSubmittedRef = useRef(false);
  const gameOverHandledRef = useRef(false);

  // Constants
  const GROUND_RATIO = 0.82;
  const GRAVITY = 2200;
  const JUMP_V = 820;
  const BASE_SCROLL = 270;
  const MAX_STAGE = 20;
  const HEART_FONT_BASE = 52 * 0.70;
  const HEART_HIT_R_BASE = 26 * 0.70;

  const getStageByScore = (s: number) => {
    if (s < 20) return 0;
    return Math.min(MAX_STAGE, Math.floor((s - 20) / 5) + 1);
  };

  const speedByStage = (st: number) => {
    if (st === 0) return 1.0;
    return 1.0 + st * 0.075;
  };

  const heartScaleByStage = (stage: number) => (stage >= 10 ? 0.5 : 1.0);
  const heartValueByStage = (stage: number) => (stage >= 10 ? 2 : 1);

  const updateUI = useCallback(() => {
    setUiState({ ...gameStateRef.current });
  }, []);

  // Load images
  useEffect(() => {
    const lettyImg = new Image();
    lettyImg.src = "/letty.webp";
    lettyImgRef.current = lettyImg;

    const riniImg = new Image();
    riniImg.src = "/rini.webp";
    riniImgRef.current = riniImg;

    const bgImg = new Image();
    bgImg.src = "/bg.webp";
    bgImgRef.current = bgImg;
  }, []);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Utils
  const rand = (a: number, b: number) => Math.random() * (b - a) + a;
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const groundY = () => (canvasRef.current?.clientHeight || 600) * GROUND_RATIO;

  const circleRectIntersect = (cx: number, cy: number, r: number, rect: { x: number; y: number; w: number; h: number }) => {
    const x = clamp(cx, rect.x, rect.x + rect.w);
    const y = clamp(cy, rect.y, rect.y + rect.h);
    const dx = cx - x, dy = cy - y;
    return dx * dx + dy * dy <= r * r;
  };

  const ellipseRectIntersect = (ell: { cx: number; cy: number; rx: number; ry: number }, rect: { x: number; y: number; w: number; h: number }) => {
    const pts = [
      [rect.x, rect.y],
      [rect.x + rect.w, rect.y],
      [rect.x, rect.y + rect.h],
      [rect.x + rect.w, rect.y + rect.h],
      [rect.x + rect.w * 0.5, rect.y],
      [rect.x + rect.w * 0.5, rect.y + rect.h],
      [rect.x, rect.y + rect.h * 0.5],
      [rect.x + rect.w, rect.y + rect.h * 0.5],
    ];
    for (const [px, py] of pts) {
      const nx = (px - ell.cx) / ell.rx;
      const ny = (py - ell.cy) / ell.ry;
      if (nx * nx + ny * ny <= 1) return true;
    }
    if (ell.cx >= rect.x && ell.cx <= rect.x + rect.w && ell.cy >= rect.y && ell.cy <= rect.y + rect.h) return true;
    return false;
  };

  // Particles
  const emitDust = (x: number, y: number, amount: number, dir = 1) => {
    for (let i = 0; i < amount; i++) {
      if (particlesRef.current.length > 240) particlesRef.current.shift();
      const a = rand(0, Math.PI * 2);
      const sp = rand(60, 220);
      particlesRef.current.push({
        x: x + rand(-6, 6),
        y: y + rand(-4, 4),
        vx: Math.cos(a) * sp - dir * rand(80, 160),
        vy: Math.sin(a) * sp - rand(30, 120),
        life: rand(0.25, 0.55),
        r: rand(2, 5),
        alpha: rand(0.35, 0.75),
      });
    }
  };

  // Spawning
  const canSpawnObstacle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    if (obstaclesRef.current.length === 0) return true;
    const last = obstaclesRef.current[obstaclesRef.current.length - 1];
    return last.x < canvas.clientWidth - 260;
  };

  const spawnObstacleAndHearts = (currentStage: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = groundY();
    const highSpeed = currentStage >= 16;

    if (highSpeed && consecutiveRef.current >= 2) {
      consecutiveRef.current = 0;
      return;
    }
    if (!canSpawnObstacle()) return;

    const ox = canvas.clientWidth + 80;
    const ow = 64, oh = 64;

    obstaclesRef.current.push({ x: ox, y: g - oh, w: ow, h: oh, scale: 0.01 });
    consecutiveRef.current++;

    const lanes = [g - 130, g - 170, g - 210];
    const laneWeights = [0.60, 0.32, 0.08];

    const pickLane = () => {
      const r = Math.random();
      let acc = 0;
      for (let i = 0; i < lanes.length; i++) {
        acc += laneWeights[i];
        if (r <= acc) return lanes[i];
      }
      return lanes[0];
    };

    const heartCount = Math.random() < 0.55 ? 2 : Math.random() < 0.25 ? 3 : 1;
    const baseX = ox + rand(180, 260);
    const spacing = 54;
    const o = obstaclesRef.current[obstaclesRef.current.length - 1];
    const paddedObs = { x: o.x - 100, y: o.y - 140, w: o.w + 200, h: o.h + 280 };

    for (let i = 0; i < heartCount; i++) {
      let hx = baseX + i * spacing;
      const hy = pickLane();
      if (circleRectIntersect(hx, hy, HEART_HIT_R_BASE, paddedObs)) {
        hx += 110;
      }
      heartsRef.current.push({ x: hx, y: hy, taken: false });
    }
  };

  // Jump
  const jump = useCallback(() => {
    if (!gameStateRef.current.running) return;
    const player = playerRef.current;
    if (player.jumpCount < player.maxJump) {
      player.vy = -JUMP_V;
      player.jumpCount++;
      const g = groundY();
      if (player.y + player.h >= g - 3) {
        emitDust(player.x + player.w * 0.45, g + 2, 12, 1);
      }
    }
  }, []);

  // Game loop
  const gameLoop = useCallback((t: number) => {
    if (!gameStateRef.current.running) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dt = Math.min(0.033, (t - lastTimeRef.current) / 1000);
    lastTimeRef.current = t;

    const state = gameStateRef.current;
    const player = playerRef.current;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const g = groundY();

    // Update stage/speed
    const newStage = getStageByScore(state.score);
    if (newStage > state.stage) {
      state.stage = newStage;
      speedUpRef.current = { active: true, x: w + 240, y: h * 0.26, life: 1.3 };
    }
    state.speedMult = speedByStage(state.stage);
    const scroll = BASE_SCROLL * state.speedMult;

    // Player physics
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    const onGround = player.y + player.h >= g;
    if (onGround) {
      player.y = g - player.h;
      player.vy = 0;
      player.jumpCount = 0;
      if (!player.wasOnGround) {
        emitDust(player.x + player.w * 0.35, g + 2, 14, 1);
        emitDust(player.x + player.w * 0.65, g + 2, 10, 1);
      }
    }
    player.wasOnGround = onGround;

    // Spawn
    spawnTimerRef.current -= dt * (0.95 + state.speedMult * 0.10);
    if (spawnTimerRef.current <= 0) {
      spawnObstacleAndHearts(state.stage);
      const base = rand(1.05, 1.55);
      spawnTimerRef.current = base * (state.stage >= 16 ? 0.92 : 1.0);
    }

    // Move obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const o = obstaclesRef.current[i];
      o.x -= scroll * dt;
      if (o.scale < 1) {
        o.scale += dt * 3;
        if (o.scale > 1) o.scale = 1;
      }
      if (o.x + o.w < -220) obstaclesRef.current.splice(i, 1);
    }

    // Move hearts & collect
    const hs = HEART_HIT_R_BASE * heartScaleByStage(state.stage);
    const hv = heartValueByStage(state.stage);
    const playerRect = { x: player.x + 8, y: player.y + 6, w: player.w - 16, h: player.h - 10 };

    for (let i = heartsRef.current.length - 1; i >= 0; i--) {
      const hrt = heartsRef.current[i];
      hrt.x -= scroll * dt;
      if (hrt.x + 120 < -220) {
        heartsRef.current.splice(i, 1);
        continue;
      }
      if (circleRectIntersect(hrt.x, hrt.y, hs, playerRect)) {
        state.score += hv;
        emitDust(hrt.x, hrt.y, 10, 1);
        heartsRef.current.splice(i, 1);
      }
    }

    // Collision
    const hitPlayer = { x: player.x + 10, y: player.y + 8, w: player.w - 20, h: player.h - 12 };
    for (const o of obstaclesRef.current) {
      if (o.scale < 1) continue;
      const ell = {
        cx: o.x + o.w * 0.52,
        cy: o.y + o.h * 0.55,
        rx: o.w * 0.30,
        ry: o.h * 0.33,
      };
      if (ellipseRectIntersect(ell, hitPlayer)) {
        state.running = false;
        state.gameOver = true;
        updateUI();
        handleGameOver(state.score);
        return;
      }
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life -= dt;
      p.vy += 650 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r *= 1 - dt * 1.3;
      if (p.life <= 0 || p.r <= 0.6) particlesRef.current.splice(i, 1);
    }

    // SpeedUp banner
    if (speedUpRef.current.active) {
      speedUpRef.current.life -= dt;
      speedUpRef.current.x += -900 * dt;
      if (speedUpRef.current.life <= 0) speedUpRef.current.active = false;
    }

    // Background offset
    bgXRef.current.x1 -= scroll * 0.18 * dt;
    bgXRef.current.x2 -= scroll * 0.35 * dt;
    bgXRef.current.x3 -= scroll * 0.55 * dt;

    // ===== DRAW =====
    const bgImg = bgImgRef.current;
    if (bgImg?.complete && bgImg.naturalWidth > 0) {
      const scale = h / bgImg.naturalHeight;
      const bw = bgImg.naturalWidth * scale;

      if (bgXRef.current.x1 <= -bw) bgXRef.current.x1 += bw;
      if (bgXRef.current.x2 <= -bw) bgXRef.current.x2 += bw;
      if (bgXRef.current.x3 <= -bw) bgXRef.current.x3 += bw;

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bgImg, bgXRef.current.x1, 0, bw, h);
      ctx.drawImage(bgImg, bgXRef.current.x1 + bw, 0, bw, h);
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(bgImg, bgXRef.current.x2, 0, bw, h);
      ctx.drawImage(bgImg, bgXRef.current.x2 + bw, 0, bw, h);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(bgImg, bgXRef.current.x3, 0, bw, h);
      ctx.drawImage(bgImg, bgXRef.current.x3 + bw, 0, bw, h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#87c8ff";
      ctx.fillRect(0, 0, w, h);
    }

    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, g, w, h - g);

    // Obstacles
    const riniImg = riniImgRef.current;
    for (const o of obstaclesRef.current) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.scale(o.scale, o.scale);
      ctx.translate(-o.w / 2, -o.h / 2);
      if (riniImg?.complete && riniImg.naturalWidth > 0) {
        ctx.drawImage(riniImg, 0, 0, o.w, o.h);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(0, 0, o.w, o.h);
      }
      ctx.restore();
    }

    // Hearts
    const heartScale = heartScaleByStage(state.stage);
    const fontPx = Math.max(18, Math.floor(HEART_FONT_BASE * heartScale));
    ctx.font = `900 ${fontPx}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const hrt of heartsRef.current) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.fillText("❤️", hrt.x, hrt.y);
      ctx.restore();
    }

    // Player
    const lettyImg = lettyImgRef.current;
    const dx = player.x - 18;
    const dy = player.y - 22;
    const dw = player.w + 36;
    const dh = player.h + 44;
    if (lettyImg?.complete && lettyImg.naturalWidth > 0) {
      ctx.drawImage(lettyImg, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = "#fff";
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    // Particles
    for (const p of particlesRef.current) {
      const a = clamp(p.life / 0.55, 0, 1) * p.alpha;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // SpeedUp banner
    if (speedUpRef.current.active) {
      const alpha = clamp(speedUpRef.current.life / 1.3, 0, 1);
      const bigPx = Math.max(78, Math.floor(player.h * 1.55));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(speedUpRef.current.x, speedUpRef.current.y);
      ctx.rotate(-0.06);
      ctx.font = `900 ${bigPx}px system-ui, sans-serif`;
      ctx.shadowColor = "rgba(255,60,120,0.75)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SPEED UP", 0, 0);
      ctx.restore();
    }

    updateUI();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [updateUI]);

  // Handle game over
  const handleGameOver = useCallback(async (finalScore: number) => {
    // Prevent multiple calls
    if (gameOverHandledRef.current) {
      return;
    }
    gameOverHandledRef.current = true;

    // Track game end
    trackGameEnd(finalScore);

    // Always notify native app if score > 0
    if (finalScore > 0) {
      notifyGameEnd(finalScore);

      // Only submit to leaderboard if not already submitted
      if (!scoreSubmittedRef.current) {
        const qualifies = await checkQualifiesForTop10(finalScore);
        if (qualifies) {
          scoreSubmittedRef.current = true;
          const playerName = getNicknameFromUrlOrStorage();
          const result = await submitScore(finalScore);
          if (result.success) {
            trackScoreSubmit(finalScore, playerName);
            setTimeout(() => {
              window.location.href = "/scoreboard";
            }, 1500);
          } else if (result.shouldShowError) {
            toast({
              title: "Submission Failed",
              description: "Please try again later",
              variant: "destructive",
            });
          }
        }
      }
    }
  }, [checkQualifiesForTop10, submitScore, toast]);

  // Reset game
  const resetGame = useCallback(() => {
    const player = playerRef.current;
    player.vy = 0;
    player.jumpCount = 0;
    player.wasOnGround = true;
    player.y = groundY() - player.h;

    obstaclesRef.current = [];
    heartsRef.current = [];
    particlesRef.current = [];
    bgXRef.current = { x1: 0, x2: 0, x3: 0 };
    spawnTimerRef.current = 0.9;
    consecutiveRef.current = 0;
    speedUpRef.current = { active: false, x: 0, y: 0, life: 0 };
    scoreSubmittedRef.current = false;
    gameOverHandledRef.current = false;

    gameStateRef.current = {
      score: 0,
      stage: 0,
      speedMult: 1.0,
      running: false,
      gameOver: false,
      showStart: true,
      showNativeMessage: false,
      startButtonEnabled: true,
      isProcessingStart: false,
    };
    updateUI();
  }, [updateUI]);

  // Start game directly
  const startGameDirectly = useCallback(() => {
    const state = gameStateRef.current;
    state.showStart = false;
    state.running = true;
    state.isProcessingStart = false;
    updateUI();
    trackGameStart();
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, updateUI]);

  // Start game (with native check)
  const startGame = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.startButtonEnabled || state.isProcessingStart) return;

    state.isProcessingStart = true;
    state.startButtonEnabled = false;
    updateUI();

    // Native app check first - this ensures payment flow works in native app
    if (nativeAppInfo.isNative) {
      // Native 앱에서는 승인 요청 (게임비 지불)
      requestGameStart();
    } else if (window.location.hostname === "localhost" || !REQUIRE_NATIVE_APP) {
      // localhost에서는 바로 시작
      startGameDirectly();
    } else {
      // Native 앱이 아니면 메시지 표시
      state.showNativeMessage = true;
      state.isProcessingStart = false;
      updateUI();
    }
  }, [nativeAppInfo.isNative, startGameDirectly, updateUI]);

  // Native message listener
  useEffect(() => {
    const handleNativeMessage = (message: NativeMessage) => {
      if (message.type === "GAME_START_APPROVED") {
        startGameDirectly();
      } else if (message.type === "ACTIVATE_START_BUTTON") {
        const state = gameStateRef.current;
        if (!state.running) {
          state.startButtonEnabled = true;
          state.isProcessingStart = false;
          updateUI();
        }
      }
    };
    return listenToNative(handleNativeMessage);
  }, [startGameDirectly, updateUI]);

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-manipulation"
        style={{ height: "calc(100vh - 80px)" }}
        onPointerDown={(e) => {
          e.preventDefault();
          jump();
        }}
      />

      {/* HUD */}
      {uiState.running && (
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm border-3 border-red-400 rounded-full px-4 py-2 text-red-500 font-black shadow-lg">
            ❤️ {uiState.score}
          </div>
          <div className="bg-white/95 backdrop-blur-sm border-3 border-blue-300 rounded-full px-4 py-2 text-blue-400 font-black shadow-lg">
            SPEED x{uiState.speedMult.toFixed(2)}
          </div>
        </div>
      )}

      {/* Start Overlay */}
      {uiState.showStart && !uiState.showNativeMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-200/80 to-green-200/80 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-red-400 rounded-3xl p-6 w-full max-w-[380px] text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-3 text-red-400 flex items-center justify-center gap-2">
              <img src="/letty.webp" alt="Letty" className="w-10 h-10 object-contain" />
              {t.gameTitle} ❤️
            </h2>
            <div className="text-sm text-gray-700 mb-4 leading-relaxed bg-gradient-to-r from-rose-50 to-sky-50 p-3 rounded-xl">
              {t.objectiveDescription}<br />
              <span className="text-red-400 font-bold">{t.timeLimitDescription}</span><br />
              <span className="text-red-400 font-bold">{t.scoringDescription}</span>
            </div>
            <Button
              onClick={startGame}
              disabled={!uiState.startButtonEnabled || uiState.isProcessingStart}
              className="w-full bg-gradient-to-r from-red-400 to-rose-400 hover:from-red-500 hover:to-rose-500 text-white font-black py-4 rounded-xl border-4 border-white shadow-lg"
            >
              {uiState.isProcessingStart ? "PROCESSING..." : `🎮 ${t.startButtonText}`}
            </Button>
            <div className="text-xs text-gray-500 mt-3">
              ※ {t.gameTip}
            </div>
          </div>
        </div>
      )}

      {/* Native Message */}
      {uiState.showNativeMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-200/80 to-green-200/80 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-red-400 rounded-3xl p-6 w-full max-w-[380px] text-center shadow-2xl">
            <h2 className="text-2xl font-black mb-3 text-red-400">{t.appRequiredTitle}</h2>
            <p className="text-sm text-gray-700 mb-4">
              {t.appRequiredDescription}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-red-400 to-rose-400 text-white font-black py-3 rounded-xl border-4 border-white"
            >
              {t.closeText}
            </Button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {uiState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-200/80 to-green-200/80 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-red-400 rounded-3xl p-6 w-full max-w-[380px] text-center shadow-2xl">
            <h2 className="text-3xl font-black mb-3 text-red-400 flex items-center justify-center gap-2">
              {t.gameOverTitle}
              <img src="/letty.webp" alt="Letty" className="w-10 h-10 object-contain" />
            </h2>
            <div className="text-2xl mb-4 bg-gradient-to-r from-rose-50 to-sky-50 py-3 rounded-xl">
              {t.finalScoreText} <span className="font-black text-red-500">❤️ {uiState.score}</span>
            </div>
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-blue-300 to-sky-400 hover:from-blue-400 hover:to-sky-500 text-white font-black py-4 rounded-xl border-4 border-white shadow-lg"
            >
              🔄 {t.playAgainText}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LettyRunGame;
