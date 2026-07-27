import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
initializeApp({ projectId: config.projectId });
const db = getFirestore(config.firestoreDatabaseId);

async function test() {
  const doc = await db.collection('system').doc('users').get();
  console.log('Users in Firestore:', doc.exists);
  if (doc.exists) {
     console.log((doc.data()?.data || []).length, 'users found');
  }
}
test();
