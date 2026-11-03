import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { Player, Team } from '../types';
import { Trophy, Star, Award, Flame, Shield, ChevronRight } from 'lucide-react';


interface MasterLeaderboardWidgetProps {
  title: string;
  subtitle: string;
  players: { player: Player; value: number | string; displaySub?: string }[];
  teamsMap: Map<string, Team>;
  metricLabel: string;
  isFantasy?: boolean;
}

export const MasterLeaderboardWidget: React.FC<MasterLeaderboardWidgetProps> = ({
  title,
  subtitle,
  players = [],
  teamsMap,
  metricLabel,
  isFantasy = false
}) => {
  
  const navigate = useNavigate();

  if (!players || players.length === 0) {
    return (
      <div className="bg-slate-900/90 rounded-3xl p-8 text-center text-slate-400 border border-slate-800 shadow-2xl">
        <p className="font-bold text-sm">No statistics recorded for this category yet.</p>
      </div>
    );
  }

  const heroItem = players[0];
  const listItems = players.slice(1, 10);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header (Optional in Stars but we keep it here for context) */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
           <span className="bg-[#800020] text-white shadow-md shadow-rose-950/50 border border-rose-800 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
             {metricLabel}
           </span>
        </div>
      </div>

      {/* Hero #1 Rank Card (SofaScore Style) */}
      {heroItem ? (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Header Title */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-800/80">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
              {title}
            </h4>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Leader
            </span>
          </div>

          {/* Top Banner with #1 Player */}
          <div className="relative bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 px-6 pt-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-5">
              {/* Player Photo */}
              <div className="relative">
                <img
                  src={heroItem.player.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=80'}
                  alt={heroItem.player.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/80 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`?modal=playerProfile&playerId=${heroItem.player.id}`)}
                />
                <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded uppercase shadow">
                  {heroItem.player.position}
                </span>
              </div>

              <div>
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                  #1 Ranked SuperStar
                </span>
                <h3 className="text-lg font-black text-white mt-0.5 cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => navigate(`?modal=playerProfile&playerId=${heroItem.player.id}`)}>
                  {heroItem.player.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {teamsMap.get(heroItem.player.teamId)?.name || 'EPL Club'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {metricLabel}
              </span>
              <span className="text-2xl font-black text-amber-400">
                {heroItem.value}
              </span>
            </div>
          </div>

          {/* Solid Accent Banner for #1 */}
          <div className="bg-emerald-800 px-6 py-3 flex items-center justify-between text-white font-bold text-xs shadow-inner">
            <div className="flex items-center gap-4">
              <span className="w-6 h-6 rounded-lg bg-emerald-950 text-white font-black flex items-center justify-center text-xs shadow">
                1
              </span>
              <span className="font-extrabold tracking-wide cursor-pointer hover:text-emerald-200 transition-colors" onClick={() => navigate(`?modal=playerProfile&playerId=${heroItem.player.id}`)}>{heroItem.player.name}</span>
              <span className="text-emerald-200 text-[11px] hidden sm:inline-block">
                {heroItem.player.position} {heroItem.displaySub ? `· ${heroItem.displaySub}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-base font-black text-amber-300">{heroItem.value}</span>
            </div>
          </div>

          {/* Rows for Ranks 2 to 10 */}
          {listItems.length > 0 && (
            <div className="divide-y divide-slate-800/80 bg-slate-950">
              {listItems.map((item, idx) => {
                const rank = idx + 2;
                return (
                  <div 
                    key={item.player.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-slate-400 font-bold flex items-center justify-center text-xs border border-slate-800 shrink-0">
                        {rank}
                      </span>
                      
                      <img
                        src={item.player.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=80'}
                        alt={item.player.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 cursor-pointer hover:scale-105 transition-transform shrink-0"
                        onClick={() => navigate(`?modal=playerProfile&playerId=${item.player.id}`)}
                      />

                      <div className="truncate">
                        <h5 className="font-bold text-white text-xs hover:text-amber-400 transition-colors cursor-pointer truncate" onClick={() => navigate(`?modal=playerProfile&playerId=${item.player.id}`)}>
                          {item.player.name}
                        </h5>
                        <div className="text-[10px] text-slate-500 font-medium truncate">
                          {item.player.position} · {teamsMap.get(item.player.teamId)?.shortName || 'EPL'} {item.displaySub ? `· ${item.displaySub}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-amber-400">{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/90 rounded-3xl p-8 text-center text-slate-400 border border-slate-800 shadow-2xl">
          <p className="font-bold text-sm">No statistics recorded for this category yet.</p>
        </div>
      )}

      
    </div>
  );
};
