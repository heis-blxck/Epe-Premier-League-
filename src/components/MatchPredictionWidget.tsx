import React, { useState, useEffect } from 'react';
import { Match, MatchPredictionStats, PredictionType } from '../types';
import { api } from '../services/api';
import { Vote, CheckCircle, Lock } from 'lucide-react';

interface MatchPredictionWidgetProps {
  match: Match;
  homeTeamName?: string;
  awayTeamName?: string;
  compact?: boolean;
}

const getSessionId = (): string => {
  let id = localStorage.getItem('epe_user_session_id');
  if (!id) {
    id = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('epe_user_session_id', id);
  }
  return id;
};

export const MatchPredictionWidget: React.FC<MatchPredictionWidgetProps> = ({
  match,
  homeTeamName,
  awayTeamName,
  compact = false
}) => {
  const [stats, setStats] = useState<MatchPredictionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const homeName = homeTeamName || match.homeTeam?.name || 'Home';
  const awayName = awayTeamName || match.awayTeam?.name || 'Away';

  // Is match voting locked? Locked if status is NOT Scheduled
  const isLocked = match.status !== 'Scheduled';

  const loadPredictionData = async () => {
    if (!match?.id) return;
    try {
      setLoading(true);
      const sessionId = getSessionId();
      const res = await api.getMatchPrediction(match.id, sessionId);
      setStats(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (match.id) {
      loadPredictionData();
    }
  }, [match.id, match.status]);

  const handleVote = async (predictionType: PredictionType) => {
    if (isLocked || submitting) return;
    try {
      setSubmitting(true);
      setErrorMsg('');
      const sessionId = getSessionId();
      const updatedStats = await api.submitMatchPrediction(match.id, sessionId, predictionType);
      setStats(updatedStats);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record vote');
    } finally {
      setSubmitting(false);
    }
  };

  const userVote = stats?.userVote;
  const hasVoted = Boolean(userVote);

  if (loading && !stats) {
    return (
      <div className="animate-pulse bg-slate-800/40 rounded-lg p-3 text-center text-xs text-slate-400">
        Loading fan predictions...
      </div>
    );
  }

  const total = stats?.totalVotes || 0;
  const homePct = stats?.homeWinPercent ?? 0;
  const drawPct = stats?.drawPercent ?? 0;
  const awayPct = stats?.awayWinPercent ?? 0;

  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 text-white shadow-md ${compact ? 'text-xs' : 'text-sm'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : (
            <Vote className="w-4 h-4 text-[#800020]" />
          )}
          <span className="font-semibold text-slate-200 tracking-wide">
            {isLocked ? 'Final Fan Predictions' : hasVoted ? 'Fan Predictions (Your Vote Recorded)' : 'Fan Match Prediction'}
          </span>
        </div>
        {total > 0 && (
          <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-full">
            {total} {total === 1 ? 'vote' : 'votes'}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="mb-2 p-2 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-xs">
          {errorMsg}
        </div>
      )}

      {/* UI State 1: Open & Not Voted Yet */}
      {!isLocked && !hasVoted && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Predict the match outcome before kickoff:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleVote('Home Win')}
              disabled={submitting}
              className="w-full py-2 px-1 bg-slate-800 hover:bg-[#800020] border border-slate-700 hover:border-[#800020] text-slate-200 hover:text-white font-medium rounded-lg text-xs sm:text-sm transition-all duration-200 active:scale-95 text-center truncate"
              title={`Vote for ${homeName} Win`}
            >
              {homeName}
            </button>
            <button
              onClick={() => handleVote('Draw')}
              disabled={submitting}
              className="w-full py-2 px-1 bg-slate-800 hover:bg-[#800020] border border-slate-700 hover:border-[#800020] text-slate-200 hover:text-white font-medium rounded-lg text-xs sm:text-sm transition-all duration-200 active:scale-95 text-center truncate"
              title="Vote for Draw"
            >
              Draw
            </button>
            <button
              onClick={() => handleVote('Away Win')}
              disabled={submitting}
              className="w-full py-2 px-1 bg-slate-800 hover:bg-[#800020] border border-slate-700 hover:border-[#800020] text-slate-200 hover:text-white font-medium rounded-lg text-xs sm:text-sm transition-all duration-200 active:scale-95 text-center truncate"
              title={`Vote for ${awayName} Win`}
            >
              {awayName}
            </button>
          </div>
        </div>
      )}

      {/* UI State 2 (Voted - Real time feedback) & UI State 3 (Locked) */}
      {(hasVoted || isLocked) && (
        <div className="space-y-3">
          {/* Multi-segment Horizontal Percentage Bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700/50">
            <div
              style={{ width: `${homePct}%` }}
              className={`h-full transition-all duration-500 ${userVote === 'Home Win' ? 'bg-[#800020]' : 'bg-red-700/80'}`}
              title={`${homeName}: ${homePct}%`}
            />
            <div
              style={{ width: `${drawPct}%` }}
              className={`h-full transition-all duration-500 ${userVote === 'Draw' ? 'bg-[#800020]' : 'bg-amber-600/80'}`}
              title={`Draw: ${drawPct}%`}
            />
            <div
              style={{ width: `${awayPct}%` }}
              className={`h-full transition-all duration-500 ${userVote === 'Away Win' ? 'bg-[#800020]' : 'bg-blue-600/80'}`}
              title={`${awayName}: ${awayPct}%`}
            />
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => !isLocked && handleVote('Home Win')}
              className={`p-2 rounded-lg border text-center transition-all ${
                userVote === 'Home Win'
                  ? 'bg-[#800020]/20 border-[#800020] ring-1 ring-[#800020]'
                  : 'bg-slate-800/40 border-slate-700/50'
              } ${!isLocked ? 'cursor-pointer hover:border-[#800020]/60' : ''}`}
            >
              <div className="text-[10px] text-slate-400 font-medium truncate flex items-center justify-center gap-1">
                {userVote === 'Home Win' && <CheckCircle className="w-3 h-3 text-red-400 inline" />}
                {homeName}
              </div>
              <div className="text-sm font-bold text-white mt-0.5">{homePct}%</div>
            </div>

            <div
              onClick={() => !isLocked && handleVote('Draw')}
              className={`p-2 rounded-lg border text-center transition-all ${
                userVote === 'Draw'
                  ? 'bg-[#800020]/20 border-[#800020] ring-1 ring-[#800020]'
                  : 'bg-slate-800/40 border-slate-700/50'
              } ${!isLocked ? 'cursor-pointer hover:border-[#800020]/60' : ''}`}
            >
              <div className="text-[10px] text-slate-400 font-medium truncate flex items-center justify-center gap-1">
                {userVote === 'Draw' && <CheckCircle className="w-3 h-3 text-amber-400 inline" />}
                Draw
              </div>
              <div className="text-sm font-bold text-white mt-0.5">{drawPct}%</div>
            </div>

            <div
              onClick={() => !isLocked && handleVote('Away Win')}
              className={`p-2 rounded-lg border text-center transition-all ${
                userVote === 'Away Win'
                  ? 'bg-[#800020]/20 border-[#800020] ring-1 ring-[#800020]'
                  : 'bg-slate-800/40 border-slate-700/50'
              } ${!isLocked ? 'cursor-pointer hover:border-[#800020]/60' : ''}`}
            >
              <div className="text-[10px] text-slate-400 font-medium truncate flex items-center justify-center gap-1">
                {userVote === 'Away Win' && <CheckCircle className="w-3 h-3 text-blue-400 inline" />}
                {awayName}
              </div>
              <div className="text-sm font-bold text-white mt-0.5">{awayPct}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
