const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\/\/ Request Notification Permissions on mount or login[\s\S]*?\}, \[currentUser\]\);\s*/,
  ""
);

fs.writeFileSync('src/App.tsx', code);
