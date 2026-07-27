const fs = require('fs');
const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  /const existing = db\.getUsers\(\)\.find\(\(u\) => u\.email\.toLowerCase\(\) === email\);\s+if \(existing\) {/g,
  `const existing = db.getUsers().find((u) => u.email.toLowerCase() === email);
      if (!existing && !req.body.name) {
        return res.status(401).json({ error: "Account not found. Please sign up first." });
      }
      if (existing) {`
);
fs.writeFileSync(path, code);
