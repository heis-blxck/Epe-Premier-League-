const fs = require('fs');
let code = fs.readFileSync('public/firebase-messaging-sw.js', 'utf8');

const swInit = `
const initFirebase = async () => {
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
        data: payload.data,
        silent: true 
      };

      const useCustomSound = await getCustomSoundPreference();
      const requiresCustomSound = payload.data?.custom_sound === 'epe_alert.mp3' || payload.notification?.sound === 'epe_alert.mp3';

      if (useCustomSound && requiresCustomSound) {
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          if (clients && clients.length > 0) {
            clients.forEach((client) => {
              client.postMessage({ type: 'PLAY_CUSTOM_SOUND', soundFile: 'epe_alert.mp3' });
            });
          }
        });
      } else if (!useCustomSound) {
        options.silent = false; 
      }
      return self.registration.showNotification(title, options);
    });
  } catch (e) {
    console.error('SW Firebase Init failed', e);
  }
};
initFirebase();
`;

code = code.replace(/firebase\.initializeApp\(\{[\s\S]*\}\);[\s\S]*const messaging = firebase\.messaging\(\);/m, "");
code = code.replace(/\/\/ Background Message Handler[\s\S]*/m, swInit);

fs.writeFileSync('public/firebase-messaging-sw.js', code);
