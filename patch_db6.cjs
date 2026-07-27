const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

code = code.replace(
  '  }\n}\n  public getPlayerOfTheWeek',
  '  }\n  public getPlayerOfTheWeek'
);

fs.writeFileSync('src/server/db.ts', code);
