const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const newImports = '  Download,\n  Megaphone,\n  Play,\n  Trophy,\n  Users,\n  Newspaper';
code = code.replace('  Download,\n  Megaphone', newImports);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard imports patched.");
