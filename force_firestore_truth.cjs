const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

// Unconditionally apply Firestore data
content = content.replace('if (hasData) {', 'if (true) {');

fs.writeFileSync('src/server/db.ts', content, 'utf8');
