const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!code.includes('import { PotwManager }')) {
  code = code.replace(
    "import { AdsManager } from './AdsManager';",
    "import { AdsManager } from './AdsManager';\nimport { PotwManager } from './PotwManager';"
  );
}

// Add the tab button
const potwTabButton = `
            <button
              onClick={() => setAdminTab('potw')}
              className={\`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap \${
                adminTab === 'potw'
                  ? 'border-amber-400 text-amber-400 font-bold bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/30 font-medium'
              }\`}
            >
              <Trophy className="w-4 h-4" />
              POTW
            </button>
`;

code = code.replace(
  /(\<button[\s\S]*?onClick=\{\(\) =\> setAdminTab\('ads'\)\}[\s\S]*?\<\/button\>)/,
  `$1\n${potwTabButton}`
);

// Add the tab content
const potwContent = `
          {adminTab === 'potw' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  Player of the Week (POTW)
                </h2>
                <p className="text-sm text-slate-400 mt-1">Upload and manage the player of the week graphic.</p>
              </div>
              <PotwManager players={players} teams={teams} />
            </div>
          )}
`;

code = code.replace(
  /(\{adminTab === 'ads' && \([\s\S]*?\<\/div\>\s*\)\})/,
  `$1\n${potwContent}`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
