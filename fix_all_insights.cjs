const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const regex = /          <\/div>\n        <\/div>\n      \)\}/g;
let matchCount = 0;
code = code.replace(regex, (match) => {
    matchCount++;
    return `          </div>
        </div>
      ))}`;
});

console.log("Replaced", matchCount);
fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
