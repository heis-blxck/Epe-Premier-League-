const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

// Add PlayerOfTheWeek import
code = code.replace(
  'Advertisement } from \'../types\';',
  'Advertisement, PlayerOfTheWeek } from \'../types\';'
);

// Add to DatabaseSchema
code = code.replace(
  'advertisements?: Advertisement[];\n}',
  'advertisements?: Advertisement[];\n  playerOfTheWeek?: PlayerOfTheWeek[];\n}'
);

// Add to constructor initial state
code = code.replace(
  'advertisements: []\n    };',
  'advertisements: [],\n      playerOfTheWeek: []\n    };'
);

// Add to sync collections
code = code.replace(
  "collections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'fantasy', 'advertisements'];",
  "collections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'fantasy', 'advertisements', 'playerOfTheWeek'];"
);

// Add to firestore promises
code = code.replace(
  "{ col: 'advertisements', getVal: (d: any) => ({ data: d.advertisements || [] }) }",
  "{ col: 'advertisements', getVal: (d: any) => ({ data: d.advertisements || [] }) },\n           { col: 'playerOfTheWeek', getVal: (d: any) => ({ data: d.playerOfTheWeek || [] }) }"
);

fs.writeFileSync('src/server/db.ts', code);
