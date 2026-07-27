const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

code = code.replace(
  "promises.push(setDoc(doc(firestore, 'system', colMap.col), val));",
  "promises.push(setDoc(doc(firestore, 'system', colMap.col), JSON.parse(JSON.stringify(val))));"
);

fs.writeFileSync('src/server/db.ts', code);
