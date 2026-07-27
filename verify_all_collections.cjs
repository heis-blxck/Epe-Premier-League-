const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const dbFilePath = path.join(__dirname, 'data', 'epe_league_db.json');
let localDb = {};
if (fs.existsSync(dbFilePath)) {
  try {
    localDb = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
  } catch (e) {
    console.error('Error reading local db', e);
  }
}

const collectionsList = [
  { col: 'settings', getItems: () => [ { id: 'global', ...localDb.settings } ] },
  { col: 'teams', getItems: () => localDb.teams || [] },
  { col: 'players', getItems: () => localDb.players || [] },
  { col: 'matches', getItems: () => localDb.matches || [] },
  { col: 'events', getItems: () => localDb.events || [] },
  { col: 'news', getItems: () => localDb.news || [] },
  { col: 'users', getItems: () => localDb.users || [] },
  { col: 'admins', getItems: () => localDb.admins || [] },
  { col: 'notifications', getItems: () => localDb.notifications || [] },
  { col: 'ratings', getItems: () => Object.entries(localDb.ratings || {}).map(([id, rating]) => ({ id, rating })) },
  { col: 'predictions', getItems: () => localDb.predictions || [] },
  { col: 'fantasySquads', getItems: () => localDb.fantasySquads || [] },
  { col: 'miniLeagues', getItems: () => localDb.miniLeagues || [] },
  { col: 'advertisements', getItems: () => localDb.advertisements || [] },
  { col: 'playerOfTheWeek', getItems: () => localDb.playerOfTheWeek || [] },
  { col: 'managerChips', getItems: () => localDb.managerChips || [] }
];

async function main() {
  console.log('Verifying all Firestore collections...');
  for (const item of collectionsList) {
    const colName = item.col;
    try {
      const snap = await getDocs(collection(firestore, colName));
      console.log(`Collection "${colName}": ${snap.size} documents found.`);
      if (snap.empty) {
        console.log(`Collection "${colName}" is empty. Seeding initial data...`);
        const initialItems = item.getItems();
        if (initialItems && initialItems.length > 0) {
          for (const docData of initialItems) {
            const docId = docData.id || docData._id || 'init';
            await setDoc(doc(firestore, colName, docId), docData);
            console.log(`  -> Created document "${docId}" in collection "${colName}"`);
          }
        } else {
          // If no local items exist, create an initial placeholder document to establish the collection
          const placeholderId = 'placeholder_init';
          const placeholderData = { id: placeholderId, initializedAt: new Date().toISOString(), status: 'active' };
          await setDoc(doc(firestore, colName, placeholderId), placeholderData);
          console.log(`  -> Created placeholder document "${placeholderId}" in collection "${colName}"`);
        }
      }
    } catch (err) {
      console.error(`Error verifying collection "${colName}":`, err.message);
    }
  }
  console.log('Verification complete!');
  process.exit(0);
}

main();
