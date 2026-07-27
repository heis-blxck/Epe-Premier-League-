const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const testNotifRegex = /  const handleTriggerTestNotification = async \(\) => \{[\s\S]*?setTimeout\(\(\) => setToastNotif\(null\), 5000\);\n  \};/;

const newTestNotif = `  const handleTriggerTestNotification = async () => {
    const randomTeam = teams[Math.floor(Math.random() * teams.length)] || teams[0];
    const newNotif = {
      title: \`⚽ TEST ALERT: \${randomTeam?.name || 'Epe Club'} Scores!\`,
      message: \`Thunderous strike from 25 yards out into the top corner!\`,
      type: 'match_goal'
    };

    setToastNotif({
      id: \`toast-\${Date.now()}\`,
      title: newNotif.title,
      message: newNotif.message,
      type: 'match_goal',
      timestamp: new Date().toISOString(),
      read: false
    });
    setTimeout(() => setToastNotif(null), 5000);

    // Play in-app sound if enabled
    if (currentUser && currentUser.notificationsEnabled !== false) {
      try {
        const audio = new Audio('/epe_alert.mp3');
        audio.play().catch(e => console.warn('In-app audio play blocked:', e));
      } catch(e) {}
    }

    // Show Native OS Notification
    if (currentUser && currentUser.notificationsEnabled !== false) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notifOpts = {
          body: newNotif.message,
          icon: '/logo.svg',
          silent: false,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200, 100, 200]
        };
        new Notification(newNotif.title, notifOpts);
      }
    }
  };`;

code = code.replace(testNotifRegex, newTestNotif);
fs.writeFileSync('src/App.tsx', code);
