import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GameStatus,
  GameReport,
  Difficulty,
  PlayerInfo,
  BattleState,
  BattleResult,
} from "./types";
import GameCanvas from "./components/GameCanvas";
import TypingArea from "./components/TypingArea";
import { soundService } from "./services/soundService";
import { generateTypingText } from "./services/textService";
import { usePersistence } from "./hooks/usePersistence";
import { useGameEngine } from "./hooks/useGameEngine";
import { useTypingEngine } from "./hooks/useTypingEngine";
import Header from "./components/Header";
import GameControls from "./components/GameControls";
import MobileStats from "./components/MobileStats";
import { useMultiplayer } from "./hooks/useMultiplayer";
import { Car, Copy, Check, Info, Users, Zap } from "lucide-react";

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [gameReport, setGameReport] = useState<GameReport | null>(null);
  const [mode, setMode] = useState<"SOLO" | "BATTLE">("SOLO");
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem("turbo-typer-name") || ""
  );
  const [opponent, setOpponent] = useState<PlayerInfo | null>(null);
  const [battleState, setBattleState] = useState<BattleState>({
    players: {},
    targetText: "",
  });
  const [copied, setCopied] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const battleStartTimeRef = useRef<number>(0);
  const myFinishTimeRef = useRef<number>(0);
  const battleEndedRef = useRef<boolean>(false);

  // Refs for accessing current state in callbacks
  const stateRef = useRef({
    myId: "",
    userName: "",
    stats: { wpm: 0, progress: 0 },
    speed: 0,
    hasShield: false,
  });

  const { highScores, saveScore } = usePersistence();

  const [battleRequest, setBattleRequest] = useState<{
    from: string;
    text: string;
  } | null>(null);
  const [challengeSent, setChallengeSent] = useState(false);

  const handleOpponentFinished = useCallback((data: any) => {
    // Opponent finished first - they win!
    if (battleEndedRef.current) return;
    battleEndedRef.current = true;

    const opponentFinishTime = data.finishTime || Date.now();
    const opponentPlayer: PlayerInfo = {
      ...data.player,
      isFinished: true,
    };

    setOpponent(opponentPlayer);

    // Create battle result - opponent won using refs for current state
    const myPlayer: PlayerInfo = {
      id: stateRef.current.myId,
      name: stateRef.current.userName,
      wpm: stateRef.current.stats.wpm,
      progress: stateRef.current.stats.progress,
      speed: stateRef.current.speed,
      hasShield: stateRef.current.hasShield,
      score: 0,
      isFinished: false,
    };

    const timeDiff = myFinishTimeRef.current
      ? (myFinishTimeRef.current - opponentFinishTime) / 1000
      : undefined;

    setBattleResult({
      winner: opponentPlayer,
      loser: myPlayer,
      myReport: data.report,
      iWon: false,
      timeDiff,
    });

    soundService.playBump();
    setStatus(GameStatus.FINISHED);
  }, []);

  const { myId, connectToPeer, sendData, resetConnection } = useMultiplayer({
    userName,
    onOpponentJoined: useCallback((opp: PlayerInfo) => {
      setOpponent(opp);
      soundService.playPowerUp();
    }, []),
    onDataReceived: useCallback(
      (data: any) => {
        if (data.type === "CHALLENGE") {
          setBattleRequest({ from: data.from, text: data.text });
        } else if (data.type === "ACCEPT") {
          (window as any).handleBattleAccept?.(data.text);
        } else if (data.type === "UPDATE") {
          // Smooth update with interpolation
          setOpponent((prev) => {
            if (!prev) return null;
            // Interpolate progress for smoother visuals
            const newProgress = data.player.progress;
            const smoothProgress =
              prev.progress + (newProgress - prev.progress) * 0.3;
            return {
              ...prev,
              ...data.player,
              progress:
                Math.abs(newProgress - prev.progress) > 5
                  ? newProgress
                  : smoothProgress,
            };
          });
        } else if (data.type === "FINISHED") {
          handleOpponentFinished(data);
        }
      },
      [handleOpponentFinished]
    ),
    onConnected: useCallback((id: string) => {
      console.log("Connected with ID:", id);
    }, []),
  });

  const handleCrash = useCallback(() => {
    // Collision logic is handled in game engine
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

      if (status === GameStatus.BATTLE_PLAYING) {
        // Record my finish time
        myFinishTimeRef.current = Date.now();

        // Check if battle already ended (opponent finished first)
        if (battleEndedRef.current) {
          setGameReport(enrichedReport);
          return;
        }

        // I finished first - I win!
        battleEndedRef.current = true;

        const myPlayer: PlayerInfo = {
          id: myId,
          name: userName,
          progress: 100,
          speed: 0,
          hasShield: false,
          wpm: report.finalWpm,
          score: 0,
          isFinished: true,
        };

        sendData({
          type: "FINISHED",
          player: myPlayer,
          report: enrichedReport,
          finishTime: myFinishTimeRef.current,
        });

        // Set battle result - I won
        if (opponent) {
          setBattleResult({
            winner: myPlayer,
            loser: opponent,
            myReport: enrichedReport,
            iWon: true,
          });
        }
      }

      setGameReport(enrichedReport);
      setStatus(GameStatus.FINISHED);
    },
    [highScores, saveScore, status, sendData, myId, userName, opponent]
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

  // Keep state ref updated for use in callbacks
  useEffect(() => {
    stateRef.current = {
      myId,
      userName,
      stats: { wpm: stats.wpm, progress: stats.progress },
      speed,
      hasShield,
    };
  }, [myId, userName, stats.wpm, stats.progress, speed, hasShield]);

  const startBattle = useCallback(
    async (text: string) => {
      setGameReport(null);
      setBattleResult(null);
      battleEndedRef.current = false;
      myFinishTimeRef.current = 0;
      battleStartTimeRef.current = Date.now();
      resetGameEngine();
      await resetTypingEngine(difficulty, text);
      setStatus(GameStatus.BATTLE_PLAYING);
    },
    [resetGameEngine, resetTypingEngine, difficulty]
  );

  // Connection Bridge
  useEffect(() => {
    (window as any).handleBattleAccept = (text: string) => {
      setChallengeSent(false);
      startBattle(text);
    };
    return () => {
      delete (window as any).handleBattleAccept;
    };
  }, [startBattle]);

  const challengeOpponent = useCallback(async () => {
    if (!opponent) return;
    setChallengeSent(true);
    const text = await generateTypingText(difficulty);
    sendData({ type: "CHALLENGE", from: userName, text });
  }, [opponent, userName, sendData, difficulty]);

  const acceptChallenge = useCallback(() => {
    if (!battleRequest) return;
    sendData({ type: "ACCEPT", text: battleRequest.text });
    startBattle(battleRequest.text);
    setBattleRequest(null);
  }, [battleRequest, sendData, startBattle]);

  // Initialize Game
  const initGame = useCallback(async () => {
    setStatus(GameStatus.LOADING);
    setGameReport(null);
    setBattleResult(null);
    setChallengeSent(false);
    battleEndedRef.current = false;
    await resetTypingEngine(difficulty);
    resetGameEngine();
    setStatus(GameStatus.IDLE);
  }, [difficulty, resetTypingEngine, resetGameEngine]);

  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Main Game Loop
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (status !== "PLAYING" && status !== "BATTLE_PLAYING") return;

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

      // 5. Sync Multiplayer (throttle to ~20fps for network efficiency)
      if (status === "BATTLE_PLAYING" && !battleEndedRef.current) {
        const now = Date.now();
        if (now - lastSyncRef.current >= 50) {
          // 20 updates per second
          lastSyncRef.current = now;
          sendData({
            type: "UPDATE",
            player: {
              id: myId,
              name: userName,
              progress: stats.progress,
              speed: speed,
              hasShield: hasShield,
              wpm: stats.wpm,
              score: 0,
            },
            timestamp: now,
          });
        }
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
    stats,
    hasShield,
    sendData,
    userName,
  ]);

  const [targetId, setTargetId] = useState<string>("");

  return (
    <div className="min-h-screen bg-sky-100 font-sans p-4 md:p-8 flex flex-col items-center">
      {/* Name Setup / Multiplayer Lobbies */}
      {!userName && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
              <Car className="text-red-500" /> WHO ARE YOU?
            </h2>
            <input
              type="text"
              placeholder="Enter Driver Name"
              className="w-full p-3 border-4 border-black rounded-xl mb-4 text-xl font-bold"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const name = (e.target as HTMLInputElement).value;
                  if (name) {
                    setUserName(name);
                    localStorage.setItem("turbo-typer-name", name);
                  }
                }
              }}
            />
            <p className="text-sm text-gray-600 italic">Press Enter to Start</p>
          </div>
        </div>
      )}

      {/* Battle Invitation */}
      {battleRequest && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full">
            <h2 className="text-2xl font-black mb-4">CHALLENGE RECEIVED!</h2>
            <p className="text-xl mb-6">
              <span className="text-red-500 font-black">
                {battleRequest.from}
              </span>{" "}
              wants to race you!
            </p>
            <div className="flex gap-4">
              <button
                onClick={acceptChallenge}
                className="flex-1 bg-yellow-400 p-3 border-4 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
              >
                ACCEPT
              </button>
              <button
                onClick={() => setBattleRequest(null)}
                className="flex-1 bg-gray-200 p-3 border-4 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
              >
                DECLINE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection UI / Multiplayer Center */}
      {status === GameStatus.IDLE && userName && (
        <div className="w-full max-w-4xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Your Identity */}
          <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    myId ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  {myId ? "Service Online" : "Connecting to Server..."}
                </span>
              </div>
              <h3 className="text-xl font-black mb-4">Hello, {userName}!</h3>

              <div className="bg-sky-50 border-2 border-black border-dashed p-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col grow truncate mr-2">
                  <span className="text-[10px] font-black text-sky-600 uppercase">
                    {myId === "RETRYING..."
                      ? "Handshake Failed"
                      : "Share this ID with a friend"}
                  </span>
                  <span
                    className={`font-mono font-bold text-sm truncate ${
                      !myId || myId.includes("...")
                        ? "text-gray-400 italic"
                        : ""
                    }`}
                  >
                    {myId || "Connecting to server..."}
                  </span>
                </div>
                {myId && !myId.includes("...") ? (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(myId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`p-2 rounded-lg border-2 border-black transition-all ${
                      copied ? "bg-green-400" : "bg-white hover:bg-yellow-100"
                    }`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                ) : (
                  <button
                    onClick={resetConnection}
                    className="p-2 px-3 bg-red-500 text-white rounded-lg border-2 border-black text-xs font-black hover:bg-red-600 transition-colors shrink-0"
                  >
                    RETRY
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Join a Race */}
          <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-red-500" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Live Battle Center
              </span>
            </div>

            {opponent ? (
              <div className="h-full flex flex-col">
                <div className="bg-yellow-100 border-2 border-yellow-500 p-3 rounded-xl flex items-center gap-4 grow mb-3">
                  <div className="bg-black text-white p-2 rounded-lg">
                    <Car size={32} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-yellow-700 uppercase">
                      {challengeSent ? "Challenge Sent!" : "Ready for Battle"}
                    </div>
                    <div className="text-lg font-black truncate">
                      {opponent.name}
                    </div>
                  </div>
                </div>
                {challengeSent ? (
                  <div className="w-full bg-yellow-400 p-3 rounded-xl border-4 border-black font-black text-lg flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                    Waiting for response...
                  </div>
                ) : (
                  <button
                    onClick={challengeOpponent}
                    className="w-full bg-red-500 text-white p-3 rounded-xl border-4 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <Zap size={20} fill="white" /> SEND CHALLENGE!
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-gray-500 italic">
                  Enter a friend's ID to start a typing duel on the same track.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Driver ID here..."
                    className="grow p-3 border-4 border-black rounded-xl font-bold bg-gray-50 focus:bg-white transition-colors outline-none text-sm"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                  />
                  <button
                    onClick={() => connectToPeer(targetId)}
                    className="bg-black text-white px-6 py-2 rounded-xl font-black hover:bg-red-500 transition-all border-b-4 border-gray-700 active:border-b-0 active:translate-y-1"
                  >
                    CONNECT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Header
        status={status}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        highScores={highScores}
        wpm={stats.wpm}
        errors={stats.errors}
        remainingChars={stats.remainingChars}
      />

      <main className="w-full max-w-4xl grow flex flex-col">
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
            opponent={opponent}
          />
        </div>

        <GameControls
          speed={speed}
          hasShield={hasShield}
          obstacles={obstacles}
          myProgress={stats.progress}
          myName={userName}
          opponent={opponent}
          isBattle={status === GameStatus.BATTLE_PLAYING}
        />

        <TypingArea
          text={targetText}
          input={inputText}
          onInputChange={handleInputChange}
          status={status}
          onRestart={initGame}
          report={gameReport}
          battleResult={battleResult}
          onRematch={opponent ? challengeOpponent : undefined}
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
