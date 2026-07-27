const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

if (!server.includes('/api/manager-chips')) {
  const newRoutes = `
  app.get("/api/manager-chips/:userId", (req, res) => {
    try {
      res.json(db.getManagerChips(req.params.userId));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/manager-chips", (req, res) => {
    try {
      const saved = db.saveManagerChips(req.body);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
`;
  server = server.replace('app.get("/api/player-of-the-week"', newRoutes + '\n  app.get("/api/player-of-the-week"');
  fs.writeFileSync('server.ts', server);
}
console.log("Server routes patched");
