const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldClearCode = `  app.post("/api/admin/clear-fantasy", (req, res) => {
    try {
      db.data.fantasySquads = [];
      if (db.data.users) {
        db.data.users = db.data.users.map(u => {
          delete u.fantasyTeamName;
          return u;
        });
      }
      db.saveData(db.data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });`;

const newClearCode = `  app.post("/api/admin/clear-fantasy", async (req, res) => {
    try {
      await db.clearAllFantasySquads();
      res.json({ success: true, message: 'Successfully cleared all fantasy squads.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });`;

code = code.replace(oldClearCode, newClearCode);
fs.writeFileSync('server.ts', code);
