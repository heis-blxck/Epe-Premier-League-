const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex3 = /if \(DELETED_SEED_TEAM_IDS\.has\(id\) \|\| DELETED_SEED_TEAM_NAMES\.has\(name\)\) \{/g;
content = content.replace(regex3, 'if (false) {');

const regex4 = /if \(data\.teamId && \(\!currentValidTeamIds\.has\(data\.teamId\) \|\| true\)\) \{/g;
content = content.replace(regex4, 'if (data.teamId && (!currentValidTeamIds.has(data.teamId))) {');

fs.writeFileSync('src/server/db.ts', content, 'utf8');
