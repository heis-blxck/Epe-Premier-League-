const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/\(0, import_express\.default\)/g, 'express');
code = code.replace(/import_express\.default/g, 'express');
code = code.replace(/const PORT = 3e3;/g, '');

fs.writeFileSync('server.ts', code);
