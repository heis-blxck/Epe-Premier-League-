import React, { useState } from 'react';
import { Match, MatchLineup, LineupPlayer, MatchEvent, Player, Team } from '../types';
import { User, Shield, Star, Award, ArrowRightLeft, Globe, Calendar, DollarSign, Ruler, Sparkles, Trophy } from 'lucide-react';

export type LineupFilterType = 'market_value' | 'fantasy_pts';

export interface Pitch2DProps {
  match?: Match;
  lineup?: MatchLineup;
  teamName?: string;
  ratings?: Record<string, number>;
  events?: MatchEvent[];
  players?: Player[];
  team?: Team;
  homeTeam?: Team;
  awayTeam?: Team;
  selectedTeamSide?: 'home' | 'away';
  onTeamChange?: (side: 'home' | 'away') => void;
  onPlayerClick?: (player: LineupPlayer | Player) => void;
}

// Map tactical position tags to base grid coordinate offsets on a 0-100 percentage scale
const BASE_TACTICAL_POSITIONS: Record<string, { y: number; minX: number; maxX: number; defaultX: number }> = {
  GK:  { y: 90, minX: 50, maxX: 50, defaultX: 50 },
  LB:  { y: 74, minX: 14, maxX: 14, defaultX: 14 },
  CB:  { y: 76, minX: 30, maxX: 70, defaultX: 50 },
  RB:  { y: 74, minX: 86, maxX: 86, defaultX: 86 },
  DM:  { y: 62, minX: 35, maxX: 65, defaultX: 50 },
  LM:  { y: 48, minX: 14, maxX: 14, defaultX: 14 },
  CM:  { y: 50, minX: 28, maxX: 72, defaultX: 50 },
  RM:  { y: 48, minX: 86, maxX: 86, defaultX: 86 },
  CAM: { y: 35, minX: 30, maxX: 70, defaultX: 50 },
  LW:  { y: 22, minX: 18, maxX: 18, defaultX: 18 },
  RW:  { y: 22, minX: 82, maxX: 82, defaultX: 82 },
  ST:  { y: 18, minX: 35, maxX: 65, defaultX: 50 },

  // Generic fallbacks
  DEF: { y: 75, minX: 25, maxX: 75, defaultX: 50 },
  MID: { y: 50, minX: 25, maxX: 75, defaultX: 50 },
  FWD: { y: 20, minX: 25, maxX: 75, defaultX: 50 }
};

// Fallback formation coordinates index map
const getFormationCoordinates = (formation: string = '4-3-3') => {
  switch (formation) {
    case '4-4-2':
      return [
        { x: 50, y: 90 }, // GK
        { x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 }, // DEF
        { x: 15, y: 45 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 45 }, // MID
        { x: 35, y: 20 }, { x: 65, y: 20 } // FWD
      ];
    case '4-2-3-1':
      return [
        { x: 50, y: 90 }, // GK
        { x: 15, y: 72 }, { x: 38, y: 74 }, { x: 62, y: 74 }, { x: 85, y: 72 }, // DEF
        { x: 35, y: 55 }, { x: 65, y: 55 }, // DM
        { x: 20, y: 35 }, { x: 50, y: 33 }, { x: 80, y: 35 }, // AM
        { x: 50, y: 15 } // ST
      ];
    case '3-5-2':
      return [
        { x: 50, y: 90 }, // GK
        { x: 25, y: 74 }, { x: 50, y: 76 }, { x: 75, y: 74 }, // CB
        { x: 10, y: 48 }, { x: 32, y: 52 }, { x: 50, y: 50 }, { x: 68, y: 52 }, { x: 90, y: 48 }, // MID
        { x: 35, y: 20 }, { x: 65, y: 20 } // FWD
      ];
    case '3-4-3':
      return [
        { x: 50, y: 90 }, // GK
        { x: 25, y: 74 }, { x: 50, y: 76 }, { x: 75, y: 74 }, // CB
        { x: 15, y: 50 }, { x: 38, y: 52 }, { x: 62, y: 52 }, { x: 85, y: 50 }, // MID
        { x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 } // FWD
      ];
    case '4-3-3':
    default:
      return [
        { x: 50, y: 90 }, // GK
        { x: 15, y: 72 }, { x: 38, y: 74 }, { x: 62, y: 74 }, { x: 85, y: 72 }, // DEF
        { x: 25, y: 48 }, { x: 50, y: 52 }, { x: 75, y: 48 }, // MID
        { x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 } // FWD
      ];
  }
};

