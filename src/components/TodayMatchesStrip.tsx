import React, { useState } from 'react';
import { Match } from '../types';
import { MatchCard } from './MatchCard';
import { Flame, Calendar, Activity } from 'lucide-react';
import { formatMatchDisplayTime } from '../utils/matchClock';

interface TodayMatchesStripProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string;
}

export const TodayMatchesStrip: React.FC<TodayMatchesStripProps> = ({
  matches,
  onSelectMatch,
  selectedMatchId
}) => {
  const [filter, setFilter] = useState<'all' | 'live' | 'finished' | 'scheduled'>('all');

  const filteredMatches = matches.filter(m => {
    if (filter === 'live') return m.status === 'Live';
    if (filter === 'finished') return m.status === 'Full-Time';
    if (filter === 'scheduled') return m.status === 'Scheduled';
    return true;
  });

  const liveMatches = matches.filter(m => m.status === 'Live');

  return (
    <div className="space-y-4">
      {/* Filters Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#800020] text-amber-300 flex items-center justify-center font-bold border border-rose-800">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
              MATCH CENTER
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Epe Premier League Fixtures & Real-Time Scores
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({matches.length})
          </button>

          <button
            onClick={() => setFilter('live')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              filter === 'live'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {liveMatches.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>}
            Live ({liveMatches.length})
          </button>

          <button
            onClick={() => setFilter('finished')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'finished'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Finished
          </button>

          <button
            onClick={() => setFilter('scheduled')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'scheduled'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Featured Live Banner (If Live Match exists) */}
      {liveMatches.length > 0 && filter === 'all' && (
        <div className="bg-gradient-to-r from-[#800020] via-rose-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden border border-rose-800/40">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Flame className="w-48 h-48 text-rose-300" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-md">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                FEATURED LIVE MATCH &bull; {formatMatchDisplayTime(liveMatches[0].matchMinute, liveMatches[0].period, liveMatches[0].stoppageTime1stHalf, liveMatches[0].stoppageTime2ndHalf).displayString}
              </span>
              <span className="text-xs text-rose-200/80 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {liveMatches[0].venue}
              </span>
            </div>

            <div className="grid grid-cols-3 items-center text-center max-w-2xl mx-auto py-2">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={liveMatches[0].homeTeam?.logoUrl}
                  alt={liveMatches[0].homeTeam?.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg bg-white/10"
                />
                <span className="font-extrabold text-sm sm:text-lg tracking-tight">
                  {liveMatches[0].homeTeam?.name}
                </span>
              </div>

              {/* Score Display */}
              <div className="flex flex-col items-center">
                <div className="text-3xl sm:text-5xl font-black tracking-wider text-amber-300 font-mono bg-black/30 px-4 py-2 rounded-2xl border border-white/10 shadow-inner">
                  {liveMatches[0].homeScore} - {liveMatches[0].awayScore}
                </div>
                <span className="text-xs font-bold text-rose-200 mt-2 uppercase tracking-widest">
                  {liveMatches[0].period}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={liveMatches[0].awayTeam?.logoUrl}
                  alt={liveMatches[0].awayTeam?.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg bg-white/10"
                />
                <span className="font-extrabold text-sm sm:text-lg tracking-tight">
                  {liveMatches[0].awayTeam?.name}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => onSelectMatch(liveMatches[0])}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                OPEN LIVE MATCH CENTER &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Cards Scrollable */}
      <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
        {filteredMatches.length === 0 ? (
          <div className="w-full text-center py-8 bg-slate-900 rounded-2xl border border-dashed border-slate-800 text-slate-400 font-medium text-sm">
            No matches found in this category.
          </div>
        ) : (
          filteredMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onClick={onSelectMatch}
              selectedMatchId={selectedMatchId}
            />
          ))
        )}
      </div>
    </div>
  );
};
