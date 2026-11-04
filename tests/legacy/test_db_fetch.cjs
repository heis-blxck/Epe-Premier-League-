const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId
  });
}

// Test default DB
const dbDefault = admin.firestore();
dbDefault.collection('teams').get().then(snap => {
    console.log("Default DB teams count:", snap.size);
}).catch(console.error);

// Test custom DB
const dbCustom = admin.firestore(admin.app(), 'ai-studio-epepremierleague-7596b478-8ce9-4b28-8acd-0a3d632b7f70');
dbCustom.collection('teams').get().then(snap => {
    console.log("Custom DB teams count:", snap.size);
}).catch(console.error);