const calculateLineupCoordinates = (startingXI: LineupPlayer[], formation: string) => {
  const formationCoords = getFormationCoordinates(formation);
  const result: { x: number; y: number }[] = [];

  // Group players by position tag
  const groups: Record<string, number[]> = {};
  startingXI.slice(0, 11).forEach((player, idx) => {
    const rawPos = (player.position || '').toUpperCase();
    const posTag = BASE_TACTICAL_POSITIONS[rawPos] ? rawPos : 'CM';
    if (!groups[posTag]) groups[posTag] = [];
    groups[posTag].push(idx);
  });

  const assignedCoords: Record<number, { x: number; y: number }> = {};

  Object.entries(groups).forEach(([posTag, indices]) => {
    const base = BASE_TACTICAL_POSITIONS[posTag] || BASE_TACTICAL_POSITIONS.CM;
    const count = indices.length;

    indices.forEach((playerIdx, i) => {
      let x = base.defaultX;
      if (count > 1 && base.minX !== base.maxX) {
        x = base.minX + (i / (count - 1)) * (base.maxX - base.minX);
      }
      assignedCoords[playerIdx] = { x, y: base.y };
    });
  });

  startingXI.slice(0, 11).forEach((_, idx) => {
    result.push(assignedCoords[idx] || formationCoords[idx] || { x: 50, y: 50 });
  });

  return result;
};

// Rating color badge helper
const getRatingBadgeStyle = (rating?: number) => {
  if (rating === undefined || rating <= 0) {
    return 'bg-slate-800 text-slate-300 border-slate-600';
  }
  if (rating >= 8.0) {
    return 'bg-emerald-500 text-white font-black border-emerald-300 shadow-md ring-2 ring-emerald-400/40';
  }
  if (rating >= 7.0) {
    return 'bg-emerald-600 text-white font-bold border-emerald-400 ring-1 ring-emerald-500/30';
  }
  if (rating >= 6.5) {
    return 'bg-amber-400 text-slate-950 font-bold border-amber-200 ring-1 ring-amber-400/30';
  }
  if (rating >= 6.0) {
    return 'bg-orange-500 text-white font-bold border-orange-300 ring-1 ring-orange-400/30';
  }
  return 'bg-rose-600 text-white font-bold border-rose-300 ring-1 ring-rose-400/30';
};

