const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const target = '{/* 2D FOOTBALL PITCH STAGE */}';
const newUI = `
              {/* CHIPS ACTIVATION TRAY */}
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Gameweek Chips
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Deploy a single-use chip to boost your score.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleActivateChip('TC')}
                    disabled={isGameweekLocked || !chips.tripleCaptainAvailable || activeChipThisGW !== null}
                    className={\`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer \${
                      activeChipThisGW === 'TC'
                        ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50 ring-offset-1 ring-offset-slate-900'
                        : chips.tripleCaptainAvailable && !isGameweekLocked && !activeChipThisGW
                        ? 'bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-400'
                        : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                    }\`}
                  >
                    TRIPLE CAPTAIN
                  </button>
                  <button
                    onClick={() => handleActivateChip('BB')}
                    disabled={isGameweekLocked || !chips.benchBoostAvailable || activeChipThisGW !== null}
                    className={\`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer \${
                      activeChipThisGW === 'BB'
                        ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-500/50 ring-offset-1 ring-offset-slate-900'
                        : chips.benchBoostAvailable && !isGameweekLocked && !activeChipThisGW
                        ? 'bg-slate-800 text-blue-400 border border-slate-700 hover:border-blue-400'
                        : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                    }\`}
                  >
                    BENCH BOOST
                  </button>
                  <button
                    onClick={() => handleActivateChip('WC')}
                    disabled={isGameweekLocked || !chips.wildcardAvailable || activeChipThisGW !== null}
                    className={\`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer \${
                      activeChipThisGW === 'WC'
                        ? 'bg-[#1cd861] text-slate-950 shadow-md ring-2 ring-[#1cd861]/50 ring-offset-1 ring-offset-slate-900'
                        : chips.wildcardAvailable && !isGameweekLocked && !activeChipThisGW
                        ? 'bg-slate-800 text-[#1cd861] border border-slate-700 hover:border-[#1cd861]'
                        : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                    }\`}
                  >
                    WILDCARD
                  </button>
                </div>
              </div>

              {/* 2D FOOTBALL PITCH STAGE */}
`;

if (code.includes(target) && !code.includes('CHIPS ACTIVATION TRAY')) {
  code = code.replace(target, newUI);
  fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
  console.log("Chips UI patched");
}
