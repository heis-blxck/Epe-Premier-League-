const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const injectCode = `
  app.post("/api/admin/reset-fantasy-test", async (req, res) => {
    try {
      await db.resetFantasyTest();
      res.json({ success: true, message: 'Successfully wiped all fantasy squads and reset user profiles for testing.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
`;

code = code.replace(/app\.post\("\/api\/admin\/clear-fantasy"/, injectCode + '\n  app.post("/api/admin/clear-fantasy"');
fs.writeFileSync('server.ts', code);
