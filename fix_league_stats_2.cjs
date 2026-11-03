const fs = require('fs');
let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

// The block to remove is:
/*
    // Check if preseason (0 goals league-wide)
    const isPreseason = playersList.every(p => (p.goals || 0) === 0);

    if (isPreseason) {
      return playersList.map(player => {
        return {
          player,
          value: player.position,
          displaySub: `Team: ${teamsMap.get(player.teamId)?.name || 'Unknown'}`
        };
      }).sort((a, b) => String(a.value).localeCompare(String(b.value)));
    }
*/

const searchStr = `    // Check if preseason (0 goals league-wide)
    const isPreseason = playersList.every(p => (p.goals || 0) === 0);

    if (isPreseason) {
      return playersList.map(player => {
        return {
          player,
          value: player.position,
          displaySub: \`Team: \$\{teamsMap.get(player.teamId)?.name || 'Unknown'\}\`
        };
      }).sort((a, b) => String(a.value).localeCompare(String(b.value)));
    }`;

content = content.replace(searchStr, '');
fs.writeFileSync('src/components/LeagueStats.tsx', content, 'utf8');
