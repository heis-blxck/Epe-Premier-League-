import React, { useState } from 'react';
import { Match, MatchEvent } from '../types';
import { Pitch2D } from './Pitch2D';
import { X, Clock, Award, Star, Activity, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { formatMatchDisplayTime } from '../utils/matchClock';

interface MatchDetailModalProps {
  match: Match;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, onClose }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'lineups' | 'ratings' | 'stats'>('timeline');
  const [selectedTeamLineup, setSelectedTeamLineup] = useState<'home' | 'away'>('home');

  const isLive = match.status === 'Live';
  const isFullTime = match.status === 'Full-Time';

  // Find Man of the Match (Highest rating)
  let motmPlayerId: string | null = null;
  let highestRating = 0;
  if (match.ratings) {
    Object.entries(match.ratings).forEach(([pId, rating]) => {
      const numRating = typeof rating === 'number' ? rating : Number(rating);
      if (numRating > highestRating) {
        highestRating = numRating;
        motmPlayerId = pId;
      }
    });
  }

  // Combine player names from lineups
  const allLineupPlayers = [
    ...(match.homeLineup?.startingXI || []),
    ...(match.homeLineup?.substitutes || []),
    ...(match.awayLineup?.startingXI || []),
    ...(match.awayLineup?.substitutes || [])
  ];

  const getPlayerName = (pId: string, fallback?: string) => {
    const found = allLineupPlayers.find(p => p.playerId === pId);
    return found ? found.name : (fallback || 'Player');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-800 my-auto animate-in fade-in zoom-in duration-200 text-slate-100">
        {/* Top Header & Scoreboard Banner */}
        <div className="bg-gradient-to-br from-[#800020] via-rose-950 to-slate-950 text-white p-4 sm:p-6 relative border-b border-rose-900/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white transition-colors cursor-pointer border border-rose-800/60"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center max-w-xl mx-auto space-y-4">
            {/* Status Pill */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold text-rose-200/80 uppercase tracking-wider">
                Epe Premier League &bull; Matchday {match.matchday}
              </span>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                formatMatchDisplayTime(match.matchMinute, match.period, match.stoppageTime1stHalf, match.stoppageTime2ndHalf).badgeColor
              }`}>
                {formatMatchDisplayTime(match.matchMinute, match.period, match.stoppageTime1stHalf, match.stoppageTime2ndHalf).displayString}
              </span>
            </div>

            {/* Scoreboard Grid */}
            <div className="grid grid-cols-3 items-center">
              {/* Home */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={match.homeTeam?.logoUrl}
                  alt={match.homeTeam?.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg bg-white/10"
                />
                <h3 className="font-extrabold text-sm sm:text-lg text-white">
                  {match.homeTeam?.name}
                </h3>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center">
                <div className="text-4xl sm:text-6xl font-black text-amber-300 font-mono tracking-wider bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                  {match.homeScore} - {match.awayScore}
                </div>
                <span className="text-xs text-rose-200/80 font-medium mt-2">
                  {match.venue}
                </span>
              </div>

              {/* Away */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={match.awayTeam?.logoUrl}
                  alt={match.awayTeam?.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg bg-white/10"
                />
                <h3 className="font-extrabold text-sm sm:text-lg text-white">
                  {match.awayTeam?.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Modal Tabs */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 pt-4 border-t border-rose-800/50">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-[#800020] shadow-md'
                  : 'text-rose-100 hover:bg-white/10'
              }`}
            >
              Timeline
            </button>

            <button
              onClick={() => setActiveTab('lineups')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'lineups'
                  ? 'bg-white text-[#800020] shadow-md'
                  : 'text-rose-100 hover:bg-white/10'
              }`}
            >
              Lineups & Formations
            </button>

            <button
              onClick={() => setActiveTab('ratings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'ratings'
                  ? 'bg-white text-[#800020] shadow-md'
                  : 'text-rose-100 hover:bg-white/10'
              }`}
            >
              Live Ratings
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'stats'
                  ? 'bg-white text-[#800020] shadow-md'
                  : 'text-rose-100 hover:bg-white/10'
              }`}
            >
              Match Stats
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-4">
                Match Events Timeline
              </h4>

              {!match.events || match.events.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium text-sm">
                  No match events recorded yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-32 space-y-6">
                  {match.events.map((evt: MatchEvent) => {
                    const isHomeEvent = evt.teamId === match.homeTeamId;

                    return (
                      <div key={evt.id} className="relative pl-6 flex items-start gap-3">
                        {/* Minute Bubble */}
                        <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-[#800020] text-amber-300 font-extrabold text-[11px] flex items-center justify-center border-2 border-white shadow-md">
                          {evt.minute}'
                        </div>

                        {/* Event Card */}
                        <div className={`p-3 rounded-2xl border w-full text-xs font-medium ${
                          isHomeEvent
                            ? 'bg-rose-950/40 border-rose-800 text-slate-100'
                            : 'bg-slate-950/80 border-slate-800 text-slate-100'
                        }`}>
                          <div className="flex items-center justify-between font-bold text-sm">
                            <span className="flex items-center gap-2">
                              {evt.eventType === 'Goal' && '⚽'}
                              {evt.eventType === 'Penalty Goal' && '⚽ (P)'}
                              {evt.eventType === 'Yellow Card' && '🟨'}
                              {evt.eventType === 'Red Card' && '🟥'}
                              {evt.eventType === 'Sub' && '🔄'}
                              <span>{evt.playerName || getPlayerName(evt.playerId)}</span>
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {isHomeEvent ? match.homeTeam?.shortName : match.awayTeam?.shortName}
                            </span>
                          </div>

                          {/* Detail text */}
                          {evt.assisterName && (
                            <p className="text-slate-300 mt-1">
                              Assist: <span className="font-bold text-amber-300">{evt.assisterName}</span>
                            </p>
                          )}
                          {evt.detail && (
                            <p className="text-slate-400 italic mt-0.5">{evt.detail}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LINEUPS & FORMATION */}
          {activeTab === 'lineups' && (
            <div className="space-y-4">
              {/* Selector for Home vs Away Pitch view */}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => setSelectedTeamLineup('home')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTeamLineup === 'home'
                      ? 'bg-[#800020] text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {match.homeTeam?.name} Lineup
                </button>
                <button
                  onClick={() => setSelectedTeamLineup('away')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTeamLineup === 'away'
                      ? 'bg-[#800020] text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {match.awayTeam?.name} Lineup
                </button>
              </div>

              {selectedTeamLineup === 'home' ? (
                <Pitch2D
                  lineup={match.homeLineup}
                  teamName={match.homeTeam?.name}
                  ratings={match.ratings}
                />
              ) : (
                <Pitch2D
                  lineup={match.awayLineup}
                  teamName={match.awayTeam?.name}
                  ratings={match.ratings}
                />
              )}
            </div>
          )}

          {/* TAB 3: LIVE RATINGS */}
          {activeTab === 'ratings' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Player Performance Ratings (Out of 10.0)
                </h4>
                {motmPlayerId && (
                  <div className="flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-extrabold">
                    <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>MOTM: {getPlayerName(motmPlayerId)} ({highestRating.toFixed(1)})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Ratings */}
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <h5 className="font-black text-sm text-amber-300 border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
                    <span>{match.homeTeam?.name} Ratings</span>
                  </h5>
                  {match.homeLineup?.startingXI.map(p => {
                    const r = match.ratings?.[p.playerId] || p.rating || 6.5;
                    const isMotm = p.playerId === motmPlayerId;
                    return (
                      <div key={p.playerId} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 font-bold w-5">#{p.number}</span>
                          <span className="font-bold text-slate-200">{p.name}</span>
                          {isMotm && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        </div>
                        <span className={`font-black px-2 py-0.5 rounded-md ${
                          r >= 8.0 ? 'bg-emerald-500 text-white' : r >= 7.0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {r.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Away Ratings */}
                <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <h5 className="font-black text-sm text-amber-300 border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
                    <span>{match.awayTeam?.name} Ratings</span>
                  </h5>
                  {match.awayLineup?.startingXI.map(p => {
                    const r = match.ratings?.[p.playerId] || p.rating || 6.5;
                    const isMotm = p.playerId === motmPlayerId;
                    return (
                      <div key={p.playerId} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 font-bold w-5">#{p.number}</span>
                          <span className="font-bold text-slate-200">{p.name}</span>
                          {isMotm && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        </div>
                        <span className={`font-black px-2 py-0.5 rounded-md ${
                          r >= 8.0 ? 'bg-emerald-500 text-white' : r >= 7.0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {r.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MATCH STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 max-w-xl mx-auto py-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Detailed Match Statistics
              </h4>

              {match.stats ? (
                <div className="space-y-4">
                  {/* Possession */}
                  <div>
                    <div className="flex justify-between text-xs font-black text-slate-800 mb-1">
                      <span>{match.stats.homePossession}%</span>
                      <span className="text-slate-500 font-bold">Possession</span>
                      <span>{match.stats.awayPossession}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${match.stats.homePossession}%` }} className="bg-[#800020]"></div>
                      <div style={{ width: `${match.stats.awayPossession}%` }} className="bg-slate-400"></div>
                    </div>
                  </div>

                  {/* Total Shots */}
                  <div>
                    <div className="flex justify-between text-xs font-black text-slate-800 mb-1">
                      <span>{match.stats.homeShots}</span>
                      <span className="text-slate-500 font-bold">Total Shots</span>
                      <span>{match.stats.awayShots}</span>
                    </div>
                  </div>

                  {/* Shots on Target */}
                  <div>
                    <div className="flex justify-between text-xs font-black text-slate-800 mb-1">
                      <span>{match.stats.homeShotsOnTarget}</span>
                      <span className="text-slate-500 font-bold">Shots on Target</span>
                      <span>{match.stats.awayShotsOnTarget}</span>
                    </div>
                  </div>

                  {/* Corners */}
                  <div>
                    <div className="flex justify-between text-xs font-black text-slate-800 mb-1">
                      <span>{match.stats.homeCorners}</span>
                      <span className="text-slate-500 font-bold">Corners</span>
                      <span>{match.stats.awayCorners}</span>
                    </div>
                  </div>

                  {/* Fouls */}
                  <div>
                    <div className="flex justify-between text-xs font-black text-slate-800 mb-1">
                      <span>{match.stats.homeFouls}</span>
                      <span className="text-slate-500 font-bold">Fouls</span>
                      <span>{match.stats.awayFouls}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  Match statistics will be available once play commences.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
