const fs = require('fs');
let content = fs.readFileSync('src/firebase.ts', 'utf8');
content = content.replace("import { getFirestore } from 'firebase/firestore';", "import { initializeFirestore } from 'firebase/firestore';");
content = content.replace("export const db = getFirestore(app);", `export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});`);
fs.writeFileSync('src/firebase.ts', content);
