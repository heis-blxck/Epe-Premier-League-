const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldBlock = `            {isResettingFantasy ? (
              <button disabled className="bg-rose-950 text-rose-400 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 opacity-70">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Wiping...
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to wipe all fantasy test data?')) {
                    setIsResettingFantasy(true);
                    try {
                      const res = await fetch('/api/admin/reset-fantasy-test', { method: 'POST' });
                      if (res.ok) {
                        alert('Test Data Wiped! Refreshing...');
                        window.location.reload();
                      } else {
                        alert('Error resetting data');
                      }
                    } catch (e) {
                      alert('Error resetting data');
                    } finally {
                      setIsResettingFantasy(false);
                    }
                  }
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.5)] flex items-center gap-1.5 cursor-pointer animate-pulse border-2 border-rose-400"
              >
                <Trash2 className="w-4 h-4" />
                RESET FANTASY TEST DATA
              </button>
            )}`;

const newBlock = `            {isResettingFantasy === 'confirming' ? (
              <div className="flex items-center gap-2 bg-rose-950 p-2 rounded-xl border border-rose-700">
                <span className="text-[11px] font-bold text-rose-200 px-1">Wipe fantasy test data?</span>
                <button
                  onClick={async () => {
                    setIsResettingFantasy('wiping');
                    try {
                      const res = await fetch('/api/admin/reset-fantasy-test', { method: 'POST' });
                      if (res.ok) {
                        showToast('Test Data Wiped! Refreshing...');
                        setTimeout(() => window.location.reload(), 1500);
                      } else {
                        showToast('Error resetting data');
                      }
                    } catch (e) {
                      showToast('Error resetting data');
                    } finally {
                      if (isResettingFantasy !== 'wiping') setIsResettingFantasy(false);
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Yes, Wipe
                </button>
                <button
                  onClick={() => setIsResettingFantasy(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : isResettingFantasy === 'wiping' ? (
              <button disabled className="bg-rose-950 text-rose-400 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 opacity-70">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Wiping...
              </button>
            ) : (
              <button
                onClick={() => setIsResettingFantasy('confirming')}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.5)] flex items-center gap-1.5 cursor-pointer animate-pulse border-2 border-rose-400"
              >
                <Trash2 className="w-4 h-4" />
                RESET FANTASY TEST DATA
              </button>
            )}`;

code = code.replace(oldBlock, newBlock);

code = code.replace(
  "const [isResettingFantasy, setIsResettingFantasy] = useState<boolean>(false);",
  "const [isResettingFantasy, setIsResettingFantasy] = useState<'confirming' | 'wiping' | false>(false);"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
