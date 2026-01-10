import React from "react";
import { Gauge, Shield, Signal, Car, Trophy } from "lucide-react";
import { Obstacle, PlayerInfo } from "../types";

interface GameControlsProps {
  speed: number;
  hasShield: boolean;
  obstacles: Obstacle[];
  myProgress?: number;
  myName?: string;
  opponent?: PlayerInfo | null;
  isBattle?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  speed,
  hasShield,
  obstacles,
  myProgress = 0,
  myName = "YOU",
  opponent,
  isBattle = false,
}) => {
  return (
    <div className="bg-gray-800 border-x-4 border-b-4 border-black p-2 flex flex-col gap-2 text-white font-mono rounded-b-xl mb-2 shadow-lg">
      {/* Battle Progress Bar */}
      {isBattle && opponent && (
        <div className="w-full bg-gray-900 rounded-lg p-2 border-2 border-gray-700">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-black text-yellow-400">RACE PROGRESS</span>
            <Trophy size={14} className="text-yellow-400" />
          </div>

          {/* My Progress */}
          <div className="flex items-center gap-2 mb-1">
            <Car size={14} className="text-green-400 shrink-0" />
            <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-150 ease-out"
                style={{ width: `${Math.min(100, myProgress)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
                {myName} - {Math.round(myProgress)}%
              </span>
            </div>
            <span className="text-green-400 font-bold text-xs w-12 text-right">
              {Math.round(myProgress)}%
            </span>
          </div>

          {/* Opponent Progress */}
          <div className="flex items-center gap-2">
            <Car size={14} className="text-red-400 shrink-0" />
            <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-150 ease-out"
                style={{ width: `${Math.min(100, opponent.progress)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
                {opponent.name} - {Math.round(opponent.progress)}%
              </span>
            </div>
            <span className="text-red-400 font-bold text-xs w-12 text-right">
              {Math.round(opponent.progress)}%
            </span>
          </div>

          {/* WPM Comparison */}
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-400">
              ⚡ {Math.round(speed * 0.67)} WPM
            </span>
            <span className="text-red-400">
              ⚡ {Math.round(opponent.wpm || 0)} WPM
            </span>
          </div>
        </div>
      )}

      {/* Standard Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Gauge
            className={`w-5 h-5 ${
              speed > 10 ? "text-yellow-400" : "text-gray-500"
            }`}
          />
          <span>SPEED: {Math.round(speed)} MPH</span>
        </div>

        {hasShield && (
          <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
            <Shield className="w-5 h-5 fill-cyan-400" />
            <span className="hidden sm:inline">SHIELD ACTIVE</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Signal
            className={`w-5 h-5 ${
              obstacles.some((o) => o.x < 800)
                ? "text-red-500 animate-ping"
                : "text-green-500"
            }`}
          />
          <span>RADAR</span>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
