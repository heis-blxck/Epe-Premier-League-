import React, { useState } from 'react';
import { Player, Team } from '../types';
import { api } from '../services/api';
import { UserX, Save, Search } from 'lucide-react';

interface PlayerAvailabilityManagerProps {
  players: Player[];
  teams: Team[];
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
}

export const PlayerAvailabilityManager: React.FC<PlayerAvailabilityManagerProps> = ({
  players,
  teams,
  onRefresh,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [editedState, setEditedState] = useState<Record<string, { isSuspended: boolean; suspensionWeeks: number; injuryStatus: 'Fit' | 'Injured' | 'Doubtful' }>>({});
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);

  const teamMap = new Map<string, Team>(teams.map(t => [t.id, t]));

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === 'all' || p.teamId === teamFilter;
    return matchesSearch && matchesTeam;
  });

  const getPlayerState = (p: Player) => {
    if (editedState[p.id]) return editedState[p.id];
    return {
      isSuspended: !!p.isSuspended,
      suspensionWeeks: p.suspensionWeeks || 1,
      injuryStatus: p.injuryStatus || (p.isInjured ? 'Injured' : 'Fit')
    };
  };

  const handleToggleSuspension = (p: Player) => {
    const current = getPlayerState(p);
    setEditedState(prev => ({
      ...prev,
      [p.id]: { ...current, isSuspended: !current.isSuspended }
    }));
  };

  const handleSuspensionWeeksChange = (p: Player, weeks: number) => {
    const current = getPlayerState(p);
    setEditedState(prev => ({
      ...prev,
      [p.id]: { ...current, suspensionWeeks: weeks }
    }));
  };

  const handleInjuryChange = (p: Player, status: 'Fit' | 'Injured' | 'Doubtful') => {
    const current = getPlayerState(p);
    setEditedState(prev => ({
      ...prev,
      [p.id]: { ...current, injuryStatus: status }
    }));
  };

  const handleSave = async (p: Player) => {
    const state = getPlayerState(p);
    try {
      setSavingPlayerId(p.id);
      await api.updatePlayerValuation(
        p.id,
        p.price || 6.0,
        state.isSuspended,
        state.injuryStatus === 'Injured',
        state.injuryStatus,
        state.suspensionWeeks
      );
      onShowToast(`Updated availability for ${p.name}`);
      onRefresh();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to update player availability');
    } finally {
      setSavingPlayerId(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-white space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Player Availability & Suspensions</h3>
          <p className="text-xs text-slate-400">Manage player red card suspensions, yellow card accumulation bans, and injury fitness flags</p>
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4">Team</th>
              <th className="py-3 px-4">Position</th>
              <th className="py-3 px-4">Suspension Status</th>
              <th className="py-3 px-4">Injury Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
            {filteredPlayers.map(p => {
              const team = teamMap.get(p.teamId);
              const state = getPlayerState(p);
              const isModified =
                state.isSuspended !== !!p.isSuspended ||
                state.injuryStatus !== (p.injuryStatus || (p.isInjured ? 'Injured' : 'Fit'));

              return (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-medium flex items-center gap-2">
                    <img src={p.photoUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400">#{(p.shirtNumber || 10)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{team?.name || 'Free Agent'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-300">{p.position}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSuspension(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          state.isSuspended ? 'bg-red-900/80 text-red-200 border border-red-500 animate-pulse' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        {state.isSuspended ? 'Suspended' : 'Available'}
                      </button>
                      {state.isSuspended && (
                        <select
                          value={state.suspensionWeeks}
                          onChange={(e) => handleSuspensionWeeksChange(p, Number(e.target.value))}
                          className="bg-slate-800 border border-red-500 rounded-lg px-2 py-1 text-xs text-red-200 font-bold"
                        >
                          <option value={1}>1 GW</option>
                          <option value={2}>2 GW</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={state.injuryStatus}
                      onChange={(e) => handleInjuryChange(p, e.target.value as any)}
                      className={`bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold ${
                        state.injuryStatus === 'Injured' ? 'border-red-500 text-red-300 bg-red-950/40' :
                        state.injuryStatus === 'Doubtful' ? 'border-amber-500 text-amber-300 bg-amber-950/40' :
                        'border-slate-700 text-emerald-300'
                      }`}
                    >
                      <option value="Fit">🟢 Fit (100%)</option>
                      <option value="Doubtful">🟡 Doubtful</option>
                      <option value="Injured">🔴 Injured (Out)</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSave(p)}
                      disabled={savingPlayerId === p.id}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer ${
                        isModified ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg animate-pulse' : 'bg-slate-800 text-slate-300'
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
