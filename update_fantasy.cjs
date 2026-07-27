const fs = require('fs');

let content = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

content = content.replace(
  "import {\n  Trophy,",
  "import { PlayerProfileModal } from './PlayerProfileModal';\nimport {\n  Trophy,"
);

content = content.replace(
  "const [activeTab, setActiveTab] = useState<'my_team' | 'transfers' | 'leaderboard' | 'mini_leagues' | 'insights'>('insights');",
  "const [activeTab, setActiveTab] = useState<'my_team' | 'transfers' | 'leaderboard' | 'mini_leagues' | 'insights'>('insights');\n  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<Player | null>(null);"
);

content = content.replace(
  /<div className="flex items-center gap-3">\n\s*<img\n\s*src={player.photoUrl}/g,
  '<div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedProfilePlayer(player)}>\n                          <img\n                            src={player.photoUrl}'
);

content = content.replace(
  '  return (\n    <div className="space-y-6">',
  '  return (\n    <div className="space-y-6">\n      {selectedProfilePlayer && (\n        <PlayerProfileModal\n          player={selectedProfilePlayer}\n          team={teams.find(t => t.id === selectedProfilePlayer.teamId)}\n          onClose={() => setSelectedProfilePlayer(null)}\n        />\n      )}'
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', content);
console.log("Updated FantasyLeagueView.tsx");
