const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

code = code.replace(/\)\)\}/g, ')}');
fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
