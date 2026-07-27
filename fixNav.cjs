const fs = require('fs');
let content = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

content = content.replace(
  'className="flex items-center justify-start sm:justify-center overflow-x-auto max-w-lg mx-auto py-2 px-2 gap-2 scrollbar-hide"',
  'className="flex items-center justify-around max-w-lg mx-auto py-2 px-2 relative"'
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', content);
