import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app);
db.settings({ databaseId: config.firestoreDatabaseId || '(default)' });
db.collection('test').doc('test').set({ hello: 'world' }).then(() => {
  console.log('Admin write succeeded');
  process.exit(0);
}).catch(e => {
  console.error('Admin write failed', e.message);
  process.exit(1);
});
