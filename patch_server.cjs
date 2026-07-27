const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove fcmAdminApp initialization
code = code.replace(/import \{ initializeApp \} from 'firebase-admin\/app';\n/, '');
code = code.replace(/import \{ getMessaging \} from 'firebase-admin\/messaging';\n/, '');

const fcmInitRegex = /let fcmAdminApp = null;[\s\S]*?\} catch \(e\) \{\s*console\.warn\('Failed to initialize Firebase Admin SDK', e\);\s*\}/;
code = code.replace(fcmInitRegex, '');

const sendFcmRegex = /const sendFCMNotification = async \(notif\) => \{[\s\S]*?  db\.on\('new_notification', sendFCMNotification\);/g;
code = code.replace(sendFcmRegex, '');

const fcmTestRegex = /  app\.post\('\/api\/notifications\/test', async \(req, res\) => \{[\s\S]*?  \}\);/g;
code = code.replace(fcmTestRegex, '');

fs.writeFileSync('server.ts', code);
