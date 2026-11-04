import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp({
  projectId: config.projectId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
});
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  const dRef = doc(db, 'system', 'users');
  const result = await getDoc(dRef);
  console.log('Result exists:', result.exists());
  if (result.exists()) {
    console.log('Number of users:', result.data().data.length);
  }
  process.exit(0);
}
test();
