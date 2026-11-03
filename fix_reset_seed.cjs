const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex1 = /if \(\!this\.data\.teams \|\| this\.data\.teams\.length === 0\) \{\s*this\.data\.teams = INITIAL_TEAMS;\s*\}/g;
content = content.replace(regex1, '');

const regex2 = /if \(\!this\.data\.players \|\| this\.data\.players\.length === 0\) \{\s*this\.data\.players = INITIAL_PLAYERS;\s*\}/g;
content = content.replace(regex2, '');

fs.writeFileSync('src/server/db.ts', content, 'utf8');
