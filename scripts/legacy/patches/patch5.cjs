const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

if (!code.includes("setLogLevel")) {
  code = code.replace(
    "import { getFirestore, Firestore, doc, getDoc, setDoc } from 'firebase/firestore';",
    "import { getFirestore, Firestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';\nsetLogLevel('silent');"
  );
  fs.writeFileSync('src/server/db.ts', code);
}
