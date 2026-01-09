import { useState, useEffect } from 'react';

const HIGHSCORE_KEY = 'turbo-typer-highscores-v2';

export const usePersistence = () => {
  const [highScores, setHighScores] = useState<number[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HIGHSCORE_KEY);
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load scores", e);
    }
  }, []);

  const saveScore = (netWpm: number) => {
    const newHistory = [...highScores, netWpm]
        .sort((a, b) => b - a)
        .slice(0, 5); 
    
    setHighScores(newHistory);
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(newHistory));
    return newHistory;
  };

  return { highScores, saveScore };
};
