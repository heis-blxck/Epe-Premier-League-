const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

code = code.replace(
  "const collections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'fantasy'];",
  "const collections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'fantasy', 'advertisements'];"
);

fs.writeFileSync('src/server/db.ts', code);
