import { DBStore } from './src/server/db';
const db = new DBStore();
db.addNotification({
  title: 'Test',
  message: 'Test message',
  type: 'system',
  eventType: 'Published News',
  linkMatchId: undefined
});
console.log('Done');
