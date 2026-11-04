const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /let homePointsToAdd = 0;[\s\S]*?if \(selectedMatch\.awayTeamId\) \{[\s\S]*?\}\s*\}/g;
code = code.replace(regex, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
