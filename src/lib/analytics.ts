// Google Analytics tracking functions
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

export const trackGameStart = () => {
  if (window.gtag) {
    window.gtag('event', 'game_start', {
      event_category: 'game',
      event_label: 'Snake Game Started'
    });
  }
};

export const trackGameEnd = (score: number) => {
  if (window.gtag) {
    window.gtag('event', 'game_end', {
      event_category: 'game',
      event_label: 'Snake Game Ended',
      value: score
    });
  }
};

export const trackScoreSubmit = (score: number, name: string) => {
  if (window.gtag) {
    window.gtag('event', 'score_submit', {
      event_category: 'leaderboard',
      event_label: 'Score Submitted',
      value: score,
      player_name: name
    });
  }
};

export const trackLeaderboardView = () => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: 'Leaderboard',
      page_path: '/scoreboard'
    });
  }
};
