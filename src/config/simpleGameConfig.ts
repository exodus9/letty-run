import { GameConfig, FallingItem } from '@/types/gameTypes';
import { Locale } from '@/i18n/translations';

export interface SimpleGameItem extends FallingItem {
  symbol: string;
}

export const getSimpleGameConfig = (locale: Locale): GameConfig<SimpleGameItem> => {
  const uiTexts: Record<Locale, GameConfig<SimpleGameItem>['ui']> = {
    en: {
      howToPlayTitle: 'HOW TO PLAY',
      objectiveTitle: 'Objective',
      objectiveDescription: 'Click O to get points! Avoid clicking X!',
      scoringTitle: 'Scoring',
      scoringDescription: 'O: +5 | X: -3',
      timeLimitTitle: 'Time Limit',
      timeLimitDescription: 'You have 30 seconds!',
      startButtonText: 'START GAME',
      gameOverTitle: 'GAME OVER!',
      finalScoreText: 'Final Score:',
      playAgainText: 'PLAY AGAIN',
    },
    ko: {
      howToPlayTitle: '게임 방법',
      objectiveTitle: '게임 목표',
      objectiveDescription: 'O를 클릭하면 점수 획득! X는 피하세요!',
      scoringTitle: '점수',
      scoringDescription: 'O: +5 | X: -3',
      timeLimitTitle: '제한 시간',
      timeLimitDescription: '30초 안에 클릭하세요!',
      startButtonText: '게임 시작',
      gameOverTitle: '게임 종료!',
      finalScoreText: '최종 점수:',
      playAgainText: '다시 하기',
    },
    ja: {
      howToPlayTitle: '遊び方',
      objectiveTitle: 'ゲーム目的',
      objectiveDescription: 'Oをクリックして得点！Xは避けて！',
      scoringTitle: 'スコア',
      scoringDescription: 'O: +5 | X: -3',
      timeLimitTitle: '制限時間',
      timeLimitDescription: '30秒以内にクリック！',
      startButtonText: 'ゲーム開始',
      gameOverTitle: 'ゲーム終了！',
      finalScoreText: '最終スコア:',
      playAgainText: 'もう一度',
    },
    'zh-CN': {
      howToPlayTitle: '游戏玩法',
      objectiveTitle: '游戏目标',
      objectiveDescription: '点击O得分！避开X！',
      scoringTitle: '计分',
      scoringDescription: 'O: +5 | X: -3',
      timeLimitTitle: '时间限制',
      timeLimitDescription: '你有30秒时间！',
      startButtonText: '开始游戏',
      gameOverTitle: '游戏结束！',
      finalScoreText: '最终得分:',
      playAgainText: '再玩一次',
    },
    'zh-TW': {
      howToPlayTitle: '遊戲玩法',
      objectiveTitle: '遊戲目標',
      objectiveDescription: '點擊O得分！避開X！',
      scoringTitle: '計分',
      scoringDescription: 'O: +5 | X: -3',
      timeLimitTitle: '時間限制',
      timeLimitDescription: '你有30秒時間！',
      startButtonText: '開始遊戲',
      gameOverTitle: '遊戲結束！',
      finalScoreText: '最終得分:',
      playAgainText: '再玩一次',
    },
  };

  return {
    gameTitle: 'Simple Game',
    gameDescription: 'Click O to score!',

    data: [
      { id: 'correct', name: 'O', subItems: ['O'] },
      { id: 'wrong', name: 'X', subItems: ['X'] },
    ],

    colors: ['#22C55E', '#EF4444'],

    timeLimit: 30,
    correctPoints: 5,
    incorrectPoints: -3,
    correctProbability: 0.6,

    itemSpawnInterval: 2000,
    itemSpawnCount: { min: 2, max: 3 },
    itemSpawnDelay: 300,
    initialItemCount: { min: 3, max: 5 },

    speedRange: { min: 0.3, max: 0.5 },
    uniformSpeed: 0.4,

    ui: uiTexts[locale],

    customSpawnItem: (_data, _colors, correctProbability, speedRange) => {
      const isCorrect = Math.random() < correctProbability;
      const symbol = isCorrect ? 'O' : 'X';

      return {
        id: `${Date.now()}-${Math.random()}`,
        text: symbol,
        symbol: symbol,
        isCorrect: isCorrect,
        color: isCorrect ? '#22C55E' : '#EF4444',
        x: Math.random() * 70 + 15,
        y: -10,
        speed: speedRange.min + Math.random() * (speedRange.max - speedRange.min),
      };
    },
  };
};
