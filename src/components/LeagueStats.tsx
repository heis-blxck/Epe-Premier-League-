import React, { useState } from 'react';
import { LeagueStats as StatsType, Team, Player } from '../types';
import { Flame, Award, ShieldCheck, User } from 'lucide-react';

interface LeagueStatsProps {
  stats: StatsType;
  teams: Team[];
}

export const LeagueStats: React.FC<LeagueStatsProps> = ({ stats, teams }) => {
  const [activeCategory, setActiveCategory] = useState<'goals' | 'assists' | 'cleanSheets'>('goals');

  const teamsMap = new Map<string, Team>(teams.map(t => [t.id, t]));

  const getPlayersList = (): { players: Player[]; label: string; metricName: string } => {
    if (activeCategory === 'assists') {
      return { players: stats.topAssists, label: 'Playmaker Award', metricName: 'Assists' };
    }
    if (activeCategory === 'cleanSheets') {
      return { players: stats.cleanSheets, label: 'Golden Glove Award', metricName: 'Clean Sheets' };
    }
    return { players: stats.topScorers, label: 'Golden Boot Leaderboard', metricName: 'Goals' };
  };

  const { players, label, metricName } = getPlayersList();
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="space-y-6">
      {/* Category Toggle Header */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-black text-slate-100 tracking-tight">
            LEAGUE PLAYER STATS & AWARDS
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Individual Performance Rankings & Leaders
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl w-full sm:w-auto border border-slate-800">
          <button
            onClick={() => setActiveCategory('goals')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'goals'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Top Scorers</span>
          </button>

          <button
            onClick={() => setActiveCategory('assists')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'assists'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Most Assists</span>
          </button>

          <button
            onClick={() => setActiveCategory('cleanSheets')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'cleanSheets'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Clean Sheets</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Visual */}
      {top3.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-[#800020] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="text-center mb-6">
            <span className="text-amber-400 font-extrabold text-xs uppercase tracking-widest bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
              {label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-4">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="flex flex-col items-center text-center space-y-2 order-1">
                <div className="relative">
                  <img
                    src={top3[1].photoUrl}
                    alt={top3[1].name}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-slate-300 shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-slate-900">
                    2
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm truncate max-w-[100px]">{top3[1].name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{teamsMap.get(top3[1].teamId)?.shortName}</p>
                  <div className="mt-1 bg-white/10 px-2 py-0.5 rounded-md font-mono text-xs font-black text-amber-300">
                    {activeCategory === 'assists' ? top3[1].assists : activeCategory === 'cleanSheets' ? top3[1].cleanSheets : top3[1].goals} {metricName}
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="flex flex-col items-center text-center space-y-2 order-2 -mt-4">
                <div className="relative">
                  <div className="absolute -top-6 text-2xl">👑</div>
                  <img
                    src={top3[0].photoUrl}
                    alt={top3[0].name}
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-amber-400 shadow-2xl ring-4 ring-amber-400/30"
                  />
                  <span className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-slate-900 shadow-lg">
                    1
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-amber-300 truncate max-w-[120px]">{top3[0].name}</h4>
                  <p className="text-xs text-rose-200 font-bold">{teamsMap.get(top3[0].teamId)?.name}</p>
                  <div className="mt-1.5 bg-amber-400 text-slate-950 font-mono text-sm font-black px-3 py-1 rounded-xl shadow-lg">
                    {activeCategory === 'assists' ? top3[0].assists : activeCategory === 'cleanSheets' ? top3[0].cleanSheets : top3[0].goals} {metricName}
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="flex flex-col items-center text-center space-y-2 order-3">
                <div className="relative">
                  <img
                    src={top3[2].photoUrl}
                    alt={top3[2].name}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-amber-700 shadow-xl"
                  />
                  <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-slate-900">
                    3
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm truncate max-w-[100px]">{top3[2].name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{teamsMap.get(top3[2].teamId)?.shortName}</p>
                  <div className="mt-1 bg-white/10 px-2 py-0.5 rounded-md font-mono text-xs font-black text-amber-300">
                    {activeCategory === 'assists' ? top3[2].assists : activeCategory === 'cleanSheets' ? top3[2].cleanSheets : top3[2].goals} {metricName}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 backdrop-blur-sm">
        <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
          Complete {metricName} Rankings
        </h3>

        <div className="divide-y divide-slate-800/80">
          {players.map((player, idx) => {
            const team = teamsMap.get(player.teamId);
            const val = activeCategory === 'assists' ? player.assists : activeCategory === 'cleanSheets' ? player.cleanSheets : player.goals;

            return (
              <div key={player.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/60 px-2.5 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-slate-500 text-sm w-6 text-center">
                    #{idx + 1}
                  </span>
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-xs bg-slate-800"
                  />
                  <div>
                    <div className="font-bold text-slate-100 text-sm">
                      {player.name}
                    </div>
                    <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                      <span>{team?.name || 'Free Agent'}</span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="font-mono text-slate-400">#{player.shirtNumber} ({player.position})</span>
                    </div>
                  </div>
                </div>

                <div className="font-mono font-black text-base text-amber-300 bg-slate-950 px-3.5 py-1 rounded-xl border border-slate-800">
                  {val} <span className="text-[10px] font-normal text-slate-400">{metricName.toLowerCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
