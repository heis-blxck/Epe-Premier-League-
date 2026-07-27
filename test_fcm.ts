import { DBStore } from './src/server/db';
const db = new DBStore();
db.addNotification({
  title: 'Test FCM',
  message: 'Push from test_fcm',
  type: 'system',
  eventType: 'Published News',
  linkMatchId: undefined
});
console.log('Added FCM test notif.');
