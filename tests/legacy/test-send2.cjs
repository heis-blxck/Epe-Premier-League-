const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const fs = require('fs');

try {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  const app = initializeApp({
    projectId: firebaseConfig.projectId,
  });
  getMessaging(app).send({
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
