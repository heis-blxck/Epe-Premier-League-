const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const teamId = req\.query\.teamId;/g, 'const teamId = req.query.teamId as string;');
code = code.replace(/const saved = db\.saveAdmin\(newAdmin\);/g, 'const saved = db.saveAdmin(newAdmin as any);');
code = code.replace(/const userSessionId = req\.query\.userSessionId \|\| "";/g, 'const userSessionId = req.query.userSessionId as string || "";');
code = code.replace(/await \(0, createViteServer\)/g, 'await createViteServer');

fs.writeFileSync('server.ts', code);
