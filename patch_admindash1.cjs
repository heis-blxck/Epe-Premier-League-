const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /"valuations" \| "ads"\>\("controller"\);/g,
  `'valuations' | 'ads' | 'potw'>('controller');`
);
code = code.replace(
  /\| 'ads'\>\('controller'\);/g,
  `| 'ads' | 'potw'>('controller');`
);

// We also need to fetch POTWs in AdminDashboard or let the component fetch it?
// Let's create a new component `PotwManager` to keep it clean, and just import it.
// Or just add it inline. It's React, so inline is fine but can be large. Let's make a separate file src/components/PotwManager.tsx

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
