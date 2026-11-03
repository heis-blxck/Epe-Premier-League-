import { useNavigate, useSearchParams } from 'react-router-dom';
import { useURLModal } from '../hooks/useURLModal';
import React, { useState, useEffect } from 'react';
import { FantasySquad, Player, Team, Match, ManagerChips } from '../types';
import { Trophy, X, Shield, Star, Award, Zap, Sparkles, User, Flame, ChevronRight, Activity, ArrowUpRight, Crown } from 'lucide-react';
import { api } from '../services/api';
import { PlayerFantasyBreakdownModal } from './PlayerFantasyBreakdownModal';


interface ManagerSquadModalProps {
  allSquads: FantasySquad[];
  players: Player[];
  teams: Team[];
  matches: Match[];
  currentUserEmail: string;
}

export const ManagerSquadModal: React.FC<ManagerSquadModalProps> = ({
  allSquads,
  players,
  teams,
  matches,
  currentUserEmail
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openModal: openFantasyBreakdown } = useURLModal<{ playerId: string }>('fantasyBreakdown');
  const { isOpen, closeModal, modalData } = useURLModal<{ squadId?: string }>('managerSquad');
  
  const squad = allSquads.find(s => s.id === modalData?.squadId);
  
  // 1. Determine list of available Gameweeks / Matchdays
  const matchdaysFromMatches: number[] = Array.from(new Set<number>(matches.map(m => Number(m.matchday)).filter(m => !isNaN(m) && m > 0))).sort((a: number, b: number) => a - b);
  const availableGws = matchdaysFromMatches.length > 0 ? matchdaysFromMatches : Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Find latest/active matchday
  const activeMatch = matches.find(m => m.status === 'Live' || m.status === 'Half-Time' || m.status === 'Penalties');
  const completedMatchdays: number[] = Array.from(new Set<number>(matches.filter(m => m.status === 'Full-Time').map(m => Number(m.matchday)).filter(m => !isNaN(m) && m > 0)));
  const latestMatchday = activeMatch?.matchday || (completedMatchdays.length > 0 ? Math.max(...completedMatchdays) : 1);

  const [selectedGw, setSelectedGw] = useState<number>(latestMatchday);
  const [managerChips, setManagerChips] = useState<ManagerChips | null>(null);
  const [loadingChips, setLoadingChips] = useState<boolean>(true);
  

  

  // Mappings
  const playerMap = new Map<string, Player>(players.map(p => [p.id, p]));
  const teamMap = new Map<string, Team>(teams.map(t => [t.id, t]));

  // Global Rank Calculation
  const validSquads = allSquads.filter(s => s.id !== 'placeholder_init' && s.userEmail);
  const sortedSquads = [...validSquads].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  const globalRank = squad ? sortedSquads.findIndex(s => s.id === squad.id) + 1 : 0;

  // Fetch manager's chips data
  useEffect(() => {
    let isMounted = true;
    if (!squad) return;
    setLoadingChips(true);
    api.getManagerChips(squad?.userId || squad?.userEmail || '')
      .then(res => {
        if (isMounted) {
          setManagerChips(res);
          setLoadingChips(false);
        }
      })
      .catch(err => {
        console.error('Error fetching manager chips:', err);
        if (isMounted) setLoadingChips(false);
      });

    return () => { isMounted = false; };
  }, [squad?.userId, squad?.userEmail]);

  if (!isOpen || !modalData?.squadId || !squad) return null;

  // Determine active chip for the selected Gameweek
  let activeChipForGw: 'TC' | 'BB' | 'WC' | null = null;
  if (managerChips && squad) {
    if (managerChips.tripleCaptainUsedGw === selectedGw) activeChipForGw = 'TC';
    else if (managerChips.benchBoostUsedGw === selectedGw) activeChipForGw = 'BB';
    else if (managerChips.wildcardUsedGw === selectedGw) activeChipForGw = 'WC';
  }
  // Fallback if current GW matches squad active chip
  if (!activeChipForGw && selectedGw === latestMatchday && squad.activeChip) {
    activeChipForGw = squad.activeChip;
  }

  // Helper to calculate a player's individual points in selected Gameweek
  const getPlayerGwStats = (player: Player) => {
    const gwMatches = matches.filter(m => m.matchday === selectedGw && (m.homeTeamId === player.teamId || m.awayTeamId === player.teamId));
    if (gwMatches.length === 0) {
      // If no match found in GW or pre-season, fall back to an estimate or 0
      return { pts: 0, goals: 0, assists: 0, cleanSheet: false, played: false };
    }

    let totalPts = 0;
    let totalGoals = 0;
    let totalAssists = 0;
    let cleanSheet = false;
    let playedAny = false;

    gwMatches.forEach(m => {
      if (m.status === 'Scheduled') return;

      const isHome = m.homeTeamId === player.teamId;
      const goalsConceded = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      const events = m.events || [];

      // Check if played
      const lineup = isHome ? m.homeLineup : m.awayLineup;
      let played = false;
      if (lineup && lineup.starters && lineup.starters.length > 0) {
        played = lineup.starters.some(s => s.playerId === player.id) ||
                 Boolean(lineup.substitutes?.some(s => s.playerId === player.id && s.minutesPlayed && s.minutesPlayed > 0)) ||
                 events.some(e => e.playerId === player.id || e.subInPlayerId === player.id);
      } else {
        played = true; // Default match participation if match is live or completed
      }

      if (played) playedAny = true;

      let g = 0;
      let a = 0;
      let ownGoals = 0;
      let yellowCards = 0;
      let redCards = 0;
      events.forEach(e => {
        const typeStr = String(e.eventType || '');
        const isGoalEvent = typeStr === 'Goal' || typeStr === 'Penalty Goal' || typeStr === 'penalty' || typeStr === 'Own Goal';
        const isP = String(e.playerId) === String(player.id);
        const isA = String(e.assistPlayerId) === String(player.id) || String(e.assisterId) === String(player.id);

        if (isGoalEvent) {
          if ((e.goalType === 'own_goal' || typeStr === 'Own Goal') && isP) ownGoals++;
          else if (isP) g++;
          
          if (isA) a++;
        }
        if (typeStr === 'Yellow Card' && isP) yellowCards++;
        if (typeStr === 'Red Card' && isP) redCards++;
      });

      totalGoals += g;
      totalAssists += a;

      const cs = played && goalsConceded === 0 && (player.position === 'GK' || player.position === 'DEF');
      if (cs) cleanSheet = true;

      let pts = 0;
      if (played) pts += 2;
      
      if (player.position === 'GK' || player.position === 'DEF') {
        pts += g * 6 + (cs ? 4 : 0);
      } else if (player.position === 'MID') {
        pts += g * 5;
      } else {
        pts += g * 4;
      }
      pts += a * 3;

      // Strict BPS Projection (from Match Awards)
      let bps = 0;
      const p1 = m.fantasyBonus1stPlayerId || m.bonusPointsAllocations?.firstPlacePlayerId;
      const p2 = m.fantasyBonus2ndPlayerId || m.bonusPointsAllocations?.secondPlacePlayerId;
      const p3 = m.fantasyBonus3rdPlayerId || m.bonusPointsAllocations?.thirdPlacePlayerId;
      
      if (p1 === player.id) bps = 3;
      else if (p2 === player.id) bps = 2;
      else if (p3 === player.id) bps = 1;
      
      pts += bps;
      pts -= ownGoals * 2;
      pts -= yellowCards * 1;
      pts -= redCards * 3;

      totalPts += pts;
    });

    return { pts: totalPts, goals: totalGoals, assists: totalAssists, cleanSheet, played: playedAny };
  };

  // Organize squad into Starters and Bench
  const allSquadPlayerIds = squad.playerIds || [];
  const starterIds = squad.startingPlayerIds || allSquadPlayerIds.slice(0, 11);
  const benchIds = squad.benchPlayerIds || allSquadPlayerIds.filter(id => !starterIds.includes(id));

  const captainId = squad.captainPlayerId || starterIds[0];
  const viceCaptainId = squad.viceCaptainPlayerId || starterIds[1] || starterIds[0];

  const rawStarters = starterIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];
  const rawBench = benchIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];

  // Auto-Sub Logic for GW view
  let effectiveStarters = [...rawStarters];
  const startingGK = rawStarters.find(p => p.position === 'GK');
  const benchGK = rawBench.find(p => p.position === 'GK');

  const startingGKStats = startingGK ? getPlayerGwStats(startingGK) : null;
  const benchGKStats = benchGK ? getPlayerGwStats(benchGK) : null;

  if (startingGK && startingGKStats && !startingGKStats.played && benchGK && benchGKStats && benchGKStats.played) {
    effectiveStarters = effectiveStarters.map(p => p.id === startingGK.id ? benchGK : p);
  }

  // Outfield auto subs
  const benchOutfieldAvailable = rawBench.filter(p => p.position !== 'GK' && getPlayerGwStats(p).played);
  const nonPlayingOutfieldStarters = effectiveStarters.filter(p => p.position !== 'GK' && !getPlayerGwStats(p).played);

  nonPlayingOutfieldStarters.forEach(nonPlayer => {
    if (benchOutfieldAvailable.length > 0) {
      const subIn = benchOutfieldAvailable.shift();
      if (subIn) {
        effectiveStarters = effectiveStarters.map(p => p.id === nonPlayer.id ? subIn : p);
      }
    }
  });

  // Effective Captain logic
  const captStats = playerMap.get(captainId) ? getPlayerGwStats(playerMap.get(captainId)!) : null;
  const viceStats = playerMap.get(viceCaptainId) ? getPlayerGwStats(playerMap.get(viceCaptainId)!) : null;

  let effectiveCaptainId = captainId;
  if (captStats && !captStats.played && viceStats && viceStats.played) {
    effectiveCaptainId = viceCaptainId;
  }

  const captainMultiplier = activeChipForGw === 'TC' ? 3 : 2;

  // Calculate GW Total Points
  let calculatedGwPoints = 0;
  effectiveStarters.forEach(p => {
    const stats = getPlayerGwStats(p);
    let pPts = stats.pts;
    if (p.id === effectiveCaptainId) {
      pPts *= captainMultiplier;
    }
    calculatedGwPoints += pPts;
  });

  if (activeChipForGw === 'BB') {
    rawBench.forEach(p => {
      const stats = getPlayerGwStats(p);
      calculatedGwPoints += stats.pts;
    });
  }

  // Subtract GW point hits if latest GW matches squad hits or estimate
  const pointHitsThisGw = (selectedGw === latestMatchday ? (squad.pointHits || 0) : 0);
  calculatedGwPoints = Math.max(0, calculatedGwPoints - pointHitsThisGw);

  // Positional Grouping for Starters
  const gkStarters = effectiveStarters.filter(p => p.position === 'GK');
  const defStarters = effectiveStarters.filter(p => p.position === 'DEF');
  const midStarters = effectiveStarters.filter(p => p.position === 'MID');
  const fwdStarters = effectiveStarters.filter(p => p.position === 'FWD');

  const renderPlayerCard = (player: Player, isBench: boolean = false) => {
    const stats = getPlayerGwStats(player);
    const isCapt = player.id === captainId;
    const isVice = player.id === viceCaptainId;
    const isEffectiveCapt = player.id === effectiveCaptainId;
    const team = teamMap.get(player.teamId);

    let displayPts = stats.pts;
    if (isEffectiveCapt) {
      displayPts *= captainMultiplier;
    }

    return (
      <div 
        key={player.id} 
        onClick={() => openFantasyBreakdown({ playerId: player.id })}
        className={`relative flex flex-col items-center group transition-all transform hover:scale-105 cursor-pointer ${
          isBench ? 'w-20 sm:w-24' : 'w-22 sm:w-28'
        }`}
      >
        {/* Badges (Captain / Vice Captain) */}
        {isCapt && (
          <div className="absolute -top-2 -right-1 z-20 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg border border-slate-900 flex items-center gap-0.5">
            <span>C</span>
            {activeChipForGw === 'TC' && <span className="text-[8px] bg-rose-900 text-white px-1 rounded">3x</span>}
          </div>
        )}
        {!isCapt && isVice && (
          <div className="absolute -top-2 -right-1 z-20 bg-slate-300 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg border border-slate-900">
            V
          </div>
        )}

        {/* Player Image / Kit */}
        <div className={`relative rounded-2xl overflow-hidden border-2 shadow-xl bg-slate-950/80 ${
          isCapt ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700'
        } ${isBench ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-14 h-14 sm:w-16 sm:h-16'}`}>
          <img 
            src={player.photoUrl} 
            alt={player.name} 
            className="w-full h-full object-cover object-top filter brightness-105"
          />
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-0.5 text-center">
            <span className="text-[8px] font-black text-amber-300 uppercase tracking-widest">{team?.shortName || 'EPE'}</span>
          </div>
        </div>

        {/* Player Name Tag */}
        <div className="mt-1 w-full bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg py-1 px-1 text-center shadow-lg">
          <p className="text-[10px] sm:text-xs font-black text-white truncate px-1">{player.name}</p>
          
          <div className="flex items-center justify-center gap-1 mt-0.5">
            {/* Position */}
            <span className="text-[8px] font-extrabold text-slate-400 uppercase bg-slate-900 px-1 rounded border border-slate-800">
              {player.position}
            </span>

            {/* GW Points Pill */}
            <span className={`text-[10px] font-black px-1.5 rounded ${
              isEffectiveCapt ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-emerald-400'
            }`}>
              {displayPts} pts
            </span>
          </div>

          {/* Performance Mini Indicators */}
          {(stats.goals > 0 || stats.assists > 0 || stats.cleanSheet) && (
            <div className="flex items-center justify-center gap-1 mt-1 pt-1 border-t border-slate-800/80 text-[9px]">
              {stats.goals > 0 && <span title="Goals" className="text-amber-400">⚽{stats.goals > 1 ? stats.goals : ''}</span>}
              {stats.assists > 0 && <span title="Assists" className="text-cyan-400">🅰️{stats.assists > 1 ? stats.assists : ''}</span>}
              {stats.cleanSheet && <span title="Clean Sheet" className="text-emerald-400">🛡️</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-6 pt-safe pb-safe px-safe ios-scroll">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92dvh] overflow-y-auto shadow-2xl relative flex flex-col my-auto ios-scroll">
        
        {/* MODAL HEADER */}
        <div className="sticky top-0 z-30 bg-slate-950/95 border-b border-slate-800 p-4 sm:p-6 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#800020] to-rose-900 text-amber-300 flex items-center justify-center font-black text-lg shadow-lg border border-rose-800/50 shrink-0">
              {squad.userName ? squad.userName.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{squad.squadName}</h2>
                <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Global #{globalRank}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Manager: <strong className="text-slate-200">{squad.userName}</strong> ({squad.userEmail})
              </p>
            </div>
          </div>

          <button 
            onClick={closeModal}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 flex-1">
          
          {/* TOP HERO METRICS PANEL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Season Points</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">{squad.totalPoints || 0} <span className="text-xs font-normal text-slate-400">pts</span></span>
            </div>

            <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GW {selectedGw} Score</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">{calculatedGwPoints} <span className="text-xs font-normal text-slate-400">pts</span></span>
            </div>

            <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transfers Made</span>
              <span className="text-xl sm:text-2xl font-black text-white mt-1 block">{squad.transfersMade || 0}</span>
            </div>

            <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Point Hits</span>
              <span className="text-xl sm:text-2xl font-black text-rose-400 mt-1 block">-{squad.pointHits || 0} pts</span>
            </div>
          </div>

          {/* GAMEWEEK SELECTOR BAR */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                Select Gameweek View
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Viewing Squad & Points for Matchday {selectedGw}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {availableGws.map(gw => {
                const isSelected = gw === selectedGw;
                const isCurrent = gw === latestMatchday;
                return (
                  <button
                    key={gw}
                    onClick={() => setSelectedGw(gw)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>GW {gw}</span>
                    {isCurrent && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-amber-400/20 text-amber-400'}`}>
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE CHIP BANNER FOR SELECTED GAMEWEEK */}
          <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeChipForGw === 'TC' && (
                <div className="p-2.5 bg-amber-400/20 border border-amber-400/50 rounded-xl text-amber-300">
                  <Crown className="w-5 h-5 animate-pulse" />
                </div>
              )}
              {activeChipForGw === 'BB' && (
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300">
                  <Zap className="w-5 h-5 animate-bounce" />
                </div>
              )}
              {activeChipForGw === 'WC' && (
                <div className="p-2.5 bg-purple-500/20 border border-purple-500/50 rounded-xl text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
              {!activeChipForGw && (
                <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400">
                  <Shield className="w-5 h-5" />
                </div>
              )}

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  {activeChipForGw === 'TC' && '🔥 TRIPLE CAPTAIN CHIP ACTIVATED'}
                  {activeChipForGw === 'BB' && '⚡ BENCH BOOST CHIP ACTIVATED'}
                  {activeChipForGw === 'WC' && '🃏 WILDCARD CHIP ACTIVATED'}
                  {!activeChipForGw && 'STANDARD GAMEWEEK SETUP'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {activeChipForGw === 'TC' && `Captain points multiplied 3x in Gameweek ${selectedGw}!`}
                  {activeChipForGw === 'BB' && `All 4 bench players contribute points in Gameweek ${selectedGw}!`}
                  {activeChipForGw === 'WC' && `Unlimited free transfers applied for Gameweek ${selectedGw}.`}
                  {!activeChipForGw && `No special chip active in Gameweek ${selectedGw}.`}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              {activeChipForGw ? `${activeChipForGw} Active` : 'No Chip'}
            </span>
          </div>

          {/* TACTICAL PITCH VIEW (STARTING XI) */}
          <div className="relative rounded-3xl overflow-hidden border border-emerald-900/50 bg-gradient-to-b from-emerald-950 via-green-950 to-slate-950 p-4 sm:p-6 shadow-2xl">
            {/* Pitch Marking Overlays */}
            <div className="absolute inset-x-8 top-0 h-24 border-b-2 border-x-2 border-emerald-500/20 rounded-b-3xl pointer-events-none"></div>
            <div className="absolute inset-x-0 top-1/2 -mt-12 h-24 border-y-2 border-emerald-500/20 flex items-center justify-center pointer-events-none">
              <div className="w-28 h-28 border-2 border-emerald-500/20 rounded-full"></div>
            </div>

            <div className="relative z-10 space-y-6 sm:space-y-8">
              {/* GOALKEEPER */}
              <div className="flex justify-center items-center gap-4">
                {gkStarters.map(p => renderPlayerCard(p))}
              </div>

              {/* DEFENDERS */}
              <div className="flex justify-around items-center gap-2 sm:gap-4 max-w-2xl mx-auto">
                {defStarters.map(p => renderPlayerCard(p))}
              </div>

              {/* MIDFIELDERS */}
              <div className="flex justify-around items-center gap-2 sm:gap-4 max-w-2xl mx-auto">
                {midStarters.map(p => renderPlayerCard(p))}
              </div>

              {/* FORWARDS */}
              <div className="flex justify-around items-center gap-2 sm:gap-4 max-w-xl mx-auto">
                {fwdStarters.map(p => renderPlayerCard(p))}
              </div>
            </div>
          </div>

          {/* BENCH SECTION */}
          <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
            activeChipForGw === 'BB' 
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Substitutes Bench (Gameweek {selectedGw})
                </h3>
              </div>

              {activeChipForGw === 'BB' && (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 border border-emerald-500 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Zap className="w-3 h-3" /> Bench Points Added
                </span>
              )}
            </div>

            <div className="flex justify-around items-center gap-2 overflow-x-auto">
              {rawBench.map(p => renderPlayerCard(p, true))}
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between rounded-b-3xl">
          <div className="text-xs text-slate-400">
            Manager ID: <span className="font-mono text-slate-200">{squad.userId || squad.userEmail}</span>
          </div>

          <button
            onClick={closeModal}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>

      <PlayerFantasyBreakdownModal players={players} matches={matches} selectedGw={selectedGw} />
    </div>
  );
};
