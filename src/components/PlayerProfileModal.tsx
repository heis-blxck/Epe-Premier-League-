import React, { useState } from 'react';
import { Player, Team } from '../types';
import { X } from 'lucide-react';
import { useBackHandler } from '../utils/backManager';

interface PlayerProfileModalProps {
  player: Player;
  team?: Team;
  onClose: () => void;
}

const getPositionFullName = (pos: string) => {
  switch (pos) {
    case 'FWD': return 'Forward';
    case 'MID': return 'Midfielder';
    case 'DEF': return 'Defender';
    case 'GK': return 'Goalkeeper';
    default: return pos;
  }
};

const getFlagEmoji = (nationality?: string) => {
  if (!nationality) return '🇳🇬';
  const nat = nationality.toLowerCase();
  if (nat.includes('nigeria')) return '🇳🇬';
  if (nat.includes('england') || nat.includes('uk')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (nat.includes('brazil')) return '🇧🇷';
  if (nat.includes('france')) return '🇫🇷';
  if (nat.includes('spain')) return '🇪🇸';
  if (nat.includes('portugal')) return '🇵🇹';
  if (nat.includes('argentina')) return '🇦🇷';
  if (nat.includes('ghana')) return '🇬🇭';
  if (nat.includes('senegal')) return '🇸🇳';
  if (nat.includes('cameroon')) return '🇨🇲';
  return '🇳🇬';
};

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, team, onClose }) => {
  const [activeTab, setActiveTab] = useState<'league' | 'cup' | 'fantasy'>('league');

  useBackHandler(() => {
    onClose();
    return true;
  }, [onClose]);
  
  const nameParts = player.name ? player.name.trim().split(' ') : ['Player'];
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

  const matchesCount = activeTab === 'league' 
    ? (player.matchesPlayed ?? player.appearances ?? 0)
    : activeTab === 'cup' ? (player.cupMatchesPlayed ?? 0) : 0;
    
  const getStat = (leagueStat: number = 0, cupStat: number = 0) => {
    return activeTab === 'league' ? leagueStat : cupStat;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 flex flex-col p-4 sm:p-5 gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header Card (Burgundy background theme) */}
        <div className="bg-gradient-to-br from-[#800020] to-[#500014] border border-[#a0002a]/40 relative rounded-[2rem] p-6 overflow-hidden shadow-xl min-h-[220px] flex flex-col justify-between shrink-0">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition-colors z-20 cursor-pointer backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 max-w-[62%] space-y-1">
            <p className="text-rose-200/90 font-extrabold text-sm tracking-wide">
              {firstName}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
              {lastName}
            </h2>
            <p className="text-rose-100/80 text-xs font-bold pt-0.5">
              {player.age ? `${player.age} Years` : (player.nationality || 'Pro Player')}
            </p>
            
            <div className="pt-2">
              <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tighter leading-none drop-shadow">
                {player.shirtNumber ? `#${player.shirtNumber}` : '#10'}
              </div>
              <div className="text-rose-200/90 font-extrabold text-xs tracking-wider uppercase mt-1">
                {getPositionFullName(player.position)}
              </div>
            </div>

            <div className="flex gap-2 pt-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-900/60 p-1.5 shadow-md flex items-center justify-center border border-rose-500/30 backdrop-blur-sm">
                <span className="text-base" role="img" aria-label="country">
                  {getFlagEmoji(player.nationality)}
                </span>
              </div>
              {team?.logoUrl ? (
                <div className="w-8 h-8 rounded-xl bg-white p-1 shadow-md flex items-center justify-center border border-white/40 overflow-hidden">
                  <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-900/60 p-1 shadow-md flex items-center justify-center border border-rose-500/30 font-bold text-xs text-white">
                  ⚽
                </div>
              )}
            </div>
          </div>
          
          {/* Player Portrait Image on Right */}
          <div className="absolute right-[-10px] bottom-0 w-48 sm:w-56 h-full flex items-end justify-end pointer-events-none z-0">
            <img 
              src={player.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'} 
              alt={player.name} 
              className="w-full h-[95%] object-cover object-top filter drop-shadow-2xl brightness-105 contrast-110"
              style={{ 
                maskImage: 'linear-gradient(to top, transparent 0%, black 15%)',
                WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 15%)'
              }}
            />
          </div>
        </div>

        {/* Lower Section (Dark Box containing the 4 requested Stat Blocks/Tabs) */}
        <div className="bg-[#1e1f26] rounded-[2rem] p-5 sm:p-6 shadow-2xl border border-slate-800/80">
          
          <div className="flex items-center justify-between bg-slate-900 rounded-xl p-1 mb-5">
            <button 
              onClick={() => setActiveTab('league')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'league' ? 'bg-[#800020] text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              League
            </button>
            <button 
              onClick={() => setActiveTab('cup')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'cup' ? 'bg-[#800020] text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Cup
            </button>
            <button 
              onClick={() => setActiveTab('fantasy')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'fantasy' ? 'bg-[#800020] text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Fantasy
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {activeTab === 'fantasy' ? (
              <>
                <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Total Points
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {player.fantasyPoints || 0}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Avg Points/GW
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {player.fantasyAvgPoints || 0}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center col-span-2">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Current Price
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    ₦{(player.price || 6.0).toFixed(1)}m
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Avg rating */}
                <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Avg Rating
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {player.ratingAverage !== undefined && player.ratingAverage !== null && player.ratingAverage > 0 ? player.ratingAverage.toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* Matches played */}
                <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Matches Played
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {matchesCount}
                  </span>
                </div>

                {player.position === 'GK' ? (
                  <>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Clean Sheets
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {getStat(player.cleanSheets, player.cupCleanSheets)}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Goals Conceded
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {getStat(player.goalsConceded, player.cupGoalsConceded)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Goals
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {getStat(player.goals, player.cupGoals)}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Assists
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {getStat(player.assists, player.cupAssists)}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

