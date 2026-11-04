const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const target1 = `      news: INITIAL_NEWS,
      admins: INITIAL_ADMINS,`;

const target1Windows = target1.replace(/\n/g, '\r\n');

if (content.includes(target1)) {
    content = content.replace(target1, '      news: [],\n      admins: INITIAL_ADMINS,');
    console.log("Patched db.ts by setting default news to empty array");
} else if (content.includes(target1Windows)) {
    content = content.replace(target1Windows, '      news: [],\r\n      admins: INITIAL_ADMINS,');
    console.log("Patched db.ts (Windows)");
} else {
    console.error("Target1 not found!");
}
fs.writeFileSync('src/server/db.ts', content, 'utf8');
