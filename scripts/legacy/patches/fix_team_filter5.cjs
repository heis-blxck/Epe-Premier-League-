const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex1 = /else if \(col === 'teams'\) \{\s*this\.data\.teams = items\.filter\(\(t: any\) =>\s*true\s*\);\s*\}/g;
content = content.replace(regex1, "else if (col === 'teams') { this.data.teams = items; }");

const regex2 = /else if \(col === 'players'\) \{\s*const validTeamIds = new Set\(\(this\.data\.teams \|\| \[\]\)\.map\(t => t\.id\)\);\s*this\.data\.players = items\.filter\(\(p: any\) =>\s*true\s*\);\s*\}/g;
content = content.replace(regex2, "else if (col === 'players') { this.data.players = items; }");

fs.writeFileSync('src/server/db.ts', content, 'utf8');
