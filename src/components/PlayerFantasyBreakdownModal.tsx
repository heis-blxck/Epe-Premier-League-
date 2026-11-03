import { useNavigate } from 'react-router-dom';
import { useURLModal } from '../hooks/useURLModal';
import React from 'react';
import { Player, Match } from '../types';
import { X } from 'lucide-react';


interface PlayerFantasyBreakdownModalProps {
  players: Player[];
  matches: Match[];
  selectedGw: number;
}

export const PlayerFantasyBreakdownModal: React.FC<PlayerFantasyBreakdownModalProps> = ({
  players,
  matches,
  selectedGw
}) => {
  const { isOpen, closeModal, modalData } = useURLModal<{ playerId?: string }>('fantasyBreakdown');
  
  if (!isOpen || !modalData?.playerId) return null;
  const player = players.find(p => p.id === modalData.playerId);
  if (!player) return null;
  
  const gwMatches = matches.filter(m => m.matchday === selectedGw && (m.homeTeamId === player.teamId || m.awayTeamId === player.teamId));
  
  let totalPts = 0;
  const breakdownItems: { label: string; pts: number; desc: string }[] = [];

  gwMatches.forEach(m => {
    if (m.status === 'Scheduled') return;
    const isHome = m.homeTeamId === player.teamId;
    const goalsConceded = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
    const events = m.events || [];

    // Appearance
    breakdownItems.push({ label: 'Minutes Played (Appearance)', pts: 2, desc: 'Played in match' });

    let goals = 0;
    let assists = 0;
    let yellowCards = 0;
    let redCards = 0;

    events.forEach(e => {
      const typeStr = e.eventType as string;
      if ((typeStr === 'Goal' || typeStr === 'Penalty Goal' || typeStr === 'penalty') && e.goalType !== 'own_goal') {
        if (e.playerId === player.id) goals++;
      }
      const isAssister = e.assisterId === player.id || (e as any).assistPlayerId === player.id;
      if (isAssister && (typeStr === 'Goal' || typeStr === 'Penalty Goal') && e.goalType !== 'own_goal') assists++;
      if (typeStr === 'Yellow Card' && e.playerId === player.id) yellowCards++;
      if (typeStr === 'Red Card' && e.playerId === player.id) redCards++;
    });

    if (goals > 0) {
      const gPtsPerGoal = player.position === 'GK' || player.position === 'DEF' ? 6 : player.position === 'MID' ? 5 : 4;
      const gPts = goals * gPtsPerGoal;
      breakdownItems.push({ label: `${goals}x Goal(s) Scored (${player.position})`, pts: gPts, desc: `${gPtsPerGoal} pts per goal` });
    }

    if (assists > 0) {
      const aPts = assists * 3;
      breakdownItems.push({ label: `${assists}x Assist(s)`, pts: aPts, desc: '3 pts per assist' });
    }

    const cs = goalsConceded === 0 && (player.position === 'GK' || player.position === 'DEF' || player.position === 'MID');
    if (cs) {
      const csPts = player.position === 'GK' || player.position === 'DEF' ? 4 : 1;
      breakdownItems.push({ label: 'Clean Sheet', pts: csPts, desc: 'Conceded 0 goals' });
    }

    if (yellowCards > 0) {
      breakdownItems.push({ label: `${yellowCards}x Yellow Card`, pts: yellowCards * -1, desc: '-1 pt per yellow' });
    }
    if (redCards > 0) {
      breakdownItems.push({ label: `${redCards}x Red Card`, pts: redCards * -3, desc: '-3 pts per red' });
    }

    if (m.ratings && m.ratings[player.id]) {
      const r = m.ratings[player.id];
      let rPts = 0;
      if (r >= 8.5) rPts = 3;
      else if (r >= 7.5) rPts = 2;
      else if (r >= 7.0) rPts = 1;
      if (rPts > 0) {
        breakdownItems.push({ label: `Match Rating Bonus (${r.toFixed(1)})`, pts: rPts, desc: 'Performance rating bonus' });
      }
    }
  });

  totalPts = breakdownItems.reduce((acc, item) => acc + item.pts, 0);
  if (totalPts < 0 && gwMatches.length > 0) totalPts = 0;

  // Form history per gameweek (1 to 12)
  const allGws = Array.from({ length: 12 }, (_, i) => i + 1);
  const gwPointsHistory = allGws.map(gw => {
    const gwMs = matches.filter(m => m.matchday === gw && (m.homeTeamId === player.teamId || m.awayTeamId === player.teamId));
    let pts = 0;
    gwMs.forEach(m => {
      if (m.status === 'Scheduled') return;
      const isHome = m.homeTeamId === player.teamId;
      const gc = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      const evs = m.events || [];
      pts += 2;
      evs.forEach(e => {
        if (e.eventType === 'Goal' && e.playerId === player.id) {
          pts += (player.position === 'GK' || player.position === 'DEF' ? 6 : player.position === 'MID' ? 5 : 4);
        }
        const isAssister = e.assisterId === player.id || (e as any).assistPlayerId === player.id;
        if (isAssister && (e.eventType === 'Goal' || (e.eventType as string) === 'Penalty Goal')) pts += 3;
      });
      if (gc === 0 && (player.position === 'GK' || player.position === 'DEF')) pts += 4;
    });
    return { gw, pts };
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeModal} />
      <div className="relative w-full max-w-lg bg-slate-950 rounded-[2.5rem] p-6 shadow-2xl border border-slate-800 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-rose-500/40 bg-slate-900">
              <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover object-top" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{player.name}</h3>
              <p className="text-xs font-bold text-rose-300">{player.position} &bull; #{player.shirtNumber}</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 rounded-full bg-slate-900 text-slate-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GW Points & Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#800020] to-slate-900 p-4 rounded-2xl border border-rose-900/40">
            <div>
              <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">Gameweek {selectedGw} Points</span>
              <h4 className="text-3xl font-black text-amber-300">{totalPts} pts</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-amber-300 font-bold">
              ⚽
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
            <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Itemized Breakdown</h5>
            {breakdownItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No points recorded for Gameweek {selectedGw} yet.</p>
            ) : (
              breakdownItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0">
                  <div>
                    <p className="font-bold text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                  <span className={`font-black px-2 py-0.5 rounded ${item.pts > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {item.pts > 0 ? `+${item.pts}` : item.pts} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form Indicator Dashboard */}
        <div className="space-y-2">
          <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Form Indicator (Points per Gameweek)</h5>
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 grid grid-cols-6 gap-2 text-center">
            {gwPointsHistory.map(g => (
              <div key={g.gw} className={`p-2 rounded-xl border ${g.gw === selectedGw ? 'bg-[#800020]/40 border-rose-500' : 'bg-slate-950/60 border-slate-800'}`}>
                <span className="text-[10px] font-bold text-slate-400 block">GW {g.gw}</span>
                <span className="text-sm font-black text-amber-300 block mt-1">{g.pts}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
