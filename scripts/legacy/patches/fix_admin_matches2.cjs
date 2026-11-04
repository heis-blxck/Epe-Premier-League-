const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

content = content.replace(/matches\.length/g, 'enrichedMatches.length');
content = content.replace(/matches\.map/g, 'enrichedMatches.map');
content = content.replace(/matches\.find/g, 'enrichedMatches.find');
content = content.replace(/matches\.filter/g, 'enrichedMatches.filter');
content = content.replace(/matches\.reduce/g, 'enrichedMatches.reduce');
content = content.replace(/setMatches/g, 'setMatches'); // wait, there is no setMatches

fs.writeFileSync('src/components/AdminDashboard.tsx', content, 'utf8');
