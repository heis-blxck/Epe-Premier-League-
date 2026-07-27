const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const insightsUI = `
      {/* INSIGHTS & STATS TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-8 animate-fade-in">
          {/* Captaincy Favorite Hero */}
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-4 pl-1">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Global Captaincy Favorite</span>
            </h2>
            {captaincyFavorite ? (
              <div className="bg-gradient-to-r from-[#800020] via-rose-900 to-amber-700 p-6 sm:p-8 rounded-3xl shadow-2xl border border-amber-400/30 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
                <img 
                  src={captaincyFavorite.photoUrl} 
                  alt={captaincyFavorite.name} 
                  className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-full border-4 border-amber-300 shadow-xl relative z-10 bg-slate-950"
                />
                <div className="text-center sm:text-left relative z-10 space-y-2">
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 uppercase tracking-widest rounded-full">
                    Most Captained 
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">{captaincyFavorite.name}</h3>
                  <p className="text-amber-200 text-sm font-bold uppercase tracking-widest">
                    {teamMap.get(captaincyFavorite.teamId)?.name} • {captaincyFavorite.position}
                  </p>
                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs font-bold text-rose-100">
                    <span className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                      Owned by {( (ownershipCount.get(captaincyFavorite.id) || 0) / (allSquads.length || 1) * 100 ).toFixed(1)}%
                    </span>
                    <span className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                      Total Points: {captaincyFavorite.fantasyPoints || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-sm font-bold">
                No captaincy data available yet.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Performers (Gameweek Kings) */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 pl-1">
                <Flame className="w-5 h-5 text-rose-400" />
                <span>Gameweek Kings</span>
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
                {topPerformers.map((p, idx) => (
                  <div key={p.id} className="min-w-[200px] flex-shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-4 snap-start relative group">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center text-xs font-black text-slate-400 shadow-lg">
                      #{idx + 1}
                    </div>
                    <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-400 mb-3 bg-slate-800" />
                    <div className="text-center">
                      <p className="font-extrabold text-sm text-white truncate px-2">{p.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">{p.position}</p>
                      <div className="bg-amber-400/10 text-amber-400 border border-amber-400/20 py-2 rounded-xl text-lg font-black">
                        {p.fantasyPoints || 0} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Trends (Most Bought) */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 pl-1">
                <ArrowUp className="w-5 h-5 text-emerald-400" />
                <span>Market Trends (Most Bought)</span>
              </h2>
              <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
                {mostOwnedPlayers.map((p, idx) => {
                  const ownedCount = ownershipCount.get(p.id) || 0;
                  const percent = allSquads.length > 0 ? ((ownedCount / allSquads.length) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl"></div>
                      <div className="font-black text-slate-600 text-lg w-4 text-right">{idx + 1}</div>
                      <img src={p.photoUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700" />
                      <div className="flex-1">
                        <p className="font-black text-white text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{teamMap.get(p.teamId)?.shortName} • {p.position}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase">Selected By</div>
                        <div className="text-sm font-black text-white">{percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  /(\s*\<\/div\>\s*\)\}\s*\<\/div\>\s*\);\s*\};\s*\/\/\s*COMPONENT:\s*PITCH\s*PLAYER\s*CARD)/,
  `\n${insightsUI}$1`
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
