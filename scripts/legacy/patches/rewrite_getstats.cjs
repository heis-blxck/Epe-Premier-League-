const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const targetRegex = /  public getStats\(\) \{[\s\S]*?    const computePerformanceScore = /;

const replacement = `  public getStats() {
    this.recalculateLeagueStatsAndStandings();

    const computePerformanceScore = `;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/server/db.ts', content, 'utf8');
