const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Move db outside
code = code.replace(/async function startServer\(\) \{/, 'const db = new DBStore();\n\nasync function startServer() {');

// Clean FCM from compiled
code = code.replace(/db\.on\("new_notification", sendFCMNotification\);/g, '');
const fcmTestRegex = /  app\.post\("\/api\/notifications\/test", async \(req, res\) => \{[\s\S]*?  \}\);/g;
code = code.replace(fcmTestRegex, '');
code = code.replace(/const messaging = \(0, import_messaging\.getMessaging\)\(fcmAdminApp\);/g, '');

fs.writeFileSync('server.ts', code);
