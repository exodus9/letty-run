// 게임 아이템 기본 인터페이스
export interface FallingItem {
  id: string;
  text: string;
  isCorrect: boolean;
  color: string;
  x: number;
  y: number;
  speed: number;
}

// 게임 상태 인터페이스
export interface GameState<T extends FallingItem = FallingItem> {
  items: T[];
  score: number;
  timeLeft: number;
  gameOver: boolean;
  gameStarted: boolean;
  countdown: number | null;
  showNativeMessage: boolean;
  startButtonEnabled: boolean;
  isProcessingStart: boolean;
}

// 점수 표시 인터페이스
export interface FloatingScore {
  id: string;
  isCorrect: boolean;
  points: number;
}

// 게임 데이터 항목 인터페이스
export interface GameDataItem {
  id: string;
  name: string;
  subItems: string[];
}

// 게임 설정 인터페이스
export interface GameConfig<T extends FallingItem = FallingItem> {
  // 게임 메타데이터
  gameTitle: string;
  gameDescription: string;

  // 게임 데이터
  data: GameDataItem[];
  colors: string[];

  // 게임 규칙
  timeLimit: number; // 초 단위
  correctPoints: number;
  incorrectPoints: number;
  correctProbability: number; // 0-1 사이 값

  // 아이템 생성 설정
  itemSpawnInterval: number; // 밀리초
  itemSpawnCount: { min: number; max: number };
  itemSpawnDelay: number; // 각 아이템 사이의 지연 시간 (밀리초)
  initialItemCount: { min: number; max: number };

  // 아이템 속도 설정
  speedRange: { min: number; max: number };
  uniformSpeed?: number;
  spawnSpacing?: {
    minHorizontalGap?: number;
    minVerticalGap?: number;
    verticalThreshold?: number;
    maxAttempts?: number;
    maxVerticalShift?: number;
  };

  // UI 텍스트
  ui: {
    howToPlayTitle: string;
    objectiveTitle: string;
    objectiveDescription: string;
    scoringTitle: string;
    scoringDescription: string;
    timeLimitTitle: string;
    timeLimitDescription: string;
    startButtonText: string;
    gameOverTitle: string;
    finalScoreText: string;
    playAgainText: string;
  };

  // 커스텀 아이템 생성 함수 (선택적)
  customSpawnItem?: (
    data: GameDataItem[],
    colors: string[],
    correctProbability: number,
    speedRange: { min: number; max: number }
  ) => T;

  // 커스텀 클릭 핸들러 (선택적)
  customHandleItemClick?: (
    item: T,
    currentScore: number
  ) => { newScore: number; pointChange: number };
}
