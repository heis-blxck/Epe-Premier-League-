const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /<footer style=\{\{ paddingBottom: '80px' \}\}\s*className=\{`py-8 border-t transition-colors mt-12 \$\{/g,
  '<footer className={`py-8 pb-28 border-t transition-colors mt-auto ${'
);

fs.writeFileSync('src/App.tsx', app);
console.log("Updated App.tsx footer.");
