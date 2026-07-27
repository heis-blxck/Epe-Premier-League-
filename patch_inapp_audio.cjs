const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /        setTimeout\(\(\) => setToastNotif\(null\), 5000\);/,
  `        setTimeout(() => setToastNotif(null), 5000);
        
        // Play in-app sound if enabled
        if (currentUser && currentUser.notificationsEnabled !== false) {
          try {
            const audio = new Audio('/epe_alert.mp3');
            audio.play().catch(e => console.warn('In-app audio play blocked:', e));
          } catch(e) {}
        }`
);
fs.writeFileSync('src/App.tsx', code);
