const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

async function run() {
    const collections = ['teams', 'users', 'admins', 'settings'];
    for (const col of collections) {
        const snap = await getDocs(collection(firestore, col));
        console.log(`${col} count: ${snap.size}`);
    }
    process.exit(0);
}
run();
