# 새로운 게임 생성 가이드

이 가이드는 기존의 Falling Item Game 엔진을 활용하여 새로운 게임을 빠르게 만드는 방법을 설명합니다.

## 📋 목차

1. [프로젝트 구조 이해](#프로젝트-구조-이해)
2. [새 게임 만들기 단계](#새-게임-만들기-단계)
3. [게임 설정 옵션](#게임-설정-옵션)
4. [예제: 축구팀 매칭 게임](#예제-축구팀-매칭-게임)
5. [고급 커스터마이징](#고급-커스터마이징)

---

## 🏗️ 프로젝트 구조 이해

### 재사용 가능한 부분 (수정 불필요)

```
src/
├── hooks/
│   ├── useFallingItemGame.ts    # 게임 엔진 Hook (재사용)
│   ├── useScoreboard.ts         # 스코어보드 Hook (재사용)
│   └── use-toast.ts             # 토스트 Hook (재사용)
├── types/
│   └── gameTypes.ts             # 타입 정의 (재사용)
├── lib/
│   ├── analytics.ts             # 분석 추적 (재사용)
│   └── utils.ts                 # 유틸리티 함수 (재사용)
└── components/
    └── ui/                       # UI 컴포넌트 (재사용)
```

### 게임별로 변경하는 부분

```
src/
├── config/
│   └── [yourGame]Config.ts      # 게임 설정 파일 (생성)
└── components/
    └── [YourGame].tsx            # 게임 컴포넌트 (생성)
```

---

## 🚀 새 게임 만들기 단계

### Step 1: 게임 설정 파일 생성

`src/config/yourGameConfig.ts` 파일을 생성하고 게임 데이터를 정의합니다.

```typescript
import { GameConfig, FallingItem } from '@/types/gameTypes';

// 필요한 경우 커스텀 아이템 인터페이스 정의
export interface YourGameItem extends FallingItem {
  // 추가 속성이 필요하면 여기에 정의
  categoryName?: string;
  itemName?: string;
}

export const yourGameConfig: GameConfig<YourGameItem> = {
  // 1. 게임 메타데이터
  gameTitle: 'Your Game Title',
  gameDescription: 'Game description',

  // 2. 게임 데이터 (가장 중요!)
  data: [
    { id: 'category1', name: 'Category 1', subItems: ['Item A', 'Item B', 'Item C'] },
    { id: 'category2', name: 'Category 2', subItems: ['Item X', 'Item Y', 'Item Z'] },
    // 더 많은 카테고리 추가...
  ],

  // 3. 색상 팔레트
  colors: [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    // 원하는 색상 추가...
  ],

  // 4. 게임 규칙
  timeLimit: 30, // 게임 시간 (초)
  correctPoints: 5, // 정답 점수
  incorrectPoints: -3, // 오답 점수
  correctProbability: 0.7, // 정답 확률 (0-1)

  // 5. 아이템 생성 설정
  itemSpawnInterval: 2000, // 생성 주기 (밀리초)
  itemSpawnCount: { min: 2, max: 4 }, // 한 번에 생성되는 아이템 수
  itemSpawnDelay: 100, // 각 아이템 사이 지연 (밀리초)
  initialItemCount: { min: 5, max: 8 }, // 게임 시작 시 아이템 수

  // 6. 아이템 속도
  speedRange: { min: 0.4, max: 0.4 }, // 낙하 속도 범위

  // 7. UI 텍스트
  ui: {
    howToPlayTitle: '📖 게임 방법 📖',
    objectiveTitle: '게임 목표',
    objectiveDescription: '올바른 조합을 클릭하세요!',
    scoringTitle: '점수 규칙',
    scoringDescription: '정답: +5 | 오답: -3',
    timeLimitTitle: '제한 시간',
    timeLimitDescription: '30초 안에 최대한 많은 점수를!',
    startButtonText: '🎮 게임 시작 🎮',
    gameOverTitle: '🎉 게임 종료! 🎉',
    finalScoreText: '최종 점수:',
    playAgainText: '🔄 다시 하기',
  },
};
```

### Step 2: 게임 컴포넌트 생성

`src/components/YourGame.tsx` 파일을 생성합니다.

```typescript
import { Button } from "@/components/ui/button";
import { yourGameConfig, YourGameItem } from "@/config/yourGameConfig";
import { useFallingItemGame } from "@/hooks/useFallingItemGame";

const YourGame = () => {
  const { gameState, floatingScore, handleItemClick, resetGame, startGame } =
    useFallingItemGame<YourGameItem>(yourGameConfig);

  const config = yourGameConfig;

  return (
    <div className="flex flex-col items-center h-full game-container w-full">
      <div
        className="relative w-full bg-gradient-to-b from-purple-100 via-pink-100 to-blue-100 border-4 border-purple-500 rounded-3xl shadow-lg overflow-hidden"
        style={{
          height: 'calc(100vh - 150px)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        {/* 점수 및 시간 표시 */}
        {gameState.gameStarted && !gameState.gameOver && (
          <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl border-3 border-purple-500 shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="font-bold text-lg text-purple-600">
                ⭐ {gameState.score}
              </div>
              <div className="font-bold text-lg text-pink-600">
                ⏰ {gameState.timeLeft}s
              </div>
            </div>
          </div>
        )}

        {/* 떨어지는 아이템 */}
        {gameState.items.map((item) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleItemClick(item);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleItemClick(item);
            }}
            className="absolute px-5 py-4 text-white font-bold rounded-xl shadow-lg active:scale-95 cursor-pointer border-3 border-white"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translateX(-50%)',
              backgroundColor: item.color,
              fontSize: '1.1rem',
              whiteSpace: 'nowrap',
              touchAction: 'manipulation',
              pointerEvents: 'auto',
              zIndex: 15,
              userSelect: 'none',
            }}
          >
            {item.text}
          </button>
        ))}

        {/* 카운트다운 */}
        {gameState.countdown !== null && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-9xl font-bold text-purple-600 animate-pulse">
              {gameState.countdown}
            </div>
          </div>
        )}

        {/* 점수 애니메이션 */}
        {floatingScore && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div
              className={`font-bold text-6xl ${
                floatingScore.isCorrect ? 'text-green-500' : 'text-red-500'
              }`}
              style={{
                animation: 'bounceAndFade 1s ease-out forwards',
              }}
            >
              {floatingScore.isCorrect ? '✅' : '❌'}{' '}
              {floatingScore.points > 0 ? '+' : ''}
              {floatingScore.points}
            </div>
          </div>
        )}

        {/* 게임 시작 화면 */}
        {!gameState.gameStarted && !gameState.gameOver && gameState.countdown === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-20">
            <div className="max-w-2xl w-full space-y-6">
              <h2 className="text-5xl font-bold text-purple-600 text-center">
                {config.ui.howToPlayTitle}
              </h2>

              <div className="space-y-4 bg-white/90 backdrop-blur-sm p-8 rounded-2xl">
                <div className="p-4 bg-purple-100 rounded-xl">
                  <p className="font-bold text-xl text-purple-600 mb-2">
                    {config.ui.objectiveTitle}
                  </p>
                  <p className="text-lg">{config.ui.objectiveDescription}</p>
                </div>

                <div className="p-4 bg-blue-100 rounded-xl">
                  <p className="font-bold text-xl text-blue-600 mb-2">
                    {config.ui.scoringTitle}
                  </p>
                  <p className="text-lg">{config.ui.scoringDescription}</p>
                </div>

                <div className="p-4 bg-pink-100 rounded-xl">
                  <p className="font-bold text-xl text-pink-600 mb-2">
                    {config.ui.timeLimitTitle}
                  </p>
                  <p className="text-lg">{config.ui.timeLimitDescription}</p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={startGame}
                className="w-full text-2xl py-6"
              >
                {config.ui.startButtonText}
              </Button>
            </div>
          </div>
        )}

        {/* 게임 오버 화면 */}
        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-20 bg-white/80 backdrop-blur-sm">
            <div className="space-y-4 bg-white border-4 border-purple-500 rounded-3xl p-8 shadow-lg max-w-md w-full">
              <h3 className="text-4xl font-bold text-purple-600">
                {config.ui.gameOverTitle}
              </h3>
              <p className="text-2xl">
                {config.ui.finalScoreText}{' '}
                <span className="font-bold text-purple-600">{gameState.score}</span>
              </p>
              <Button onClick={resetGame} className="w-full text-lg py-4">
                {config.ui.playAgainText}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YourGame;
```

### Step 3: 라우팅 설정 (선택사항)

`src/App.tsx`에서 라우팅을 추가하거나, `src/pages/Index.tsx`에서 게임 컴포넌트를 import하여 사용합니다.

---

## ⚙️ 게임 설정 옵션

### GameConfig 인터페이스

```typescript
interface GameConfig<T extends FallingItem = FallingItem> {
  // 게임 메타데이터
  gameTitle: string;              // 게임 제목
  gameDescription: string;        // 게임 설명

  // 게임 데이터
  data: GameDataItem[];           // 카테고리와 아이템 데이터
  colors: string[];               // 색상 팔레트

  // 게임 규칙
  timeLimit: number;              // 제한 시간 (초)
  correctPoints: number;          // 정답 점수
  incorrectPoints: number;        // 오답 점수 (음수 권장)
  correctProbability: number;     // 정답이 나올 확률 (0-1)

  // 아이템 생성 설정
  itemSpawnInterval: number;      // 생성 주기 (밀리초)
  itemSpawnCount: { min: number; max: number };  // 생성 개수
  itemSpawnDelay: number;         // 아이템 간 지연 (밀리초)
  initialItemCount: { min: number; max: number }; // 초기 개수

  // 아이템 속도
  speedRange: { min: number; max: number };  // 속도 범위

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

  // 커스텀 함수 (선택)
  customSpawnItem?: (...) => T;
  customHandleItemClick?: (...) => { newScore: number; pointChange: number };
}
```

---

## 🎯 예제: 축구팀 매칭 게임

### 게임 설정 파일

```typescript
// src/config/soccerMatchConfig.ts
import { GameConfig, FallingItem } from '@/types/gameTypes';

export interface SoccerMatchItem extends FallingItem {
  teamName: string;
  playerName: string;
}

export const soccerMatchConfig: GameConfig<SoccerMatchItem> = {
  gameTitle: 'Soccer Team Match',
  gameDescription: 'Match players with their teams!',

  data: [
    {
      id: 'mancity',
      name: 'Manchester City',
      subItems: ['Haaland', 'De Bruyne', 'Foden', 'Rodri']
    },
    {
      id: 'arsenal',
      name: 'Arsenal',
      subItems: ['Saka', 'Odegaard', 'Rice', 'Saliba']
    },
    {
      id: 'liverpool',
      name: 'Liverpool',
      subItems: ['Salah', 'Van Dijk', 'Alexander-Arnold', 'Mac Allister']
    },
    {
      id: 'realmadrid',
      name: 'Real Madrid',
      subItems: ['Bellingham', 'Vinicius', 'Modric', 'Courtois']
    },
  ],

  colors: ['#6CABDD', '#EF0107', '#C8102E', '#FEBE10'],

  timeLimit: 20,
  correctPoints: 3,
  incorrectPoints: -2,
  correctProbability: 0.65,

  itemSpawnInterval: 2500,
  itemSpawnCount: { min: 2, max: 3 },
  itemSpawnDelay: 400,
  initialItemCount: { min: 4, max: 6 },

  speedRange: { min: 0.25, max: 0.55 },

  ui: {
    howToPlayTitle: '⚽ HOW TO PLAY ⚽',
    objectiveTitle: 'Game Objective',
    objectiveDescription: 'Click correct player-team pairs! Ex: Manchester City-Haaland ✓',
    scoringTitle: 'Scoring',
    scoringDescription: 'Correct: +3 | Wrong: -2',
    timeLimitTitle: 'Time Limit',
    timeLimitDescription: 'You have 20 seconds!',
    startButtonText: '⚽ START GAME ⚽',
    gameOverTitle: '🏆 GAME OVER! 🏆',
    finalScoreText: 'Final Score:',
    playAgainText: '🔄 PLAY AGAIN',
  },

  customSpawnItem: (data, colors, correctProbability, speedRange) => {
    const team = data[Math.floor(Math.random() * data.length)];
    const isCorrect = Math.random() < correctProbability;

    let playerName: string;
    if (isCorrect) {
      playerName = team.subItems[Math.floor(Math.random() * team.subItems.length)];
    } else {
      const otherTeams = data.filter(t => t.id !== team.id);
      const randomTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)];
      playerName = randomTeam.subItems[Math.floor(Math.random() * randomTeam.subItems.length)];
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      text: `${team.name}-${playerName}`,
      teamName: team.name,
      playerName: playerName,
      isCorrect: isCorrect,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 80 + 10,
      y: -10,
      speed: speedRange.min + Math.random() * (speedRange.max - speedRange.min),
    };
  },
};
```

---

## 🎨 고급 커스터마이징

### 1. 커스텀 아이템 생성 로직

기본 아이템 생성 로직을 사용하지 않고 완전히 커스텀하려면:

```typescript
customSpawnItem: (data, colors, correctProbability, speedRange) => {
  // 여기에 커스텀 로직 작성
  // 예: 특정 조건에 따라 다른 타입의 아이템 생성

  const item = {
    id: `${Date.now()}-${Math.random()}`,
    text: 'Custom Item',
    isCorrect: true,
    color: colors[0],
    x: 50,
    y: -10,
    speed: 0.3,
    // 추가 속성...
  };

  return item as YourGameItem;
}
```

### 2. 커스텀 클릭 핸들러

점수 계산 로직을 커스터마이징하려면:

```typescript
customHandleItemClick: (item, currentScore) => {
  // 예: 콤보 시스템 구현
  let pointChange = item.isCorrect ? 5 : -3;

  // 연속 정답에 보너스 점수
  if (item.isCorrect && comboCount > 3) {
    pointChange = pointChange * 2;
  }

  const newScore = Math.max(0, currentScore + pointChange);

  return { newScore, pointChange };
}
```

### 3. UI 커스터마이징

게임 컴포넌트에서 CSS 클래스와 스타일을 자유롭게 변경할 수 있습니다:

```typescript
// 배경 그라데이션 변경
className="bg-gradient-to-b from-blue-100 via-green-100 to-yellow-100"

// 테두리 색상 변경
className="border-4 border-blue-500"

// 아이템 스타일 변경
style={{
  backgroundColor: item.color,
  fontSize: '1.2rem',
  borderRadius: '20px',
  // 추가 스타일...
}}
```

### 4. 난이도 조절

게임 난이도를 조절하려면 다음 설정을 변경:

**쉬운 난이도:**
```typescript
timeLimit: 40,
correctPoints: 5,
incorrectPoints: -1,
correctProbability: 0.8,  // 정답 확률 높임
speedRange: { min: 0.15, max: 0.35 },  // 속도 느리게
itemSpawnInterval: 3000,  // 생성 주기 길게
```

**어려운 난이도:**
```typescript
timeLimit: 15,
correctPoints: 2,
incorrectPoints: -5,
correctProbability: 0.5,  // 정답 확률 낮춤
speedRange: { min: 0.4, max: 0.8 },  // 속도 빠르게
itemSpawnInterval: 1500,  // 생성 주기 짧게
```

---

## 🔧 문제 해결

### 타입 에러가 발생하는 경우

커스텀 아이템 인터페이스를 사용할 때는 제네릭 타입을 명시해야 합니다:

```typescript
const { gameState, ... } = useFallingItemGame<YourGameItem>(yourGameConfig);
```

### 아이템이 너무 빠르거나 느린 경우

`speedRange` 값을 조절하세요:
- 느리게: `{ min: 0.1, max: 0.3 }`
- 보통: `{ min: 0.2, max: 0.5 }`
- 빠르게: `{ min: 0.4, max: 0.8 }`

### 점수 제출이 안 되는 경우

`.env` 파일에서 `VITE_GAME_ID`가 올바르게 설정되어 있는지 확인하세요.

---

## 📝 체크리스트

새 게임을 만들 때 다음 사항을 확인하세요:

- [ ] `src/config/[yourGame]Config.ts` 파일 생성
- [ ] 게임 데이터 (`data`) 정의
- [ ] 색상 팔레트 (`colors`) 정의
- [ ] 게임 규칙 (시간, 점수) 설정
- [ ] UI 텍스트 커스터마이징
- [ ] `src/components/[YourGame].tsx` 컴포넌트 생성
- [ ] 게임 컴포넌트에서 설정 import 및 사용
- [ ] 게임 테스트 (점수, 타이머, 아이템 생성 확인)
- [ ] 스타일 커스터마이징 (색상, 폰트, 레이아웃)

---

## 🎉 완성!

이제 새로운 게임을 만들 준비가 되었습니다!

**핵심 원칙:**
1. **게임 설정 파일**만 수정하면 됩니다
2. **useFallingItemGame Hook**은 모든 게임 로직을 처리합니다
3. **UI만 커스터마이징**하여 독특한 게임을 만들 수 있습니다

질문이나 문제가 있으면 기존 `idolMatchConfig.ts`와 `IdolMatchGame.tsx`를 참고하세요!
