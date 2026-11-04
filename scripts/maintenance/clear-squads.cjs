const fs = require('fs');
const dbPath = 'data/epe_league_db.json';
if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  data.fantasySquads = [];
  if (data.users) {
    data.users = data.users.map(u => {
      delete u.fantasyTeamName;
      return u;
    });
  }
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('Cleared from epe_league_db.json');
} else {
  console.log('File not found');
}
