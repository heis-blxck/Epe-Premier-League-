const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const regex = /          <\/div>\n        <\/div>\n      \)\}/g;
const replacement = `          </div>
        </div>
      ))}`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
