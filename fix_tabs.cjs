const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

// The block that starts with "{activeTab === 'insights'" might be messed up.
// Let's replace the whole duplicated mess.

const badPart = `{activeTab === 'insights' && (!players || players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4 font-bold animate-pulse">Loading fantasy stats...</p>
        </div>
      ) : (!players || players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4 font-bold animate-pulse">Loading fantasy stats...</p>
        </div>
      ) : (`

const goodPart = `{activeTab === 'insights' && (!players || players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4 font-bold animate-pulse">Loading fantasy stats...</p>
        </div>
      ) : (`;

code = code.replace(badPart, goodPart);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
