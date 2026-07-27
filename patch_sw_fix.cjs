const fs = require('fs');
let code = fs.readFileSync('public/firebase-messaging-sw.js', 'utf8');

code = code.replace(
  /\/\/ IndexedDB Helper to get user's sound preference[\s\S]*?\}\);/m,
  `const initFirebase = async () => {
  try {
    const res = await fetch('/firebase-applet-config.json');
    const config = await res.json();
    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(async (payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      const title = payload.notification?.title || payload.data?.title || 'Epe Premier League Alert';
      const options = {
        body: payload.notification?.body || payload.data?.body,
        icon: '/logo.svg',
        data: payload.data
      };

      return self.registration.showNotification(title, options);
    });
  } catch (e) {
    console.error('SW Firebase Init failed', e);
  }
};
initFirebase();`
);

fs.writeFileSync('public/firebase-messaging-sw.js', code);
