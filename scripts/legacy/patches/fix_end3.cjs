const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');
const lines = code.split('\n');

// Find the line with "public getFantasyDashboardStats()"
const index = lines.findIndex(l => l.includes('public getFantasyDashboardStats()'));
if (index > 0) {
    if (lines[index - 1] === '}') {
        lines.splice(index - 1, 1);
    }
}
fs.writeFileSync('src/server/db.ts', lines.join('\n'));
