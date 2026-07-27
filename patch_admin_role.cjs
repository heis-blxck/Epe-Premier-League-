const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'role: req.body.role === "super_admin" ? "super_admin" : "sub_admin",',
  'role: req.body.role === "super_admin" ? "super_admin" : (req.body.role === "news_reporter" ? "news_reporter" : "sub_admin"),'
);

code = code.replace(
  'message: \`\${newAdmin.name} (\${newAdmin.email}) appointed as \${newAdmin.role === "super_admin" ? "Super Admin" : "Sub-Admin"}.\`,',
  'message: \`\${newAdmin.name} (\${newAdmin.email}) appointed as \${newAdmin.role === "super_admin" ? "Super Admin" : (newAdmin.role === "news_reporter" ? "News Reporter" : "Sub-Admin")}.\`,'
);

fs.writeFileSync('server.ts', code);
console.log("server.ts patched");
