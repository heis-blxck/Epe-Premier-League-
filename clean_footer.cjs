const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  /<button\s+onClick=\{\(\) => \{\s+if \(isAdmin\) \{\s+setActiveTab\('admin'\);\s+\} else \{\s+setIsAuthDeckOpen\(true\);\s+\}\s+\}\}\s+className="text-amber-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"\s+>\s+<Shield className="w-3.5 h-3.5 text-amber-500" \/>\s+<span>\{isAdmin \? 'Admin Command Center' : 'My Account & Preferences'\}<\/span>\s+<\/button>/,
  ''
);
fs.writeFileSync('src/App.tsx', app);
