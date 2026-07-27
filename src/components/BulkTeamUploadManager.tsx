import React, { useState } from 'react';
import { Team } from '../types';
import { api } from '../services/api';
import { Shield, AlertTriangle } from 'lucide-react';

interface BulkTeamUploadManagerProps {
  teams: Team[];
  onSuccess: () => void;
  onShowToast: (msg: string) => void;
}

export const BulkTeamUploadManager: React.FC<BulkTeamUploadManagerProps> = ({
  onSuccess,
  onShowToast
}) => {
  const [teamText, setTeamText] = useState<string>(
    `Epe United FC, EPE, Coach John, Epe Stadium\nAlaro City FC, ALR, Coach Mike, Alaro Arena\nPoka Lions FC, PKA, Coach David, Poka Turf`
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamText.trim()) {
      setError('Please enter team data in the text box.');
      return;
    }
    try {
      setIsUploading(true);
      setError(null);
      const res = await api.bulkUploadTeams(teamText);
      onShowToast(`Successfully imported ${res.importedCount} teams!`);
      setTeamText('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error occurred during bulk team upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-white">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#800020]/20 border border-[#800020]/40 rounded-xl text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Bulk Team Upload</h3>
            <p className="text-xs text-slate-400">Batch ingest league teams: Name, Short Name, Coach Name, Stadium</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Team Data (CSV format per line: Name, Short Name, Coach, Stadium)</label>
          <textarea
            rows={6}
            value={teamText}
            onChange={(e) => setTeamText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-400"
            placeholder="Epe United FC, EPE, Coach John, Epe Stadium"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-600 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? 'Importing Teams...' : 'Import Teams in Bulk'}
          </button>
        </div>
      </form>
    </div>
  );
};
