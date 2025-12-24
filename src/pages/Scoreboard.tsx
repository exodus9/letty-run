import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useScoreboard } from "@/hooks/useScoreboard";
import { trackLeaderboardView } from "@/lib/analytics";
import { useEffect } from "react";

const Scoreboard = () => {
  const { scores, loading, error } = useScoreboard();

  useEffect(() => {
    trackLeaderboardView();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-8">
              LOADING...
            </h1>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-red-500 mb-8">
              ERROR LOADING SCORES
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return "1st";
      case 2:
        return "2nd";
      case 3:
        return "3rd";
      default:
        return `${rank}th`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-400 bg-yellow-50";
      case 2:
        return "border-gray-400 bg-gray-50";
      case 3:
        return "border-orange-400 bg-orange-50";
      default:
        return "border-blue-300 bg-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-6 md:mb-8 text-center">
            LEADERBOARD
          </h1>

          {/* Scoreboard */}
          <div className="bg-white border-4 border-blue-500 rounded-3xl shadow-lg p-4 md:p-8">
            {scores.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">O</div>
                <p className="font-bold text-2xl text-blue-600 mb-4">
                  NO SCORES YET
                </p>
                <p className="text-lg text-gray-600">
                  Be the first to set a record!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map((score, index) => (
                  <div
                    key={score.id}
                    className={`flex items-center justify-between p-4 border-4 rounded-2xl ${getRankColor(index + 1)} transition-all hover:scale-105`}
                  >
                    <span className="font-bold text-2xl md:text-3xl min-w-[60px] flex-shrink-0 text-gray-700">
                      {getRankMedal(index + 1)}
                    </span>
                    <span className="font-bold text-lg md:text-2xl text-gray-700 truncate flex-1 min-w-0 mx-2">
                      {score.player_name}
                    </span>
                    <span className="font-bold text-xl md:text-3xl text-blue-600 flex-shrink-0">
                      {score.score}
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
                className="font-bold text-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg border-4 border-white rounded-2xl px-8 py-6"
              >
                PLAY GAME
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Scoreboard;
