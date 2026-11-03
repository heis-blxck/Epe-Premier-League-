const fs = require('fs');

let code = fs.readFileSync('src/server/db.ts', 'utf8');

const oldInit = `    try {
      let credential = admin.credential.applicationDefault();
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
      }
      admin.initializeApp({
        credential,
        projectId
      });
      firestore = admin.firestore();
    } catch (e: any) {`;

const newInit = `    try {
      const { applicationDefault, cert } = require('firebase-admin/app');
      let credential = applicationDefault();
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
      }
      admin.initializeApp({
        credential,
        projectId
      });
      firestore = admin.firestore();
    } catch (e: any) {`;

code = code.replace(oldInit, newInit);
fs.writeFileSync('src/server/db.ts', code);
console.log('Fixed admin initialization');
