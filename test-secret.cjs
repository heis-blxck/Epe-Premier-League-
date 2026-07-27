const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

setDoc(doc(db, 'test', 'test-secret'), { hello: 'world', server_sync_secret: 'MY_SECRET' })
  .then(() => console.log('Success!'))
  .catch(e => console.error('Failed:', e.message))
  .finally(() => process.exit(0));
