const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const newTabBtn = `
          <button
            onClick={() => setActiveTab('insights')}
            className={\`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer \${
              activeTab === 'insights'
                ? 'bg-[#800020] text-white shadow-lg shadow-red-950/50 border border-red-700'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }\`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Insights & Stats</span>
          </button>
`;

code = code.replace(
  /\<button\s*onClick=\{\(\) =\> setActiveTab\('mini_leagues'\)\}[\s\S]*?\<\/button\>/,
  `$&${newTabBtn}`
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
