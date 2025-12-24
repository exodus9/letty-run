import { GameConfig, FallingItem } from '@/types/gameTypes';

// Soccer Match 게임 전용 아이템 인터페이스
export interface SoccerMatchItem extends FallingItem {
  teamName: string;
  playerName: string;
}

// Soccer Match 게임 설정
export const soccerMatchConfig: GameConfig<SoccerMatchItem> = {
  // 게임 메타데이터
  gameTitle: 'Soccer Team Match',
  gameDescription: 'Match players with their teams!',

  // 게임 데이터
  data: [
    {
      id: 'mancity',
      name: 'Manchester City',
      subItems: ['Haaland', 'De Bruyne', 'Foden', 'Rodri', 'Grealish']
    },
    {
      id: 'arsenal',
      name: 'Arsenal',
      subItems: ['Saka', 'Odegaard', 'Rice', 'Saliba', 'Martinelli']
    },
    {
      id: 'liverpool',
      name: 'Liverpool',
      subItems: ['Salah', 'Van Dijk', 'Alexander-Arnold', 'Mac Allister', 'Diaz']
    },
    {
      id: 'realmadrid',
      name: 'Real Madrid',
      subItems: ['Bellingham', 'Vinicius', 'Modric', 'Courtois', 'Rudiger']
    },
    {
      id: 'barcelona',
      name: 'Barcelona',
      subItems: ['Lewandowski', 'Gundogan', 'Pedri', 'Ter Stegen', 'Gavi']
    },
  ],

  // 색상 팔레트
  colors: [
    '#6CABDD', // Man City Blue
    '#EF0107', // Arsenal Red
    '#C8102E', // Liverpool Red
    '#FEBE10', // Real Madrid Gold
    '#A50044', // Barcelona Maroon
    '#004170', // Dark Blue
  ],

  // 게임 규칙
  timeLimit: 20, // 20초
  correctPoints: 3,
  incorrectPoints: -2,
  correctProbability: 0.65, // 65% 확률로 정답

  // 아이템 생성 설정
  itemSpawnInterval: 2500, // 2.5초마다
  itemSpawnCount: { min: 2, max: 3 }, // 2-3개씩 생성
  itemSpawnDelay: 400, // 각 아이템 사이 400ms 지연
  initialItemCount: { min: 4, max: 6 }, // 초기 4-6개 생성

  // 아이템 속도 설정
  speedRange: { min: 0.25, max: 0.55 }, // 0.25-0.55 pixels per frame

  // UI 텍스트
  ui: {
    howToPlayTitle: '⚽ HOW TO PLAY ⚽',
    objectiveTitle: 'Game Objective',
    objectiveDescription: 'Click CORRECT player-team pairs! Ex: Manchester City-Haaland ✓',
    scoringTitle: 'Scoring',
    scoringDescription: 'Correct: +3 | Wrong: -2',
    timeLimitTitle: 'Time Limit',
    timeLimitDescription: 'You have 20 seconds!',
    startButtonText: '⚽ START GAME ⚽',
    gameOverTitle: '🏆 GAME OVER! 🏆',
    finalScoreText: 'Final Score:',
    playAgainText: '🔄 PLAY AGAIN',
  },

  // 커스텀 아이템 생성 함수
  customSpawnItem: (data, colors, correctProbability, speedRange) => {
    const team = data[Math.floor(Math.random() * data.length)];
    const isCorrect = Math.random() < correctProbability;

    let playerName: string;
    if (isCorrect) {
      // 같은 팀의 선수 선택
      playerName = team.subItems[Math.floor(Math.random() * team.subItems.length)];
    } else {
      // 다른 팀의 선수 선택
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
      x: Math.random() * 80 + 10, // 10-90% of screen width
      y: -10,
      speed: speedRange.min + Math.random() * (speedRange.max - speedRange.min),
    };
  },

  // 커스텀 클릭 핸들러 (기본 로직 사용)
  customHandleItemClick: (item, currentScore) => {
    const pointChange = item.isCorrect ? 3 : -2;
    const newScore = Math.max(0, currentScore + pointChange);
    return { newScore, pointChange };
  },
};
