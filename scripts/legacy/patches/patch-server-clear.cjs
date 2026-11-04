const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const injectCode = `
  app.post("/api/admin/clear-fantasy", (req, res) => {
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
  });
`;

code = code.replace(/app\.post\("\/api\/admin\/force-firestore-sync"/, injectCode + '\n  app.post("/api/admin/force-firestore-sync"');
fs.writeFileSync('server.ts', code);
