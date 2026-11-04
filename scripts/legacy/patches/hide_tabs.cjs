const fs = require('fs');
let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

const targetRegex = /        \{\/\* Tab Pills \*\/\}/;
const replacement = `        {/* Tab Pills */}
        {!isPreseason && (`;

content = content.replace(targetRegex, replacement);

const targetRegex2 = /        <\/div>\n      <\/div>\n\n      \{\/\* Master Leaderboard Widget Deployment \*\/\}/;
const replacement2 = `        </div>
        )}
      </div>

      {/* Master Leaderboard Widget Deployment */}`;

content = content.replace(targetRegex2, replacement2);

fs.writeFileSync('src/components/LeagueStats.tsx', content, 'utf8');
