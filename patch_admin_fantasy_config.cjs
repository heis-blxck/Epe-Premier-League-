const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = "{adminTab === 'potw' && (";
const newPanel = `
      {adminTab === 'fantasy_config' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-6 backdrop-blur-sm text-slate-100">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Fantasy League Control
            </h3>
            <p className="text-xs text-slate-400">
              Manage marketplace adjustments, budget configurations, global metrics, and chip usage overview.
            </p>
          </div>
          
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
             <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-800">
               <Sliders className="w-8 h-8 text-amber-400 opacity-50" />
             </div>
             <div>
               <h4 className="font-bold text-lg text-white">Fantasy Engine Configuration</h4>
               <p className="text-sm text-slate-500 max-w-md mt-2">
                 Marketplace budget algorithms, chip tracking metrics, and points engine parameters are active. Global metrics will be generated after Gameweek 1.
               </p>
             </div>
             <button disabled className="mt-4 px-6 py-2 bg-slate-800 text-slate-500 font-bold text-sm rounded-xl border border-slate-700 cursor-not-allowed">
               Configuration Locked (Mid-Season)
             </button>
          </div>
        </div>
      )}

      {adminTab === 'potw' && (
`;

if (code.includes(target) && !code.includes("adminTab === 'fantasy_config' && (")) {
  code = code.replace(target, newPanel);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Admin Fantasy Config Panel added");
}
