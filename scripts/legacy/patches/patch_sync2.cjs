const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const wipeRegex = /const matchesSnap = await firestore\.collection\('matches'\)\.get\(\);\s*if \(\!matchesSnap\.empty\) \{\s*const deletePromises = matchesSnap\.docs\.map\(docSnap => firestore\.collection\('matches'\)\.doc\(docSnap\.id\)\.delete\(\)\.catch\(e => console\.error\(e\)\)\);\s*await Promise\.all\(deletePromises\);\s*console\.log\('Wiped all match documents from Firestore'\);\s*\}/;

if (wipeRegex.test(content)) {
    content = content.replace(wipeRegex, '');
    console.log("Patched db.ts by removing wipe code");
    fs.writeFileSync('src/server/db.ts', content, 'utf8');
} else {
    console.error("Wipe code not found!");
}
