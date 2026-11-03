import React from 'react';
import { Match } from '../types';
import { MapPin, Clock } from 'lucide-react';
import { useMatchClock } from '../utils/matchClock';
import { MatchCountdown } from './MatchCountdown';
import { TeamLogo } from './TeamLogo';

interface MatchCardProps {
  match: Match;
  onClick: (match: Match) => void;
  selectedMatchId?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick, selectedMatchId }) => {
  const isLive = match.status === 'Live' || match.period === '1st Half' || match.period === '2nd Half';
  const isFullTime = match.status === 'Full-Time' || match.period === 'Full-Time';
  const isSelected = selectedMatchId === match.id;

  const clock = useMatchClock(match);

  return (
    <div
      onClick={() => onClick(match)}
      className={`min-w-[280px] sm:min-w-[320px] bg-white p-4 cursor-pointer transition-all duration-75 relative flex flex-col justify-between border-[3px] border-black ${
        isSelected
          ? 'shadow-[6px_6px_0px_0px_#FF5500] translate-x-[1px] translate-y-[1px]'
          : isLive
          ? 'shadow-[6px_6px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000000]'
          : 'shadow-[6px_6px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#000000]'
      }`}
    >
      {/* Raw Punch-Ticket Header */}
      <div className="flex items-center justify-between text-xs -mx-4 -mt-4 mb-3 px-4 py-2 bg-[#F4F4F0] border-b-[3px] border-black">
        <span className="font-black text-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 bg-black inline-block"></span>
          MD {match.matchday}
        </span>

        {isLive ? (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#FF5500] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] animate-neo-live">
            <span className="w-2 h-2 bg-black inline-block"></span>
            <span>{clock.displayString} {clock.overflowText ? clock.overflowText : ''} LIVE</span>
          </div>
        ) : isFullTime ? (
          <span className="bg-black text-white font-black px-2 py-0.5 text-[10px] uppercase font-mono border border-black shadow-[2px_2px_0px_0px_#000]">
            {clock.displayString || 'FULL-TIME'}
          </span>
        ) : (
          <MatchCountdown match={match} />
        )}
      </div>

      {/* Teams & Score Blocks */}
      <div className="space-y-2.5 my-1">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 border-2 border-black bg-white p-0.5 shrink-0 flex items-center justify-center">
              <TeamLogo team={match.homeTeam} className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-black text-xs sm:text-sm uppercase tracking-tight leading-tight truncate">
              {match.homeTeam?.name || 'Home Team'}
            </span>
          </div>
          <span className={`text-lg font-black font-mono px-3 py-0.5 border-2 border-black ${
            isLive || isFullTime 
              ? 'bg-[#FF5500] text-black shadow-[2px_2px_0px_0px_#000]' 
              : 'bg-[#F4F4F0] text-neutral-400'
          }`}>
            {isLive || isFullTime ? match.homeScore : '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 border-2 border-black bg-white p-0.5 shrink-0 flex items-center justify-center">
              <TeamLogo team={match.awayTeam} className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-black text-xs sm:text-sm uppercase tracking-tight leading-tight truncate">
              {match.awayTeam?.name || 'Away Team'}
            </span>
          </div>
          <span className={`text-lg font-black font-mono px-3 py-0.5 border-2 border-black ${
            isLive || isFullTime 
              ? 'bg-[#FF5500] text-black shadow-[2px_2px_0px_0px_#000]' 
              : 'bg-[#F4F4F0] text-neutral-400'
          }`}>
            {isLive || isFullTime ? match.awayScore : '-'}
          </span>
        </div>
      </div>

      {/* Footer Info: Structural punch-ticket bottom */}
      <div className="mt-3 pt-2.5 border-t-2 border-black border-dashed flex items-center justify-between text-[11px] text-neutral-700">
        <span className="flex items-center gap-1 font-bold truncate max-w-[170px] uppercase">
          <MapPin className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />
          <span className="truncate">{match.venue || 'Epe Township Stadium'}</span>
        </span>
        <span className="font-black text-black uppercase tracking-wider hover:text-[#FF5500] flex items-center gap-1">
          CENTER &rarr;
        </span>
      </div>
    </div>
  );
};
