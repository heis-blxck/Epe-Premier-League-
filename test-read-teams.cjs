const admin = require('firebase-admin');

async function test() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.log('No project ID');
    process.exit(1);
  }
  admin.initializeApp({
    projectId,
    credential: admin.credential.applicationDefault()
  });

  const firestore = admin.firestore();
  try {
    const snap = await firestore.collection('teams').get();
    console.log('READ OK', snap.size);
  } catch (e) {
    console.error('FAILED:', e.message);
  }
  process.exit(0);
}
test();
