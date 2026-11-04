const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  'authorRole?: string;',
  'authorRole?: string;\n  authorEmail?: string;'
);

fs.writeFileSync('src/types.ts', code);
console.log("NewsArticle type patched for real");
