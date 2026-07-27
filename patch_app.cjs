const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove Firebase messaging import
code = code.replace(/import \{ getMessaging, getToken \} from 'firebase\/messaging';\n/, '');
code = code.replace(/import \{ initializeApp \} from 'firebase\/app';\n/, '');

// Remove requestFCMToken
code = code.replace(/\/\/ Request FCM Token\s*const requestFCMToken = async \(\) => \{[\s\S]*?  \};\n/, '');

// Remove call to requestFCMToken in useEffect
code = code.replace(/    if \(currentUser && currentUser\.notificationsEnabled && Notification\.permission === 'granted'\) \{\s*requestFCMToken\(\);\s*\}/, '');

// Remove call to requestFCMToken in handleToggleNotifications
code = code.replace(/      if \(enabled && permissionGranted\) \{\s*requestFCMToken\(\);\s*\}/, '');

// Update handleTriggerTestNotification
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
  };`;

code = code.replace(testNotifRegex, newTestNotif);

fs.writeFileSync('src/App.tsx', code);
