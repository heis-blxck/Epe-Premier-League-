const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const regex = /\{topPerformers\.map/g;
const replacement = `{topPerformers && topPerformers.map`;

code = code.replace(regex, replacement);

const regex2 = /\{mostOwnedPlayers\.map/g;
const replacement2 = `{mostOwnedPlayers && mostOwnedPlayers.map`;
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
