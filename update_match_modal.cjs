const fs = require('fs');

let content = fs.readFileSync('src/components/MatchDetailModal.tsx', 'utf8');

// Add PlayerProfileModal import
content = content.replace(
  'import { Pitch2D } from \'./Pitch2D\';',
  'import { Pitch2D } from \'./Pitch2D\';\nimport { PlayerProfileModal } from \'./PlayerProfileModal\';\nimport { Player, Team } from \'../types\';'
);

// We need to fix duplicate imports of Match, Player, Team if they exist, but let's just do a blanket replace if needed.
// Actually, let's just use string replace carefully.
content = content.replace(
  'interface MatchDetailModalProps {\n  match: Match;\n  onClose: () => void;\n}',
  'interface MatchDetailModalProps {\n  match: Match;\n  players?: Player[];\n  teams?: Team[];\n  onClose: () => void;\n}'
);

content = content.replace(
  'export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, onClose }) => {',
  'export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, players = [], teams = [], onClose }) => {\n  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<Player | null>(null);'
);

// Find the Pitch2D invocations and add onPlayerClick
content = content.replace(
  '<Pitch2D\n                  lineup={match.homeLineup}\n                  teamName={match.homeTeam?.name}\n                  ratings={match.ratings}\n                />',
  '<Pitch2D\n                  lineup={match.homeLineup}\n                  teamName={match.homeTeam?.name}\n                  ratings={match.ratings}\n                  onPlayerClick={(lp) => {\n                    const p = players.find(x => x.id === lp.playerId);\n                    if (p) setSelectedProfilePlayer(p);\n                  }}\n                />'
);

content = content.replace(
  '<Pitch2D\n                  lineup={match.awayLineup}\n                  teamName={match.awayTeam?.name}\n                  ratings={match.ratings}\n                />',
  '<Pitch2D\n                  lineup={match.awayLineup}\n                  teamName={match.awayTeam?.name}\n                  ratings={match.ratings}\n                  onPlayerClick={(lp) => {\n                    const p = players.find(x => x.id === lp.playerId);\n                    if (p) setSelectedProfilePlayer(p);\n                  }}\n                />'
);

// Add the modal at the very end
content = content.replace(
  '      </div>\n    </div>\n  );\n};',
  '      </div>\n      {selectedProfilePlayer && (\n        <PlayerProfileModal \n          player={selectedProfilePlayer} \n          team={teams.find(t => t.id === selectedProfilePlayer.teamId)} \n          onClose={() => setSelectedProfilePlayer(null)} \n        />\n      )}\n    </div>\n  );\n};'
);

fs.writeFileSync('src/components/MatchDetailModal.tsx', content);
console.log("Updated MatchDetailModal");
