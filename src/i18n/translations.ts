export type Locale = "ko" | "en" | "ja" | "zh-CN" | "zh-TW";

export interface Translation {
	// Game info
	gameTitle: string;
	gameTip: string;

	// How to play
	howToPlayTitle: string;
	objectiveTitle: string;
	objectiveDescription: string;
	scoringTitle: string;
	scoringDescription: string;
	timeLimitTitle: string;
	timeLimitDescription: string;

	// Buttons
	startButtonText: string;
	gameOverTitle: string;
	finalScoreText: string;
	playAgainText: string;

	// Native app
	appRequiredTitle: string;
	appRequiredDescription: string;
	closeText: string;

	// Leaderboard
	leaderboardTitle: string;
	noScoresYet: string;
	beFirstPlayer: string;

	// Menu
	menuTitle: string;
	menuPlay: string;
	menuLeaderboard: string;
}

export const translations: Record<Locale, Translation> = {
	en: {
		gameTitle: "Run Letty!",
		gameTip: "The faster you collect hearts, the faster you go!",

		howToPlayTitle: "HOW TO PLAY",
		objectiveTitle: "Controls",
		objectiveDescription: "Tap/Click/Space = Jump (up to 3x)",
		scoringTitle: "Scoring",
		scoringDescription: "Collect hearts! Stage 10+: 2x points",
		timeLimitTitle: "Speed Up",
		timeLimitDescription: "Speed increases from score 20!",

		startButtonText: "START GAME",
		gameOverTitle: "GAME OVER!",
		finalScoreText: "Score:",
		playAgainText: "PLAY AGAIN",

		appRequiredTitle: "Mobile App Required",
		appRequiredDescription: "This game can only be played in the mobile app.",
		closeText: "Close",

		leaderboardTitle: "Leaderboard",
		noScoresYet: "No scores yet",
		beFirstPlayer: "Be the first to set a record!",

		menuTitle: "MENU",
		menuPlay: "Play",
		menuLeaderboard: "Leaderboard",
	},
	ko: {
		gameTitle: "달려라 레티!",
		gameTip: "하트를 모을 수록 속도가 빨라져요!",

		howToPlayTitle: "게임 방법",
		objectiveTitle: "조작법",
		objectiveDescription: "탭/클릭/스페이스 = 점프 (최대 3단)",
		scoringTitle: "점수",
		scoringDescription: "하트를 모으세요! 10단계+: 2배 점수",
		timeLimitTitle: "스피드 업",
		timeLimitDescription: "점수 20부터 속도가 빨라져요!",

		startButtonText: "게임 시작",
		gameOverTitle: "게임 종료!",
		finalScoreText: "점수:",
		playAgainText: "다시 하기",

		appRequiredTitle: "앱에서만 플레이 가능",
		appRequiredDescription: "이 게임은 모바일 앱에서만 플레이할 수 있어요.",
		closeText: "닫기",

		leaderboardTitle: "랭킹",
		noScoresYet: "아직 기록이 없어요",
		beFirstPlayer: "첫 주자가 돼줘!",

		menuTitle: "메뉴",
		menuPlay: "게임",
		menuLeaderboard: "리더보드",
	},
	ja: {
		gameTitle: "走れレティ!",
		gameTip: "ハートを集めるほど速くなるよ!",

		howToPlayTitle: "遊び方",
		objectiveTitle: "操作",
		objectiveDescription: "タップ/クリック/スペース = ジャンプ (最大3段)",
		scoringTitle: "スコア",
		scoringDescription: "ハートを集めよう！ステージ10+: 2倍得点",
		timeLimitTitle: "スピードアップ",
		timeLimitDescription: "スコア20からスピードアップ！",

		startButtonText: "ゲーム開始",
		gameOverTitle: "ゲーム終了！",
		finalScoreText: "スコア:",
		playAgainText: "もう一度",

		appRequiredTitle: "アプリが必要です",
		appRequiredDescription: "このゲームはモバイルアプリでのみプレイできます。",
		closeText: "閉じる",

		leaderboardTitle: "ランキング",
		noScoresYet: "まだ記録がありません",
		beFirstPlayer: "最初のプレイヤーになろう！",

		menuTitle: "メニュー",
		menuPlay: "ゲーム",
		menuLeaderboard: "ランキング",
	},
	"zh-CN": {
		gameTitle: "快跑莱蒂!",
		gameTip: "收集的爱心越多，速度越快！",

		howToPlayTitle: "游戏玩法",
		objectiveTitle: "操作",
		objectiveDescription: "点击/空格 = 跳跃 (最多3段)",
		scoringTitle: "计分",
		scoringDescription: "收集爱心！第10阶段+：2倍得分",
		timeLimitTitle: "加速",
		timeLimitDescription: "从20分开始加速！",

		startButtonText: "开始游戏",
		gameOverTitle: "游戏结束！",
		finalScoreText: "得分:",
		playAgainText: "再玩一次",

		appRequiredTitle: "需要移动应用",
		appRequiredDescription: "此游戏只能在移动应用中玩。",
		closeText: "关闭",

		leaderboardTitle: "排行榜",
		noScoresYet: "暂无记录",
		beFirstPlayer: "成为第一个创造记录的人！",

		menuTitle: "菜单",
		menuPlay: "游戏",
		menuLeaderboard: "排行榜",
	},
	"zh-TW": {
		gameTitle: "快跑萊蒂!",
		gameTip: "收集的愛心越多，速度越快！",

		howToPlayTitle: "遊戲玩法",
		objectiveTitle: "操作",
		objectiveDescription: "點擊/空格 = 跳躍 (最多3段)",
		scoringTitle: "計分",
		scoringDescription: "收集愛心！第10階段+：2倍得分",
		timeLimitTitle: "加速",
		timeLimitDescription: "從20分開始加速！",

		startButtonText: "開始遊戲",
		gameOverTitle: "遊戲結束！",
		finalScoreText: "得分:",
		playAgainText: "再玩一次",

		appRequiredTitle: "需要移動應用",
		appRequiredDescription: "此遊戲只能在移動應用中玩。",
		closeText: "關閉",

		leaderboardTitle: "排行榜",
		noScoresYet: "暫無記錄",
		beFirstPlayer: "成為第一個創造記錄的人！",

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
