import { useState, useRef, useCallback } from 'react';
import { GameStatus, GameStats, Difficulty, GameReport } from '../types';
import { generateTypingText } from '../services/textService';
import { soundService } from '../services/soundService';

interface UseTypingEngineProps {
  status: GameStatus;
  setStatus: (s: GameStatus) => void;
  onMistake: () => void;
  onFinish: (report: GameReport) => void;
  highScores: number[];
}

const INITIAL_TEXT = "Tap the keys to move the car. Don't crash!";

export const useTypingEngine = ({ status, setStatus, onMistake, onFinish, highScores }: UseTypingEngineProps) => {
  const [targetText, setTargetText] = useState<string>(INITIAL_TEXT);
  const [inputText, setInputText] = useState<string>("");
  const [stats, setStats] = useState<GameStats>({
    wpm: 0,
    accuracy: 100,
    errors: 0,
    progress: 0
  });

  const startTimeRef = useRef<number | null>(null);
  const lastInputLengthRef = useRef<number>(0);
  const keyPressHistory = useRef<number[]>([]);
  const lastKeyTime = useRef<number>(0);

  const resetTypingEngine = useCallback(async (difficulty: Difficulty) => {
    const newText = await generateTypingText(difficulty);
    setTargetText(newText);
    setInputText("");
    setStats({ wpm: 0, accuracy: 100, errors: 0, progress: 0 });
    startTimeRef.current = null;
    lastInputLengthRef.current = 0;
    keyPressHistory.current = [];
    lastKeyTime.current = 0;
  }, []);

  const handleInputChange = useCallback((newInput: string) => {
    if (status === 'FINISHED' || status === 'LOADING') return;

    if (status === 'IDLE') {
      setStatus(GameStatus.PLAYING);
      startTimeRef.current = Date.now();
    }

    const prevLength = lastInputLengthRef.current;
    
    // Backspace or partial update
    if (newInput.length < prevLength) {
        setInputText(newInput);
        lastInputLengthRef.current = newInput.length;
        return;
    }

    const charIndex = newInput.length - 1;
    const expectedChar = targetText[charIndex];
    const typedChar = newInput[charIndex];

    if (typedChar !== expectedChar) {
       soundService.playTypo();
       setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
       onMistake();
    } else {
       keyPressHistory.current.push(Date.now());
       lastKeyTime.current = Date.now();
    }

    setInputText(newInput);
    lastInputLengthRef.current = newInput.length;

    if (newInput.length === targetText.length) {
       const report = calculateReport();
       onFinish(report);
    }
  }, [status, targetText, onMistake, onFinish]);

  const calculateReport = (): GameReport => {
    const endTime = Date.now();
    const startTime = startTimeRef.current || endTime;
    const durationSeconds = Math.max(0.1, (endTime - startTime) / 1000);
    const durationMinutes = durationSeconds / 60;

    const grossWpm = Math.round((targetText.length / 5) / durationMinutes);
    const errorPenalty = Math.round(stats.errors / durationMinutes);
    const netWpm = Math.max(0, grossWpm - errorPenalty);

    const finalAccuracy = Math.round(((targetText.length - stats.errors) / targetText.length) * 100);
    const adjustedAccuracy = Math.max(0, finalAccuracy);

    let isNewRecord = false;
    const currentBest = highScores.length > 0 ? highScores[0] : 0;
    if (netWpm > currentBest) isNewRecord = true;

    const newHistory = [...highScores, netWpm].sort((a, b) => b - a).slice(0, 5);

    let rank = 'C';
    if (netWpm >= 80 && adjustedAccuracy >= 98) rank = 'S';
    else if (netWpm >= 60 && adjustedAccuracy >= 95) rank = 'A';
    else if (netWpm >= 40 && adjustedAccuracy >= 90) rank = 'B';
    else if (netWpm < 20) rank = 'D';

    return {
        finalWpm: netWpm,
        accuracy: adjustedAccuracy,
        timeSeconds: parseFloat(durationSeconds.toFixed(1)),
        errors: stats.errors,
        isNewRecord,
        highScore: newHistory[0],
        rank,
        history: newHistory
    };
  };

  const updateStats = useCallback(() => {
     if (status !== 'PLAYING') return 0;
     const now = Date.now();
     const start = startTimeRef.current || now;
     
     const durationInMinutes = (now - start) / 60000;
     const averageWpm = durationInMinutes > 0 ? Math.round((inputText.length / 5) / durationInMinutes) : 0;

     const WINDOW_MS = 1200;
     keyPressHistory.current = keyPressHistory.current.filter(t => now - t < WINDOW_MS);
     
     const validKeystrokesInWindow = keyPressHistory.current.length;
     const instantWpm = Math.round((validKeystrokesInWindow / 5) * (60 / (WINDOW_MS / 1000)));

     setStats(prev => ({
         ...prev,
         wpm: averageWpm, 
         accuracy: inputText.length > 0 
             ? Math.round(((inputText.length - prev.errors) / inputText.length) * 100)
             : 100,
         progress: Math.round((inputText.length / targetText.length) * 100)
     }));

     return instantWpm;
  }, [status, inputText.length, targetText.length]);

  return {
      targetText,
      inputText,
      stats,
      resetTypingEngine,
      handleInputChange,
      updateStats,
      lastKeyTime
  };
};
