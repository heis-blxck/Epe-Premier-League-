const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `          if (!latestNotif.read && notifications.length > 0 && notifications[0]?.id !== latestNotif.id) {
            if (notificationsEnabled) {
              setToastNotif(latestNotif);
              setTimeout(() => setToastNotif(null), 5000);
            }
          }`,
  `          // Toast is now handled by SSE to ensure real-time and audio`
);

fs.writeFileSync('src/App.tsx', code);
