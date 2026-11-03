const fs = require('fs');

let code = fs.readFileSync('src/server/db.ts', 'utf8');
code = code.replace("import * as admin from 'firebase-admin';", "import * as admin from 'firebase-admin';\nimport { applicationDefault, cert } from 'firebase-admin/app';");
code = code.replace("const { applicationDefault, cert } = require('firebase-admin/app');\n", "");

fs.writeFileSync('src/server/db.ts', code);
console.log('Fixed imports');
