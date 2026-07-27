const fs = require('fs');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'epe_league_db.json');
if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (data.fantasySquads) {
    const originalLength = data.fantasySquads.length;
    // Remove placeholder_init
    data.fantasySquads = data.fantasySquads.filter(s => s.id !== 'placeholder_init');
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Removed ${originalLength - data.fantasySquads.length} dummy squads.`);
  }
} else {
  console.log('No DB file found');
}
