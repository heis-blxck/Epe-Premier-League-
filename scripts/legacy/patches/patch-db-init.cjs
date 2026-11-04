const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

code = code.replace(
  "      firestore = getFirestore();",
  "      const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId;\n      if (databaseId) {\n        firestore = getFirestore(admin.app(), databaseId);\n      } else {\n        firestore = getFirestore();\n      }"
);

fs.writeFileSync('src/server/db.ts', code);
