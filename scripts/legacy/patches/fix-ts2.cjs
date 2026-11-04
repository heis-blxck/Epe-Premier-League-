const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');
code = code.replace(/import \{ applicationDefault, cert \} from 'firebase-admin\/app';/g, "import { applicationDefault, cert } from 'firebase-admin/app';\nimport { getFirestore } from 'firebase-admin/firestore';");
code = code.replace(/firestore = admin.firestore\(\);/g, "firestore = getFirestore();");
fs.writeFileSync('src/server/db.ts', code);
