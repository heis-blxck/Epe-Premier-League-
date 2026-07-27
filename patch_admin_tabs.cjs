const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// We will add activePanel state
if (!code.includes('const [activePanel, setActivePanel]')) {
  code = code.replace(
    /const \[adminTab, setAdminTab\] = useState<[^>]+>\('controller'\);/,
    `const [activePanel, setActivePanel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [adminTab, setAdminTab] = useState<'controller' | 'events' | 'ratings' | 'squads' | 'transfers' | 'players' | 'teams' | 'standings' | 'branding' | 'news' | 'admins' | 'fixtures' | 'bulk_upload' | 'valuations' | 'ads' | 'potw' | 'lineups' | 'fantasy_config'>('controller');`
  );
}

const isNewsReporter = `const isNewsReporter = currentAdmin?.role === 'news_reporter';`;
if (code.includes(isNewsReporter) && !code.includes('setActivePanel(5);')) {
  code = code.replace(
    /useEffect\(\(\) => \{\s*if \(isNewsReporter\) \{\s*setAdminTab\('news'\);\s*\}\s*\}, \[isNewsReporter\]\);/,
    `useEffect(() => {
    if (isNewsReporter) {
      setActivePanel(5);
      setAdminTab('news');
    }
  }, [isNewsReporter]);`
  );
}

// Find the tabs block and replace it
const startToken = '<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">';
const endToken = '</div>';
let startIndex = code.indexOf(startToken);

if (startIndex !== -1) {
  // We need to find the matching closing div for this block
  let depth = 0;
  let endIndex = -1;
  const substring = code.substring(startIndex);
  
  // This is a naive parsing, let's just use regex for replacing the whole block if possible, 
  // or better, just write a robust parser.
  let i = 0;
  while (i < substring.length) {
    if (substring.substring(i, i + 4) === '<div') {
      depth++;
      i += 4;
    } else if (substring.substring(i, i + 6) === '</div>') {
      depth--;
      if (depth === 0) {
        endIndex = startIndex + i + 6;
        break;
      }
      i += 6;
    } else {
      i++;
    }
  }

  if (endIndex !== -1 && !code.includes('Panel 1: Match Management')) {
    const newTabs = `
        <div className="flex flex-col gap-4 mb-6">
          {/* Main Panel Navigation */}
          <div className="flex flex-wrap gap-2 p-2 bg-slate-900 rounded-2xl border border-slate-800">
            {!isNewsReporter && (
              <>
                <button onClick={() => { setActivePanel(1); setAdminTab('fixtures'); }} className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${activePanel === 1 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}\`}>Panel 1: Match Management</button>
                <button onClick={() => { setActivePanel(2); setAdminTab('standings'); }} className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${activePanel === 2 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}\`}>Panel 2: Standings & Data</button>
                <button onClick={() => { setActivePanel(3); setAdminTab('players'); }} className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${activePanel === 3 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}\`}>Panel 3: Valuations & Stats</button>
                <button onClick={() => { setActivePanel(4); setAdminTab('fantasy_config'); }} className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${activePanel === 4 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}\`}>Panel 4: Fantasy Control</button>
              </>
            )}
            <button onClick={() => { setActivePanel(5); setAdminTab('news'); }} className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${activePanel === 5 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}\`}>Panel 5: Media & News</button>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {activePanel === 1 && !isNewsReporter && (
              <>
                <button onClick={() => setAdminTab('fixtures')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'fixtures' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Fixtures & Scheduler</button>
                <button onClick={() => setAdminTab('controller')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'controller' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Match Clock & Stats</button>
                <button onClick={() => setAdminTab('lineups')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'lineups' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Lineups</button>
                <button onClick={() => setAdminTab('events')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'events' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Goal & Event Logger</button>
                <button onClick={() => setAdminTab('ratings')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'ratings' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Live Player Ratings & MOTM</button>
              </>
            )}
            {activePanel === 2 && !isNewsReporter && (
              <>
                <button onClick={() => setAdminTab('standings')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'standings' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Standings Override</button>
                <button onClick={() => setAdminTab('teams')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'teams' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Team Manager</button>
                <button onClick={() => setAdminTab('squads')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'squads' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Squad Manager</button>
                <button onClick={() => setAdminTab('transfers')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'transfers' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Transfer Engine</button>
              </>
            )}
            {activePanel === 3 && !isNewsReporter && (
              <>
                <button onClick={() => setAdminTab('players')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'players' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Player Stats</button>
                <button onClick={() => setAdminTab('valuations')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'valuations' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Player Valuations</button>
                <button onClick={() => setAdminTab('potw')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'potw' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Player of the Week</button>
                <button onClick={() => setAdminTab('bulk_upload')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'bulk_upload' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Bulk Upload</button>
              </>
            )}
            {activePanel === 4 && !isNewsReporter && (
              <>
                <button onClick={() => setAdminTab('fantasy_config')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'fantasy_config' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Fantasy Config & Chips</button>
              </>
            )}
            {activePanel === 5 && (
              <>
                <button onClick={() => setAdminTab('news')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'news' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>News & Gazette</button>
                {isSuperAdmin && <button onClick={() => setAdminTab('ads')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'ads' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Ad Placement</button>}
                {isSuperAdmin && <button onClick={() => setAdminTab('branding')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'branding' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>App Branding</button>}
                {isSuperAdmin && <button onClick={() => setAdminTab('admins')} className={\`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all \${adminTab === 'admins' ? 'bg-[#800020] text-amber-300 border border-rose-800' : 'bg-slate-900 text-slate-300'}\`}>Admin Management</button>}
              </>
            )}
          </div>
        </div>
`;
    code = code.substring(0, startIndex) + newTabs + code.substring(endIndex);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log("Replaced tabs successfully.");
  } else {
    console.log("Could not find matching div or already replaced.");
  }
} else {
  console.log("Start token not found.");
}
