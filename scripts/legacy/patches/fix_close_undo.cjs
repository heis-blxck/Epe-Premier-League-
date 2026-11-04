const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

code = code.replace(/          <\/div>\n        <\/div>\n      \)\)\}/g, `          </div>
        </div>
      )}`);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
