const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace('  Download,\n  Megaphone,\n  Play,\n  Trophy,\n  Users,\n  Newspaper', '  Download,\n  Megaphone');
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard imports reverted.");
