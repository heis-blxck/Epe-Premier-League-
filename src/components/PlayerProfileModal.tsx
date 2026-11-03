import React, { useState } from 'react';
import { Player, Team, Match } from '../types';
import { X } from 'lucide-react';
import { useURLModal } from '../hooks/useURLModal';
import { useNavigate, useSearchParams } from 'react-router-dom';


interface PlayerProfileModalProps {
  players: Player[];
  teams: Team[];
  matches?: Match[];
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

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ players, teams, matches = [] }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isOpen, closeModal, modalData } = useURLModal<{ playerId?: string, matchContextId?: string, stage?: 'league' | 'cup' | 'fantasy' }>('playerProfile');
  const [activeTabState, setActiveTabState] = useState(searchParams.get('stage') || modalData?.stage || 'league');
  
  React.useEffect(() => {
    if (modalData?.stage) setActiveTabState(modalData.stage);
    else setActiveTabState(searchParams.get('stage') || 'league');
  }, [modalData?.playerId, modalData?.stage]);

  const activeTab = activeTabState;
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };
  
  if (!isOpen || !modalData?.playerId) return null;

  const player = players.find(p => String(p.id) === String(modalData.playerId));
  if (!player) return null;

  const team = teams.find(t => String(t.id) === String(player.teamId));
  const matchContext = matches.find(m => String(m.id) === String(modalData.matchContextId));

  
  
  const nameParts = player.name ? player.name.trim().split(' ') : ['Player'];
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

  const matchesCount = activeTab === 'league' 
    ? (player.matchesPlayed ?? player.appearances ?? 0)
    : activeTab === 'cup' ? (player.cupMatchesPlayed ?? 0) : 0;
    
  const getStat = (leagueStat: number = 0, cupStat: number = 0) => {
    return activeTab === 'league' ? leagueStat : cupStat;
  };


  // Match Context Computations
  let matchRating = 0;
  let matchMinutesPlayed = 0;
  let matchGoals = 0;
  let matchAssists = 0;
  let matchShotsFaced = 0;
  let matchSaves = 0;

  if (matchContext) {
    const isHome = matchContext.homeTeamId === player.teamId;
    const lineup = isHome ? matchContext.homeLineup : matchContext.awayLineup;
    const oppTeam = isHome ? matchContext.awayTeam : matchContext.homeTeam;
    
    // Rating
    matchRating = matchContext.ratings?.[player.id] || 0;
    if (!matchRating && lineup) {
      const activeLineupPlayer = [...(lineup.startingXI || []), ...(lineup.substitutes || [])].find(p => String(p.playerId) === String(player.id));
      matchRating = activeLineupPlayer?.rating || 0;
    }
    
    // Goals & Assists
    matchGoals = matchContext.events?.filter(e => {
      const t = String(e.eventType || '');
      const isGoal = (t === 'Goal' || t === 'Penalty Goal' || t === 'penalty') && e.goalType !== 'own_goal';
      return isGoal && String(e.playerId) === String(player.id);
    }).length || 0;
    
    matchAssists = matchContext.events?.filter(e => {
      const t = String(e.eventType || '');
      const isGoal = (t === 'Goal' || t === 'Penalty Goal' || t === 'penalty') && e.goalType !== 'own_goal';
      const isAssister = String(e.assisterId) === String(player.id) || String((e as any).assistPlayerId) === String(player.id);
      return isGoal && isAssister;
    }).length || 0;
    
    // Minutes Played calculation
    let subOnMinute = -1;
    let subOffMinute = -1;
    
    const isStarter = lineup?.startingXI?.some(p => String(p.playerId) === String(player.id)) ?? false;
    
    matchContext.events?.forEach(e => {
      if (String(e.eventType) === 'Sub') {
        if (String(e.subInPlayerId) === String(player.id)) subOnMinute = e.minute;
        if (String(e.playerId) === String(player.id)) subOffMinute = e.minute;
      }
    });
    
    if (isStarter) {
      if (subOffMinute > -1) {
        matchMinutesPlayed = subOffMinute;
      } else {
        matchMinutesPlayed = matchContext.matchMinute || 90;
      }
    } else if (subOnMinute > -1) {
      if (subOffMinute > -1) {
         matchMinutesPlayed = subOffMinute - subOnMinute;
      } else {
         const currentMin = matchContext.matchMinute || 90;
         matchMinutesPlayed = currentMin - subOnMinute;
      }
    }
    
    // GK Stats
    if (player.position === 'GK' || player.position === 'GOALKEEPER') {
      const oppShotsOnTarget = isHome ? matchContext.stats?.awayShotsOnTarget : matchContext.stats?.homeShotsOnTarget;
      matchShotsFaced = oppShotsOnTarget || 0;
      
      const oppGoalsScored = isHome ? matchContext.awayScore : matchContext.homeScore;
      matchSaves = Math.max(0, matchShotsFaced - (oppGoalsScored || 0));
    }
  }

  return (

    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={closeModal}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 flex flex-col p-4 sm:p-5 gap-4 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header Card (Burgundy background theme) */}
        <div className="bg-gradient-to-br from-[#800020] via-[#58061e] to-[#3b0213] border border-rose-800/40 relative rounded-[2rem] p-6 overflow-hidden shadow-xl min-h-[220px] flex flex-col justify-between shrink-0">
          {/* Close button */}
          <button 
            onClick={closeModal}
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
              {player.nationality || 'Pro Player'}
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
          
          {!matchContext && (
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
          )}

          <div className="grid grid-cols-2 gap-3.5">
            
            {matchContext ? (
              <>
                <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Match Rating
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {matchRating > 0 ? matchRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Minutes Played
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {matchMinutesPlayed > 0 ? `${matchMinutesPlayed}'` : '0'}
                  </span>
                </div>
                {player.position === 'GK' || player.position === 'GOALKEEPER' ? (
                  <>
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Shots Faced
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchShotsFaced}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Saves
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchSaves}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Goals
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchGoals}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Assists
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchAssists}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : activeTab === 'fantasy' ? (

              <>
                <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Total Points
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {player.fantasyPoints || 0}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Avg Points/GW
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {player.fantasyAvgPoints || 0}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center col-span-2">
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
                <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Avg Rating
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {player.ratingAverage !== undefined && player.ratingAverage !== null && player.ratingAverage > 0 ? player.ratingAverage.toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* Matches played */}
                <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Matches Played
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {matchesCount}
                  </span>
                </div>

                {player.position === 'GK' ? (
                  <>
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Clean Sheets
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {getStat(player.cleanSheets, player.cupCleanSheets)}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
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
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Goals
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {getStat(player.goals, player.cupGoals)}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#9a3412] border border-[#f97316]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
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

