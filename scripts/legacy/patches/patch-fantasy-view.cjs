const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

// replace the old return with the wizard
const importToAdd = `import { FantasyOnboardingWizard } from './FantasyOnboardingWizard';\n`;
if (!code.includes('FantasyOnboardingWizard')) {
  code = code.replace(/import React/, importToAdd + 'import React');
}

const oldRegistrationCode = `  if (!mySquad && !hasConfirmedParticipation && !(currentUser.fantasyTeamName && currentUser.fantasyTeamName.trim())) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 pb-24 font-sans">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center py-10 space-y-4">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              Epe Premier League Fantasy Manager
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
              Build your dream 18-man squad (2 GK, 6 DEF, 6 MID, 4 FWD, Max 3 per Club) within the ₦100.0M budget. 
              Earn points from real match performances and compete for ultimate glory.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md mx-auto space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" /> Participate in the Official Fantasy League
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
            Welcome! To participate in the Fantasy League, pick your 18-man squad (2 GK, 6 DEF, 6 MID, 4 FWD, Max 3 per Club) within the ₦100.0M salary cap, earn points from live match performance, compete in mini-leagues, and climb the Leaderboard.
            </p>

            {/* Gate 2 Required Input: Fantasy Team Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Fantasy Team Name *</span>
              <span className="text-rose-400">{teamNameError}</span>
              </label>
              <input
              type="text"
              placeholder="e.g. Dream FC"
              value={regFantasyTeamName}
              onChange={(e) => {
                setRegFantasyTeamName(e.target.value);
                setTeamNameError(null);
              }}
              onBlur={() => checkTeamNameAvailability(regFantasyTeamName)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={handleConfirmParticipation}
                disabled={isRegistering || !regFantasyTeamName.trim() || Boolean(teamNameError)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRegistering ? (
                <span>Registering...</span>
                ) : (
                <span>Confirm Fantasy Team Name & Join League &rarr;</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }`;

const newWizard = `  if (!mySquad && !hasConfirmedParticipation && !(currentUser.fantasyTeamName && currentUser.fantasyTeamName.trim())) {
    return (
      <FantasyOnboardingWizard
         currentUser={currentUser}
         players={players}
         onComplete={async () => {
            setHasConfirmedParticipation(true);
            await loadFantasyData();
         }}
         onShowToast={onShowToast}
         onUpdateProfile={onUpdateProfile}
      />
    );
  }`;

code = code.replace(oldRegistrationCode, newWizard);
fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
console.log('Patched view');
