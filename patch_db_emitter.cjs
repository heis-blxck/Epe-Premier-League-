const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

if (!code.includes("import { EventEmitter }")) {
  code = code.replace("import fs from 'fs';", "import fs from 'fs';\nimport { EventEmitter } from 'events';");
  
  code = code.replace(
    "export class DBStore {",
    "export class DBStore extends EventEmitter {"
  );
  
  code = code.replace(
    "  constructor() {",
    "  constructor() {\n    super();"
  );
  
  code = code.replace(
    "    this.data.notifications.unshift(newNotif);",
    "    this.data.notifications.unshift(newNotif);\n    this.emit('new_notification', newNotif);"
  );
  
  fs.writeFileSync('src/server/db.ts', code);
}
