export type Locale = "ko" | "en" | "ja" | "zh-CN" | "zh-TW";

export interface Translation {
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
	menuTitle: string;
	menuPlay: string;
	menuLeaderboard: string;
}

export const translations: Record<Locale, Translation> = {
	en: {
		howToPlayTitle: "HOW TO PLAY",
		objectiveTitle: "Objective",
		objectiveDescription: "Click O to get points! Avoid clicking X!",
		scoringTitle: "Scoring",
		scoringDescription: "O: +5 | X: -3",
		timeLimitTitle: "Time Limit",
		timeLimitDescription: "You have 30 seconds!",
		startButtonText: "START GAME",
		gameOverTitle: "GAME OVER!",
		finalScoreText: "Final Score:",
		playAgainText: "PLAY AGAIN",
		menuTitle: "MENU",
		menuPlay: "Play",
		menuLeaderboard: "Leaderboard",
	},
	ko: {
		howToPlayTitle: "게임 방법",
		objectiveTitle: "게임 목표",
		objectiveDescription: "O를 클릭하면 점수 획득! X는 피하세요!",
		scoringTitle: "점수",
		scoringDescription: "O: +5 | X: -3",
		timeLimitTitle: "제한 시간",
		timeLimitDescription: "30초 안에 클릭하세요!",
		startButtonText: "게임 시작",
		gameOverTitle: "게임 종료!",
		finalScoreText: "최종 점수:",
		playAgainText: "다시 하기",
		menuTitle: "메뉴",
		menuPlay: "게임",
		menuLeaderboard: "리더보드",
	},
	ja: {
		howToPlayTitle: "遊び方",
		objectiveTitle: "ゲーム目的",
		objectiveDescription: "Oをクリックして得点！Xは避けて！",
		scoringTitle: "スコア",
		scoringDescription: "O: +5 | X: -3",
		timeLimitTitle: "制限時間",
		timeLimitDescription: "30秒以内にクリック！",
		startButtonText: "ゲーム開始",
		gameOverTitle: "ゲーム終了！",
		finalScoreText: "最終スコア:",
		playAgainText: "もう一度",
		menuTitle: "メニュー",
		menuPlay: "ゲーム",
		menuLeaderboard: "ランキング",
	},
	"zh-CN": {
		howToPlayTitle: "游戏玩法",
		objectiveTitle: "游戏目标",
		objectiveDescription: "点击O得分！避开X！",
		scoringTitle: "计分",
		scoringDescription: "O: +5 | X: -3",
		timeLimitTitle: "时间限制",
		timeLimitDescription: "你有30秒时间！",
		startButtonText: "开始游戏",
		gameOverTitle: "游戏结束！",
		finalScoreText: "最终得分:",
		playAgainText: "再玩一次",
		menuTitle: "菜单",
		menuPlay: "游戏",
		menuLeaderboard: "排行榜",
	},
	"zh-TW": {
		howToPlayTitle: "遊戲玩法",
		objectiveTitle: "遊戲目標",
		objectiveDescription: "點擊O得分！避開X！",
		scoringTitle: "計分",
		scoringDescription: "O: +5 | X: -3",
		timeLimitTitle: "時間限制",
		timeLimitDescription: "你有30秒時間！",
		startButtonText: "開始遊戲",
		gameOverTitle: "遊戲結束！",
		finalScoreText: "最終得分:",
		playAgainText: "再玩一次",
		menuTitle: "選單",
		menuPlay: "遊戲",
		menuLeaderboard: "排行榜",
	},
};

export const DEFAULT_LOCALE: Locale = "en";

export function getLocaleFromStorage(): Locale {
	if (typeof window === "undefined") return DEFAULT_LOCALE;

	const stored = localStorage.getItem("locale");
	if (stored && isValidLocale(stored)) {
		return stored as Locale;
	}

	return DEFAULT_LOCALE;
}

function isValidLocale(locale: string): locale is Locale {
	return ["ko", "en", "ja", "zh-CN", "zh-TW"].includes(locale);
}
