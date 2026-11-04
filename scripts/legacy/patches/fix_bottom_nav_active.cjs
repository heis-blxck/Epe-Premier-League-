const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /\{(\/\* Bottom Navigation Bar \*\/)\}\s*<div className="fixed bottom-0 left-0 right-0 z-40 bg-\[#800020\] border-t border-\[#5a0016\] shadow-\[0_-10px_30px_-10px_rgba\(128,0,32,0\.4\)\] pb-safe">\s*<div className="flex items-center justify-around max-w-lg mx-auto pt-3 pb-4 px-2">.*?<\/div>\s*<\/div>/s,
  `{/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#800020] border-t border-[#5a0016] shadow-[0_-10px_30px_-10px_rgba(128,0,32,0.4)] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'matches' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
          >
            <Radio className={\`transition-all \${activeTab === 'matches' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className={\`font-bold tracking-wide transition-all \${activeTab === 'matches' ? 'text-[11px]' : 'text-[10px]'}\`}>Matches</span>
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'standings' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
          >
            <Trophy className={\`transition-all \${activeTab === 'standings' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className={\`font-bold tracking-wide transition-all \${activeTab === 'standings' ? 'text-[11px]' : 'text-[10px]'}\`}>Standings</span>
          </button>
          <button
            onClick={() => setActiveTab('cup')}
            className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'cup' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
          >
            <Goal className={\`transition-all \${activeTab === 'cup' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className={\`font-bold tracking-wide transition-all \${activeTab === 'cup' ? 'text-[11px]' : 'text-[10px]'}\`}>Cup</span>
          </button>
          <button
            onClick={() => setActiveTab('fantasy')}
            className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'fantasy' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
          >
            <Sparkles className={\`transition-all \${activeTab === 'fantasy' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className={\`font-bold tracking-wide transition-all \${activeTab === 'fantasy' ? 'text-[11px]' : 'text-[10px]'}\`}>Fantasy</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={\`flex flex-col items-center justify-center gap-1 min-w-[64px] py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 \${activeTab === 'news' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}\`}
          >
            <Newspaper className={\`transition-all \${activeTab === 'news' ? 'w-6 h-6' : 'w-5 h-5'}\`} />
            <span className={\`font-bold tracking-wide transition-all \${activeTab === 'news' ? 'text-[11px]' : 'text-[10px]'}\`}>News</span>
          </button>
        </div>
      </div>`
);

fs.writeFileSync('src/App.tsx', app);
console.log("Updated App.tsx bottom nav active state");
