const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const target = `}) => {
  const [activePanel`;

const replacement = `}) => {
  const enrichedMatches = matches.map(m => ({
    ...m,
    homeTeam: m.homeTeam || teams.find(t => t.id === m.homeTeamId),
    awayTeam: m.awayTeam || teams.find(t => t.id === m.awayTeamId),
  }));

  const [activePanel`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/AdminDashboard.tsx', content, 'utf8');
