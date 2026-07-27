import React, { useState } from 'react';
import { Player, Team } from '../types';
import { api } from '../services/api';
import { Coins, Search, Save } from 'lucide-react';

interface PlayerValuationManagerProps {
  players: Player[];
  teams: Team[];
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const PlayerValuationManager: React.FC<PlayerValuationManagerProps> = ({
  players,
  teams,
  onRefresh,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');

  const [editedState, setEditedState] = useState<Record<string, { price: number }>>({});
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);

  const teamMap = new Map<string, Team>(teams.map(t => [t.id, t]));

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === 'all' || p.teamId === teamFilter;
    const matchesPos = positionFilter === 'all' || p.position === positionFilter;
    return matchesSearch && matchesTeam && matchesPos;
  });

  const getPlayerState = (p: Player) => {
    if (editedState[p.id]) return editedState[p.id];
    return {
      price: p.price || 6.0
    };
  };

  const handlePriceStep = (p: Player, delta: number) => {
    const current = getPlayerState(p);
    const newPrice = Math.max(3.0, Math.min(25.0, Number((current.price + delta).toFixed(1))));
    setEditedState(prev => ({
      ...prev,
      [p.id]: { ...current, price: newPrice }
    }));
  };

  const handlePriceChange = (p: Player, valStr: string) => {
    const num = parseFloat(valStr);
    const current = getPlayerState(p);
    if (!isNaN(num)) {
      setEditedState(prev => ({
        ...prev,
        [p.id]: { ...current, price: num }
      }));
    }
  };

  const handleSaveValuation = async (p: Player) => {
    const state = getPlayerState(p);
    try {
      setSavingPlayerId(p.id);
      await api.updatePlayerValuation(
        p.id,
        state.price,
        !!p.isSuspended,
        !!p.isInjured,
        p.injuryStatus || 'Fit',
        p.suspensionWeeks || 1
      );
      onShowToast(`Updated valuation for ${p.name} to ₦${state.price.toFixed(1)}M`);
      onRefresh();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to update player valuation');
    } finally {
      setSavingPlayerId(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-white space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            Player Valuations
          </h3>
          <p className="text-xs text-slate-400 mt-1">Adjust Fantasy Prices (₦M) for the upcoming gameweek</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
        >
          <option value="all">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
        >
          <option value="all">All Pos</option>
          <option value="GK">Goalkeepers</option>
          <option value="DEF">Defenders</option>
          <option value="MID">Midfielders</option>
          <option value="FWD">Forwards</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <th className="py-3 px-4 rounded-tl-xl">Player</th>
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-4">Pos</th>
              <th className="py-3 px-4 text-center">Fantasy Price (₦M)</th>
              <th className="py-3 px-4 text-right rounded-tr-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
            {filteredPlayers.map(p => {
              const team = teamMap.get(p.teamId);
              const state = getPlayerState(p);
              const isModified = state.price !== (p.price || 6.0);

              return (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium flex items-center gap-2">
                    <img src={p.photoUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{team?.shortName || team?.name || 'FA'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-300">{p.position}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handlePriceStep(p, -0.1)} className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer">-</button>
                      <div className="relative w-20">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₦</span>
                        <input
                          type="number"
                          step="0.1"
                          min="3.0"
                          max="25.0"
                          value={state.price}
                          onChange={(e) => handlePriceChange(p, e.target.value)}
                          className={`w-full bg-slate-950 border ${isModified ? 'border-amber-500 text-amber-300' : 'border-slate-700 text-white'} rounded pl-6 pr-2 py-1 text-sm font-bold focus:outline-none focus:border-amber-400 text-center transition-colors`}
                        />
                      </div>
                      <button onClick={() => handlePriceStep(p, 0.1)} className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer">+</button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSaveValuation(p)}
                      disabled={savingPlayerId === p.id}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                        isModified ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingPlayerId === p.id ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
