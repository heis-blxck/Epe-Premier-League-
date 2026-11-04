const admin = require('firebase-admin');
const fs = require('fs');

try {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  admin.messaging().send({
    topic: 'test',
    notification: { title: 'Test', body: 'Test body' }
  }).then((res) => {
    console.log("Success:", res);
  }).catch((err) => {
    console.error("Error sending:", err.message);
  });
} catch (e) {
  console.error(e);
}
