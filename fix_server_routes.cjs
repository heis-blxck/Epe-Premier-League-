const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routesToAdd = `
  app.get("/api/fantasy-dashboard-stats", (req, res) => {
    res.json(db.getFantasyDashboardStats());
  });
  
  app.get("/api/player-version", (req, res) => {
    res.json(db.getPlayerVersion());
  });
`;

code = code.replace(/app\.get\("\/api\/players", \(req, res\) => \{/, routesToAdd + '\n  app.get("/api/players", (req, res) => {');

fs.writeFileSync('server.ts', code);
