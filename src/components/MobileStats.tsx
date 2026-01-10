import React from "react";
import { RefreshCcw } from "lucide-react";

interface MobileStatsProps {
  wpm: number;
  errors: number;
  remainingChars: number;
  onRestart: () => void;
}

const MobileStats: React.FC<MobileStatsProps> = ({
  wpm,
  errors,
  remainingChars,
  onRestart,
}) => {
  return (
    <div className="flex md:hidden justify-between w-full mt-4 gap-2">
      <div className="flex-1 bg-white border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <span className="text-xs font-bold text-gray-500 block">WPM</span>
        <span className="text-xl font-black">{wpm}</span>
      </div>
      <div className="flex-1 bg-white border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <span className="text-xs font-bold text-gray-500 block">ERR</span>
        <span className="text-xl font-black text-red-500">{errors}</span>
      </div>
      <div className="flex-1 bg-blue-200 border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
        <span className="text-xs font-bold text-gray-500 block">LEFT</span>
        <span className="text-xl font-black text-blue-700">
          {remainingChars}
        </span>
      </div>
      <button
        onClick={onRestart}
        className="flex-1 flex justify-center items-center bg-blue-400 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
      >
        <RefreshCcw className="w-6 h-6 text-black" />
      </button>
    </div>
  );
};

export default MobileStats;
