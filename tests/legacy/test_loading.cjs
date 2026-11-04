const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');
const match = code.match(/if \(!players.*loading.*/i);
console.log("Loading check:", match);
