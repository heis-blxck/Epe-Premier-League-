const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/await db\.addNotification\(\{\n\s*title: `\\u\{1F504\} INTER-TEAM TRANSFER`,/g, 
`await db.addNotification({
        idempotencyKey: \`notif_transfer_\${player.id}_\${newTeamId}\`,
        title: \`\\u{1F504} INTER-TEAM TRANSFER\`,`);

content = content.replace(/await db\.addNotification\(\{\n\s*title: `\$\{notifTitle\} \$\{event\.minute\}'`,/g,
`await db.addNotification({
          idempotencyKey: \`notif_event_\${event.id}\`,
          title: \`\${notifTitle} \${event.minute}'\`,`);

content = content.replace(/await db\.addNotification\(\{\n\s*title: `📋 Lineup Published: \$\{teamName\}`/g,
`await db.addNotification({
        idempotencyKey: \`notif_lineup_\${match.id}_\${isHome ? 'home' : 'away'}\`,
        title: \`📋 Lineup Published: \${teamName}\``);

content = content.replace(/await db\.addNotification\(\{\n\s*title: req\.body\.title \|\| "League Notification",/g,
`await db.addNotification({
        idempotencyKey: req.body.idempotencyKey,
        title: req.body.title || "League Notification",`);

fs.writeFileSync('server.ts', content, 'utf8');
console.log("Patched server.ts idempotency keys");
