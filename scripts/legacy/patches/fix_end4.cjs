const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');
const lines = code.split('\n');

const index = lines.findIndex(l => l.includes('public getFantasyDashboardStats()'));
console.log(lines.slice(index - 5, index + 2));
