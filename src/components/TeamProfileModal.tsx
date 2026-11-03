import { useNavigate, useSearchParams } from 'react-router-dom';
import { useURLModal } from '../hooks/useURLModal';
import React, { useState, useMemo } from 'react';

import { Team, Player, Match, UserAccount } from '../types';
import { X, Calendar, MapPin, User, ChevronRight, Activity, Star, TrendingUp, Trophy, Heart } from 'lucide-react';


interface TeamProfileModalProps {
  teams: Team[];
  standings: Team[];
  players: Player[];
  matches: Match[];
  users?: UserAccount[];
}

export const TeamProfileModal: React.FC<TeamProfileModalProps> = ({ teams, standings, players, matches, users = [] }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isOpen, closeModal, modalData } = useURLModal<{ teamId?: string, stage?: 'overview' | 'roster' | 'top_performers' }>('teamProfile');
  const [activeTabState, setActiveTabState] = useState(searchParams.get('stage') || modalData?.stage || 'overview');
  
  React.useEffect(() => {
    if (modalData?.stage) setActiveTabState(modalData.stage);
    else setActiveTabState(searchParams.get('stage') || 'overview');
  }, [modalData?.teamId, modalData?.stage]);

  const activeTab = activeTabState;
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };

  if (!isOpen || !modalData?.teamId) return null;
  const team = teams.find(t => t.id === modalData.teamId);
  if (!team) return null;
  

  


  const leaguePosition = standings.findIndex(t => t.id === team.id) + 1;

  // Calculate registered fan count for this team
  const fanCount = (!users || users.length === 0) 
    ? 0 
    : users.filter(u => u.favoriteTeamId === team.id || u.favoriteTeamId === team.name).length;

  // Filter matches for this team
  const teamMatches = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
  
  // Sort matches by time (assuming we can use status or we just use them in order)
  // Usually full-time are past, others are upcoming
  const pastMatches = teamMatches.filter(m => m.status === 'Full-Time').slice(-3); // Get last 3
  const upcomingMatches = teamMatches.filter(m => m.status !== 'Full-Time').slice(0, 3); // Get next 3

  // Get team players
  const teamPlayers = players.filter(p => p.teamId === team.id);
  
  // Group players by position
  const rosterByPosition = teamPlayers.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  // Top Performers (Top 10 sorted by performance impact score including Clean Sheets)
  const computePlayerImpactScore = (p: Player) => {
    const g = p.goals || 0;
    const a = p.assists || 0;
    const cs = p.cleanSheets || 0;
    const rating = p.ratingAverage || 6.0;

    let csPoints = 0;
    if (p.position === 'GK' || p.position === 'DEF') {
      csPoints = cs * 5;
    } else if (p.position === 'MID') {
      csPoints = cs * 2;
    }

    const goalPoints = g * 5;
    const assistPoints = a * 3;
    const ratingPoints = Math.max(0, (rating - 5.0) * 4);

    return goalPoints + assistPoints + csPoints + ratingPoints;
  };

  const topPerformers = [...teamPlayers].sort((a, b) => {
    const scoreA = computePlayerImpactScore(a);
    const scoreB = computePlayerImpactScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    if ((b.cleanSheets || 0) !== (a.cleanSheets || 0)) return (b.cleanSheets || 0) - (a.cleanSheets || 0);
    if ((b.goals || 0) !== (a.goals || 0)) return (b.goals || 0) - (a.goals || 0);
    return (b.ratingAverage || 0) - (a.ratingAverage || 0);
  }).slice(0, 8);

  const getMatchResult = (match: Match) => {
    const isHome = match.homeTeamId === team.id;
    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;
    
    if (homeScore === awayScore) return 'D';
    if (isHome) return homeScore > awayScore ? 'W' : 'L';
    return awayScore > homeScore ? 'W' : 'L';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 pt-safe pb-safe px-safe ios-scroll">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* Modal Container */}
      <div className="relative w-full h-full sm:max-w-2xl bg-slate-900 sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92dvh] my-auto">
        
        {/* Header Hero Section */}
        <div className="bg-gradient-to-br from-[#800020] via-[#800020] to-slate-950 relative pt-12 pb-6 px-6 sm:px-8 shrink-0 overflow-hidden border-b border-[#881337]/50">
          {/* Close button */}
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Background watermark logo */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
             <img src={team.logoUrl} alt="Watermark" className="w-64 h-64 object-contain filter grayscale" />
          </div>

          <div className="relative z-10 flex items-end gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-3 shadow-2xl border-4 border-white/10 shrink-0">
              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
            </div>
            
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                   <Trophy className="w-3 h-3" />
                   {leaguePosition > 0 ? `${leaguePosition}${leaguePosition === 1 ? 'st' : leaguePosition === 2 ? 'nd' : leaguePosition === 3 ? 'rd' : 'th'} in League` : 'N/A'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                   <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                   {fanCount} Registered {fanCount === 1 ? 'Fan' : 'Fans'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-2">
                {team.name}
              </h1>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-rose-200/90 text-xs font-semibold">
                  <User className="w-3.5 h-3.5" />
                  <span>Manager: {team.coach || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{team.stadium || 'Stadium'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-4 border-b border-slate-800 bg-slate-900 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
             <Activity className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'roster' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
             <UsersIcon className="w-4 h-4" /> Squad Roster
          </button>
          <button
            onClick={() => setActiveTab('top_performers')}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'top_performers' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
             <Star className="w-4 h-4" /> Top Performers
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Fanbase Metric Card */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-400" /> Club Fanbase
                  </h3>
                  <p className="text-xs text-slate-400">Registered supporters who selected {team.name} during sign up.</p>
                </div>
                <div className="text-right pl-4">
                  <div className="text-2xl font-black text-amber-300">{fanCount}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{fanCount === 1 ? 'Registered Fan' : 'Registered Fans'}</div>
                </div>
              </div>

              {/* Form Guide */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm">
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> Recent Form
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  {pastMatches.length > 0 ? pastMatches.map(match => {
                    const result = getMatchResult(match);
                    const isHome = match.homeTeamId === team.id;
                    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                    const opponent = standings.find(t => t.id === opponentId);
                    
                    return (
                      <div key={match.id} className="flex flex-col items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1 min-w-[120px]">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${
                          result === 'W' ? 'bg-emerald-500 text-emerald-950' : 
                          result === 'D' ? 'bg-amber-400 text-amber-950' : 
                          'bg-rose-500 text-rose-950'
                        }`}>
                          {result}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-sm text-slate-100">{match.homeScore} - {match.awayScore}</span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 truncate w-full justify-center">
                          <span className="opacity-70">{isHome ? 'vs' : '@'}</span>
                          <span className="truncate">{opponent?.shortName || 'Unknown'}</span>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="text-sm text-slate-500 py-2">No recent matches found.</div>
                  )}
                </div>
              </div>

              {/* Upcoming Fixtures */}
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm">
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" /> Next Fixtures
                </h3>
                <div className="space-y-2">
                  {upcomingMatches.length > 0 ? upcomingMatches.map(match => {
                    const isHome = match.homeTeamId === team.id;
                    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                    const opponent = standings.find(t => t.id === opponentId);
                    
                    return (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 p-1 flex items-center justify-center">
                             <img src={opponent?.logoUrl} alt="Opponent" className="w-5 h-5 object-contain" />
                           </div>
                           <div>
                             <div className="text-xs font-bold text-slate-100">
                               {isHome ? 'vs' : '@'} {opponent?.name || 'Unknown'}
                             </div>
                             <div className="text-[10px] text-slate-400">{isHome ? 'Home' : 'Away'} Match</div>
                           </div>
                        </div>
                        <div className="px-2 py-1 bg-slate-900 text-[10px] font-bold text-amber-400 rounded-md border border-slate-800">
                           {match.time ? `${match.time} WAT` : 'TBD'}
                        </div>
                      </div>
                    )
                  }) : (
                     <div className="text-sm text-slate-500 py-2">No upcoming fixtures scheduled.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ROSTER TAB */}
          {activeTab === 'roster' && (
            <div className="space-y-6 pb-6">
              {['GK', 'DEF', 'MID', 'FWD'].map(pos => {
                const posPlayers = rosterByPosition[pos];
                if (!posPlayers || posPlayers.length === 0) return null;
                return (
                  <div key={pos} className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                      {pos === 'GK' ? 'Goalkeepers' : pos === 'DEF' ? 'Defenders' : pos === 'MID' ? 'Midfielders' : 'Forwards'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {posPlayers.map(player => (
                        <div 
                          key={player.id} 
                          onClick={() => navigate(`?modal=playerProfile&playerId=${player.id}`)}
                          className="flex items-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-800/90 transition-all cursor-pointer shadow-md group"
                        >
                          <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover border border-slate-700 mr-3 group-hover:scale-105 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">{player.name}</h5>
                            <span className="text-[10px] text-slate-400 font-mono">#{player.shirtNumber}</span>
                          </div>
                          <div className="text-right">
                             <div className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                               {(player.ratingAverage !== undefined && player.ratingAverage !== null ? player.ratingAverage : 0).toFixed(2)} <span className="text-[9px] font-normal text-amber-400/70 ml-0.5">AVG</span>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TOP PERFORMERS TAB */}
          {activeTab === 'top_performers' && (
            <div className="space-y-4 pb-6">
               {topPerformers.map((player, idx) => {
                 const score = computePlayerImpactScore(player);
                 const ratingStr = player.ratingAverage !== undefined && player.ratingAverage !== null && player.ratingAverage > 0 ? player.ratingAverage.toFixed(2) : '0.00';
                 return (
                   <div 
                     key={player.id} 
                     onClick={() => navigate(`?modal=playerProfile&playerId=${player.id}`)}
                     className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl p-4 border border-slate-800 hover:border-amber-400/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] group"
                   >
                     <div className="absolute top-0 right-0 w-32 h-full opacity-5 pointer-events-none">
                       <Trophy className="w-full h-full text-white" />
                     </div>

                     <div className="flex items-center gap-3 z-10 min-w-0">
                       <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-300 text-sm border border-slate-700 shadow-inner shrink-0">
                         #{idx + 1}
                       </div>
                       
                       <img src={player.photoUrl} alt={player.name} className="w-13 h-13 rounded-full object-cover border-2 border-[#800020] shadow-md shrink-0 group-hover:scale-105 transition-transform" />
                       
                       <div className="min-w-0">
                         <h4 className="text-sm font-black text-white truncate group-hover:text-amber-300 transition-colors">{player.name}</h4>
                         <div className="flex items-center gap-1.5 mt-0.5">
                           <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                             player.position === 'GK' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                             player.position === 'DEF' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                             player.position === 'MID' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                             'bg-rose-950 text-rose-300 border border-rose-800'
                           }`}>
                             {player.position}
                           </span>
                           <span className="text-xs text-slate-400 font-mono">#{player.shirtNumber}</span>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between sm:justify-end gap-3 z-10 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                       {/* Stat Breakdown Badges */}
                       <div className="flex items-center gap-1 text-[10px] font-bold flex-wrap">
                         <span className="bg-rose-950/80 text-rose-300 px-2 py-1 rounded-lg border border-rose-800/40" title="Goals">⚽ {player.goals || 0}</span>
                         <span className="bg-amber-950/80 text-amber-300 px-2 py-1 rounded-lg border border-amber-800/40" title="Assists">👟 {player.assists || 0}</span>
                         <span className="bg-emerald-950/80 text-emerald-300 px-2 py-1 rounded-lg border border-emerald-800/40 font-black" title="Clean Sheets">🛡️ {player.cleanSheets || 0}</span>
                         <span className="bg-slate-800 text-slate-200 px-2 py-1 rounded-lg border border-slate-700" title="Average Rating">⭐ {ratingStr}</span>
                       </div>

                       {/* Impact Points */}
                       <div className="bg-amber-400/10 text-amber-300 px-3 py-1 rounded-xl border border-amber-400/30 text-right shrink-0">
                         <div className="text-sm font-black font-mono">{Math.round(score)} <span className="text-[10px] font-medium text-amber-400/70">pts</span></div>
                         <div className="text-[9px] font-bold uppercase text-amber-400/70">Impact Score</div>
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}

        </div>

        {/* Selected Player Profile Popup Modal */}
        
      </div>
    </div>
  );
};

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
