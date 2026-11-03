import { useNavigate, useLocation } from 'react-router-dom';
import { useURLModal } from '../hooks/useURLModal';
import React, { useState, useEffect } from 'react';

import { Match, MatchEvent, FixtureChatMessage, UserAccount } from '../types';
import { Pitch2D } from './Pitch2D';

import { Player, Team } from '../types';
import { MatchPredictionWidget } from './MatchPredictionWidget';
import { X, Clock, Award, Star, Activity, ArrowRightLeft, ShieldAlert, ArrowLeft, Flame, Sparkles } from 'lucide-react';
import { useMatchClock, formatMatchDisplayTime } from '../utils/matchClock';
import { MatchCountdown } from './MatchCountdown';
import { api } from '../services/api';
import { TeamLogo } from './TeamLogo';
import { GoalAnimationOverlay, GoalAlertData } from './GoalAnimationOverlay';

interface MatchDetailModalProps {
  matches: Match[];
  players?: Player[];
  teams?: Team[];
  isAdmin?: boolean;
  currentUser?: UserAccount | null;
}

interface MatchEventRowProps {
  evt: MatchEvent;
  isHomeEvent: boolean;
  getPlayerName: (pId: string, fallback?: string) => string;
}

const MatchEventRow: React.FC<MatchEventRowProps> = ({ evt, isHomeEvent, getPlayerName }) => {
  const mainPlayerName = evt.playerName || getPlayerName(evt.playerId);
  const subInName = evt.subInPlayerName || (evt.subInPlayerId ? getPlayerName(evt.subInPlayerId) : null);
  const assisterName = evt.assisterName || (evt.assisterId ? getPlayerName(evt.assisterId) : null);

  const renderIcon = () => {
    const typeStr = String(evt.eventType || '');
    if (typeStr === 'Goal' || typeStr === 'Penalty Goal' || typeStr === 'Own Goal' || typeStr === 'penalty') {
      if (evt.goalType === 'penalty' || typeStr === 'Penalty Goal') return <span title="Penalty Goal" className="text-base sm:text-lg select-none">🎯</span>;
      if (evt.goalType === 'own_goal' || typeStr === 'Own Goal') return <span title="Own Goal" className="text-base sm:text-lg select-none">🔴⚽</span>;
      return <span title="Goal" className="text-base sm:text-lg select-none">⚽</span>;
    }
    if (typeStr === 'penalty_miss') return <span title="Penalty Miss" className="text-base sm:text-lg select-none">❌</span>;
    if (typeStr === 'Yellow Card') return <span title="Yellow Card" className="text-base sm:text-lg select-none">🟨</span>;
    if (typeStr === 'Red Card') return <span title="Red Card" className="text-base sm:text-lg select-none">🟥</span>;
    if (typeStr === 'Sub') return <span title="Substitution" className="text-base sm:text-lg select-none">🔄</span>;
    return <span className="text-base sm:text-lg select-none">⏱️</span>;
  };

  const renderPlayerInfo = (isLeft: boolean) => {
    if (evt.eventType === 'Sub') {
      return (
        <div className={`flex flex-col ${isLeft ? 'text-left' : 'text-right'} min-w-0`}>
          <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
            {subInName || mainPlayerName}
          </span>
          {mainPlayerName && subInName && (
            <span className="text-slate-400 text-[11px] truncate">
              {mainPlayerName}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={`flex flex-col ${isLeft ? 'text-left' : 'text-right'} min-w-0`}>
        <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
          {mainPlayerName}
        </span>
        {assisterName && (
          <span className="text-slate-400 text-[11px] truncate">
            Assist: {assisterName}
          </span>
        )}
        {evt.detail && (
          <span className="text-slate-400 text-[10px] italic truncate">
            {evt.detail}
          </span>
        )}
      </div>
    );
  };

  if (isHomeEvent) {
    // Condition A: Home Team Event (Render on the Left)
    return (
      <div 
        className="w-full flex items-center justify-start mb-3 text-sm"
        style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '12px', fontSize: '14px' }}
      >
        <span className="font-extrabold text-amber-400 min-w-[32px] text-left shrink-0">
          {evt.minute}'
        </span>

        <span className="mx-2 shrink-0 flex items-center">
          {renderIcon()}
        </span>

        <div className="max-w-[70%] bg-slate-950/80 px-3 py-1.5 rounded-xl border border-rose-900/40 shadow-sm">
          {renderPlayerInfo(true)}
        </div>
      </div>
    );
  }

  // Condition B: Away Team Event (Render on the Right)
  return (
    <div 
      className="w-full flex items-center justify-end mb-3 text-sm"
      style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '12px', fontSize: '14px' }}
    >
      <div className="max-w-[70%] bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
        {renderPlayerInfo(false)}
      </div>

      <span className="mx-2 shrink-0 flex items-center">
        {renderIcon()}
      </span>

      <span className="font-extrabold text-amber-400 min-w-[32px] text-right shrink-0">
        {evt.minute}'
      </span>
    </div>
  );
};

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ matches, players = [], teams = [], isAdmin = false, currentUser = null }) => {
  const { isOpen, closeModal, modalData } = useURLModal<{ matchId: string, stage?: 'timeline' | 'lineups' | 'stats' | 'chat' }>('matchDetail');
  const match = matches.find(m => m.id === modalData?.matchId);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTabState] = useState<'timeline' | 'lineups' | 'stats' | 'chat'>(modalData?.stage || 'timeline');
  
  useEffect(() => {
    if (modalData?.stage) {
      setActiveTabState(modalData.stage);
    } else {
      setActiveTabState('timeline');
    }
  }, [modalData?.matchId, modalData?.stage]);

  const setActiveTab = (tab: any) => {
    setActiveTabState(tab);
  };
  const [selectedTeamLineup, setSelectedTeamLineup] = useState<'home' | 'away'>('home');

  const [chatMessages, setChatMessages] = useState<FixtureChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const defaultUsername = currentUser?.name || localStorage.getItem('epl_chat_username') || 'EPL Fan';
  const [usernameInput, setUsernameInput] = useState(defaultUsername);
  
  useEffect(() => {
    if (currentUser?.name) {
      setUsernameInput(currentUser.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.name]);

  const [sendingChat, setSendingChat] = useState(false);

  // Live Goal Animation Tracking
  const [goalAlert, setGoalAlert] = useState<GoalAlertData | null>(null);
  const prevHomeScoreRef = React.useRef<number | undefined>(match?.homeScore);
  const prevAwayScoreRef = React.useRef<number | undefined>(match?.awayScore);
  const prevEventsCountRef = React.useRef<number>(match?.events?.length || 0);

  useEffect(() => {
    if (!match) return;

    const currentHomeScore = Number(match.homeScore) || 0;
    const currentAwayScore = Number(match.awayScore) || 0;
    const currentEvents = match.events || [];

    // Initialize refs if undefined
    if (prevHomeScoreRef.current === undefined) {
      prevHomeScoreRef.current = currentHomeScore;
      prevAwayScoreRef.current = currentAwayScore;
      prevEventsCountRef.current = currentEvents.length;
      return;
    }

    const homeIncreased = currentHomeScore > prevHomeScoreRef.current;
    const awayIncreased = currentAwayScore > prevAwayScoreRef.current;

    if (homeIncreased || awayIncreased) {
      // Goal detected! Find the latest goal event if possible
      const scoringSide: 'home' | 'away' = homeIncreased ? 'home' : 'away';
      const scoringTeam = scoringSide === 'home' ? (match.homeTeam || null) : (match.awayTeam || null);
      const opponentTeam = scoringSide === 'home' ? (match.awayTeam || null) : (match.homeTeam || null);

      // Look for latest goal event
      const goalEvents = currentEvents.filter(e => {
        const typeStr = String(e.eventType || '');
        return typeStr === 'Goal' || typeStr === 'Penalty Goal' || typeStr === 'Own Goal' || typeStr === 'penalty';
      });

      const latestGoal = goalEvents.length > 0 ? goalEvents[goalEvents.length - 1] : null;
      let scorerName = latestGoal ? (latestGoal.playerName || getPlayerName(latestGoal.playerId)) : `${scoringTeam?.name || 'Striker'} Scorer`;
      let assisterName = latestGoal?.assisterName || (latestGoal?.assisterId ? getPlayerName(latestGoal.assisterId) : undefined);
      let minute = latestGoal?.minute || match.matchMinute || 45;

      setGoalAlert({
        id: `goal-${Date.now()}`,
        scoringTeam,
        opponentTeam,
        side: scoringSide,
        scorerName,
        assisterName,
        minute,
        newHomeScore: currentHomeScore,
        newAwayScore: currentAwayScore,
        goalType: latestGoal?.goalType || 'standard',
        matchTitle: `${match.homeTeam?.name || 'Home'} vs ${match.awayTeam?.name || 'Away'}`
      });
    }

    prevHomeScoreRef.current = currentHomeScore;
    prevAwayScoreRef.current = currentAwayScore;
    prevEventsCountRef.current = currentEvents.length;
  }, [match?.homeScore, match?.awayScore, match?.events, match?.id]);

  // Demo Goal Trigger for testing/previewing animation anytime
  const handleTriggerDemoGoal = (side: 'home' | 'away' = 'home') => {
    if (!match) return;
    const scoringTeam = side === 'home' ? (match.homeTeam || null) : (match.awayTeam || null);
    const opponentTeam = side === 'home' ? (match.awayTeam || null) : (match.homeTeam || null);
    const simHome = side === 'home' ? (match.homeScore || 0) + 1 : (match.homeScore || 0);
    const simAway = side === 'away' ? (match.awayScore || 0) + 1 : (match.awayScore || 0);

    setGoalAlert({
      id: `demo-goal-${Date.now()}`,
      scoringTeam,
      opponentTeam,
      side,
      scorerName: side === 'home' ? (match.homeTeam?.name ? `${match.homeTeam.name} Star` : 'Home Striker') : (match.awayTeam?.name ? `${match.awayTeam.name} Star` : 'Away Striker'),
      assisterName: 'Playmaker #10',
      minute: match.matchMinute || Math.floor(Math.random() * 80) + 10,
      newHomeScore: simHome,
      newAwayScore: simAway,
      goalType: 'standard',
      matchTitle: `${match.homeTeam?.name} vs ${match.awayTeam?.name}`
    });
  };

  const longPressTimerRef = React.useRef<any>(null);

  useEffect(() => {
    if (!match?.id) return;
    let isMounted = true;
    const fetchChats = () => {
      api.getFixtureChats(match.id)
        .then(res => {
          if (isMounted) setChatMessages(Array.isArray(res) ? res : []);
        })
        .catch(() => {
          if (isMounted) setChatMessages([]);
        });
    };

    fetchChats();
    const interval = setInterval(fetchChats, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [match?.id]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;
    setSendingChat(true);
    try {
      localStorage.setItem('epl_chat_username', usernameInput);
      const newMsg = await api.addFixtureMessage(match.id, {
        userId: (usernameInput || '').toLowerCase().replace(/\s+/g, '-'),
        username: usernameInput,
        content: chatInput.trim()
      });
      setChatMessages(prev => [...prev, newMsg]);
      setChatInput('');
    } catch (err) {
      console.error('Failed to send chat message', err);
    } finally {
      setSendingChat(false);
    }
  };

  const handleDeleteMessage = async (chatId: string) => {
    const isSuperAdmin = isAdmin || localStorage.getItem('isAdmin') === 'true';
    if (!isSuperAdmin) return;
    if (!confirm('Super Admin: Delete this fixture chat message?')) return;
    try {
      const success = await api.deleteFixtureMessage(match.id, chatId);
      if (success) {
        setChatMessages(prev => prev.filter(m => m.id !== chatId));
      }
    } catch (err) {
      console.error('Failed to delete chat message', err);
    }
  };

  const handleTouchStart = (chatId: string) => {
    const isSuperAdmin = isAdmin || localStorage.getItem('isAdmin') === 'true';
    if (!isSuperAdmin) return;
    longPressTimerRef.current = setTimeout(() => {
      handleDeleteMessage(chatId);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const isLive = match?.status === 'Live';
  const isFullTime = match?.status === 'Full-Time';

  // Man of the Match
  let motmPlayerId: string | null = match?.motmPlayerId || null;
  let highestRating = match?.motmPlayerId && match?.ratings ? Number(match.ratings[match.motmPlayerId]) || 0 : 0;
  
  if (!motmPlayerId && match?.ratings) {
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
    ...(match?.homeLineup?.startingXI || []),
    ...(match?.homeLineup?.substitutes || []),
    ...(match?.awayLineup?.startingXI || []),
    ...(match?.awayLineup?.substitutes || [])
  ];

  const getPlayerName = (pId: string, fallback?: string) => {
    const found = allLineupPlayers.find(p => p.playerId === pId);
    return found ? found.name : (fallback || 'Player');
  };

  const clock = useMatchClock(match as any);

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-y-auto pt-safe pb-safe px-safe ios-scroll animate-in fade-in duration-200">
      <div className="w-full flex-1 flex flex-col min-h-screen bg-slate-950">
        
        {/* Top Sticky Navigation Header Bar */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-md">
          <button
            onClick={() => closeModal()}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Match Center</h2>
            <p className="text-[10px] text-rose-300 font-semibold uppercase tracking-widest">
              Epe Premier League &bull; Matchday {match.matchday}
            </p>
          </div>
          
          <div className="w-[82px]"></div> {/* Spacer to keep header centered */}
        </div>

        {/* Top Scoreboard Banner */}
        <div className="bg-gradient-to-br from-[#800020] via-rose-950 to-slate-950 text-white p-4 sm:p-6 border-b border-rose-900/40">
          <div className="max-w-3xl mx-auto space-y-4">

            {/* Central Scoreboard Box - Single Horizontal Line */}
            <div className="bg-slate-950/80 border border-rose-800/50 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-6">
                
                {/* Home Team (Right-aligned text + logo) */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
                  <span className="font-extrabold text-xs sm:text-lg text-white text-right truncate">
                    {match.homeTeam?.name}
                  </span>
                  <TeamLogo team={match.homeTeam} className="w-10 h-10 sm:w-16 sm:h-16" />
                </div>

                {/* Score Center Box (Single Line) */}
                <div className="flex flex-col items-center shrink-0 px-1 sm:px-3">
                  <div className="text-2xl sm:text-5xl font-black text-amber-300 font-mono tracking-wider whitespace-nowrap bg-black/70 px-3.5 sm:px-6 py-1.5 sm:py-2 rounded-2xl border border-white/10 shadow-inner">
                    {match.homeScore} - {match.awayScore}
                  </div>
                </div>

                {/* Away Team (Logo + Left-aligned text) */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start min-w-0">
                  <TeamLogo team={match.awayTeam} className="w-10 h-10 sm:w-16 sm:h-16" />
                  <span className="font-extrabold text-xs sm:text-lg text-white text-left truncate">
                    {match.awayTeam?.name}
                  </span>
                </div>
              </div>

              {/* Venue & Nested Live Clock Badge DIRECTLY Underneath Scoreline */}
              <div className="flex flex-col items-center gap-2 mt-4 pt-3 border-t border-rose-900/40 text-center">
                <span className="text-[11px] sm:text-xs text-rose-200/90 font-medium flex items-center gap-1">
                  📍 {match.venue || 'Epe Township Stadium'}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {clock.isLive || match.status === 'Full-Time' || match.period === 'Full-Time' ? (
                    <span className={`text-xs sm:text-sm font-black px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5 border ${clock.badgeColor}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{clock.displayString} {clock.overflowText ? `(${clock.overflowText})` : ''}</span>
                    </span>
                  ) : (
                    <MatchCountdown match={match} />
                  )}

                  {/* Goal Celebration Animation Trigger (For previewing and live excitement) */}
                  <button
                    onClick={() => handleTriggerDemoGoal('home')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#800020] to-[#881337] text-white hover:brightness-110 shadow-sm border border-amber-300/30 transition-transform active:scale-95 cursor-pointer"
                    title="Preview Goal celebration animation"
                  >
                    <Flame className="w-3 h-3 text-amber-200 animate-pulse" />
                    <span>Goal Replay</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center justify-between w-full py-2 px-4 gap-1.5 sm:gap-2 pt-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-white text-[#800020] shadow-md'
                    : 'text-rose-100 hover:bg-white/10'
                }`}
              >
                Details
              </button>

              <button
                onClick={() => setActiveTab('lineups')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'lineups'
                    ? 'bg-white text-[#800020] shadow-md'
                    : 'text-rose-100 hover:bg-white/10'
                }`}
              >
                Lineups & Formations
              </button>


              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'stats'
                    ? 'bg-white text-[#800020] shadow-md'
                    : 'text-rose-100 hover:bg-white/10'
                }`}
              >
                Match Stats
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-white text-[#800020] shadow-md'
                    : 'text-rose-100 hover:bg-white/10'
                }`}
              >
                <span>💬 Live Chat</span>
                <span className="text-[10px] bg-rose-900 text-amber-300 px-1.5 py-0.2 rounded-full font-black">
                  {chatMessages.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex-1 space-y-5 max-w-4xl mx-auto w-full">
          {/* Fan Prediction Engine Integration */}
          <div className="max-w-2xl mx-auto">
            <MatchPredictionWidget match={match} />
          </div>

          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (() => {
            const sortedEvents = [...(match.events || [])].sort((a, b) => a.minute - b.minute);
            const firstHalfEvents = sortedEvents.filter(e => e.minute <= 45);
            const secondHalfEvents = sortedEvents.filter(e => e.minute > 45);

            let htHomeScore = 0;
            let htAwayScore = 0;
            firstHalfEvents.filter(e => e.eventType === 'Goal').forEach(e => {
              const isHome = e.teamId ? e.teamId === match.homeTeamId : ((e as any).team === 'home');
              if (e.goalType === 'own_goal') {
                if (isHome) htAwayScore += 1;
                else htHomeScore += 1;
              } else {
                if (isHome) htHomeScore += 1;
                else htAwayScore += 1;
              }
            });

            return (
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Header Team Labels */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs font-black uppercase tracking-wider text-slate-300 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo team={match.homeTeam} className="w-5 h-5" />
                    <span className="text-amber-300 truncate">{match.homeTeam?.name}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 shrink-0 mx-2">
                    MATCH EVENTS
                  </span>
                  <div className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="text-slate-300 truncate">{match.awayTeam?.name}</span>
                    <TeamLogo team={match.awayTeam} className="w-5 h-5" />
                  </div>
                </div>

                {!match.events || match.events.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium text-sm bg-slate-950/40 rounded-2xl border border-slate-800">
                    No match events recorded yet.
                  </div>
                ) : (
                  <div className="w-full space-y-1 py-2">
                    {/* First Half Events */}
                    {firstHalfEvents.map((evt: MatchEvent) => {
                      const isHomeEvent = evt.teamId ? evt.teamId === match.homeTeamId : ((evt as any).team === 'home');
                      return (
                        <MatchEventRow
                          key={evt.id}
                          evt={evt}
                          isHomeEvent={isHomeEvent}
                          getPlayerName={getPlayerName}
                        />
                      );
                    })}

                    {/* Center Divider: Half-Time */}
                    <div className="flex items-center my-4 w-full">
                      <div className="flex-1 h-px bg-slate-800"></div>
                      <span className="px-3 py-1 bg-slate-900 text-amber-300 border border-slate-700 rounded-full font-black text-xs uppercase tracking-wider mx-3 shadow-md">
                        HT {htHomeScore} - {htAwayScore}
                      </span>
                      <div className="flex-1 h-px bg-slate-800"></div>
                    </div>

                    {/* Second Half Events */}
                    {secondHalfEvents.map((evt: MatchEvent) => {
                      const isHomeEvent = evt.teamId ? evt.teamId === match.homeTeamId : ((evt as any).team === 'home');
                      return (
                        <MatchEventRow
                          key={evt.id}
                          evt={evt}
                          isHomeEvent={isHomeEvent}
                          getPlayerName={getPlayerName}
                        />
                      );
                    })}

                    {/* Center Divider: Full-Time */}
                    {(match.status === 'Full-Time' || (match.matchMinute && match.matchMinute >= 90)) && (
                      <div className="flex items-center my-4 w-full">
                        <div className="flex-1 h-px bg-slate-800"></div>
                        <span className="px-3 py-1 bg-[#800020] text-amber-300 border border-rose-800 rounded-full font-black text-xs uppercase tracking-wider mx-3 shadow-md">
                          FT {match.homeScore} - {match.awayScore}
                        </span>
                        <div className="flex-1 h-px bg-slate-800"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2: LINEUPS & FORMATION */}
          {activeTab === 'lineups' && (
            <Pitch2D
              match={match}
              players={players}
              events={match.events}
              ratings={match.ratings}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              selectedTeamSide={selectedTeamLineup}
              onTeamChange={setSelectedTeamLineup}
              onPlayerClick={(p) => {
                const targetId = (p as any).playerId || p.id;
                const fullP = players?.find(x => x.id === targetId || (x.name && p.name && x.name.toLowerCase() === p.name.toLowerCase()));
                if (fullP) {
                  navigate(`?modal=playerProfile&playerId=${fullP.id}`);
                } else if ('goals' in p) {
                  navigate(`?modal=playerProfile&playerId=${(p as Player).id}`);
                }
              }}
            />
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

          {/* TAB 5: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="max-w-2xl mx-auto bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col h-[420px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Live Match Discussion & Chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    Chatting as: <strong className="text-white">{usernameInput}</strong>
                  </span>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-[#800020]/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                      📢
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-wider">No comments yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Be the first to predict the score, share live match commentary, or debate referee decisions!</p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isSuperAdmin = isAdmin || localStorage.getItem('isAdmin') === 'true';
                    return (
                      <div
                        key={msg.id}
                        onTouchStart={() => handleTouchStart(msg.id)}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={() => handleTouchStart(msg.id)}
                        onMouseUp={handleTouchEnd}
                        className="group relative bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-1 select-none hover:border-rose-900/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-rose-300">{msg.username}</span>
                            {isSuperAdmin && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/20 font-mono">
                                Admin (Long-press to delete)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                title="Delete Message (Super Admin)"
                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 p-1 rounded transition-opacity cursor-pointer"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{msg.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendChat} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Share live match commentary..."
                  className="flex-1 bg-slate-900 text-xs text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-600"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatInput.trim()}
                  className="bg-[#800020] hover:bg-rose-900 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Goal Flash Celebration Overlay */}
      <GoalAnimationOverlay
        goalAlert={goalAlert}
        onDismiss={() => setGoalAlert(null)}
      />
      
    </div>
  );
};
