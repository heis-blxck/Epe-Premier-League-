const fs = require('fs');
let config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
delete config.firestoreDatabaseId;
fs.writeFileSync('firebase-applet-config.json', JSON.stringify(config, null, 2), 'utf8');
