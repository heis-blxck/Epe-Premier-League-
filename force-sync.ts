import { db } from './src/server/db';
setTimeout(() => {
    // Force a save to Firestore
    db['saveData'](db['data']);
    console.log('Forced save to Firestore!');
    setTimeout(() => process.exit(0), 3000);
}, 2000);
