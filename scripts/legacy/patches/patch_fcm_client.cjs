const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const fcmImports = `
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
`;

code = code.replace("import { EpeLogo } from './components/EpeLogo';", "import { EpeLogo } from './components/EpeLogo';\n" + fcmImports);

const fcmInit = `
  // Request FCM Token
  const requestFCMToken = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      const res = await fetch('/firebase-applet-config.json');
      const config = await res.json();
      
      const app = initializeApp(config);
      const messaging = getMessaging(app);
      
      const swRegistration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(messaging, {
        serviceWorkerRegistration: swRegistration,
        // Using a dummy VAPID key or the config one if available
        vapidKey: config.vapidKey || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLcgG5z-jQvg'
      });
      
      if (currentToken && currentUser) {
        // Only update if we don't already have this token
        const tokens = currentUser.fcmTokens || [];
        if (!tokens.includes(currentToken)) {
          await handleUpdateProfile({ 
            email: currentUser.email, 
            fcmTokens: [...tokens, currentToken] 
          });
        }
      }
    } catch (err) {
      console.warn('FCM Token generation failed:', err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.notificationsEnabled && Notification.permission === 'granted') {
      requestFCMToken();
    }
  }, [currentUser, notificationsEnabled]);
`;

code = code.replace("  useEffect(() => {\n    loadData();", fcmInit + "\n  useEffect(() => {\n    loadData();");

fs.writeFileSync('src/App.tsx', code);
