import React, { useState, useEffect, useMemo } from 'react';
import { Match, UserAccount, PredictorLeaderboardEntry } from '../types';
import { api } from '../services/api';
import { TeamLogo } from './TeamLogo';
import { 
  Trophy, Lock, CheckCircle, Save, Check, Calendar, Clock, AlertCircle, Sparkles,
  Medal, Star, Award, ChevronDown, ChevronUp, User, RefreshCw, Info, HelpCircle
} from 'lucide-react';

interface MatchdayPredictorProps {
  matches: Match[];
  currentUser: UserAccount | null;
  onShowToast?: (msg: string) => void;
  onOpenAuthDeck?: () => void;
  className?: string;
  defaultTab?: 'predict' | 'leaderboard';
}

export const MatchdayPredictor: React.FC<MatchdayPredictorProps> = ({
  matches = [],
  currentUser,
  onShowToast,
  onOpenAuthDeck,
  className = "",
  defaultTab = 'predict'
}) => {
  // Tabs: 'predict' (fixtures predictions) or 'leaderboard'
  const [activeTab, setActiveTab] = useState<'predict' | 'leaderboard'>(defaultTab);

  // Score predictions state: matchId -> { homeScore: number | ''; awayScore: number | '' }
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number | ''; awayScore: number | '' }>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<PredictorLeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Filter upcoming matches
  const upcomingMatches = useMemo(() => {
    return matches.filter(m => m.status === 'Scheduled');
  }, [matches]);

  // Check if kickoff time has passed for a match
  const isMatchLocked = (match: Match): boolean => {
    if (match.status !== 'Scheduled') return true;
    if (!match.date) return false;
    
    // Parse date and time
    const dateStr = match.date.includes('T') ? match.date.split('T')[0] : match.date;
    const timeStr = match.time || '00:00';
    const kickoff = new Date(`${dateStr}T${timeStr}`);
    
    // Disable if kickoff time has passed
    return !isNaN(kickoff.getTime()) && kickoff < new Date();
  };

  // Load existing predictions for user
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const fetchUserPredictions = async () => {
      try {
        const userPreds = await api.getScorePredictions(currentUser.id);
        const initialMap: Record<string, { homeScore: number | ''; awayScore: number | '' }> = {};
        const statusMap: Record<string, boolean> = {};

        userPreds.forEach(p => {
          initialMap[p.matchId] = {
            homeScore: p.homeScore,
            awayScore: p.awayScore
          };
          statusMap[p.matchId] = true;
        });

        setPredictions(prev => ({ ...prev, ...initialMap }));
        setSavedStatus(prev => ({ ...prev, ...statusMap }));
      } catch {
        // Fallback gracefully
      }
    };

    fetchUserPredictions();
  }, [currentUser?.id]);

  // Load leaderboard data
  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await api.getPredictorLeaderboard();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleScoreChange = (matchId: string, team: 'home' | 'away', val: string) => {
    const numVal = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        homeScore: team === 'home' ? numVal : (prev[matchId]?.homeScore ?? ''),
        awayScore: team === 'away' ? numVal : (prev[matchId]?.awayScore ?? '')
      }
    }));
    // Clear saved status on change
    setSavedStatus(prev => ({ ...prev, [matchId]: false }));
  };

  const handleSavePrediction = async (match: Match) => {
    if (!currentUser) {
      if (onOpenAuthDeck) onOpenAuthDeck();
      else if (onShowToast) onShowToast('Please log in to save your score predictions');
      return;
    }

    const matchPred = predictions[match.id];
    if (matchPred?.homeScore === '' || matchPred?.awayScore === '' || matchPred?.homeScore === undefined || matchPred?.awayScore === undefined) {
      if (onShowToast) onShowToast('Please enter both Home and Away predicted scores');
      return;
    }

    if (isMatchLocked(match)) {
      if (onShowToast) onShowToast('Kickoff time has passed. Predictions are locked for this match.');
      return;
    }

    try {
      setSavingMatchId(match.id);
      await api.saveScorePrediction({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        matchId: match.id,
        homeScore: Number(matchPred.homeScore),
        awayScore: Number(matchPred.awayScore)
      });

      setSavedStatus(prev => ({ ...prev, [match.id]: true }));
      if (onShowToast) onShowToast(`Prediction saved for ${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}!`);
      // Refresh leaderboard data in background
      loadLeaderboard();
    } catch (err: any) {
      if (onShowToast) onShowToast(err.message || 'Failed to save prediction');
    } finally {
      setSavingMatchId(null);
    }
  };

  // Current user's leaderboard position
  const myLeaderboardRank = useMemo(() => {
    if (!currentUser) return null;
    const userKey = currentUser.id || currentUser.email;
    return leaderboard.find(l => l.userId === userKey || (currentUser.email && l.userEmail === currentUser.email));
  }, [currentUser, leaderboard]);

  return (
    <div className={`bg-[#09090b] border border-neutral-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl space-y-6 ${className}`}>
      {/* Header & Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
              Matchday Predictor
              <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                OFFICIAL
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Predict fixture scores, earn points, and climb the Official Leaderboard!
            </p>
          </div>
        </div>

        {/* Tab Switcher & Rules Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Prediction Scoring Rules"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('predict')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === 'predict'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Fixtures ({upcomingMatches.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('leaderboard');
                loadLeaderboard();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Medal className="w-3.5 h-3.5" />
              Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Rules Explainer Banner (Toggleable) */}
      {showRules && (
        <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Official Scoring Point System
            </h4>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="text-neutral-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-950/80 border border-amber-500/40 rounded-xl p-3 text-center">
              <span className="text-xl font-black text-amber-400 block">5 PTS</span>
              <span className="font-bold text-white text-[11px] block">Exact Score</span>
              <span className="text-[10px] text-neutral-400">Correct home & away goals</span>
            </div>
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-center">
              <span className="text-xl font-black text-emerald-400 block">3 PTS</span>
              <span className="font-bold text-white text-[11px] block">Correct Winner</span>
              <span className="text-[10px] text-neutral-400">Correct result, wrong score</span>
            </div>
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-center">
              <span className="text-xl font-black text-blue-400 block">2 PTS</span>
              <span className="font-bold text-white text-[11px] block">Goal Count</span>
              <span className="text-[10px] text-neutral-400">Correct total match goals</span>
            </div>
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 text-center">
              <span className="text-xl font-black text-purple-400 block">1 PT</span>
              <span className="font-bold text-white text-[11px] block">Participation</span>
              <span className="text-[10px] text-neutral-400">Simply saving a prediction</span>
            </div>
          </div>
        </div>
      )}

      {/* User Status Bar if logged in */}
      {currentUser && myLeaderboardRank && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              #{myLeaderboardRank.rank || 1}
            </div>
            <div>
              <span className="font-black text-white">{currentUser.name || 'You'}</span>
              <span className="text-[11px] text-neutral-400 block">
                {myLeaderboardRank.totalPredictions} Predictions Made
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Exact (5pts)</span>
              <span className="font-mono font-black text-amber-400">{myLeaderboardRank.exactScoresCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Winner (3pts)</span>
              <span className="font-mono font-black text-emerald-400">{myLeaderboardRank.correctWinnersCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Total Points</span>
              <span className="font-mono font-black text-base text-amber-300">{myLeaderboardRank.totalPoints} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* User Login Warning */}
      {!currentUser && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Log in to save your match predictions and track your leaderboard ranking!</span>
          </div>
          <button
            type="button"
            onClick={onOpenAuthDeck}
            className="px-3 py-1 bg-amber-400 text-black font-black text-[11px] rounded-lg hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
          >
            Log In
          </button>
        </div>
      )}

      {/* ===================== TAB 1: PREDICTIONS ===================== */}
      {activeTab === 'predict' && (
        <div className="space-y-4">
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs space-y-2 border border-dashed border-neutral-800 rounded-xl">
              <Calendar className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="font-bold text-neutral-400">No upcoming scheduled fixtures available right now.</p>
              <p className="text-[11px] text-neutral-500">Check the Leaderboard tab to see rankings and past prediction results!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map(match => {
                const locked = isMatchLocked(match);
                const currentPred = predictions[match.id] || { homeScore: '', awayScore: '' };
                const isSaved = savedStatus[match.id];
                const homeTeam = match.homeTeam;
                const awayTeam = match.awayTeam;

                return (
                  <div 
                    key={match.id}
                    className={`bg-neutral-900/60 border rounded-xl p-4 transition-all space-y-3 ${
                      locked ? 'border-neutral-800/50 opacity-80' : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Match Metadata Line */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-300">Matchday {match.matchday}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          {match.date}
                        </span>
                        {match.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            {match.time}
                          </span>
                        )}
                      </div>

                      {/* Lock/Status Badge */}
                      {locked ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-amber-400 border border-amber-400/20">
                          <Lock className="w-3 h-3 text-amber-400" /> Kickoff Passed
                        </span>
                      ) : isSaved ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Saved
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                          Open for Prediction
                        </span>
                      )}
                    </div>

                    {/* Team Logos & Score Input Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-3 py-2">
                      {/* Home Team */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 p-1 flex items-center justify-center border border-neutral-700 shrink-0">
                            <TeamLogo team={homeTeam} logoUrl={homeTeam?.logoUrl} teamName={homeTeam?.name || 'Home'} className="w-full h-full object-contain" />
                          </div>
                          <span className="font-extrabold text-sm text-white truncate max-w-[120px]">
                            {homeTeam?.name || 'Home Team'}
                          </span>
                        </div>

                        {/* Home Score Input */}
                        <input
                          type="number"
                          min="0"
                          max="99"
                          disabled={locked}
                          value={currentPred.homeScore}
                          onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                          placeholder="0"
                          className={`w-12 h-10 text-center font-black text-base rounded-xl border transition-all ${
                            locked 
                              ? 'bg-neutral-950 text-neutral-500 border-neutral-800 cursor-not-allowed' 
                              : 'bg-black text-white border-neutral-700 focus:border-white focus:ring-1 focus:ring-white'
                          }`}
                        />
                      </div>

                      {/* VS Separator */}
                      <div className="sm:col-span-1 text-center font-black text-xs text-neutral-500 uppercase tracking-widest my-1 sm:my-0">
                        VS
                      </div>

                      {/* Away Team */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-3">
                        {/* Away Score Input */}
                        <input
                          type="number"
                          min="0"
                          max="99"
                          disabled={locked}
                          value={currentPred.awayScore}
                          onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                          placeholder="0"
                          className={`w-12 h-10 text-center font-black text-base rounded-xl border transition-all ${
                            locked 
                              ? 'bg-neutral-950 text-neutral-500 border-neutral-800 cursor-not-allowed' 
                              : 'bg-black text-white border-neutral-700 focus:border-white focus:ring-1 focus:ring-white'
                          }`}
                        />

                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-sm text-white truncate max-w-[120px]">
                            {awayTeam?.name || 'Away Team'}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-neutral-800 p-1 flex items-center justify-center border border-neutral-700 shrink-0">
                            <TeamLogo team={awayTeam} logoUrl={awayTeam?.logoUrl} teamName={awayTeam?.name || 'Away'} className="w-full h-full object-contain" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Save Row */}
                    {!locked && (
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          disabled={savingMatchId === match.id}
                          onClick={() => handleSavePrediction(match)}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            isSaved 
                              ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-white text-black hover:bg-neutral-200 active:scale-95'
                          }`}
                        >
                          {savingMatchId === match.id ? (
                            <Sparkles className="w-3.5 h-3.5 animate-spin text-black" />
                          ) : isSaved ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {savingMatchId === match.id ? 'Saving...' : isSaved ? 'Prediction Saved' : 'Save Prediction'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: LEADERBOARD ===================== */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
            <span className="font-bold">Official Predictor Standings</span>
            <button
              type="button"
              onClick={loadLeaderboard}
              disabled={loadingLeaderboard}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingLeaderboard && leaderboard.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs">Calculating official prediction scores...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs space-y-2 border border-dashed border-neutral-800 rounded-xl">
              <Trophy className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="font-bold text-neutral-300">No predictions recorded yet!</p>
              <p className="text-[11px] text-neutral-500">Switch to the Fixtures tab and submit your predictions to take the #1 spot on the leaderboard.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Leaderboard Table / Cards */}
              <div className="divide-y divide-neutral-800/80 bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden">
                {leaderboard.map((entry, idx) => {
                  const isCurrent = currentUser && (entry.userId === currentUser.id || (currentUser.email && entry.userEmail === currentUser.email));
                  const isExpanded = expandedUser === entry.userId;
                  const rank = entry.rank || idx + 1;

                  return (
                    <div 
                      key={entry.userId}
                      className={`transition-colors ${isCurrent ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : 'hover:bg-neutral-900/70'}`}
                    >
                      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
                        {/* Rank & User Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            rank === 1 
                              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
                              : rank === 2 
                              ? 'bg-slate-300 text-black' 
                              : rank === 3 
                              ? 'bg-amber-700 text-white' 
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-white truncate">
                                {entry.userName}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.2 rounded uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                              <span>{entry.totalPredictions} predicted</span>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">{entry.exactScoresCount} exact</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">{entry.correctWinnersCount} winner</span>
                            </div>
                          </div>
                        </div>

                        {/* Points & Expand Button */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-black text-base sm:text-lg text-amber-300 block">
                              {entry.totalPoints} <span className="text-xs font-bold text-neutral-400">PTS</span>
                            </span>
                          </div>

                          {entry.breakdown && entry.breakdown.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedUser(isExpanded ? null : entry.userId)}
                              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 transition-colors"
                              title="Toggle prediction breakdown"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prediction breakdown view */}
                      {isExpanded && entry.breakdown && entry.breakdown.length > 0 && (
                        <div className="px-4 pb-4 pt-1 bg-black/40 border-t border-neutral-800/60 space-y-2">
                          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                            Prediction History & Points Breakdown
                          </span>
                          <div className="space-y-1.5">
                            {entry.breakdown.map((b, bIdx) => (
                              <div 
                                key={bIdx}
                                className="flex items-center justify-between bg-neutral-900/80 border border-neutral-800/80 rounded-lg p-2 text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="font-bold text-white block truncate">
                                    {b.homeTeamName} vs {b.awayTeamName}
                                  </span>
                                  <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                                    <span>Predicted: <strong className="text-white font-mono">{b.predictedHomeScore} - {b.predictedAwayScore}</strong></span>
                                    {b.actualHomeScore !== undefined && b.actualAwayScore !== undefined && (
                                      <span>Actual: <strong className="text-emerald-400 font-mono">{b.actualHomeScore} - {b.actualAwayScore}</strong></span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  {b.reason === 'exact_score' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      +5 pts (Exact)
                                    </span>
                                  ) : b.reason === 'correct_winner' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      +3 pts (Winner)
                                    </span>
                                  ) : b.reason === 'correct_goals' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                      +2 pts (Goals)
                                    </span>
                                  ) : b.reason === 'participated' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      +1 pt (Predicted)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
