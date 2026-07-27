const fs = require('fs');
let code = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

code = code.replace(
  /const potwPlayer = [^\n]*\n/g,
  ''
);

fs.writeFileSync('src/components/LeagueStats.tsx', code);
