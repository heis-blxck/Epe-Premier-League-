const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const firebaseConfigPath = require('path').join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));

admin.initializeApp({ projectId: firebaseConfig.projectId }); // No credential!
const db = getFirestore();
db.collection('teams').get().then(s => console.log("Teams size:", s.size)).catch(e => console.error("Error:", e.message));
