import React, { useState } from 'react';
import { Team } from '../types';
import { api } from '../services/api';
import { Upload, Database, AlertTriangle, Users } from 'lucide-react';

interface BulkUploadManagerProps {
  teams: Team[];
  onSuccess: () => void;
  onShowToast: (msg: string) => void;
}

export const BulkUploadManager: React.FC<BulkUploadManagerProps> = ({
  teams,
  onSuccess,
  onShowToast
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [rosterText, setRosterText] = useState<string>(
    `Ahmad Garbadeen, Midfielder, 7.5\nIbrahim Salami, Goalkeeper, 4.5\nOlawale Jimoh, Defender, 5.5\nVictor Boniface, Forward, 9.0`
  );
  const [isUploadingRoster, setIsUploadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const handleRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setRosterError('Please select a target team.');
      return;
    }
    if (!rosterText.trim()) {
      setRosterError('Please enter player data in the text box.');
      return;
    }
    try {
      setIsUploadingRoster(true);
      setRosterError(null);
      const res = await api.bulkUploadRoster(selectedTeamId, rosterText);
      const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Team';
      onShowToast(`Successfully imported ${res.importedCount} players into ${teamName}!`);
      setRosterText('');
      onSuccess();
    } catch (err: any) {
      setRosterError(err.message || 'Error occurred during bulk roster upload');
    } finally {
      setIsUploadingRoster(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#800020]/20 border border-[#800020]/40 rounded-xl text-[#800020]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Bulk Upload Player Roster</h3>
            <p className="text-xs text-slate-400">Batch ingest squad rosters for selected clubs</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-[#800020]/30 border border-[#800020]/60 text-red-200 text-xs font-semibold rounded-full uppercase tracking-wider">
          Super Admin Restricted
        </span>
      </div>

      <form onSubmit={handleRosterSubmit} className="space-y-5">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Select Target Club / Team
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#800020]"
          >
            <option value="" disabled>-- Select Team --</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
            ))}
          </select>
        </div>
        
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Comma-Separated Roster Lines
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Format: [Player Name], [Position], [Fantasy Price in ₦M]
            </span>
          </div>
          <textarea
            rows={8}
            value={rosterText}
            onChange={(e) => {
              setRosterText(e.target.value);
              if (rosterError) setRosterError(null);
            }}
            placeholder={`Ahmad Garbadeen, Midfielder, 7.5\nIbrahim Salami, Goalkeeper, 4.5\nOlawale Jimoh, Defender, 5.5`}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-emerald-300 focus:outline-none focus:border-[#800020] placeholder-slate-600"
          />
          <p className="text-xs text-slate-400 mt-2">
            Valid positions: <span className="text-amber-300 font-medium">Goalkeeper (GK)</span>, <span className="text-amber-300 font-medium">Defender (DEF)</span>, <span className="text-amber-300 font-medium">Midfielder (MID)</span>, <span className="text-amber-300 font-medium">Forward (FWD)</span>.
          </p>
        </div>
        
        {rosterError && (
          <div className="p-3.5 bg-red-950/80 border-2 border-red-500 rounded-xl flex items-center gap-3 text-red-200 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-red-100">Upload Blocked: </span>
              <span>{rosterError}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploadingRoster}
            className="px-6 py-2.5 bg-[#800020] hover:bg-[#a00028] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {isUploadingRoster ? 'Processing Ingestion...' : 'Import Team Roster'}
          </button>
        </div>
      </form>
    </div>
  );
};
