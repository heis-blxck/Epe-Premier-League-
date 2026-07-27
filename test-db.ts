import { db } from './src/server/db';
console.log('db users:', db.getUsers().length);
setTimeout(() => { console.log('exiting'); process.exit(0); }, 5000);
