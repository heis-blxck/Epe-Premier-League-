const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const oldCheck = "{(isSuperAdmin || currentAdmin?.role === 'news_reporter') && (";
const newCheck = "{(isSuperAdmin || (currentAdmin?.role === 'news_reporter' && item.authorEmail === currentUserEmail)) && (";

if (code.includes(oldCheck)) {
  code = code.replace(oldCheck, newCheck);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("Delete restriction patched");
}
