import { GameConfig, FallingItem } from '@/types/gameTypes';
import { Locale } from '@/i18n/translations';
import itemsData from '@/static/items.json';

// Idol Match 게임 전용 아이템 인터페이스
export interface IdolMatchItem extends FallingItem {
  groupName: string;
  memberName: string;
}

// items.json의 아이템 타입
interface ItemData {
  name_ko: string;
  name_en: string;
  name_jp: string;
  name_zh_tw: string;
  name_zh_cn: string;
}

// locale에 따라 적절한 필드명 반환
const getLocaleFieldName = (locale: Locale): keyof ItemData => {
  const fieldMap: Record<Locale, keyof ItemData> = {
    ko: 'name_ko',
    en: 'name_en',
    ja: 'name_jp',
    'zh-CN': 'name_zh_cn',
    'zh-TW': 'name_zh_tw',
  };
  return fieldMap[locale] || 'name_en';
};

// "멤버_그룹" 형식을 파싱
const parseIdolName = (fullName: string): { group: string; member: string } => {
  const parts = fullName.split('_');
  if (parts.length >= 2) {
    const member = parts.slice(0, -1).join('_');
    const group = parts[parts.length - 1];
    return { group, member };
  }
  return { group: '', member: fullName };
};

// Idol Match 게임 설정을 locale에 따라 생성하는 함수
export const getIdolMatchConfig = (locale: Locale): GameConfig<IdolMatchItem> => {
  const fieldName = getLocaleFieldName(locale);
  const parsedItems = (itemsData as ItemData[])
    .map(item => {
      const fullName = item[fieldName];
      return parseIdolName(fullName);
    })
    .filter((parsed) => parsed.group.trim().length > 0 && parsed.member.trim().length > 0);

  const items =
    parsedItems.length > 0
      ? parsedItems
      : [{ group: 'IDOL', member: 'Unknown' }];

  return {
  // 게임 메타데이터
  gameTitle: 'Idol Match Game',
  gameDescription: 'Match the correct idol group members!',

  // 게임 데이터
  data: [
    { id: 'bts', name: 'BTS', subItems: ['RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'] },
    { id: 'blackpink', name: 'BLACKPINK', subItems: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'] },
    { id: 'twice', name: 'TWICE', subItems: ['Nayeon', 'Jeongyeon', 'Momo', 'Sana', 'Jihyo', 'Mina', 'Dahyun', 'Chaeyoung', 'Tzuyu'] },
    { id: 'seventeen', name: 'SEVENTEEN', subItems: ['S.Coups', 'Jeonghan', 'Joshua', 'Jun', 'Hoshi', 'Wonwoo', 'Woozi', 'DK', 'Mingyu', 'The8', 'Seungkwan', 'Vernon', 'Dino'] },
    { id: 'newjeans', name: 'NewJeans', subItems: ['Minji', 'Hanni', 'Danielle', 'Haerin', 'Hyein'] },
    { id: 'aespa', name: 'aespa', subItems: ['Karina', 'Giselle', 'Winter', 'Ningning'] },
    { id: 'txt', name: 'TXT', subItems: ['Yeonjun', 'Soobin', 'Beomgyu', 'Taehyun', 'Hueningkai'] },
    { id: 'itzy', name: 'ITZY', subItems: ['Yeji', 'Lia', 'Ryujin', 'Chaeryeong', 'Yuna'] },
  ],

  // 색상 팔레트 (톤다운된 색상)
  colors: [
    '#D84A8C', // Muted Pink
    '#7B4A9E', // Muted Purple
    '#2A7AB8', // Muted Blue
    '#4ABCBE', // Muted Mint
    '#D85A6A', // Muted Coral
    '#C9A200', // Muted Gold
    '#5CBD00', // Muted Chartreuse
    '#CC7000', // Muted Orange
    '#C41075', // Muted Deep Pink
    '#00A5A8', // Muted Turquoise
  ],

  // 게임 규칙
  timeLimit: 60, // 60초
  correctPoints: 2,
  incorrectPoints: -2,
  correctProbability: 0.6, // 정답 확률 (0.0 ~ 1.0): 0.6 = 60%

  // 아이템 생성 설정
  itemSpawnInterval: 1500, // 1.5초마다
  itemSpawnCount: { min: 2, max: 3 }, // 2-3개씩 생성
  itemSpawnDelay: 150, // 각 아이템 사이 150ms 지연 (간격 축소)
  initialItemCount: { min: 4, max: 6 }, // 초기 4-6개 생성

  // 아이템 속도 설정
  speedRange: { min: 0.21, max: 0.525 }, // 1.5x faster (0.14*1.5=0.21, 0.35*1.5=0.525)
  uniformSpeed: 0.36, // 1.5x faster (0.24*1.5=0.36)
  spawnSpacing: {
    minHorizontalGap: 12,
    minVerticalGap: 12, // 박스 간격 축소
    verticalThreshold: 18,
    maxAttempts: 14,
    maxVerticalShift: 50,
  },

  // UI 텍스트
  ui: {
    howToPlayTitle: '📖 HOW TO PLAY2 📖',
    objectiveTitle: 'Game Objective',
    objectiveDescription: 'Click CORRECT idol combinations! Ex: BTS-Jungkook ✓',
    scoringTitle: 'Scoring',
    scoringDescription: 'Correct: +2 | Wrong: -2',
    timeLimitTitle: 'Time Limit',
    timeLimitDescription: 'You have 60 seconds!',
    startButtonText: '✨ START GAME ✨',
    gameOverTitle: '🎉 GAME OVER! 🎉',
    finalScoreText: 'Final Score:',
    playAgainText: '🔄 PLAY AGAIN',
  },

  // 커스텀 아이템 생성 함수
  customSpawnItem: (_data, colors, correctProbability, speedRange) => {
    // locale별 실제 아이돌 데이터에서 랜덤 선택
    const safeItems = items.length > 0 ? items : [{ group: 'IDOL', member: 'Unknown' }];
    const randomItem = safeItems[Math.floor(Math.random() * safeItems.length)];
    const isCorrect = Math.random() < correctProbability;

    let displayGroup: string;
    let displayMember: string;

    if (isCorrect) {
      // 정답: 실제 조합 사용
      displayGroup = randomItem.group;
      displayMember = randomItem.member;
    } else {
      // 오답: 그룹은 유지하고 다른 멤버 선택
      displayGroup = randomItem.group;
      // 다른 그룹의 랜덤 멤버 선택
      const otherItems = safeItems.filter(item => item.group !== randomItem.group);
      if (otherItems.length > 0) {
        const wrongItem = otherItems[Math.floor(Math.random() * otherItems.length)];
        displayMember = wrongItem.member;
      } else {
        // 만약 다른 그룹이 없으면 같은 그룹의 다른 멤버 (fallback)
        displayMember = randomItem.member || 'Unknown';
      }
    }

    return {
      id: `${Date.now()}-${Math.random()}`,
      text: `${displayGroup || 'IDOL'}-${displayMember || 'Unknown'}`,
      groupName: displayGroup || 'IDOL',
      memberName: displayMember || 'Unknown',
      isCorrect: isCorrect,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 80 + 10, // 10-90% of screen width
      y: -10,
      speed: speedRange.min + Math.random() * (speedRange.max - speedRange.min),
    };
  },

  // 커스텀 클릭 핸들러 (기본 로직 사용)
  customHandleItemClick: (item, currentScore) => {
    const pointChange = item.isCorrect ? 2 : -2;
    const newScore = Math.max(0, currentScore + pointChange);
    return { newScore, pointChange };
  },
  };
};

// 기본 설정 (영어)
export const idolMatchConfig = getIdolMatchConfig('en');
