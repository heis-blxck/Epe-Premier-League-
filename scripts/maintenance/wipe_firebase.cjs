const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

async function run() {
    const collections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'fantasySquads', 'miniLeagues', 'advertisements', 'playerOfTheWeek', 'system'];
    for (const col of collections) {
        const snap = await getDocs(collection(firestore, col));
        for (const doc of snap.docs) {
            await deleteDoc(doc.ref);
            console.log(`Deleted ${doc.id} from ${col}`);
        }
    }
    process.exit(0);
}
run();
