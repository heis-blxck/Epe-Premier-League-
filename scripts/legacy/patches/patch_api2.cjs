const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

code = code.replace(
  /return res\.json\(\);\s*\}/g,
  'return res.json();\n  },'
);

// fix any double commas
code = code.replace(/,\s*,/g, ',');

fs.writeFileSync('src/services/api.ts', code);
