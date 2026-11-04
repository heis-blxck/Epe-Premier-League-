const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const app = initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
});

const db = getFirestore(app);

async function test() {
  const collections = [
    'settings', 'teams', 'players', 'matches', 'events', 'news', 'users',
    'admins', 'notifications', 'ratings', 'predictions', 'scorePredictions',
    'fantasySquads', 'miniLeagues', 'advertisements', 'playerOfTheMonth',
    'managerChips', 'fixture_chats', 'match_videos', 'epl_highlights'
  ];

  for (const col of collections) {
    try {
      await setDoc(doc(db, col, 'test-doc-id'), { test: true });
      console.log(col, 'OK');
    } catch (e) {
      console.error(col, 'FAILED:', e.message);
    }
  }
  process.exit(0);
}
test();
