const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldLogic = `      // Always allow super admin to specify their status, but news reporters are vetted
      if (req.body.authorRole === "news_reporter") {
          if (isApproved) {
              finalStatus = "published";
              finalIsPublished = true;
          } else {
              finalStatus = "pending_approval";
              finalIsPublished = false;
          }
      }`;

const newLogic = `      // Always allow super admin to specify their status, but news reporters are vetted
      if (req.body.authorRole === "news_reporter" && !req.body.isSuperAdminAction) {
          if (isApproved) {
              finalStatus = "published";
              finalIsPublished = true;
          } else {
              finalStatus = "pending_approval";
              finalIsPublished = false;
          }
      }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('server.ts', code);
console.log("server.ts override patched");
