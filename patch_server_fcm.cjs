const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const fcmBackend = `
import { initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';

let fcmAdminApp = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    fcmAdminApp = initializeApp({ projectId: config.projectId });
    console.log('Firebase Admin SDK initialized for FCM');
  }
} catch (e) {
  console.warn('Failed to initialize Firebase Admin SDK', e);
}

const sendFCMNotification = async (notif) => {
  if (!fcmAdminApp) return;
  const messaging = getMessaging(fcmAdminApp);
  
  // Get all users who have notifications enabled and have tokens
  const users = db.getUsers().filter(u => u.notificationsEnabled !== false && u.fcmTokens && u.fcmTokens.length > 0);
  
  const tokens = [];
  users.forEach(u => tokens.push(...u.fcmTokens));
  
  if (tokens.length === 0) return;

  const payload = {
    tokens,
    notification: {
      title: notif.title,
      body: notif.message,
    },
    android: {
      notification: {
        sound: "epe_alert",
        channelId: "epe_custom_alerts",
        clickAction: "FLUTTER_NOTIFICATION_CLICK"
      }
    },
    apns: {
      payload: {
        aps: {
          sound: "epe_alert.mp3"
        }
      }
    },
    webpush: {
      headers: {
        Urgency: "high"
      },
      notification: {
        icon: "/logo.png"
      },
      data: {
        custom_sound: "epe_alert.mp3",
        action_url: "/matches"
      }
    }
  };

  try {
    const response = await messaging.sendEachForMulticast(payload);
    console.log('FCM Multicast sent:', response.successCount, 'success,', response.failureCount, 'failed');
  } catch (error) {
    console.warn('Error sending FCM push:', error.message);
  }
};
`;

code = code.replace(
  "import express from 'express';",
  "import express from 'express';\n" + fcmBackend
);

code = code.replace(
  "    db.on('new_notification', onNewNotif);",
  "    db.on('new_notification', onNewNotif);\n    db.on('new_notification', sendFCMNotification);"
);

fs.writeFileSync('server.ts', code);
