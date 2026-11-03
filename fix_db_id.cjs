const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const target = `      const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId;
      if (databaseId) {
        firestore = getFirestore(getApp(), databaseId);
      } else {
        firestore = getFirestore();
      }`;

const replacement = `      // ALWAYS USE DEFAULT DB since user is viewing/editing the default DB in Firebase Console
      firestore = getFirestore();`;

content = content.replace(target, replacement);
fs.writeFileSync('src/server/db.ts', content, 'utf8');
