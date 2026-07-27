import React, { useState, useEffect } from "react";
import { LeagueStats as StatsType, Team, Player, PlayerOfTheMonth, Match } from "../types";
import { api } from "../services/api";
import { MasterLeaderboardWidget } from "./MasterLeaderboardWidget";
import { PlayerProfileModal } from './PlayerProfileModal';
import { Flame, Award, ShieldCheck, Trophy, Star } from "lucide-react";

interface LeagueStatsProps {
  competition?: "league" | "cup";
  stats: StatsType;
  teams: Team[];
  matches?: Match[];
  onSelectPlayer?: (player: Player) => void;
  players?: Player[];
}

export const LeagueStats: React.FC<LeagueStatsProps> = ({ stats, teams, competition = "league", matches = [], onSelectPlayer, players = [] }) => {
  const [activeCategory, setActiveCategory] = useState<'goals' | 'assists' | 'cleanSheets' | 'topPerformers'>('goals');
  const [potmList, setPotmList] = useState<PlayerOfTheMonth[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Player | null>(null);

  const teamsMap = new Map<string, Team>(teams.map(t => [t.id, t]));

  useEffect(() => {
    api.getPlayerOfTheMonth().then(data => {
      setPotmList(data || []);
    }).catch(console.error);
  }, []);

  const latestPotm = potmList[0];

  const getLeaderboardData = () => {
    let playersList: Player[] = [];
    if (competition === "cup") {
      if (activeCategory === "goals") playersList = stats.cupTopScorers || [];
      else if (activeCategory === "assists") playersList = stats.cupTopAssists || [];
      else if (activeCategory === "cleanSheets") playersList = stats.cupCleanSheets || [];
      else playersList = stats.cupTopPerformers || stats.cupTopScorers || [];
    } else {
      if (activeCategory === "goals") playersList = stats.topScorers || [];
      else if (activeCategory === "assists") playersList = stats.topAssists || [];
      else if (activeCategory === "cleanSheets") playersList = stats.cleanSheets || [];
      else playersList = stats.topPerformers || stats.topScorers || [];
    }

    return playersList.map(player => {
      const isCup = competition === 'cup';
      const g = isCup ? (player.cupGoals || 0) : player.goals;
      const a = isCup ? (player.cupAssists || 0) : player.assists;
      const cs = isCup ? (player.cupCleanSheets || 0) : player.cleanSheets;
      const rating = player.ratingAverage || 6.0;

      let value: number | string = 0;
      let displaySub = '';

      if (activeCategory === 'topPerformers') {
        const csPts = (player.position === 'DEF' || player.position === 'GK') ? cs * 5 : (player.position === 'MID' ? cs * 2 : 0);
        const impactScore = g * 5 + a * 3 + csPts + Math.max(0, (rating - 5.0) * 4);
        value = Math.round(impactScore);
        displaySub = `⚽ ${g} Goals | 👟 ${a} Assists | 🛡️ ${cs} CS | ⭐ ${rating.toFixed(2)}`;
      } else if (activeCategory === 'goals') {
        value = g;
        displaySub = `Rating: ${rating.toFixed(2)}`;
      } else if (activeCategory === 'assists') {
        value = a;
        displaySub = `Goals: ${g}`;
      } else if (activeCategory === 'cleanSheets') {
        value = cs;
        displaySub = `Position: ${player.position}`;
      }

      return {
        player,
        value,
        displaySub
      };
    }).sort((x, y) => Number(y.value) - Number(x.value));
  };

  const currentData = getLeaderboardData();

  const getTitleAndSubtitle = () => {
    const compName = competition === 'cup' ? 'Cup' : 'League';
    if (activeCategory === 'goals') return { title: `${compName} Golden Boot (Top Scorers)`, subtitle: `Leading goalscorers across all ${compName.toLowerCase()} fixtures.` };
    if (activeCategory === 'assists') return { title: `${compName} Playmaker Award (Top Assists)`, subtitle: `Most assists provided in ${compName.toLowerCase()} fixtures.` };
    if (activeCategory === 'cleanSheets') return { title: `${compName} Golden Glove (Clean Sheets)`, subtitle: `Goalkeepers and defenders with clean sheets in ${compName.toLowerCase()} fixtures.` };
    return { title: `${compName} ${competition === 'cup' ? 'Cup Stars' : 'League Stars'}`, subtitle: `Highest impact scores based on goals, assists, clean sheets & ratings.` };
  };

  const { title, subtitle } = getTitleAndSubtitle();
  const metricLabel = activeCategory === 'topPerformers' ? 'Impact Score' : activeCategory === 'goals' ? 'Goals' : activeCategory === 'assists' ? 'Assists' : 'Clean Sheets';

  const starsLabel = competition === 'cup' ? 'Cup Stars' : 'League Stars';

  return (
    <div className="space-y-6">
      {competition !== 'cup' && latestPotm && (
        <div 
          className="mb-12 w-full max-w-[350px] mx-auto flex flex-col cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => {
            const player = players.find(p => p.name === latestPotm.playerName);
            if (player) {
              setSelectedProfile(player);
            }
          }}
        >
          {/* Trading Card Container */}
          <div className="relative bg-gradient-to-br from-[#800020] to-[#3a000c] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-2 border-[#a00028] flex flex-col w-full mb-6 relative" style={{ aspectRatio: '2.5 / 3.5' }}>
            
            {/* Top Bar */}
            <div className="p-5 md:p-6 flex justify-between items-start z-20 relative bg-black/20 backdrop-blur-sm border-b border-white/10 shrink-0">
              <div className="max-w-[75%]">
                <h2 className="text-2xl md:text-3xl font-black text-white leading-none tracking-tighter drop-shadow-md line-clamp-2">
                  {latestPotm.playerName}
                </h2>
              </div>
              {latestPotm.teamLogoUrl && (
                <img src={latestPotm.teamLogoUrl} alt="Team" className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-md z-20 bg-white/10 rounded-full p-1.5 shrink-0" />
              )}
            </div>

            {/* Stat Focus & Main Visual */}
            <div className="flex-1 relative w-full h-full flex min-h-0">
              {/* Left Column Stats */}
              <div className="absolute left-5 top-6 z-30 flex flex-col items-start w-28">
                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Average Rating</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-sky-400"></div>
                  <span className="text-3xl md:text-4xl font-black text-white leading-none drop-shadow-lg">{latestPotm.score}</span>
                </div>
              </div>

              {/* Transparent PNG Cutout */}
              <img 
                src={latestPotm.graphicUrl} 
                className="absolute bottom-0 inset-x-0 h-[105%] w-full object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] z-20 pointer-events-none" 
                alt={latestPotm.playerName} 
              />
              
              {/* Background styling elements */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/0 via-black/10 to-black/40 z-0"></div>
              
              {/* Vertical Sidebar Label */}
              <div className="absolute right-0 top-0 bottom-0 w-10 border-l border-white/10 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px]">
                <div className="rotate-90 text-[10px] font-black text-amber-400/80 tracking-[0.4em] uppercase whitespace-nowrap drop-shadow-sm">
                  PLAYER OF THE MONTH • {latestPotm.month}
                </div>
              </div>
            </div>
          </div>
          
          {/* Card Footer - Crisp White Container */}
          {(latestPotm.headline || latestPotm.description) && (
            <div className="bg-white rounded-[2rem] p-6 shadow-xl">
              {latestPotm.headline && (
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{latestPotm.headline}</h3>
              )}
              {latestPotm.description && (
                <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-3">{latestPotm.description}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category Toggle Header */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 flex flex-col xl:flex-row items-center justify-between gap-4 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-black text-slate-100 tracking-tight uppercase flex items-center gap-2">
            {competition === 'cup' ? 'Cup Player Stats & Awards' : 'League Player Stats & Awards'}
          </h2>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl w-full xl:w-auto border border-slate-800 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveCategory('goals')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'goals'
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold ring-2 ring-amber-400/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-950 fill-amber-950" />
            <span>Top Scorers</span>
          </button>

          <button
            onClick={() => setActiveCategory('assists')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'assists'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Top Assister</span>
          </button>

          <button
            onClick={() => setActiveCategory('cleanSheets')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'cleanSheets'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Clean Sheets</span>
          </button>

          <button
            onClick={() => setActiveCategory('topPerformers')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeCategory === 'topPerformers'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>{starsLabel}</span>
          </button>
        </div>
      </div>

      {/* Master Leaderboard Widget Deployment */}
      <MasterLeaderboardWidget
        title={title}
        subtitle={subtitle}
        players={currentData}
        teamsMap={teamsMap}
        metricLabel={metricLabel}
      />

      {selectedProfile && (
        <PlayerProfileModal
          player={selectedProfile}
          team={teamsMap.get(selectedProfile.teamId)}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};
