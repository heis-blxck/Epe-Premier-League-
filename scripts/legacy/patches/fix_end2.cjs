const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const regex = /    return null;\n  \}\n\}\n  public getFantasyDashboardStats/g;
code = code.replace(regex, `    return null;\n  }\n  public getFantasyDashboardStats`);
fs.writeFileSync('src/server/db.ts', code);
