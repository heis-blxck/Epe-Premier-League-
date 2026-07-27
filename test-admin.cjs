const admin = require('firebase-admin');
const fs = require('fs');

try {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("Firebase Admin initialized");
} catch (e) {
  console.error(e);
}
