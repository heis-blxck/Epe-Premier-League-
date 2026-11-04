const fs = require('fs');

let code = fs.readFileSync('src/server/db.ts', 'utf8');

// Replace imports
code = code.replace(/import\s*\{\s*initializeApp\s*\}\s*from\s*'firebase\/app';\s*/g, '');
code = code.replace(/import\s*\{\s*getFirestore,\s*Firestore,\s*doc,\s*getDoc,\s*setDoc,\s*setLogLevel,\s*collection,\s*getDocs,\s*deleteDoc\s*\}\s*from\s*'firebase\/firestore';\s*/g, "import * as admin from 'firebase-admin';\n");

// Replace initialization
code = code.replace(/setLogLevel\('silent'\);\n/g, '');
code = code.replace(/let\s+firestore:\s+Firestore\s*\|\s*null\s*=\s*null;/g, 'let firestore: admin.firestore.Firestore | null = null;');

const oldInit = `  if (projectId) {
    console.log("Firebase initialized in server with Project ID:", projectId);
    const app = initializeApp({
      projectId,
      apiKey,
      authDomain,
    });
    firestore = getFirestore(app);
  }`;

const newInit = `  if (projectId) {
    console.log("Firebase Admin initialized in server with Project ID:", projectId);
    try {
      let credential = admin.credential.applicationDefault();
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
      }
      admin.initializeApp({
        credential,
        projectId
      });
      firestore = admin.firestore();
    } catch (e: any) {
      console.log("Firebase Admin initialization error (may occur in preview without Service Account):", e.message);
    }
  }`;

code = code.replace(oldInit, newInit);

// Replace methods
code = code.replace(/setDoc\(\s*doc\(\s*firestore\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*([\s\S]*?)\)(?=\.catch|\s*;|\s*$)/g, (match, p1, p2, p3) => {
    return `firestore.collection(${p1.trim()}).doc(${p2.trim()}).set(${p3.trim()})`;
});

code = code.replace(/deleteDoc\(\s*doc\(\s*firestore\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*\)/g, (match, p1, p2) => {
    return `firestore.collection(${p1.trim()}).doc(${p2.trim()}).delete()`;
});

code = code.replace(/getDocs\(\s*collection\(\s*firestore\s*,\s*([^)]+)\s*\)\s*\)/g, (match, p1) => {
    return `firestore.collection(${p1.trim()}).get()`;
});

fs.writeFileSync('src/server/db.ts', code);
console.log('Refactoring completed.');
