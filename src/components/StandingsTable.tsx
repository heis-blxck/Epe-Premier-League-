import React, { useMemo } from 'react';
import { Team, Match } from '../types';
import { Trophy, ArrowUp, ArrowDown, Minus, Zap } from 'lucide-react';
import { computeLiveGhostStandings } from '../utils/liveStandingsProjection';
import { TeamLogo } from './TeamLogo';

interface StandingsTableProps {
  standings: Team[];
  matches?: Match[];
  onSelectTeam?: (team: Team) => void;
  isAdmin?: boolean;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ standings, matches = [], onSelectTeam, isAdmin = false }) => {
  const { projectedStandings, hasActiveLiveMatches, activeLiveMatchesCount } = useMemo(() => {
    return computeLiveGhostStandings(standings, matches);
  }, [standings, matches]);

  return (
    <div className="bg-[#1b202f] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 border border-slate-800/80">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#800020] flex items-center justify-center font-black border border-rose-800 shadow-md shrink-0">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              EPE PREMIER LEAGUE STANDINGS
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Official League Table & Real-Time Performance Metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1cd861]"></span>
            Champions Zone
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Bottom Zone
          </span>
        </div>
      </div>

      {/* Ghost Live Table Active Banner (Admin Only) */}
      {hasActiveLiveMatches && isAdmin && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  GHOST LIVE TABLE ACTIVE
                </span>
                <span className="text-[11px] text-emerald-100/90 font-medium block">
                  Positions & stats are dynamically projected in real-time from {activeLiveMatchesCount} live {activeLiveMatchesCount === 1 ? 'fixture' : 'fixtures'}.
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-900/90 text-emerald-200 border border-emerald-700/80 px-3 py-1 rounded-full font-mono font-bold shrink-0">
              Client-Side Projection &bull; Zero DB Cost
            </span>
          </div>
      )}

      {/* Standings Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap table-fixed sm:table-auto">
          <thead>
            <tr className="text-slate-400 font-bold uppercase text-[8px] sm:text-[10px] tracking-wider border-b border-slate-800/80">
              <th className="pb-3 px-1 sm:px-3 text-center w-12 sm:w-20">Rank</th>
              <th className="pb-3 px-1 sm:px-3 text-left w-[35%] sm:w-auto">Club</th>
              <th className="pb-3 px-0.5 sm:px-2 text-center">MP</th>
              <th className="pb-3 px-0.5 sm:px-2 text-center">W</th>
              <th className="pb-3 px-0.5 sm:px-2 text-center">D</th>
              <th className="pb-3 px-0.5 sm:px-2 text-center">L</th>
              <th className="pb-3 px-0.5 sm:px-2 text-center">GF</th>
              <th className="pb-3 px-0.5 sm:px-2 text-center">GA</th>
              <th className="pb-3 px-0.5 sm:px-2 text-center">GD</th>
              <th className="pb-3 px-1 sm:px-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {projectedStandings.map((team, idx) => {
              const rank = idx + 1;
              const isFirst = rank === 1;
              const isLast = rank === projectedStandings.length;
              
              let rowClass = "hover:bg-slate-800/40 transition-all cursor-pointer group ";
              
              if (team.isLivePlaying) {
                rowClass += "bg-emerald-950/20 relative border-l-2 border-emerald-500 ";
              } else if (isFirst) {
                rowClass += "bg-[#1cd861]/[0.03] relative ";
              } else if (isLast) {
                rowClass += "bg-rose-500/[0.02] relative ";
              }
              
              return (
                <tr 
                  key={team.id}
                  onClick={() => onSelectTeam && onSelectTeam(team)}
                  className={rowClass}
                >
                  <td className="relative p-0 text-center">
                    {isFirst && <div className="absolute left-0 top-3 bottom-3 w-[5px] bg-[#1cd861] rounded-r-md shadow-[0_0_8px_rgba(28,216,97,0.5)]"></div>}
                    {isLast && <div className="absolute left-0 top-3 bottom-3 w-[5px] bg-rose-500 rounded-r-md shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>}
                    <div className="flex items-center justify-center gap-1 sm:gap-2 h-full py-4 sm:py-5 px-1 sm:px-3">
                      <span className={`font-black text-[11px] sm:text-base ${isFirst ? 'text-[#1cd861]' : isLast ? 'text-rose-500' : 'text-slate-300'}`}>
                        {rank}
                      </span>

                      {/* Rank Positional Movement Indicator */}
                      {team.rankMovement > 0 ? (
                        <div className="flex items-center gap-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-1 py-0.5 rounded text-[9px] font-black shadow-sm" title={`Climbed +${team.rankMovement} positions during live match`}>
                          <ArrowUp className="w-2.5 h-2.5 text-[#1cd861]" />
                          <span>+{team.rankMovement}</span>
                        </div>
                      ) : team.rankMovement < 0 ? (
                        <div className="flex items-center gap-0.5 bg-rose-950 text-rose-400 border border-rose-800 px-1 py-0.5 rounded text-[9px] font-black shadow-sm" title={`Dropped ${team.rankMovement} positions during live match`}>
                          <ArrowDown className="w-2.5 h-2.5 text-rose-500" />
                          <span>{team.rankMovement}</span>
                        </div>
                      ) : (
                        <Minus className="w-2.5 h-2.5 text-slate-600" />
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 sm:py-4 px-1 sm:px-3 truncate">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className="relative shrink-0">
                        <TeamLogo 
                          team={team} 
                          className={isFirst ? 'w-9 h-9 sm:w-12 sm:h-12 border-2 border-[#1cd861] shadow-[0_0_12px_rgba(28,216,97,0.3)]' : 'w-7 h-7 sm:w-9 sm:h-9'}
                        />
                        {team.isLivePlaying && (
                          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping"></span>
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-black truncate block text-xs sm:text-lg tracking-tight ${isFirst ? 'text-[#1cd861]' : 'text-slate-200 group-hover:text-white'}`}>
                            {team.name}
                          </span>
                          {team.isLivePlaying && (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              LIVE {team.liveScoreText}
                            </span>
                          )}
                        </div>
                        {isFirst && (
                          <span className="text-[7px] sm:text-[9px] text-[#1cd861] font-bold uppercase tracking-widest mt-0.5 block">
                            League Leader
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className={`py-3 sm:py-4 px-0.5 sm:px-2 text-center text-[10px] sm:text-sm font-bold text-slate-300`}>{team.matchesPlayed}</td>
                  <td className={`py-3 sm:py-4 px-0.5 sm:px-2 text-center text-[10px] sm:text-sm font-bold text-[#1cd861]`}>{team.won}</td>
                  <td className={`py-3 sm:py-4 px-0.5 sm:px-2 text-center text-[10px] sm:text-sm font-bold text-slate-400`}>{team.drawn}</td>
                  <td className={`py-3 sm:py-4 px-0.5 sm:px-2 text-center text-[10px] sm:text-sm font-bold text-rose-500`}>{team.lost}</td>
                  <td className={`py-3 sm:py-4 px-0.5 sm:px-2 text-center text-[10px] sm:text-sm font-bold text-slate-400`}>{team.goalsFor}</td>
                  <td className={`py-3 sm:py-4 px-0.5 sm:px-2 text-center text-[10px] sm:text-sm font-bold text-slate-400`}>{team.goalsAgainst}</td>
                  <td className={`py-3 sm:py-4 px-0.5 sm:px-2 text-center text-[10px] sm:text-sm font-bold ${
                    team.goalDifference > 0 ? 'text-[#1cd861]' : 
                    team.goalDifference < 0 ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                    {team.goalDifference}
                  </td>
                  
                  <td className="py-3 sm:py-4 px-1 sm:px-3 text-right">
                    <span className={`font-black tracking-tight ${isFirst ? 'text-xl sm:text-3xl text-[#1cd861]' : isLast ? 'text-xl sm:text-3xl text-rose-500' : 'text-base sm:text-xl text-amber-400'}`}>
                      {team.points}
                    </span>
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
