import React from 'react';
import { Car, Trophy, Mountain } from 'lucide-react';
import { Difficulty, GameStatus } from '../types';

interface HeaderProps {
    status: GameStatus;
    difficulty: Difficulty;
    setDifficulty: (d: Difficulty) => void;
    highScores: number[];
    wpm: number;
    errors: number;
}

const Header: React.FC<HeaderProps> = ({ status, difficulty, setDifficulty, highScores, wpm, errors }) => {
    const getDifficultyDesc = (d: Difficulty) => {
        switch(d) {
            case 'EASY': return "Top 300 words. Simple speed.";
            case 'MEDIUM': return "Sentences & Punctuation.";
            case 'HARD': return "Numbers, Symbols & Complex words.";
        }
    };

    return (
      <header className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
             <div className="bg-yellow-400 p-3 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Car className="w-8 h-8 text-black" />
             </div>
             <div className="flex flex-col">
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-black leading-none" style={{ textShadow: '2px 2px 0 #FFF' }}>
                    TURBO<span className="text-red-500">TYPER</span>
                </h1>
                {/* Difficulty Selector */}
                {status === 'IDLE' || status === 'LOADING' ? (
                    <div className="flex flex-col mt-2">
                        <div className="flex gap-2">
                            {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                                <button 
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`text-xs font-bold px-2 py-1 rounded border-2 border-black ${difficulty === d ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-500 mt-1 uppercase tracking-tight">
                            {getDifficultyDesc(difficulty)}
                        </span>
                    </div>
                ) : (
                    <div className="mt-1 flex items-center gap-1">
                        <Mountain size={16} />
                        <span className="text-xs font-bold uppercase">{difficulty} MODE</span>
                    </div>
                )}
             </div>
        </div>
        
        <div className="flex gap-4">
             {highScores.length > 0 && (
                 <div className="hidden md:flex flex-col items-center bg-yellow-300 border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[100px]">
                    <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-black" />
                        <span className="text-xs font-bold text-black uppercase">BEST</span>
                    </div>
                    <span className="text-2xl font-black">{highScores[0]}</span>
                 </div>
             )}

             <div className="hidden md:flex flex-col items-center bg-white border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[100px]">
                <span className="text-xs font-bold text-gray-500 uppercase">AVG WPM</span>
                <span className="text-2xl font-black">{wpm}</span>
             </div>
             <div className="hidden md:flex flex-col items-center bg-white border-4 border-black p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[100px]">
                <span className="text-xs font-bold text-gray-500 uppercase">Errors</span>
                <span className="text-2xl font-black text-red-500">{errors}</span>
             </div>
        </div>
      </header>
    );
}

export default Header;
