const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const searchFiltersRow = `
                {/* SEARCH & FILTERS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search player or team..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <select
                      value={positionFilter}
                      onChange={(e) => setPositionFilter(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">All Pos</option>
                      <option value="GK">Goalkeepers</option>
                      <option value="DEF">Defenders</option>
                      <option value="MID">Midfielders</option>
                      <option value="FWD">Forwards</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">All Teams</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.shortName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">All Prices</option>
                      <option value="UNDER_6">Under ₦6.0M</option>
                      <option value="6_TO_8">₦6.0M - ₦8.0M</option>
                      <option value="OVER_8">Over ₦8.0M</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 mb-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                  <span className="text-xs text-slate-400 font-bold">Sort Market:</span>
                  <button 
                    onClick={() => setSortByPoints(!sortByPoints)}
                    className={\`text-xs font-black px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors \${sortByPoints ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' : 'bg-slate-950 text-slate-300 border-slate-700'}\`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    {sortByPoints ? 'Highest Total Points' : 'Default (Price)'}
                  </button>
                </div>
`;

code = code.replace(
  /\{\/\* SEARCH & FILTERS ROW \*\/\}[\s\S]*?\{\/\* MARKETPLACE PLAYERS LIST \*\/\}/,
  searchFiltersRow + '\n                {/* MARKETPLACE PLAYERS LIST */}'
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
