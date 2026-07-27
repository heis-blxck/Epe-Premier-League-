const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\/\/ Show OS Notification and Play Sound[\s\S]*?\} catch \(e\) \{/g,
  `// Show Native OS Notification
        if (currentUser && currentUser.notificationsEnabled !== false) {
          if (Notification.permission === 'granted') {
            const swRegistration = await navigator.serviceWorker.getRegistration();
            const notifOpts = {
              body: notif.message,
              icon: '/logo.svg'
            };

            if (swRegistration) {
              swRegistration.showNotification(notif.title, notifOpts);
            } else {
              new Notification(notif.title, notifOpts);
            }
          }
        }
      } catch (e) {`
);

fs.writeFileSync('src/App.tsx', code);
