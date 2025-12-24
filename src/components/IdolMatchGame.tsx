import { Button } from "@/components/ui/button";
import { getIdolMatchConfig, IdolMatchItem } from "@/config/idolMatchConfig";
import { useFallingItemGame } from "@/hooks/useFallingItemGame";
import { useLocale } from "@/hooks/useLocale";
import { useEffect, useMemo } from "react";

const IdolMatchGame = () => {
	const { locale, t } = useLocale();

	// locale에 따라 config 생성
	const config = useMemo(() => getIdolMatchConfig(locale), [locale]);

	const { gameState, floatingScore, handleItemClick, resetGame, startGame } = useFallingItemGame<IdolMatchItem>(config);

	// locale이 변경되면 게임 리셋
	useEffect(() => {
		if (gameState.gameStarted || gameState.gameOver) {
			resetGame();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [locale]);

	return (
		<div className="flex flex-col items-center h-full game-container w-full">
			{/* Game Area - Full Height */}
			<div
				className="relative w-full bg-gradient-to-b from-idol-pink/10 via-idol-purple/10 to-idol-blue/10 border-4 border-idol-pink rounded-3xl shadow-pop overflow-hidden"
				style={{
					height: "calc(100vh - 150px)",
					WebkitTapHighlightColor: "transparent",
					touchAction: "manipulation",
				}}
			>
				{/* Score and Time Display - Top Left */}
				{gameState.gameStarted && !gameState.gameOver && (
					<div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl border-3 border-idol-pink shadow-lg">
						<div className="flex flex-col gap-1">
							<div className="font-bubble text-lg font-bold text-idol-pink">⭐ {gameState.score}</div>
							<div className="font-bubble text-lg font-bold text-idol-purple">⏰ {gameState.timeLeft}s</div>
						</div>
					</div>
				)}

				{/* Falling Items */}
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
						className="absolute px-3 py-3 text-white font-bubble font-bold rounded-xl shadow-lg active:scale-95 cursor-pointer border-3 border-white flex items-center justify-center"
						style={{
							left: `clamp(0px, calc(${item.x}% - 75px), calc(100% - 150px))`,
							top: `${item.y}%`,
							backgroundColor: item.color,
							fontSize: "clamp(0.75rem, 2.5vw, 1.1rem)",
							whiteSpace: "normal",
							wordBreak: "keep-all",
							overflowWrap: "break-word",
							boxShadow: "0 4px 15px rgba(0,0,0,0.2), 0 0 20px rgba(255,255,255,0.3)",
							transition: "transform 0.1s ease-out",
							width: "150px",
							minHeight: "56px",
							touchAction: "manipulation",
							pointerEvents: "auto",
							zIndex: 15,
							display: "flex",
							userSelect: "none",
							lineHeight: "1.3",
							textAlign: "center",
						}}
					>
						<span style={{
							wordBreak: "keep-all",
							overflowWrap: "break-word",
							whiteSpace: "normal",
							display: "block",
							width: "100%"
						}}>{item.text}</span>
					</button>
				))}

				{/* Countdown Overlay */}
				{gameState.countdown !== null && (
					<div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
						<div
							key={gameState.countdown}
							className="text-9xl font-bubble font-bold text-idol-pink animate-pop"
							style={{
								textShadow: "4px 4px 0 hsl(280 70% 65%)",
							}}
						>
							{gameState.countdown}
						</div>
					</div>
				)}

				{/* Floating Score Animation */}
				{floatingScore && (
					<div key={floatingScore.id} className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
						<div
							className={`font-bubble font-bold text-6xl md:text-7xl animate-bounce-fade ${
								floatingScore.isCorrect ? "text-idol-mint" : "text-idol-coral"
							}`}
							style={{
								textShadow: floatingScore.isCorrect
									? "0 0 30px rgba(108, 229, 232, 0.8), 0 0 60px rgba(108, 229, 232, 0.5)"
									: "0 0 30px rgba(255, 127, 140, 0.8), 0 0 60px rgba(255, 127, 140, 0.5)",
								animation: "bounceAndFade 1s ease-out forwards",
							}}
						>
							{floatingScore.isCorrect ? "💖" : "💔"} {floatingScore.points > 0 ? "+" : ""}
							{floatingScore.points}
						</div>
					</div>
				)}

				{/* Native App Message */}
				{gameState.showNativeMessage && (
					<div className="absolute inset-0 flex items-center justify-center p-4 z-30 bg-white/80 backdrop-blur-sm">
						<div className="space-y-4 bg-white border-4 border-idol-pink rounded-3xl p-6 md:p-8 shadow-pop max-w-md w-full">
							<h3 className="text-2xl md:text-3xl font-bubble font-bold text-idol-pink">MOBILE APP REQUIRED</h3>
							<p className="font-fun text-base md:text-lg text-foreground">
								This game can only be played in the mobile app.
							</p>
							<p className="font-fun text-sm text-muted-foreground">
								Please open this game in the Android or iOS app.
							</p>
							<Button
								onClick={() => window.location.reload()}
								className="w-full font-bubble text-lg px-6 py-4 bg-gradient-to-r from-idol-pink to-idol-purple hover:from-idol-purple hover:to-idol-pink text-white shadow-pop border-4 border-white rounded-2xl"
							>
								CLOSE
							</Button>
						</div>
					</div>
				)}

				{/* How to Play - Before Game Start */}
				{!gameState.gameStarted && !gameState.gameOver && gameState.countdown === null && !gameState.showNativeMessage && (
					<div className="absolute inset-0 flex flex-col items-center justify-center p-2 xs:p-3 sm:p-4 md:p-8 overflow-y-auto z-20">
						<div className="max-w-2xl w-full space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-6">
							<h2 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-bubble font-bold text-idol-pink text-center mb-2 xs:mb-3 sm:mb-4 md:mb-6">{t.howToPlayTitle}</h2>

							<div className="space-y-2 xs:space-y-3 sm:space-y-4 bg-white/90 backdrop-blur-sm p-3 xs:p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl">
								<div className="bg-idol-pink/10 p-2 xs:p-3 sm:p-4 rounded-lg sm:rounded-xl text-center">
									<p className="font-bubble text-sm xs:text-base sm:text-lg md:text-xl font-bold text-idol-pink mb-1 sm:mb-2 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2">
										<span className="text-base xs:text-lg sm:text-xl md:text-2xl">🎯</span>
										{t.objectiveTitle}
									</p>
									<p className="font-fun text-xs xs:text-sm sm:text-base md:text-lg text-foreground leading-snug">{t.objectiveDescription}</p>
								</div>

								<div className="bg-idol-mint/20 p-2 xs:p-3 sm:p-4 rounded-lg sm:rounded-xl text-center">
									<p className="font-bubble text-sm xs:text-base sm:text-lg md:text-xl font-bold text-idol-blue mb-1 sm:mb-2 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2">
										<span className="text-base xs:text-lg sm:text-xl md:text-2xl">⭐</span>
										{t.scoringTitle}
									</p>
									<p className="font-fun text-xs xs:text-sm sm:text-base md:text-lg text-foreground leading-snug">{t.scoringDescription}</p>
								</div>

								<div className="bg-idol-coral/20 p-2 xs:p-3 sm:p-4 rounded-lg sm:rounded-xl text-center">
									<p className="font-bubble text-sm xs:text-base sm:text-lg md:text-xl font-bold text-idol-coral mb-1 sm:mb-2 flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2">
										<span className="text-base xs:text-lg sm:text-xl md:text-2xl">⏰</span>
										{t.timeLimitTitle}
									</p>
									<p className="font-fun text-xs xs:text-sm sm:text-base md:text-lg text-foreground leading-snug">{t.timeLimitDescription}</p>
								</div>
							</div>

							<Button
								size="lg"
								onClick={startGame}
								disabled={!gameState.startButtonEnabled || gameState.isProcessingStart}
								className={`w-full font-bubble text-base xs:text-lg sm:text-2xl md:text-3xl px-4 xs:px-6 sm:px-8 py-3 xs:py-4 sm:py-6 shadow-pop border-2 xs:border-3 sm:border-4 border-white rounded-xl sm:rounded-2xl ${
									gameState.startButtonEnabled && !gameState.isProcessingStart
										? 'bg-gradient-to-r from-idol-pink to-idol-purple hover:from-idol-purple hover:to-idol-pink text-white'
										: 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
								}`}
							>
								{gameState.isProcessingStart ? 'PROCESSING...' : gameState.startButtonEnabled ? t.startButtonText : 'LOADING...'}
							</Button>
						</div>
					</div>
				)}

				{/* Game Over Screen */}
				{gameState.gameOver && (
					<div className="absolute inset-0 flex items-center justify-center p-4 z-20 bg-white/80 backdrop-blur-sm">
						<div className="space-y-4 bg-white border-4 border-idol-pink rounded-3xl p-6 md:p-8 shadow-pop max-w-md w-full">
							<h3 className="text-3xl md:text-4xl font-bubble font-bold text-idol-pink">{t.gameOverTitle}</h3>
							<p className="font-fun text-xl md:text-2xl text-foreground">
								{t.finalScoreText} <span className="font-bold text-idol-purple">{gameState.score}</span>
							</p>
							<Button
								onClick={resetGame}
								className="w-full font-bubble text-lg px-6 py-4 bg-gradient-to-r from-idol-blue to-idol-mint hover:from-idol-mint hover:to-idol-blue text-white shadow-pop border-4 border-white rounded-2xl"
							>
								{t.playAgainText}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default IdolMatchGame;
