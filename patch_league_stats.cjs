const fs = require('fs');
let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

content = content.replace(
  /\}\)\.sort\(\(x, y\) => Number\(y\.value\) - Number\(x\.value\)\)\.slice\(0, 15\);/,
  '}).filter(x => Number(x.value) > 0).sort((x, y) => Number(y.value) - Number(x.value)).slice(0, 15);'
);

fs.writeFileSync('src/components/LeagueStats.tsx', content, 'utf8');
