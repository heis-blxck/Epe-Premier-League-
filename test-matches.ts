import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

async function run() {
    try {
        const snap = await getDocs(collection(firestore, 'matches'));
        console.log('Matches:', snap.size);
    } catch (e) {
        console.error('Failed:', e);
    }
    process.exit(0);
}
run();
