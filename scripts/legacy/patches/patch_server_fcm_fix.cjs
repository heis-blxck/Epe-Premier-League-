const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Remove the incorrect attachment
code = code.replace(
  "    db.on('new_notification', onNewNotif);\n    db.on('new_notification', sendFCMNotification);",
  "    db.on('new_notification', onNewNotif);"
);

// Attach it globally instead
code = code.replace(
  "  app.get('/api/notifications/stream', (req, res) => {",
  "  // Global FCM Listener\n  db.on('new_notification', sendFCMNotification);\n\n  app.get('/api/notifications/stream', (req, res) => {"
);

fs.writeFileSync('server.ts', code);
