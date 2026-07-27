const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/requireInteraction: true/g, '');
fs.writeFileSync('src/App.tsx', appCode);

let swCode = fs.readFileSync('public/firebase-messaging-sw.js', 'utf8');
swCode = swCode.replace(/requireInteraction: true/g, '');
fs.writeFileSync('public/firebase-messaging-sw.js', swCode);
