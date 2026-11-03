const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const regex = /public addNotification\(notification: Omit<AppNotification, 'id' \| 'timestamp' \| 'read'> & \{ id\?: string; timestamp\?: string; idempotencyKey\?: string \}\): AppNotification \{\s+if \(\!this\.data\.notifications\) this\.data\.notifications = INITIAL_NOTIFICATIONS;\s+if \(\!this\.data\.dispatchedNotificationKeys\) this\.data\.dispatchedNotificationKeys = \[\];\s+const key = notification\.idempotencyKey \|\| notification\.id;\s+if \(key\) \{/;

let replacement = `public async addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string; idempotencyKey?: string }): Promise<AppNotification> {
    if (!this.data.notifications) this.data.notifications = INITIAL_NOTIFICATIONS;
    if (!this.data.dispatchedNotificationKeys) this.data.dispatchedNotificationKeys = [];
    
    const key = notification.idempotencyKey || notification.id;
    
    if (key && firestore && this.isFirestoreSynced) {
      try {
        const notifRef = firestore.collection('sent_notifications').doc(key);
        const result = await firestore.runTransaction(async (transaction) => {
          const doc = await transaction.get(notifRef);
          if (doc.exists) {
            return false;
          }
          transaction.set(notifRef, { sentAt: FieldValue.serverTimestamp() });
          return true;
        });
        if (!result) {
          console.log(\`[Notification Idempotency] Key '\${key}' already fired in Firestore. Blocking duplicate notification.\`);
          const existing = this.data.notifications.find(n => n.id === key || n.idempotencyKey === key);
          return existing || (notification as any);
        }
      } catch (err) {
        console.error('Error in notification idempotency transaction:', err);
      }
    }

    if (key) {`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/server/db.ts', content, 'utf8');
    console.log("Patched db.ts");
} else {
    console.error("Target not found!");
    process.exit(1);
}
