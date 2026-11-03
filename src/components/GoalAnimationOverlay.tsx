import React, { useEffect, useState } from 'react';
import { Team, MatchEvent } from '../types';
import { TeamLogo } from './TeamLogo';
import { Flame, Sparkles, Trophy } from 'lucide-react';

export interface GoalAlertData {
  id: string;
  scoringTeam: Team | null;
  opponentTeam: Team | null;
  side: 'home' | 'away';
  scorerName: string;
  assisterName?: string;
  minute: number;
  newHomeScore: number;
  newAwayScore: number;
  goalType?: string;
  matchTitle?: string;
}

interface GoalAnimationOverlayProps {
  goalAlert: GoalAlertData | null;
  onDismiss: () => void;
}

export const GoalAnimationOverlay: React.FC<GoalAnimationOverlayProps> = ({
  goalAlert,
  onDismiss,
}) => {
  const [phase, setPhase] = useState<'enter' | 'active' | 'exit'>('enter');

  useEffect(() => {
    if (!goalAlert) return;

    setPhase('enter');
    const tEnter = setTimeout(() => setPhase('active'), 150);
    const tExit = setTimeout(() => setPhase('exit'), 4200);
    const tClose = setTimeout(() => {
      onDismiss();
    }, 4700);

    // Play whistle/cheer audio cue safely if supported
    try {
      const audio = new Audio('/epe_alert.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch {
      // Audio optional
    }

    // Trigger haptic vibration on devices if available
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 150, 50, 300]);
      } catch {
        // ignore
      }
    }

    return () => {
      clearTimeout(tEnter);
      clearTimeout(tExit);
      clearTimeout(tClose);
    };
  }, [goalAlert, onDismiss]);

  if (!goalAlert) return null;

  const {
    scoringTeam,
    scorerName,
    assisterName,
    minute,
    newHomeScore,
    newAwayScore,
    goalType,
  } = goalAlert;

  const isPenalty = goalType === 'penalty';
  const isOwnGoal = goalType === 'own_goal';

  return (
    <div 
      className={`fixed inset-0 z-[120] pointer-events-auto flex items-center justify-center p-4 overflow-hidden transition-all duration-500 backdrop-blur-md ${
        phase === 'exit'
          ? 'opacity-0 scale-95 pointer-events-none'
          : phase === 'enter'
          ? 'opacity-0 scale-105'
          : 'opacity-100 scale-100 bg-slate-950/80'
      }`}
      onClick={onDismiss}
    >
      {/* Dynamic Animated Particles / Flash Rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial Sunset Glow */}
        <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(128,0,32,0.35)_0%,rgba(136,19,55,0.15)_35%,transparent_70%)] animate-pulse" />
        
        {/* Rotating Light Beams */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] opacity-25 animate-spin pointer-events-none" style={{ animationDuration: '24s' }}>
          <div className="w-full h-full bg-[conic-gradient(from_0deg,#800020,#881337,#FBB931,#FFE3B3,#800020)] rounded-full filter blur-3xl" />
        </div>

        {/* Floating Sparkles */}
        <div className="absolute top-12 left-1/4 text-amber-300 animate-bounce text-2xl select-none" style={{ animationDuration: '2s' }}>✨</div>
        <div className="absolute bottom-16 right-1/4 text-amber-200 animate-bounce text-2xl select-none" style={{ animationDuration: '2.5s' }}>⭐</div>
        <div className="absolute top-1/3 right-12 text-[#FBB931] animate-pulse text-3xl select-none">🔥</div>
        <div className="absolute bottom-1/3 left-12 text-[#800020] animate-pulse text-3xl select-none">⚡</div>
      </div>

      {/* Main Goal Announcement Card */}
      <div 
        className="relative max-w-lg w-full bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-[#800020] shadow-[0_0_60px_rgba(128,0,32,0.5)] rounded-3xl p-6 sm:p-8 text-center text-white overflow-hidden transform transition-transform duration-300 animate-goal-glow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Sunset Stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#800020] via-[#881337] to-[#FBB931]" />
        
        {/* Watermark Logo/Ball in background */}
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none text-9xl">
          ⚽
        </div>

        {/* Animated Headline: GOALLLLLL! */}
        <div className="space-y-1 my-2">
          <div className="inline-flex items-center gap-2 bg-[#800020]/20 border border-[#800020]/50 px-4 py-1 rounded-full text-xs sm:text-sm font-black text-[#FBB931] uppercase tracking-widest shadow-sm">
            <Flame className="w-4 h-4 text-[#800020] animate-pulse" />
            <span>LIVE MATCH ALERT &bull; {minute}' MIN</span>
            <Sparkles className="w-4 h-4 text-[#FBB931]" />
          </div>

          <div className="py-2">
            <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFE3B3] to-[#FBB931] drop-shadow-[0_4px_12px_rgba(128,0,32,0.8)] animate-bounce select-none">
              {isOwnGoal ? 'OWN GOAL!' : isPenalty ? 'PENALTY GOAL!' : 'GOAAAL!'}
            </h1>
          </div>
        </div>

        {/* Scoring Team & Animated Soccer Ball */}
        <div className="flex items-center justify-center gap-4 my-4">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 p-2 border-2 border-[#881337] shadow-[0_0_20px_rgba(136,19,55,0.4)] flex items-center justify-center">
              <TeamLogo team={scoringTeam} className="w-full h-full object-contain" />
            </div>
            {/* Spinning Ball badge */}
            <div className="absolute -bottom-2 -right-2 text-2xl sm:text-3xl animate-spin" style={{ animationDuration: '6s' }}>
              ⚽
            </div>
          </div>
        </div>

        {/* Scorer Name & Assist Credit */}
        <div className="space-y-1.5 mb-5">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {scorerName}
          </h2>
          <p className="text-sm sm:text-base font-extrabold text-[#881337]">
            {scoringTeam?.name || 'Scoring Team'}
          </p>
          {assisterName && (
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              👟 Assist by <span className="text-white font-bold">{assisterName}</span>
            </p>
          )}
        </div>

        {/* Updated Score Display */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 max-w-xs mx-auto shadow-inner flex items-center justify-center gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Score</span>
          <div className="text-3xl sm:text-4xl font-mono font-black text-[#FBB931] tracking-widest bg-black/60 px-4 py-1 rounded-xl border border-white/10">
            {newHomeScore} - {newAwayScore}
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="mt-6 pt-2">
          <button
            onClick={onDismiss}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#800020] to-[#881337] hover:brightness-110 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue Watching &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
