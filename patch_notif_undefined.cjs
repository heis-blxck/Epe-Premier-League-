const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const newCode = `  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string }): AppNotification {
    if (!this.data.notifications) this.data.notifications = INITIAL_NOTIFICATIONS;
    const newNotif: any = {
      id: notification.id || \`notif-\${Date.now()}\`,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    };
    if (notification.linkMatchId !== undefined) {
      newNotif.linkMatchId = notification.linkMatchId;
    }
    
    this.data.notifications.unshift(newNotif);`;

code = code.replace(
  /  public addNotification\(notification: Omit<AppNotification, 'id' \| 'timestamp' \| 'read'> & \{ id\?: string; timestamp\?: string \}\): AppNotification \{[\s\S]*?this\.data\.notifications\.unshift\(newNotif\);/,
  newCode
);

fs.writeFileSync('src/server/db.ts', code);
