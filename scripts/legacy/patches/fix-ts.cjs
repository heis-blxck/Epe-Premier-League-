const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');
code = code.replace(/let firestore: admin.firestore.Firestore \| null = null;/g, "let firestore: any = null;");
fs.writeFileSync('src/server/db.ts', code);
