const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const bottomNav = `
      {/* FIXED BOTTOM NAV FOR ADMIN */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#800020] border-t border-[#5a0016] shadow-[0_-10px_30px_-10px_rgba(128,0,32,0.4)] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-2">
          {!isNewsReporter && (
            <>
              <button
                onClick={() => { setActivePanel(1); setAdminTab('fixtures'); }}
                className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activePanel === 1 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
              >
                <Play className={\`transition-all \${activePanel === 1 ? 'w-6 h-6' : 'w-5 h-5'}\`} />
                <span className={\`font-bold tracking-wide transition-all \${activePanel === 1 ? 'text-[11px]' : 'text-[10px]'}\`}>Matches</span>
              </button>
              <button
                onClick={() => { setActivePanel(2); setAdminTab('standings'); }}
                className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activePanel === 2 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
              >
                <Trophy className={\`transition-all \${activePanel === 2 ? 'w-6 h-6' : 'w-5 h-5'}\`} />
                <span className={\`font-bold tracking-wide transition-all \${activePanel === 2 ? 'text-[11px]' : 'text-[10px]'}\`}>Data</span>
              </button>
              <button
                onClick={() => { setActivePanel(3); setAdminTab('players'); }}
                className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activePanel === 3 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
              >
                <Users className={\`transition-all \${activePanel === 3 ? 'w-6 h-6' : 'w-5 h-5'}\`} />
                <span className={\`font-bold tracking-wide transition-all \${activePanel === 3 ? 'text-[11px]' : 'text-[10px]'}\`}>Stats</span>
              </button>
              <button
                onClick={() => { setActivePanel(4); setAdminTab('fantasy_config'); }}
                className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activePanel === 4 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
              >
                <Sparkles className={\`transition-all \${activePanel === 4 ? 'w-6 h-6' : 'w-5 h-5'}\`} />
                <span className={\`font-bold tracking-wide transition-all \${activePanel === 4 ? 'text-[11px]' : 'text-[10px]'}\`}>Fantasy</span>
              </button>
            </>
          )}
          <button
            onClick={() => { setActivePanel(5); setAdminTab('news'); }}
            className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activePanel === 5 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
          >
            <Newspaper className={\`transition-all \${activePanel === 5 ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className={\`font-bold tracking-wide transition-all \${activePanel === 5 ? 'text-[11px]' : 'text-[10px]'}\`}>Media</span>
          </button>
        </div>
      </div>
`;

code = code.replace(
  '{toastMsg && (',
  bottomNav + '\n      {toastMsg && ('
);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Admin bottom nav patched");
