const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex1 = /    const completedMatches = this\.getMatches\(\)\.filter.*?if \(completedMatches\.length === 0\) \{[\s\S]*?return \{[\s\S]*?\};\n    \}/g;
content = content.replace(regex1, '');

const regex2 = /\.filter\(p => p\.goals > 0\)/g;
content = content.replace(regex2, '');

const regex3 = /\.filter\(p => p\.assists > 0\)/g;
content = content.replace(regex3, '');

const regex4 = /\.filter\(p => \(p\.position === "GK" \|\| p\.position === "DEF"\) && p\.cleanSheets > 0\)/g;
content = content.replace(regex4, '.filter(p => (p.position === "GK" || p.position === "DEF"))');

const regex5 = /\.filter\(p => \(p\.cupGoals \|\| 0\) > 0\)/g;
content = content.replace(regex5, '');

const regex6 = /\.filter\(p => \(p\.cupAssists \|\| 0\) > 0\)/g;
content = content.replace(regex6, '');

const regex7 = /\.filter\(p => \(p\.position === "GK" \|\| p\.position === "DEF"\) && \(p\.cupCleanSheets \|\| 0\) > 0\)/g;
content = content.replace(regex7, '.filter(p => (p.position === "GK" || p.position === "DEF"))');

fs.writeFileSync('src/server/db.ts', content, 'utf8');
