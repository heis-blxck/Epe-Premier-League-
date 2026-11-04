const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\s*\/\/ Listen for Service Worker messages[\s\S]*?navigator\.serviceWorker\.removeEventListener\('message', handleSWMessage\);\n\s*};\n\s*\}, \[\]\);/g,
  ""
);

fs.writeFileSync('src/App.tsx', code);
