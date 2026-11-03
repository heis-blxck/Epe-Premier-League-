const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const target = `    if (!this.data.news || this.data.news.length === 0) {
      this.data.news = INITIAL_NEWS;
    }`;

if (content.includes(target)) {
    content = content.replace(target, '');
    console.log("Patched db.ts by removing INITIAL_NEWS fallback in resetSeed");
} else if (content.includes(target.replace(/\n/g, '\r\n'))) {
    content = content.replace(target.replace(/\n/g, '\r\n'), '');
    console.log("Patched db.ts (Windows)");
} else {
    console.error("Target not found!");
}
fs.writeFileSync('src/server/db.ts', content, 'utf8');
