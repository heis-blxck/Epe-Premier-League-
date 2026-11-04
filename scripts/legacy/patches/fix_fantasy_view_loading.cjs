const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const regex = /\{activeTab === 'insights' && \(\(!players \|\| players\.length === 0\) \? \(/g;
const replacement = `{activeTab === 'insights' && (!statsData ? (`;
code = code.replace(regex, replacement);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
