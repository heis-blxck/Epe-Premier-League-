const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newToggle = `
  const handleToggleNotifications = async (enabled: boolean) => {
    let permissionGranted = false;
    if (enabled && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          permissionGranted = true;
        } else {
          console.warn('User denied notification permissions.');
        }
      } else {
        permissionGranted = true;
      }
    }
    
    setNotificationsEnabled(enabled);
    if (currentUser) {
      await handleUpdateProfile({ email: currentUser.email, notificationsEnabled: enabled });
      
      if (enabled && permissionGranted) {
        requestFCMToken();
      }
    }
  };
`;

code = code.replace(
  /  const handleToggleNotifications = async \(enabled: boolean\) => \{[\s\S]*?\}\s*\};\s*/,
  newToggle + "\n"
);

fs.writeFileSync('src/App.tsx', code);
