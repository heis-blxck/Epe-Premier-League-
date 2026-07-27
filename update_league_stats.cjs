const fs = require('fs');

let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

// Add import
content = content.replace(
  'import { Flame, Award, ShieldCheck, User, Trophy } from "lucide-react";',
  'import { Flame, Award, ShieldCheck, User, Trophy } from "lucide-react";\nimport { PlayerProfileModal } from "./PlayerProfileModal";'
);

// Add state
content = content.replace(
  'const [activeCategory, setActiveCategory] = useState<\'goals\' | \'assists\' | \'cleanSheets\'>(\'goals\');',
  'const [activeCategory, setActiveCategory] = useState<\'goals\' | \'assists\' | \'cleanSheets\'>(\'goals\');\n  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);'
);

// Make 2nd place clickable
content = content.replace(
  '<div className="flex flex-col items-center text-center space-y-2 order-1">',
  '<div className="flex flex-col items-center text-center space-y-2 order-1 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedPlayer(top3[1])}>'
);

// Make 1st place clickable
content = content.replace(
  '<div className="flex flex-col items-center text-center space-y-2 order-2 -mt-4">',
  '<div className="flex flex-col items-center text-center space-y-2 order-2 -mt-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedPlayer(top3[0])}>'
);

// Make 3rd place clickable
content = content.replace(
  '<div className="flex flex-col items-center text-center space-y-2 order-3">',
  '<div className="flex flex-col items-center text-center space-y-2 order-3 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedPlayer(top3[2])}>'
);

// Make list items clickable
content = content.replace(
  '<div key={player.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/60 px-2.5 rounded-xl transition-colors">',
  '<div key={player.id} onClick={() => setSelectedPlayer(player)} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/60 px-2.5 rounded-xl transition-colors cursor-pointer">'
);

// Add modal at the end
content = content.replace(
  '    </div>\n  );\n};',
  '      {selectedPlayer && (\n        <PlayerProfileModal player={selectedPlayer} team={teamsMap.get(selectedPlayer.teamId)} onClose={() => setSelectedPlayer(null)} />\n      )}\n    </div>\n  );\n};'
);

fs.writeFileSync('src/components/LeagueStats.tsx', content);
console.log("Updated LeagueStats.tsx");
