import React, { useState, useEffect, useCallback } from "react";
import { GameStatus, GameReport, Difficulty } from "./types";
import GameCanvas from "./components/GameCanvas";
import TypingArea from "./components/TypingArea";
import { soundService } from "./services/soundService";
import { usePersistence } from "./hooks/usePersistence";
import { useGameEngine } from "./hooks/useGameEngine";
import { useTypingEngine } from "./hooks/useTypingEngine";
import Header from "./components/Header";
import GameControls from "./components/GameControls";
import MobileStats from "./components/MobileStats";

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [gameReport, setGameReport] = useState<GameReport | null>(null);

  const { highScores, saveScore } = usePersistence();

  const handleCrash = useCallback(() => {
    // Collision logic is handled in game engine, but if we needed app-level side effects:
  }, []);

  const {
    obstacles,
    powerUps,
    hasShield,
    speed,
    resetGameEngine,
    handleCollision,
    handlePowerUpCollect,
    updateSpeed,
    updateEntities,
    spawnPowerUp,
    spawnObstacle,
  } = useGameEngine({ status, onCrash: handleCrash });

  const handleMistake = useCallback(() => {
    spawnObstacle();
  }, [spawnObstacle]);

  const handleFinish = useCallback(
    (report: GameReport) => {
      const isNewRecord = report.finalWpm > (highScores[0] || 0);

      if (isNewRecord) {
        soundService.playHighScore();
      } else {
        soundService.playWin();
      }

      const newHistory = saveScore(report.finalWpm);

      const enrichedReport = {
        ...report,
        isNewRecord,
        history: newHistory,
        highScore: newHistory[0],
      };

      setGameReport(enrichedReport);
      setStatus(GameStatus.FINISHED);
    },
    [highScores, saveScore]
  );

  const {
    targetText,
    inputText,
    stats,
    resetTypingEngine,
    handleInputChange,
    updateStats,
    lastKeyTime,
  } = useTypingEngine({
    status,
    setStatus,
    onMistake: handleMistake,
    onFinish: handleFinish,
    highScores,
  });

  // Initialize Game
  const initGame = useCallback(async () => {
    setStatus(GameStatus.LOADING);
    setGameReport(null);
    await resetTypingEngine(difficulty);
    resetGameEngine();
    setStatus(GameStatus.IDLE);
  }, [difficulty, resetTypingEngine, resetGameEngine]);

  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Main Game Loop
  useEffect(() => {
    if (status !== "PLAYING") return;

    const interval = setInterval(() => {
      // 1. Update Typing Stats & Get Instant WPM
      const instantWpm = updateStats();

      // 2. Calculate Target Speed
      let targetSpeed = instantWpm * 1.5;
      if (Date.now() - lastKeyTime.current > 400) {
        targetSpeed = 0;
      }

      // 3. Update Game Mechanics
      updateSpeed(targetSpeed);
      updateEntities();

      // 4. Random Events
      if (speed > 10 && Math.random() < 0.003) {
        spawnPowerUp();
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [
    status,
    speed,
    updateStats,
    updateSpeed,
    updateEntities,
    spawnPowerUp,
    lastKeyTime,
  ]);

  return (
    <div className="min-h-screen bg-sky-100 font-sans p-4 md:p-8 flex flex-col items-center">
      <Header
        status={status}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        highScores={highScores}
        wpm={stats.wpm}
        errors={stats.errors}
        remainingChars={stats.remainingChars}
      />

      <main className="w-full max-w-4xl flex-grow flex flex-col">
        <div className="w-full h-64 md:h-80 z-0">
          <GameCanvas
            speed={speed}
            obstacles={obstacles}
            powerUps={powerUps}
            hasShield={hasShield}
            onCollide={handleCollision}
            onPowerUpCollect={handlePowerUpCollect}
            status={status}
            progress={stats.progress}
            difficulty={difficulty}
          />
        </div>

        <GameControls
          speed={speed}
          hasShield={hasShield}
          obstacles={obstacles}
        />

        <TypingArea
          text={targetText}
          input={inputText}
          onInputChange={handleInputChange}
          status={status}
          onRestart={initGame}
          report={gameReport}
        />

        <MobileStats
          wpm={stats.wpm}
          errors={stats.errors}
          remainingChars={stats.remainingChars}
          onRestart={initGame}
        />
      </main>

      <footer className="mt-8 text-center text-gray-600 font-medium">
        <p>
          Type correctly to speed up. Watch the road incline increase on Hard
          mode!
        </p>
      </footer>
    </div>
  );
};

export default App;
