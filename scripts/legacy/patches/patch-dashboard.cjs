const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  "  const [resetTableConfirming, setResetTableConfirming] = useState<boolean>(false);",
  "  const [resetTableConfirming, setResetTableConfirming] = useState<boolean>(false);\n  const [isResettingFantasy, setIsResettingFantasy] = useState<boolean>(false);"
);

const newButtons = `            {isResettingFantasy ? (
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
            )}
            
            {resetTableConfirming ? (`;

code = code.replace("            {resetTableConfirming ? (", newButtons);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
