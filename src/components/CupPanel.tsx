import React, { useState } from 'react';
import { Match, Team, LeagueStats as StatsType, AdminUser } from '../types';
import { LeagueCupBracket } from './LeagueCupBracket';
import { LeagueStats } from './LeagueStats';
import { api } from '../services/api';

interface CupPanelProps {
  matches: Match[];
  teams: Team[];
  standings: Team[];
  stats: StatsType;
  setSelectedMatch: (match: Match) => void;
  currentAdmin?: AdminUser | null;
  triggerToast: (msg: string) => void;
  loadData: () => void;
}

export const CupPanel: React.FC<CupPanelProps> = ({
  matches,
  teams,
  standings,
  stats,
  setSelectedMatch,
  currentAdmin,
  triggerToast,
  loadData
}) => {
  const [activeSection, setActiveSection] = useState<'fixtures' | 'bracket' | 'stats'>('fixtures');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 w-full bg-slate-900/90 rounded-2xl p-2 shadow-2xl border border-slate-800">
        <button
          onClick={() => setActiveSection('fixtures')}
          className={`flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeSection === 'fixtures' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Fixtures
        </button>
        <button
          onClick={() => setActiveSection('bracket')}
          className={`flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeSection === 'bracket' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Cup Bracket
        </button>
        <button
          onClick={() => setActiveSection('stats')}
          className={`flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeSection === 'stats' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Player Stats
        </button>
      </div>

      {/* Fixtures Section */}
      {activeSection === 'fixtures' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
            Cup Fixtures
          </h2>
          <div className="flex items-center justify-center py-12 text-slate-400 font-medium border border-dashed border-slate-700 rounded-2xl bg-slate-950">
            No fixtures scheduled at this moment.
          </div>
        </div>
      )}

      {/* Bracket Section */}
      {activeSection === 'bracket' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <LeagueCupBracket
            matches={matches}
            teams={teams}
            standings={standings}
            onSelectMatch={setSelectedMatch}
            currentAdmin={currentAdmin}
            onScheduleCupMatch={async (cupMatchData) => {
              await api.saveMatch(cupMatchData);
              triggerToast('League Cup Match Scheduled!');
              loadData();
            }}
          />
        </div>
      )}

      {/* Stats Section */}
      {activeSection === 'stats' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <LeagueStats stats={stats} teams={teams} competition="cup" />
        </div>
      )}
    </div>
  );
};
