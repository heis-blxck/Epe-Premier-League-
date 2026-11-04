const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newToggle = `
  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('User denied notification permissions.');
        }
      }
    }
    setNotificationsEnabled(enabled);
    if (currentUser) {
      handleUpdateProfile({ email: currentUser.email, notificationsEnabled: enabled });
    }
  };
`;

code = code.replace(
  /  const handleToggleNotifications = \(enabled: boolean\) => \{[\s\S]*?\}\s*\};\s*/,
  newToggle + "\n"
);

fs.writeFileSync('src/App.tsx', code);
