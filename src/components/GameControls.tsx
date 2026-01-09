import React from 'react';
import { Gauge, Shield, Signal } from 'lucide-react';
import { Obstacle } from '../types';

interface GameControlsProps {
    speed: number;
    hasShield: boolean;
    obstacles: Obstacle[];
}

const GameControls: React.FC<GameControlsProps> = ({ speed, hasShield, obstacles }) => {
    return (
        <div className="bg-gray-800 border-x-4 border-b-4 border-black p-2 flex justify-between items-center text-white font-mono rounded-b-xl mb-2 shadow-lg">
            <div className="flex items-center gap-2">
                <Gauge className={`w-5 h-5 ${speed > 10 ? 'text-yellow-400' : 'text-gray-500'}`} />
                <span>SPEED: {Math.round(speed)} MPH</span>
            </div>
            
            {hasShield && (
                 <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                    <Shield className="w-5 h-5 fill-cyan-400" />
                    <span className="hidden sm:inline">SHIELD ACTIVE</span>
                 </div>
            )}

            <div className="flex items-center gap-2">
                <Signal className={`w-5 h-5 ${obstacles.some(o => o.x < 800) ? 'text-red-500 animate-ping' : 'text-green-500'}`} />
                <span>RADAR</span>
            </div>
        </div>
    );
}

export default GameControls;
