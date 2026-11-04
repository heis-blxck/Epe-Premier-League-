const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

code = code.replace(
  '    return league;\n  }\n}\n  public getPlayerOfTheWeek(): PlayerOfTheWeek[] {',
  '    return league;\n  }\n  public getPlayerOfTheWeek(): PlayerOfTheWeek[] {'
);

fs.writeFileSync('src/server/db.ts', code);
