const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex4 = /if \(data\.teamId && \(\!currentValidTeamIds\.has\(data\.teamId\) \|\| DELETED_SEED_TEAM_IDS\.has\(data\.teamId\)\)\) \{/g;
content = content.replace(regex4, 'if (data.teamId && (!currentValidTeamIds.has(data.teamId))) {');

fs.writeFileSync('src/server/db.ts', content, 'utf8');
