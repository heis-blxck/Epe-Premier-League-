const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex3 = /if \(updates\.teams && Array\.isArray\(updates\.teams\)\) \{\s*this\.data\.teams = updates\.teams\.filter\(\(t: any\) =>\s*true\s*\);\s*\}/g;
content = content.replace(regex3, "if (updates.teams && Array.isArray(updates.teams)) { this.data.teams = updates.teams; }");

const regex4 = /const validTeamIds = new Set\(\(this\.data\.teams \|\| \[\]\)\.map\(t => t\.id\)\);\s*if \(updates\.players && Array\.isArray\(updates\.players\)\) \{\s*this\.data\.players = updates\.players\.filter\(\(p: any\) =>\s*true\s*\);\s*\}/g;
content = content.replace(regex4, "if (updates.players && Array.isArray(updates.players)) { this.data.players = updates.players; }");

fs.writeFileSync('src/server/db.ts', content, 'utf8');
