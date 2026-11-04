const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/app\.post\("\/api\/players\/:id\/transfer", \(req, res\) => \{/g, 'app.post("/api/players/:id/transfer", async (req, res) => {');

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Fixed post transfer");
