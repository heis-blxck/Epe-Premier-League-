const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const notifOpts = \{\s*body: notif\.message,\s*icon: '\/logo\.svg',\s*silent: false,\s*\};\s*if \(swRegistration\)/,
  `const notifOpts = {
              body: notif.message,
              icon: '/logo.svg',
              silent: false,
              requireInteraction: true,
              vibrate: [200, 100, 200, 100, 200, 100, 200]
            };
            if (swRegistration)`
);
fs.writeFileSync('src/App.tsx', code);
