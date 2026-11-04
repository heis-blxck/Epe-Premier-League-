const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const sseLogic = `
  // Server-Sent Events for Real-Time Notifications
  useEffect(() => {
    const sse = new EventSource('/api/notifications/stream');
    
    sse.onmessage = async (event) => {
      try {
        const notif = JSON.parse(event.data);
        setNotifications(prev => [notif, ...prev]);
        setToastNotif(notif);
        setTimeout(() => setToastNotif(null), 5000);

        // Show OS Notification and Play Sound
        if (currentUser && currentUser.notificationsEnabled !== false) {
          if (Notification.permission === 'granted') {
            const swRegistration = await navigator.serviceWorker.getRegistration();
            if (swRegistration) {
              swRegistration.showNotification(notif.title, {
                body: notif.message,
                icon: '/logo.svg',
                silent: true // Handle custom sound manually
              });
            } else {
              new Notification(notif.title, { body: notif.message, silent: true });
            }
          }
          
          // Play custom sound if enabled via indexedDB
          const { getCustomSoundPreference } = await import('./utils/indexedDB');
          const customSound = await getCustomSoundPreference();
          if (customSound) {
            const audio = new Audio('/epe_alert.mp3');
            audio.play().catch(e => console.warn('Audio play blocked:', e));
          }
        }
      } catch (e) {
        console.error('Error parsing SSE data', e);
      }
    };

    return () => {
      sse.close();
    };
  }, [currentUser]);

  // Request Notification Permissions on mount or login
  useEffect(() => {
    if (currentUser && currentUser.notificationsEnabled !== false) {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [currentUser]);
`;

code = code.replace(
  "  useEffect(() => {\n    loadData();",
  sseLogic + "\n  useEffect(() => {\n    loadData();"
);

fs.writeFileSync('src/App.tsx', code);
