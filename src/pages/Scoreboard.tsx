import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useScoreboard } from "@/hooks/useScoreboard";
import { trackLeaderboardView } from "@/lib/analytics";
import { useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";

const Scoreboard = () => {
  const { t } = useLocale();
  const { scores, loading, error } = useScoreboard();

  useEffect(() => {
    trackLeaderboardView();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black text-red-400 mb-8">
              LOADING...
            </h1>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black text-red-500 mb-8">
              ERROR
            </h1>
            <p className="text-gray-700">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `${rank}.`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50";
      case 2:
        return "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50";
      case 3:
        return "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50";
      default:
        return "border-rose-200 bg-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black text-red-400 mb-6 md:mb-8 text-center drop-shadow-md">
            🏆 {t.leaderboardTitle} 🏆
          </h1>

          {/* Scoreboard */}
          <div className="bg-white border-4 border-red-400 rounded-3xl shadow-2xl p-4 md:p-8">
            {scores.length === 0 ? (
              <div className="text-center py-12">
                <img src="/letty.webp" alt="Letty" className="w-24 h-24 object-contain mx-auto mb-4" />
                <p className="font-bold text-2xl text-red-400 mb-4">
                  {t.noScoresYet}
                </p>
                <p className="text-lg text-gray-600">
                  {t.beFirstPlayer}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`flex items-center justify-between p-4 border-4 rounded-2xl ${getRankColor(index + 1)} transition-all hover:scale-[1.02] shadow-md`}
                  >
                    <span className="font-black text-2xl md:text-3xl min-w-[50px] flex-shrink-0 text-gray-800">
                      {getRankMedal(index + 1)}
                    </span>
                    <span className="font-bold text-lg md:text-xl text-gray-800 truncate flex-1 min-w-0 mx-2">
                      {score.player_name}
                    </span>
                    <span className="font-black text-xl md:text-2xl text-red-500 flex-shrink-0">
                      ❤️ {score.score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-center mt-8">
            <Link to="/">
              <Button
                size="lg"
                className="font-black text-xl bg-gradient-to-r from-red-400 to-rose-400 hover:from-red-500 hover:to-rose-500 text-white shadow-xl rounded-2xl px-8 py-6 border-4 border-white flex items-center gap-2"
              >
                <img src="/letty.webp" alt="Letty" className="w-8 h-8 object-contain" />
                {t.menuPlay} ❤️
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Scoreboard;
