const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
admin.initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore();

db.collection('teams').get().then(s => console.log("Teams:", s.size)).catch(e => console.error("Teams error", e.message));
db.collection('players').get().then(s => console.log("Players:", s.size)).catch(e => console.error("Players error", e.message));
