const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the Bottom Navigation Bar code
app = app.replace(
  /\{\/\* Bottom Navigation Bar \*\/\}.*?<\/div>\n      <\/div>/s,
  `{/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#800020] border-t border-[#5a0016] shadow-[0_-10px_30px_-10px_rgba(128,0,32,0.4)] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto pt-3 pb-4 px-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all duration-300 ease-spring \${activeTab === 'matches' ? 'text-amber-400 scale-110 -translate-y-1' : 'text-white/80 hover:text-white hover:scale-105'}\`}
          >
            <Radio className={\`w-6 h-6 transition-all \${activeTab === 'matches' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}\`} />
            <span className="text-[10px] font-bold tracking-wide">Matches</span>
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all duration-300 ease-spring \${activeTab === 'standings' ? 'text-amber-400 scale-110 -translate-y-1' : 'text-white/80 hover:text-white hover:scale-105'}\`}
          >
            <Trophy className={\`w-6 h-6 transition-all \${activeTab === 'standings' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}\`} />
            <span className="text-[10px] font-bold tracking-wide">Standings</span>
          </button>
          <button
            onClick={() => setActiveTab('cup')}
            className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all duration-300 ease-spring \${activeTab === 'cup' ? 'text-amber-400 scale-110 -translate-y-1' : 'text-white/80 hover:text-white hover:scale-105'}\`}
          >
            <Goal className={\`w-6 h-6 transition-all \${activeTab === 'cup' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}\`} />
            <span className="text-[10px] font-bold tracking-wide">Cup</span>
          </button>
          <button
            onClick={() => setActiveTab('fantasy')}
            className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all duration-300 ease-spring \${activeTab === 'fantasy' ? 'text-amber-400 scale-110 -translate-y-1' : 'text-white/80 hover:text-white hover:scale-105'}\`}
          >
            <Sparkles className={\`w-6 h-6 transition-all \${activeTab === 'fantasy' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}\`} />
            <span className="text-[10px] font-bold tracking-wide">Fantasy</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all duration-300 ease-spring \${activeTab === 'news' ? 'text-amber-400 scale-110 -translate-y-1' : 'text-white/80 hover:text-white hover:scale-105'}\`}
          >
            <Newspaper className={\`w-6 h-6 transition-all \${activeTab === 'news' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}\`} />
            <span className="text-[10px] font-bold tracking-wide">News</span>
          </button>
        </div>
      </div>`
);

fs.writeFileSync('src/App.tsx', app);
console.log("Updated bottom nav bar.");
