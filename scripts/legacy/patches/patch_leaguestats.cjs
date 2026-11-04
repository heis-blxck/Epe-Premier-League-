const fs = require('fs');
let code = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

const imports = `import React, { useState, useEffect } from 'react';
import { LeagueStats as StatsType, Team, Player, PlayerOfTheWeek } from '../types';
import { api } from '../services/api';`;

code = code.replace(
  /import React, \{ useState \} from 'react';\nimport \{ LeagueStats as StatsType, Team, Player \} from '\.\.\/types';/,
  imports
);

const fetchCode = `
  const [potwList, setPotwList] = useState<PlayerOfTheWeek[]>([]);

  useEffect(() => {
    api.getPlayerOfTheWeek().then(data => {
      setPotwList(data.sort((a, b) => b.gameweekNumber - a.gameweekNumber));
    }).catch(console.error);
  }, []);

  const latestPotw = potwList[0];
  const potwPlayer = latestPotw ? players.find(p => p.id === latestPotw.playerId) || (stats.topScorers.find(p => p.id === latestPotw.playerId) || stats.topAssists.find(p => p.id === latestPotw.playerId)) : null; // wait, we don't have all players in LeagueStats, just top lists. Let's just use the graphicUrl.
`;

code = code.replace(
  'const { players, label, metricName } = getPlayersList();',
  `${fetchCode}\n  const { players, label, metricName } = getPlayersList();`
);

const bannerCode = `
      {latestPotw && (
        <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-1 mb-8 overflow-hidden shadow-2xl relative">
          <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-amber-400 border border-amber-400/30 flex items-center gap-2 z-10">
            <Trophy className="w-4 h-4" />
            POTW • Gameweek {latestPotw.gameweekNumber}
          </div>
          <img src={latestPotw.graphicUrl} className="w-full object-cover rounded-2xl h-48 sm:h-64 md:h-80 opacity-90" alt="Player of the Week" />
        </div>
      )}
`;

code = code.replace(
  /<div className="space-y-6">/g,
  `<div className="space-y-6">\n${bannerCode}`
);

// We need Trophy from lucide-react
code = code.replace(
  'import { Flame, Award, ShieldCheck, User } from \'lucide-react\';',
  'import { Flame, Award, ShieldCheck, User, Trophy } from \'lucide-react\';'
);

fs.writeFileSync('src/components/LeagueStats.tsx', code);
