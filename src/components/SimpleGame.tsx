import { Button } from "@/components/ui/button";
import { getSimpleGameConfig, SimpleGameItem } from "@/config/simpleGameConfig";
import { useFallingItemGame } from "@/hooks/useFallingItemGame";
import { useLocale } from "@/hooks/useLocale";
import { useEffect, useMemo } from "react";

const SimpleGame = () => {
	const { locale, t } = useLocale();

	const config = useMemo(() => getSimpleGameConfig(locale), [locale]);

	const { gameState, floatingScore, handleItemClick, resetGame, startGame } = useFallingItemGame<SimpleGameItem>(config);

	useEffect(() => {
		if (gameState.gameStarted || gameState.gameOver) {
			resetGame();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [locale]);

	return (
		<div className="flex flex-col items-center h-full game-container w-full">
			<div
				className="relative w-full bg-gradient-to-b from-blue-50 via-gray-50 to-green-50 border-4 border-blue-500 rounded-3xl shadow-lg overflow-hidden"
				style={{
					height: "calc(100vh - 150px)",
					WebkitTapHighlightColor: "transparent",
					touchAction: "manipulation",
				}}
			>
				{/* Score and Time Display */}
				{gameState.gameStarted && !gameState.gameOver && (
					<div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl border-2 border-blue-500 shadow-lg">
						<div className="flex flex-col gap-1">
							<div className="font-bold text-lg text-blue-600">Score: {gameState.score}</div>
							<div className="font-bold text-lg text-gray-600">Time: {gameState.timeLeft}s</div>
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
						className="absolute px-6 py-4 text-white font-bold rounded-full shadow-lg active:scale-95 cursor-pointer border-4 border-white flex items-center justify-center"
						style={{
							left: `clamp(0px, calc(${item.x}% - 40px), calc(100% - 80px))`,
							top: `${item.y}%`,
							backgroundColor: item.color,
							fontSize: "2rem",
							width: "80px",
							height: "80px",
							touchAction: "manipulation",
							pointerEvents: "auto",
							zIndex: 15,
							userSelect: "none",
						}}
					>
						{item.text}
					</button>
				))}

				{/* Countdown */}
				{gameState.countdown !== null && (
					<div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
						<div
							key={gameState.countdown}
							className="text-9xl font-bold text-blue-600"
							style={{
								animation: "pulse 1s ease-in-out",
							}}
						>
							{gameState.countdown}
						</div>
					</div>
				)}

				{/* Floating Score */}
				{floatingScore && (
					<div key={floatingScore.id} className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
						<div
							className={`font-bold text-6xl md:text-7xl ${
								floatingScore.isCorrect ? "text-green-500" : "text-red-500"
							}`}
							style={{
								animation: "bounceAndFade 1s ease-out forwards",
							}}
						>
							{floatingScore.isCorrect ? "O" : "X"} {floatingScore.points > 0 ? "+" : ""}
							{floatingScore.points}
						</div>
					</div>
				)}

				{/* Native App Message */}
				{gameState.showNativeMessage && (
					<div className="absolute inset-0 flex items-center justify-center p-4 z-30 bg-white/80 backdrop-blur-sm">
						<div className="space-y-4 bg-white border-4 border-blue-500 rounded-3xl p-6 md:p-8 shadow-lg max-w-md w-full">
							<h3 className="text-2xl md:text-3xl font-bold text-blue-600">MOBILE APP REQUIRED</h3>
							<p className="text-base md:text-lg text-gray-700">
								This game can only be played in the mobile app.
							</p>
							<p className="text-sm text-gray-500">
								Please open this game in the Android or iOS app.
							</p>
							<Button
								onClick={() => window.location.reload()}
								className="w-full text-lg px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white border-4 border-white rounded-2xl"
							>
								CLOSE
							</Button>
						</div>
					</div>
				)}

				{/* How to Play */}
				{!gameState.gameStarted && !gameState.gameOver && gameState.countdown === null && !gameState.showNativeMessage && (
					<div className="absolute inset-0 flex flex-col items-center justify-center p-4 overflow-y-auto z-20">
						<div className="max-w-2xl w-full space-y-4">
							<h2 className="text-3xl md:text-5xl font-bold text-blue-600 text-center mb-6">{t.howToPlayTitle}</h2>

							<div className="space-y-4 bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-2xl">
								<div className="bg-green-100 p-4 rounded-xl text-center">
									<p className="font-bold text-xl text-green-600 mb-2">
										{t.objectiveTitle}
									</p>
									<p className="text-lg">{t.objectiveDescription}</p>
								</div>

								<div className="bg-blue-100 p-4 rounded-xl text-center">
									<p className="font-bold text-xl text-blue-600 mb-2">
										{t.scoringTitle}
									</p>
									<p className="text-lg">{t.scoringDescription}</p>
								</div>

								<div className="bg-orange-100 p-4 rounded-xl text-center">
									<p className="font-bold text-xl text-orange-600 mb-2">
										{t.timeLimitTitle}
									</p>
									<p className="text-lg">{t.timeLimitDescription}</p>
								</div>
							</div>

							<Button
								size="lg"
								onClick={startGame}
								disabled={!gameState.startButtonEnabled || gameState.isProcessingStart}
								className={`w-full text-2xl md:text-3xl px-8 py-6 border-4 border-white rounded-2xl ${
									gameState.startButtonEnabled && !gameState.isProcessingStart
										? 'bg-blue-500 hover:bg-blue-600 text-white'
										: 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
								}`}
							>
								{gameState.isProcessingStart ? 'PROCESSING...' : gameState.startButtonEnabled ? t.startButtonText : 'LOADING...'}
							</Button>
						</div>
					</div>
				)}

				{/* Game Over */}
				{gameState.gameOver && (
					<div className="absolute inset-0 flex items-center justify-center p-4 z-20 bg-white/80 backdrop-blur-sm">
						<div className="space-y-4 bg-white border-4 border-blue-500 rounded-3xl p-6 md:p-8 shadow-lg max-w-md w-full">
							<h3 className="text-3xl md:text-4xl font-bold text-blue-600">{t.gameOverTitle}</h3>
							<p className="text-xl md:text-2xl text-gray-700">
								{t.finalScoreText} <span className="font-bold text-blue-600">{gameState.score}</span>
							</p>
							<Button
								onClick={resetGame}
								className="w-full text-lg px-6 py-4 bg-green-500 hover:bg-green-600 text-white border-4 border-white rounded-2xl"
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

export default SimpleGame;
