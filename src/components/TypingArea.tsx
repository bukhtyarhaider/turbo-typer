import React, { useEffect, useRef } from "react";
import { GameReport } from "../types";
import { Trophy, Star, Clock, AlertCircle, Medal } from "lucide-react";

interface TypingAreaProps {
  text: string;
  input: string;
  onInputChange: (input: string) => void;
  status: string;
  onRestart: () => void;
  report: GameReport | null;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  text,
  input,
  onInputChange,
  status,
  onRestart,
  report,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input unless finished
  useEffect(() => {
    if (status === "PLAYING" || status === "IDLE") {
      inputRef.current?.focus();
    }
  }, [status, input]);

  // Handle focus loss
  const handleBlur = () => {
    if (status === "PLAYING") {
      inputRef.current?.focus();
    }
  };

  const renderText = () => {
    return text.split("").map((char, index) => {
      let className = "text-4xl font-mono transition-colors duration-100 ";
      const inputChar = input[index];

      if (index < input.length) {
        if (inputChar === char) {
          className += "text-green-600 font-bold animate-flash-green";
        } else {
          className +=
            "text-red-500 bg-red-100 font-bold line-through decoration-4";
        }
      } else if (index === input.length) {
        className +=
          "bg-yellow-300 border-b-4 border-black animate-pulse text-black";
      } else {
        className += "text-gray-400";
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-yellow-50 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-6 relative min-h-[300px]">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onBlur={handleBlur}
        className="opacity-0 absolute top-0 left-0 h-full w-full cursor-default"
        disabled={status === "FINISHED" || status === "LOADING"}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {status === "LOADING" ? (
        <div className="flex flex-col items-center animate-pulse">
          <div className="text-3xl font-black mb-4">Gassing up the car...</div>
          <div className="w-16 h-16 border-8 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : status === "FINISHED" && report ? (
        <div className="w-full text-center z-10 animate-fade-in-up flex flex-col items-center">
          {report.isNewRecord && (
            <>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-10%`,
                      backgroundColor: [
                        "#FFD700",
                        "#FF6347",
                        "#00BFFF",
                        "#32CD32",
                      ][Math.floor(Math.random() * 4)],
                      width: "10px",
                      height: "20px",
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 3}s`,
                    }}
                  />
                ))}
              </div>
              <div className="mb-4 inline-block bg-yellow-400 text-black font-black text-xl px-4 py-2 rotate-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                NEW RECORD! 🏆
              </div>
            </>
          )}

          <h2 className="text-4xl md:text-5xl font-black mb-6 transform -rotate-1 text-purple-600 drop-shadow-md">
            COURSE COMPLETED!
          </h2>

          {/* Main Report Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-2xl mx-auto">
            {/* NET WPM */}
            <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="text-gray-500 font-bold text-xs uppercase mb-1 z-10">
                NET WPM
              </div>
              <div className="text-5xl font-black text-blue-600 z-10">
                {report.netWpm}
              </div>
              <Trophy className="absolute -bottom-4 -right-4 text-blue-100 w-24 h-24 transform -rotate-12 z-0" />
            </div>

            {/* RANK */}
            <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="text-gray-500 font-bold text-xs uppercase mb-1 z-10">
                RANK
              </div>
              <div
                className={`text-5xl font-black z-10 ${
                  report.rank === "S"
                    ? "text-yellow-500"
                    : report.rank === "A"
                    ? "text-green-500"
                    : report.rank === "B"
                    ? "text-blue-500"
                    : "text-gray-500"
                }`}
              >
                {report.rank}
              </div>
              <Medal className="absolute -bottom-4 -right-4 text-gray-100 w-24 h-24 transform rotate-12 z-0" />
            </div>

            {/* Accuracy */}
            <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
              <div className="text-gray-500 font-bold text-xs uppercase mb-1 flex items-center gap-1">
                <Star size={12} /> ACCURACY
              </div>
              <div
                className={`text-4xl font-black ${
                  report.accuracy > 90 ? "text-green-500" : "text-orange-500"
                }`}
              >
                {report.accuracy}%
              </div>
            </div>

            {/* Errors */}
            <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
              <div className="text-gray-500 font-bold text-xs uppercase mb-1 flex items-center gap-1">
                <AlertCircle size={12} /> ERRORS
              </div>
              <div className="text-3xl font-black text-red-500">
                {report.errors}
              </div>
            </div>
          </div>

          {/* Leaderboard Small View */}
          {report.history && report.history.length > 0 && (
            <div className="w-full max-w-md bg-white border-4 border-black rounded-xl p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black uppercase border-b-2 border-gray-200 pb-2 mb-2 text-left">
                🏆 Top Records
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.history.map((score, i) => (
                  <span
                    key={i}
                    className={`font-mono font-bold px-2 py-1 rounded border-2 border-black ${
                      score === report.netWpm ? "bg-yellow-300" : "bg-gray-100"
                    }`}
                  >
                    #{i + 1} {score} WPM
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onRestart}
            className="bg-green-400 hover:bg-green-300 text-black font-black text-2xl py-4 px-12 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
          >
            RACE AGAIN
          </button>
        </div>
      ) : (
        <div className="w-full max-w-4xl text-left leading-relaxed break-words relative p-4 pointer-events-none select-none">
          {renderText()}
        </div>
      )}

      {status === "IDLE" && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white border-2 border-black px-4 py-1 rounded-full shadow-md animate-bounce">
          <span className="font-bold text-sm">Start typing to drive!</span>
        </div>
      )}
    </div>
  );
};

export default TypingArea;
