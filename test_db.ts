import { DBStore } from './src/server/db';
const db = new DBStore();
db.addNotification({
  title: 'Test Final',
  message: 'Testing background notification',
  type: 'system',
  eventType: 'Published News',
  linkMatchId: undefined
});
console.log('Added final test notification.');
