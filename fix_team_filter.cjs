const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex1 = /!DELETED_SEED_TEAM_IDS\.has\(t\.id\) &&\s*!DELETED_SEED_TEAM_NAMES\.has\(\(t\.name \|\| ''\)\.trim\(\)\.toLowerCase\(\)\)/g;
content = content.replace(regex1, 'true');

const regex2 = /!DELETED_SEED_TEAM_IDS\.has\(p\.teamId\)/g;
content = content.replace(regex2, 'true');

fs.writeFileSync('src/server/db.ts', content, 'utf8');
