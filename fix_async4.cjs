const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/app\.post\("\/api\/users\/forgot-password", \(req, res\) => \{/g, 'app.post("/api/users/forgot-password", async (req, res) => {');

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Fixed forgot password");
