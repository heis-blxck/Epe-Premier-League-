const fs = require('fs');
let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

// Remove isPreseason entirely
content = content.replace(/  const isPreseason = players && players\.length > 0 && players\.every\(p => \(p\.goals \|\| 0\) === 0 && \(p\.assists \|\| 0\) === 0\);\n/g, '');
content = content.replace(/  if \(isPreseason && !latestPotm\) return null;\n/g, '');
content = content.replace(/\{!\(isPreseason\) && \(/g, '{true && (');
content = content.replace(/\{\!isPreseason && \(/g, '{true && (');

fs.writeFileSync('src/components/LeagueStats.tsx', content, 'utf8');
