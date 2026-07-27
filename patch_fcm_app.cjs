const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
`;

code = code.replace(/import React/, imports + 'import React');

const fcmLogic = `
  const requestFCMToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const configRes = await fetch('/api/firebase-config');
        if (!configRes.ok) throw new Error('Failed to fetch firebase config');
        const config = await configRes.json();
        
        const app = initializeApp(config);
        const messaging = getMessaging(app);
        
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const currentToken = await getToken(messaging, { 
          vapidKey,
          serviceWorkerRegistration: await navigator.serviceWorker.ready
        });
        
        if (currentToken && currentUser) {
          console.log('FCM Token acquired', currentToken);
          // In a real app, send this to the server
          // await fetch('/api/users/profile', { method: 'POST', body: JSON.stringify({ email: currentUser.email, fcmTokens: [currentToken] }) });
        }
      }
    } catch (e) {
      console.error('An error occurred while retrieving token. ', e);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled && currentUser) {
      requestFCMToken();
    }
    if (currentUser) {
      await handleUpdateProfile({ email: currentUser.email, notificationsEnabled: enabled });
    }
  };
`;

code = code.replace(/  const handleToggleNotifications = async \(enabled: boolean\) => \{[\s\S]*?  \};\n/, fcmLogic);

fs.writeFileSync('src/App.tsx', code);
