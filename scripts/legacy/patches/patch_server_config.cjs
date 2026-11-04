const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const configEndpoint = `
  app.get('/api/firebase-config', (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        res.json(JSON.parse(fs.readFileSync(configPath, 'utf8')));
      } else {
        res.status(404).json({ error: 'Config not found' });
      }
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });
`;

code = code.replace(/app\.get\("\/api\/health"/, configEndpoint + '\n  app.get("/api/health"');
fs.writeFileSync('server.ts', code);
