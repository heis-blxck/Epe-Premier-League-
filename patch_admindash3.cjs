const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  "import {",
  "import {\n  Trophy,"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
