const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/};\s*\}\s*await api\.saveMatch/g, '};\n\n      await api.saveMatch');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
