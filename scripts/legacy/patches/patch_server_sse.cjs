const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const sseEndpoint = `
  app.get('/api/notifications/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onNewNotif = (notif) => {
      res.write(\`data: \${JSON.stringify(notif)}\\n\\n\`);
    };

    db.on('new_notification', onNewNotif);

    req.on('close', () => {
      db.removeListener('new_notification', onNewNotif);
    });
  });

  app.get('/api/notifications', (req, res) => {
`;

code = code.replace("  app.get('/api/notifications', (req, res) => {", sseEndpoint);

fs.writeFileSync('server.ts', code);