export const Pitch2D: React.FC<Pitch2DProps> = ({
  match,
  lineup: directLineup,
  teamName: directTeamName,
  ratings: directRatings,
  events: directEvents,
  players = [],
  team: directTeam,
  homeTeam: propHomeTeam,
  awayTeam: propAwayTeam,
  selectedTeamSide: propSelectedTeamSide,
  onTeamChange,
  onPlayerClick
}) => {
  const [internalTeamSide, setInternalTeamSide] = useState<'home' | 'away'>('home');
  const [activeFilter, setActiveFilter] = useState<LineupFilterType>('fantasy_pts');

  const teamSide = propSelectedTeamSide || internalTeamSide;
  const handleTeamToggle = (side: 'home' | 'away') => {
    setInternalTeamSide(side);
    if (onTeamChange) onTeamChange(side);
  };

  // Derive home & away teams
  const homeTeam = match?.homeTeam || propHomeTeam;
  const awayTeam = match?.awayTeam || propAwayTeam;

  // Active lineup derivation
  let activeLineup: MatchLineup | undefined;
  let activeTeam: Team | undefined;
  let activeTeamName = directTeamName || 'Team';

  if (match) {
    activeLineup = teamSide === 'home' ? match.homeLineup : match.awayLineup;
    activeTeam = teamSide === 'home' ? match.homeTeam : match.awayTeam;
    activeTeamName = activeTeam?.name || (teamSide === 'home' ? 'Home Team' : 'Away Team');
  } else {
    activeLineup = directLineup;
    activeTeam = directTeam;
  }

  const matchRatings = match?.ratings || directRatings || {};
  const matchEvents = match?.events || directEvents || [];

  // Helper to find full player record
  const getFullPlayer = (pId: string, name?: string) => {
    return players.find(p => p.id === pId || (name && p.name.toLowerCase() === name.toLowerCase()));
  };

  // Helper for filter attribute string
  const renderFilterValue = (lp: LineupPlayer, r?: number) => {
    const fullP = getFullPlayer(lp.playerId, lp.name);
    
    switch (activeFilter) {
      case 'market_value':
        return fullP?.price ? `₦${fullP.price}M` : '₦8.5M';
      case 'fantasy_pts':
        return fullP?.fantasyPoints ? `${fullP.fantasyPoints} pts` : '0 pts';
      case 'performance':
      default:
        return r && r > 0 ? `⭐ ${r.toFixed(1)}` : '⭐ 6.5';
    }
  };

  if (!activeLineup || !activeLineup.startingXI || activeLineup.startingXI.length === 0) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* Team Selector Header */}
        {match && (
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => handleTeamToggle('home')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                teamSide === 'home'
                  ? 'bg-[#800020] text-white shadow-lg border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {homeTeam?.logoUrl && <img src={homeTeam.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />}
              <span>{homeTeam?.shortName || homeTeam?.name || 'Home'}</span>
            </button>
            <button
              onClick={() => handleTeamToggle('away')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                teamSide === 'away'
                  ? 'bg-[#800020] text-white shadow-lg border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {awayTeam?.logoUrl && <img src={awayTeam.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />}
              <span>{awayTeam?.shortName || awayTeam?.name || 'Away'}</span>
            </button>
          </div>
        )}

        <div className="bg-slate-950/90 rounded-3xl p-8 text-center border border-slate-800 text-slate-300 space-y-2">
          <User className="w-12 h-12 mx-auto mb-2 text-amber-400 opacity-60" />
          <h4 className="font-extrabold text-sm text-white">Lineups not confirmed yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Official confirmed starting XI and tactical formations will be published closer to kickoff.
          </p>
        </div>
      </div>
    );
  }

  const coords = calculateLineupCoordinates(activeLineup.startingXI, activeLineup.formation || '4-3-3');
  const teamEvents = matchEvents.filter(e => e.teamId === activeTeam?.id || (match && ((teamSide === 'home' && e.teamId === match.homeTeamId) || (teamSide === 'away' && e.teamId === match.awayTeamId))));
  const subEvents = teamEvents.filter(e => e.eventType === 'Sub');

  return (
    <div className="space-y-5 max-w-3xl mx-auto text-slate-100">
      
      {/* 1. TEAM TOGGLE & FILTER HEADER */}
      <div className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        
        {/* Team Selector Switch */}
        {match && (
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTeamToggle('home')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                teamSide === 'home'
                  ? 'bg-gradient-to-r from-[#800020] via-[#881337] to-[#FBB931] text-slate-950 shadow-lg border border-[#FFE3B3]/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <img src={homeTeam?.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0" />
              <span className="truncate">{homeTeam?.shortName || homeTeam?.name}</span>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-md font-mono text-white/80 font-bold shrink-0">
                {match.homeLineup?.formation || '4-3-3'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTeamToggle('away')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                teamSide === 'away'
                  ? 'bg-gradient-to-r from-[#800020] via-[#881337] to-[#FBB931] text-slate-950 shadow-lg border border-[#FFE3B3]/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <img src={awayTeam?.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0" />
              <span className="truncate">{awayTeam?.shortName || awayTeam?.name}</span>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-md font-mono text-white/80 font-bold shrink-0">
                {match.awayLineup?.formation || '4-3-3'}
              </span>
            </button>
          </div>
        )}

        {/* Horizontal Attribute Filter Bar (Sofascore Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest mr-1 shrink-0 font-extrabold">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setActiveFilter('market_value')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeFilter === 'market_value'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Market Value</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('fantasy_pts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeFilter === 'fantasy_pts'
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Fantasy Pts</span>
          </button>

        </div>
      </div>

      {/* 2. THE 2D PITCH FORMATION VIEW */}
      <div className="space-y-3">
        {/* Banner Header */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-md">
          <div className="flex items-center gap-2.5">
            {activeTeam?.logoUrl && (
              <img src={activeTeam.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-white/20" />
            )}
            <span className="font-black text-sm text-white">{activeTeamName}</span>
          </div>

          <div className="bg-[#800020] text-amber-300 px-4 py-1.5 rounded-xl flex flex-col items-center justify-center border border-amber-400/30">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">
              Formation
            </span>
            <span className="text-sm font-black leading-none">
              {activeLineup.formation || '4-3-3'}
            </span>
          </div>
        </div>

        {/* 2D Pitch Graphic Canvas */}
        <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] max-w-2xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900 border-4 border-emerald-950 shadow-2xl p-2 sm:p-4 select-none">
          
          {/* Pitch Markings SVG */}
          <svg
            className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
            viewBox="0 0 100 130"
            preserveAspectRatio="none"
          >
            <rect x="2" y="2" width="96" height="126" fill="none" stroke="white" strokeWidth="1" />
            <line x1="2" y1="65" x2="98" y2="65" stroke="white" strokeWidth="1" />
            <circle cx="50" cy="65" r="16" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="50" cy="65" r="1" fill="white" />
            
            <rect x="25" y="2" width="50" height="22" fill="none" stroke="white" strokeWidth="1" />
            <rect x="36" y="2" width="28" height="8" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="50" cy="16" r="1" fill="white" />

            <rect x="25" y="106" width="50" height="22" fill="none" stroke="white" strokeWidth="1" />
            <rect x="36" y="120" width="28" height="8" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="50" cy="114" r="1" fill="white" />
          </svg>

          {/* Starting XI Player Nodes */}
          <div className="relative w-full h-full">
            {activeLineup.startingXI.slice(0, 11).map((player, idx) => {
              const pos = coords[idx] || { x: 50, y: 50 };
              const playerRating = matchRatings[player.playerId] || player.rating;
              const fullPlayer = getFullPlayer(player.playerId, player.name);

              // Derive match events for player
              const isGoal = (e: any) => {
                const t = String(e.eventType || '');
                return (t === 'Goal' || t === 'Penalty Goal' || t === 'penalty') && e.goalType !== 'own_goal';
              };
              const playerGoals = teamEvents.filter(e => String(e.playerId) === String(player.playerId) && isGoal(e)).length;
              const playerAssists = teamEvents.filter(e => (String(e.assisterId) === String(player.playerId) || String((e as any).assistPlayerId) === String(player.playerId)) && isGoal(e)).length;
              const hasYellowCard = teamEvents.some(e => String(e.playerId) === String(player.playerId) && String(e.eventType) === 'Yellow Card');
              const hasRedCard = teamEvents.some(e => String(e.playerId) === String(player.playerId) && String(e.eventType) === 'Red Card');
              const subOutEvt = teamEvents.find(e => String(e.playerId) === String(player.playerId) && String(e.eventType) === 'Sub');

              return (
                <div
                  key={player.playerId || idx}
                  onClick={() => onPlayerClick && onPlayerClick(fullPlayer || player)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10 hover:scale-110 transition-transform"
                >
                  {/* Floating Rating Badge */}
                  {playerRating !== undefined && playerRating > 0 && (
                    <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full mb-0.5 border shadow-md font-mono ${getRatingBadgeStyle(playerRating)}`}>
                      {playerRating.toFixed(1)}
                    </span>
                  )}

                  {/* Node Avatar / Kit */}
                  <div className="relative">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center overflow-hidden font-black text-xs sm:text-sm shadow-2xl border-2 transition-all relative ${
                      player.position === 'GK'
                        ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-500/50'
                        : 'bg-[#800020] text-white border-white ring-2 ring-[#800020]/50'
                    }`}>
                      {fullPlayer?.photoUrl ? (
                        <img src={fullPlayer.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{player.number}</span>
                      )}
                    </div>

                    {/* Captain Badge */}
                    {player.isCaptain && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-black shadow">
                        C
                      </span>
                    )}

                    {/* Sub Out Indicator */}
                    {subOutEvt && (
                      <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white font-black text-[9px] px-1 rounded-full flex items-center gap-0.5 border border-black shadow">
                        🔴 {subOutEvt.minute}'
                      </span>
                    )}

                    {/* Card Badges */}
                    {hasRedCard ? (
                      <span className="absolute -top-1 -left-1 text-xs select-none">🟥</span>
                    ) : hasYellowCard ? (
                      <span className="absolute -top-1 -left-1 text-xs select-none">🟨</span>
                    ) : null}

                    {/* Goal & Assist Badges */}
                    {playerGoals > 0 && (
                      <span className="absolute -bottom-1 -left-1 bg-black/80 text-white text-[9px] font-bold px-1 rounded-full border border-amber-400 flex items-center">
                        ⚽{playerGoals > 1 ? playerGoals : ''}
                      </span>
                    )}
                    {playerAssists > 0 && playerGoals === 0 && (
                      <span className="absolute -bottom-1 -left-1 bg-black/80 text-amber-300 text-[9px] font-bold px-1 rounded-full border border-slate-700 flex items-center">
                        🅰️
                      </span>
                    )}
                  </div>

                  {/* Name & Selected Attribute Pill */}
                  <div className="bg-slate-950/95 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-lg border border-slate-700/80 mt-1 max-w-[110px] truncate text-center shadow-lg group-hover:bg-[#800020] group-hover:border-amber-400 flex flex-col items-center justify-center">
                    <span className="truncate">{player.name.split(' ').pop()}</span>
                    <span className="text-[9px] text-amber-300 font-mono font-bold">
                      {renderFilterValue(player, playerRating)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. SUBSTITUTIONS & BENCH LIST VIEW */}
      <div className="space-y-4 pt-2">
        
        {/* Head Coach / Manager Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {activeTeam?.coachPhotoUrl ? (
                <img src={activeTeam.coachPhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-white">{activeTeam?.coach || 'Manager Unassigned'}</h4>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Head Coach
                </span>
              </div>
              <p className="text-xs text-slate-400">{activeTeamName}</p>
            </div>
          </div>

          {activeTeam?.logoUrl && (
            <img src={activeTeam.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
          )}
        </div>

        {/* Substitutions Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Match Substitutions ({subEvents.length})</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">In / Out Logs</span>
          </div>

          {subEvents.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2 text-center">
              No substitutions logged for this team yet.
            </div>
          ) : (
            <div className="space-y-2">
              {subEvents.map((subEvt) => {
                const subInName = subEvt.subInPlayerName || 'Sub In Player';
                const subOutName = subEvt.playerName || 'Sub Out Player';
                const subInRating = matchRatings[subEvt.subInPlayerId || ''];
                const subOutRating = matchRatings[subEvt.playerId || ''];

                return (
                  <div key={subEvt.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-amber-400 text-sm bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/20 shrink-0">
                        {subEvt.minute}'
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <span>🟢 IN:</span>
                          <span className="text-white font-extrabold">{subInName}</span>
                          {subInRating !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${getRatingBadgeStyle(subInRating)}`}>
                              {subInRating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                          <span>🔴 OUT:</span>
                          <span className="text-slate-300 font-semibold">{subOutName}</span>
                          {subOutRating !== undefined && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${getRatingBadgeStyle(subOutRating)}`}>
                              {subOutRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-lg">🔄</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Substitutes Bench & Reserves List */}
        {activeLineup.substitutes && activeLineup.substitutes.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Bench & Reserves Squad ({activeLineup.substitutes.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400">Click to view profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeLineup.substitutes.map((sub) => {
                const subRating = matchRatings[sub.playerId] || sub.rating;
                const fullSub = getFullPlayer(sub.playerId, sub.name);
                const isSubbedOn = subEvents.some(e => e.subInPlayerId === sub.playerId);

                return (
                  <div
                    key={sub.playerId}
                    onClick={() => onPlayerClick && onPlayerClick(fullSub || sub)}
                    className="bg-slate-950 hover:bg-slate-800/80 p-2.5 rounded-xl border border-slate-800 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-extrabold text-amber-300 shrink-0 overflow-hidden">
                        {fullSub?.photoUrl ? (
                          <img src={fullSub.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>#{sub.number}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate group-hover:text-amber-300">
                            {sub.name}
                          </span>
                          <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-slate-300 font-bold">
                            {sub.position}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 font-medium">
                          {isSubbedOn ? (
                            <span className="text-emerald-400 font-bold">🟢 Subbed On</span>
                          ) : (
                            <span>Unused Substitute &bull; {renderFilterValue(sub, subRating)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {subRating !== undefined && subRating > 0 && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${getRatingBadgeStyle(subRating)}`}>
                        {subRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
