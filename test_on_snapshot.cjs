const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const firebaseConfigPath = require('path').join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
admin.initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore();
db.collection('teams').onSnapshot(snap => {
  console.log("Teams snapshot size:", snap.size);
  process.exit(0);
}, err => {
  console.error("Teams snapshot error:", err.message);
  process.exit(1);
});
