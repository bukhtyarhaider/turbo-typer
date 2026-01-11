// Analytics Integration Template
// Add this to track user engagement and SEO performance

// OPTION 1: Google Analytics 4 (Most Popular)
// ============================================
// 1. Get tracking ID from https://analytics.google.com/
// 2. Add to index.html before </head>:

/*
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
*/

// OPTION 2: Plausible Analytics (Privacy-Friendly)
// ================================================
// 1. Sign up at https://plausible.io/
// 2. Add to index.html before </head>:

/*
<script defer data-domain="turbo-typer.vercel.app" src="https://plausible.io/js/script.js"></script>
*/

// OPTION 3: Custom Event Tracking (Add to App.tsx)
// ================================================

// Track game starts
export const trackGameStart = (difficulty: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "game_start", {
      event_category: "engagement",
      event_label: difficulty,
    });
  }
};

// Track game completion
export const trackGameComplete = (wpm: number, difficulty: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "game_complete", {
      event_category: "engagement",
      event_label: difficulty,
      value: wpm,
    });
  }
};

// Track high score
export const trackHighScore = (wpm: number) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "high_score", {
      event_category: "achievement",
      value: wpm,
    });
  }
};

// Track social share
export const trackShare = (platform: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "share", {
      event_category: "engagement",
      event_label: platform,
    });
  }
};

// Track multiplayer
export const trackMultiplayer = (action: string) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "multiplayer", {
      event_category: "engagement",
      event_label: action,
    });
  }
};

// USAGE EXAMPLE IN APP.TSX:
// ==========================

/*
import { trackGameStart, trackGameComplete, trackHighScore } from './analytics';

// In startGame function:
const startGame = () => {
  trackGameStart(difficulty);
  setStatus(GameStatus.PLAYING);
};

// In handleFinish function:
const handleFinish = (report: GameReport) => {
  trackGameComplete(report.finalWpm, difficulty);
  
  if (report.isNewRecord) {
    trackHighScore(report.finalWpm);
  }
  
  setGameReport(report);
  setStatus(GameStatus.FINISHED);
};
*/

// IMPORTANT: Update privacy policy if adding analytics!
// Add link to privacy policy in footer

export {};
