const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const app = initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
});

const db = getFirestore(app);

async function test() {
  try {
    const snap = await getDocs(collection(db, 'teams'));
    console.log('teams READ OK', snap.size);
  } catch (e) {
    console.error('teams READ FAILED:', e.message);
  }
  process.exit(0);
}
test();
