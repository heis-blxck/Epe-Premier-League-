const fs = require('fs');

// Patch App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  /const notifOpts = \{\n\s*body: notif\.message,\n\s*icon: '\/logo\.svg'\n\s*\};/g,
  `const notifOpts = {
              body: notif.message,
              icon: '/logo.svg',
              silent: false,
              requireInteraction: true
            };`
);
fs.writeFileSync('src/App.tsx', appCode);

// Patch SW
let swCode = fs.readFileSync('public/firebase-messaging-sw.js', 'utf8');
swCode = swCode.replace(
  /const options = \{\n\s*body: payload\.notification\?\.body \|\| payload\.data\?\.body,\n\s*icon: '\/logo\.svg',\n\s*data: payload\.data\n\s*\};/g,
  `const options = {
        body: payload.notification?.body || payload.data?.body,
        icon: '/logo.svg',
        data: payload.data,
        silent: false,
        requireInteraction: true
      };`
);
fs.writeFileSync('public/firebase-messaging-sw.js', swCode);

