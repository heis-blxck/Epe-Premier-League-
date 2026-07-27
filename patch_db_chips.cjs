const fs = require('fs');
let db = fs.readFileSync('src/server/db.ts', 'utf8');

if (!db.includes('ManagerChips[]')) {
  db = db.replace(
    'playerOfTheWeek?: PlayerOfTheWeek[];',
    'playerOfTheWeek?: PlayerOfTheWeek[];\n  managerChips?: ManagerChips[];'
  );
  // Also import it
  db = db.replace(
    'LineupPlayer, Advertisement, PlayerOfTheWeek',
    'LineupPlayer, Advertisement, PlayerOfTheWeek, ManagerChips'
  );
  fs.writeFileSync('src/server/db.ts', db);
}
console.log("DB schema patched");
