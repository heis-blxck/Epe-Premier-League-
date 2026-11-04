const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
app = app.replace(
  'import { MatchDetailModal } from \'./components/MatchDetailModal\';',
  'import { MatchDetailModal } from \'./components/MatchDetailModal\';\nimport { TeamProfileModal } from \'./components/TeamProfileModal\';'
);

// Add state
app = app.replace(
  '  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);',
  '  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);\n  const [selectedTeamProfile, setSelectedTeamProfile] = useState<Team | null>(null);'
);

// Pass onSelectTeam to StandingsTable
// Need to find `<StandingsTable standings={standings} />`
app = app.replace(
  /<StandingsTable standings=\{standings\}\s*\/>/,
  '<StandingsTable standings={standings} onSelectTeam={setSelectedTeamProfile} />'
);

// We might have multiple StandingsTable instances. Let's find out how many.
app = app.replace(
  /<StandingsTable standings=\{standings\}\s*\/>/g,
  '<StandingsTable standings={standings} onSelectTeam={setSelectedTeamProfile} />'
);

// Add modal at the end, right after MatchDetailModal
app = app.replace(
  '      {/* Match Detail Modal Popup */}',
  `      {/* Team Profile Modal Popup */}\n      {selectedTeamProfile && (\n        <TeamProfileModal\n          team={selectedTeamProfile}\n          standings={standings}\n          players={players}\n          matches={matches}\n          onClose={() => setSelectedTeamProfile(null)}\n        />\n      )}\n\n      {/* Match Detail Modal Popup */}`
);

fs.writeFileSync('src/App.tsx', app);
console.log("Updated App.tsx with TeamProfileModal");
