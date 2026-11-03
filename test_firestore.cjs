const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp({ projectId: 'epl-c18ef' });
const db = getFirestore();
db.collection('players').get().then(snap => {
  console.log("Players count:", snap.size);
}).catch(console.error);
