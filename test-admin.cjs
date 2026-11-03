const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function test() {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.log('No project ID');
    process.exit(1);
  }
  const app = initializeApp({
    projectId
  });

  const firestore = getFirestore(app);
  try {
    await firestore.collection('teams').doc('admin-test-id').set({ test: 'hello admin' });
    console.log('WRITE OK');
    const snap = await firestore.collection('teams').get();
    console.log('READ OK', snap.size);
  } catch (e) {
    console.error('FAILED:', e.message);
  }
  process.exit(0);
}
test();
