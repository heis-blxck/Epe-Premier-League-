import React from 'react';
import { Match } from '../types';
import { MapPin, Clock } from 'lucide-react';
import { useMatchClock } from '../utils/matchClock';

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
      className={`min-w-[280px] sm:min-w-[320px] bg-slate-900/90 rounded-2xl p-4 cursor-pointer transition-all duration-200 border shadow-lg hover:shadow-2xl hover:-translate-y-0.5 relative flex flex-col justify-between backdrop-blur-xs ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/30'
          : isLive
          ? 'border-rose-700/80 ring-1 ring-rose-500/30 bg-gradient-to-b from-rose-950/40 to-slate-900'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-800/80">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
          Matchday {match.matchday}
        </span>

        {isLive ? (
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${clock.badgeColor}`}>
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            <span>{clock.displayString} {clock.overflowText ? clock.overflowText : ''} LIVE</span>
          </div>
        ) : isFullTime ? (
          <span className="bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-md text-[11px] border border-slate-700">
            {clock.displayString}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
            <Clock className="w-3 h-3 text-slate-500" />
            {match.time} WAT
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="space-y-3 my-1">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={match.homeTeam?.logoUrl}
              alt={match.homeTeam?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shadow-xs flex-shrink-0 bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80';
              }}
            />
            <span className="font-bold text-slate-100 text-[13px] leading-tight break-words max-w-[80px] text-center">
              {match.homeTeam?.name || 'Home Team'}
            </span>
          </div>
          <span className={`text-lg font-black px-2.5 py-0.5 rounded-md ${
            isLive || isFullTime ? 'text-amber-300 font-mono bg-slate-950 border border-slate-800' : 'text-slate-600'
          }`}>
            {isLive || isFullTime ? match.homeScore : '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={match.awayTeam?.logoUrl}
              alt={match.awayTeam?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shadow-xs flex-shrink-0 bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&q=80';
              }}
            />
            <span className="font-bold text-slate-100 text-[13px] leading-tight break-words max-w-[80px] text-center">
              {match.awayTeam?.name || 'Away Team'}
            </span>
          </div>
          <span className={`text-lg font-black px-2.5 py-0.5 rounded-md ${
            isLive || isFullTime ? 'text-amber-300 font-mono bg-slate-950 border border-slate-800' : 'text-slate-600'
          }`}>
            {isLive || isFullTime ? match.awayScore : '-'}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 truncate max-w-[180px]">
          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="truncate">{match.venue}</span>
        </span>
        <span className="font-semibold text-amber-400 hover:underline">
          Match Center &rarr;
        </span>
      </div>
    </div>
  );
};
