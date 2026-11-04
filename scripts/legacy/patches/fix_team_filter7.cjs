const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex5 = /if \(this\.data\.teams\) \{\s*this\.data\.teams = this\.data\.teams\.filter\(t =>\s*true\s*\);\s*\} else \{\s*this\.data\.teams = \[\];\s*\}/g;
content = content.replace(regex5, "if (!this.data.teams) this.data.teams = [];");

const regex6 = /const validTeamIds = new Set\(\(this\.data\.teams \|\| \[\]\)\.map\(t => t\.id\)\);\s*if \(this\.data\.players\) \{\s*this\.data\.players = this\.data\.players\.filter\(p =>\s*true\s*\);\s*\} else \{\s*this\.data\.players = \[\];\s*\}/g;
content = content.replace(regex6, "if (!this.data.players) this.data.players = [];");

fs.writeFileSync('src/server/db.ts', content, 'utf8');
