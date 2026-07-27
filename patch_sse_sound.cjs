const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const sseSound = `
        if (currentUser && currentUser.notificationsEnabled !== false) {
          // Play custom sound if enabled via indexedDB
          const { getCustomSoundPreference } = await import('./utils/indexedDB');
          const customSoundEnabled = await getCustomSoundPreference();
          
          if (customSoundEnabled) {
            const audio = new Audio('/epe_alert.mp3');
            audio.play().catch(e => console.warn('Audio play blocked:', e));
          }

          if (Notification.permission === 'granted') {
            const swRegistration = await navigator.serviceWorker.getRegistration();
            const notifOpts = {
              body: notif.message,
              icon: '/logo.svg',
              silent: customSoundEnabled // Silent only if we play our custom sound
            };

            if (swRegistration) {
              swRegistration.showNotification(notif.title, notifOpts);
            } else {
              new Notification(notif.title, notifOpts);
            }
          }
        }
`;

code = code.replace(
  /        \/\/ Show OS Notification and Play Sound[\s\S]*?        \}\n/g,
  "        // Show OS Notification and Play Sound\n" + sseSound
);

fs.writeFileSync('src/App.tsx', code);
