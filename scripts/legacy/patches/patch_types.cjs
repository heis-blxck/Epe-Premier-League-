const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

const target = `  authorTitle?: string;`;
const targetWindows = target.replace(/\n/g, '\r\n');

const replacement = `  authorTitle?: string;
  customReporterRole?: string;`;
const replacementWindows = replacement.replace(/\n/g, '\r\n');

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Patched types.ts");
} else if (content.includes(targetWindows)) {
    content = content.replace(targetWindows, replacementWindows);
    console.log("Patched types.ts (Windows)");
} else {
    console.error("Target not found!");
}
fs.writeFileSync('src/types.ts', content, 'utf8');
