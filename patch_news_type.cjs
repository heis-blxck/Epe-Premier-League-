const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('authorEmail?: string;')) {
  code = code.replace(
    'authorTitle?: string;',
    'authorTitle?: string;\n  authorEmail?: string;'
  );
  fs.writeFileSync('src/types.ts', code);
  console.log("NewsArticle type patched");
}
