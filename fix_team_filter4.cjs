const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex1 = /p\.teamId && validTeamIds\.has\(p\.teamId\) && true/g;
content = content.replace(regex1, 'true'); // or 'p.teamId && validTeamIds.has(p.teamId)'

fs.writeFileSync('src/server/db.ts', content, 'utf8');
