const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

// 1. Add Firebase imports
code = code.replace(
  "import { api } from '../services/api';",
  "import { api } from '../services/api';\nimport { db } from '../firebase';\nimport { doc, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';"
);

// 2. Add state variables
code = code.replace(
  "const [isRegistering, setIsRegistering] = useState<boolean>(false);",
  "const [isRegistering, setIsRegistering] = useState<boolean>(false);\n  const [showResetSquadModal, setShowResetSquadModal] = useState(false);\n  const [isResettingSquad, setIsResettingSquad] = useState(false);"
);

// 3. Add handleResetSquad function
code = code.replace(
  "  useEffect(() => {\n    loadFantasyData();",
  `  const handleResetSquad = async () => {
    if (!mySquad?.id) return;
    setIsResettingSquad(true);
    try {
      await deleteDoc(doc(db, 'fantasySquads', mySquad.id));
      await updateDoc(doc(db, 'users', currentUser.id), {
        hasFantasyTeam: false,
        onboardingCompleted: false,
        fantasySquadId: deleteField(),
        fantasyTeamName: deleteField()
      });
      onShowToast('Fantasy Team permanently deleted.');
      if (onUpdateProfile) {
        await onUpdateProfile({
          email: currentUser.email,
          fantasyTeamName: ''
        });
      }
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      onShowToast(err.message || 'Error deleting squad');
      setIsResettingSquad(false);
    }
  };

  useEffect(() => {
    loadFantasyData();`
);

// 4. Add Danger Zone section in right sidebar
const dangerZoneHtml = `              <div className="mt-4 p-4 bg-rose-950/40 rounded-2xl border border-rose-900/50 space-y-3">
                <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider">Danger Zone</h4>
                <p className="text-[11px] text-slate-400">Permanently delete your fantasy team and wipe your points.</p>
                <button
                  onClick={() => setShowResetSquadModal(true)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-rose-500 border border-rose-900/50 hover:bg-rose-950/80 transition-all uppercase tracking-wider"
                >
                  Delete Fantasy Team
                </button>
              </div>`;

code = code.replace(
  `                  <li>Click "Save Team" to submit changes before kickoff.</li>
                </ol>
              </div>
            </div>
          </div>`,
  `                  <li>Click "Save Team" to submit changes before kickoff.</li>
                </ol>
              </div>
${dangerZoneHtml}
            </div>
          </div>`
);

// 5. Add Modal rendering right before the final closing div
const modalHtml = `      {showResetSquadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
              Delete Fantasy Team
            </h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Are you sure? This will permanently delete your squad and reset your fantasy points. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetSquadModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSquad}
                disabled={isResettingSquad}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isResettingSquad ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(
  "      {/* MANAGER SQUAD INSPECTION MODAL */}",
  `${modalHtml}\n\n      {/* MANAGER SQUAD INSPECTION MODAL */}`
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
