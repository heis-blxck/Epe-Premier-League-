import React from 'react';
import { MatchLineup, LineupPlayer } from '../types';
import { User } from 'lucide-react';

interface Pitch2DProps {
  lineup?: MatchLineup;
  teamName?: string;
  ratings?: Record<string, number>;
  onPlayerClick?: (player: LineupPlayer) => void;
}

// Map formation names to grid coordinate offsets on a 0-100 percentage scale
const getFormationCoordinates = (formation: string = '4-3-3') => {
  switch (formation) {
    case '4-4-2':
      return [
        { x: 50, y: 90 }, // GK
        { x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 }, // DEF
        { x: 15, y: 45 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 45 }, // MID
        { x: 35, y: 20 }, { x: 65, y: 20 } // FWD
      ];
    case '4-2-3-1':
      return [
        { x: 50, y: 90 }, // GK
        { x: 15, y: 72 }, { x: 38, y: 74 }, { x: 62, y: 74 }, { x: 85, y: 72 }, // DEF
        { x: 35, y: 55 }, { x: 65, y: 55 }, // DM
        { x: 20, y: 35 }, { x: 50, y: 33 }, { x: 80, y: 35 }, // AM
        { x: 50, y: 15 } // ST
      ];
    case '3-5-2':
      return [
        { x: 50, y: 90 }, // GK
        { x: 25, y: 74 }, { x: 50, y: 76 }, { x: 75, y: 74 }, // CB
        { x: 10, y: 48 }, { x: 32, y: 52 }, { x: 50, y: 50 }, { x: 68, y: 52 }, { x: 90, y: 48 }, // MID
        { x: 35, y: 20 }, { x: 65, y: 20 } // FWD
      ];
    case '3-4-3':
      return [
        { x: 50, y: 90 }, // GK
        { x: 25, y: 74 }, { x: 50, y: 76 }, { x: 75, y: 74 }, // CB
        { x: 15, y: 50 }, { x: 38, y: 52 }, { x: 62, y: 52 }, { x: 85, y: 50 }, // MID
        { x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 } // FWD
      ];
    case '4-3-3':
    default:
      return [
        { x: 50, y: 90 }, // GK
        { x: 15, y: 72 }, { x: 38, y: 74 }, { x: 62, y: 74 }, { x: 85, y: 72 }, // DEF
        { x: 25, y: 48 }, { x: 50, y: 52 }, { x: 75, y: 48 }, // MID
        { x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 } // FWD
      ];
  }
};

export const Pitch2D: React.FC<Pitch2DProps> = ({
  lineup,
  teamName,
  ratings = {},
  onPlayerClick
}) => {
  if (!lineup || !lineup.startingXI || lineup.startingXI.length === 0) {
    return (
      <div className="bg-emerald-950/90 rounded-2xl p-8 text-center border border-emerald-800 text-emerald-200">
        <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="font-bold text-sm">Lineups not confirmed yet for this match.</p>
        <p className="text-xs text-emerald-400 mt-1">Check back closer to kick-off.</p>
      </div>
    );
  }

  const coords = getFormationCoordinates(lineup.formation);

  return (
    <div className="space-y-3">
      {/* Formation Banner */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-800 shadow-md">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-slate-200">{teamName || 'Team'}</span>
        </span>
        <span className="bg-[#800020] text-amber-300 font-extrabold px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider">
          Formation: {lineup.formation}
        </span>
      </div>

      {/* Pitch Graphic */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] max-w-2xl mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900 border-4 border-emerald-950 shadow-2xl p-2 sm:p-4 select-none">
        {/* Pitch Field Markings (SVG overlay) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
          viewBox="0 0 100 130"
          preserveAspectRatio="none"
        >
          {/* Outer Boundary */}
          <rect x="2" y="2" width="96" height="126" fill="none" stroke="white" strokeWidth="1" />
          {/* Halfway Line */}
          <line x1="2" y1="65" x2="98" y2="65" stroke="white" strokeWidth="1" />
          {/* Center Circle */}
          <circle cx="50" cy="65" r="16" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="50" cy="65" r="1" fill="white" />
          
          {/* Top Penalty Box */}
          <rect x="25" y="2" width="50" height="22" fill="none" stroke="white" strokeWidth="1" />
          <rect x="36" y="2" width="28" height="8" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="50" cy="16" r="1" fill="white" />

          {/* Bottom Penalty Box */}
          <rect x="25" y="106" width="50" height="22" fill="none" stroke="white" strokeWidth="1" />
          <rect x="36" y="120" width="28" height="8" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="50" cy="114" r="1" fill="white" />
        </svg>

        {/* Players Overlay */}
        <div className="relative w-full h-full">
          {lineup.startingXI.slice(0, 11).map((player, idx) => {
            const pos = coords[idx] || { x: 50, y: 50 };
            const playerRating = ratings[player.playerId] || player.rating;

            return (
              <div
                key={player.playerId || idx}
                onClick={() => onPlayerClick && onPlayerClick(player)}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10 hover:scale-110 transition-transform"
              >
                {/* Rating Badge (If Available) */}
                {playerRating !== undefined && playerRating > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full mb-0.5 border shadow-xs ${
                    playerRating >= 8.0
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : playerRating >= 7.0
                      ? 'bg-amber-400 text-slate-950 border-amber-200'
                      : 'bg-slate-800 text-slate-100 border-slate-600'
                  }`}>
                    {playerRating.toFixed(1)}
                  </span>
                )}

                {/* Jersey Node */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-xl border-2 transition-all ${
                  player.position === 'GK'
                    ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-500/50'
                    : 'bg-[#800020] text-white border-white ring-2 ring-[#800020]/50'
                }`}>
                  {player.number}
                </div>

                {/* Player Name Pill */}
                <div className="bg-slate-950/90 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md border border-slate-700/80 mt-1 max-w-[90px] truncate text-center shadow-md group-hover:bg-[#800020] group-hover:border-amber-400">
                  {player.name.split(' ').pop()}
                  {player.isCaptain && <span className="text-amber-400 font-black ml-1">(C)</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Substitutes Bench */}
      {lineup.substitutes && lineup.substitutes.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Substitutes Bench
          </h4>
          <div className="flex flex-wrap gap-2">
            {lineup.substitutes.map(sub => (
              <div
                key={sub.playerId}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                <span className="font-mono text-amber-400 font-bold">#{sub.number}</span>
                <span className="font-semibold">{sub.name}</span>
                <span className="text-[10px] text-slate-400 font-medium">({sub.position})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
