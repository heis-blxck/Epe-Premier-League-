const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');
const lines = code.split('\n');
const index = lines.findIndex(l => l.includes('public getFantasyDashboardStats()'));
lines.splice(index - 2, 1);
fs.writeFileSync('src/server/db.ts', lines.join('\n'));
