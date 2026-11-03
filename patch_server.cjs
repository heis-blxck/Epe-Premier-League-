const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const target = `        authorTitle: isOfficialRole ? "" : (req.body.authorTitle || "Official League Correspondent"),`;
const targetWindows = target.replace(/\n/g, '\r\n');

const replacement = `        authorTitle: isOfficialRole ? "" : (req.body.authorTitle || "Official League Correspondent"),
        customReporterRole: isOfficialRole ? "Football Association" : (req.body.customReporterRole || "Reporter"),`;
const replacementWindows = replacement.replace(/\n/g, '\r\n');

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Patched server.ts");
} else if (content.includes(targetWindows)) {
    content = content.replace(targetWindows, replacementWindows);
    console.log("Patched server.ts (Windows)");
} else {
    console.error("Target not found!");
}
fs.writeFileSync('server.ts', content, 'utf8');
