const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/app\.put\("\/api\/players\/:id\/transfer", \(req, res\) => \{/g, 'app.put("/api/players/:id/transfer", async (req, res) => {');
content = content.replace(/app\.post\("\/api\/matches\/:id\/events", \(req, res\) => \{/g, 'app.post("/api/matches/:id/events", async (req, res) => {');
content = content.replace(/app\.post\("\/api\/matches\/:id\/lineup", \(req, res\) => \{/g, 'app.post("/api/matches/:id/lineup", async (req, res) => {');
content = content.replace(/app\.post\("\/api\/recover-password", \(req, res\) => \{/g, 'app.post("/api/recover-password", async (req, res) => {');
content = content.replace(/app\.post\("\/api\/notifications", \(req, res\) => \{/g, 'app.post("/api/notifications", async (req, res) => {');
content = content.replace(/app\.post\("\/api\/support", \(req, res\) => \{/g, 'app.post("/api/support", async (req, res) => {');

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Fixed async handlers in server.ts");
