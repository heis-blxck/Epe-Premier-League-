const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/app\.put\("\/api\/matches\/:id\/lineup", \(req, res\) => \{/g, 'app.put("/api/matches/:id/lineup", async (req, res) => {');
content = content.replace(/app\.post\("\/api\/matches\/:id\/lineup", async \(req, res\) => \{/g, 'app.post("/api/matches/:id/lineup", (req, res) => {');

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Fixed put lineup");
