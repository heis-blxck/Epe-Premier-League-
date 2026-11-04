import { DBStore } from './src/server/db';
const db = new DBStore();
console.log(db.getNotifications());
