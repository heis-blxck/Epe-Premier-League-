const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function clearNews() {
    console.log("Fetching news collection from Firestore...");
    const newsRef = db.collection('news');
    const snapshot = await newsRef.get();
    
    if (snapshot.empty) {
        console.log("No news found in Firestore.");
        return;
    }
    
    console.log(`Found ${snapshot.size} news articles. Deleting...`);
    const batch = db.batch();
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log("All news articles deleted from Firestore.");
}

clearNews().catch(console.error);
