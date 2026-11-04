const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The best way is to map matches at the top of the component render, or before they are used.
// Let's find: const AdminDashboard: React.FC<AdminDashboardProps> = ({ matches, teams, players, ... }) => {
// Then we can do: const enrichedMatches = matches.map(...)

const targetRegex = /const AdminDashboard: React\.FC<AdminDashboardProps> = \(\{\n  matches,\n  teams,\n  players,\n  news,\n  settings,\n  onRefreshAll\n\}\) => \{/;

const replacement = `const AdminDashboard: React.FC<AdminDashboardProps> = ({
  matches,
  teams,
  players,
  news,
  settings,
  onRefreshAll
}) => {
  // Ensure matches have homeTeam and awayTeam populated
  const enrichedMatches = matches.map(m => ({
    ...m,
    homeTeam: m.homeTeam || teams.find(t => t.id === m.homeTeamId),
    awayTeam: m.awayTeam || teams.find(t => t.id === m.awayTeamId),
  }));
`;

content = content.replace(targetRegex, replacement);

// Now replace all `matches` with `enrichedMatches` inside the component body.
// But wait, it's safer to just change the mapping inside the component.
