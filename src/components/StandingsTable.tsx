import React from 'react';
import { Team } from '../types';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StandingsTableProps {
  standings: Team[];
  onSelectTeam?: (team: Team) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, onSelectTeam }) => {
  return (
    <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 space-y-4 backdrop-blur-sm">
      {/* Table Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#800020] text-amber-300 flex items-center justify-center font-black border border-rose-800 shadow-md">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100 tracking-tight">
              EPE PREMIER LEAGUE STANDINGS
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Official League Table & Performance Metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            1st: Champion Zone
          </span>
        </div>
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="text-slate-400 font-extrabold uppercase text-[10px] sm:text-xs border-b border-slate-800 pb-2">
              <th className="py-3 px-2 text-center w-8">#</th>
              <th className="py-3 px-3">Team</th>
              <th className="py-3 px-2 text-center">P</th>
              <th className="py-3 px-2 text-center">W</th>
              <th className="py-3 px-2 text-center">D</th>
              <th className="py-3 px-2 text-center">L</th>
              <th className="py-3 px-2 text-center hidden sm:table-cell">GF</th>
              <th className="py-3 px-2 text-center hidden sm:table-cell">GA</th>
              <th className="py-3 px-2 text-center">GD</th>
              <th className="py-3 px-3 text-center font-black text-amber-400">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {standings.map((team, idx) => {
              const rank = idx + 1;
              const isLeader = rank === 1;

              return (
                <tr
                  key={team.id}
                  onClick={() => onSelectTeam && onSelectTeam(team)}
                  className={`hover:bg-slate-800/60 transition-colors cursor-pointer group ${
                    isLeader ? 'bg-amber-500/10 font-semibold' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-2 text-center font-extrabold">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                      isLeader
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                        : rank <= 3
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'text-slate-500'
                    }`}>
                      {rank}
                    </span>
                  </td>

                  {/* Team */}
                  <td className="py-3 px-3 font-bold text-slate-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-700 shadow-xs group-hover:scale-105 transition-transform bg-slate-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80';
                        }}
                      />
                      <div className="truncate max-w-[140px] sm:max-w-xs">
                        <div className="truncate font-extrabold text-slate-100 text-xs sm:text-sm">
                          {team.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Coach: {team.coach}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Played */}
                  <td className="py-3 px-2 text-center font-mono font-semibold text-slate-300">
                    {team.matchesPlayed}
                  </td>

                  {/* Won */}
                  <td className="py-3 px-2 text-center font-mono text-emerald-400 font-bold">
                    {team.won}
                  </td>

                  {/* Drawn */}
                  <td className="py-3 px-2 text-center font-mono text-slate-400 font-semibold">
                    {team.drawn}
                  </td>

                  {/* Lost */}
                  <td className="py-3 px-2 text-center font-mono text-rose-400 font-semibold">
                    {team.lost}
                  </td>

                  {/* Goals For */}
                  <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell">
                    {team.goalsFor}
                  </td>

                  {/* Goals Against */}
                  <td className="py-3 px-2 text-center font-mono text-slate-400 hidden sm:table-cell">
                    {team.goalsAgainst}
                  </td>

                  {/* Goal Difference */}
                  <td className="py-3 px-2 text-center font-mono font-bold">
                    <span className={team.goalDifference > 0 ? 'text-emerald-400' : team.goalDifference < 0 ? 'text-rose-400' : 'text-slate-400'}>
                      {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="py-3 px-3 text-center font-mono font-black text-sm text-amber-300 bg-slate-950/80 rounded-lg border border-slate-800">
                    {team.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
