const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

code = code.replace(
  'pPts += (p.assists || 0) * 3 + Math.min(matchesCount * 2, 20);',
  'pPts += (p.assists || 0) * 3 + Math.min(matchesCount * 2, 20) + (p.bonusPoints || 0);'
);

fs.writeFileSync('src/server/db.ts', code);
