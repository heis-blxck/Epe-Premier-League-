const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');
console.log(code.substring(code.indexOf('const pastKickoffMatch'), code.indexOf('const isGameweekLocked')));
