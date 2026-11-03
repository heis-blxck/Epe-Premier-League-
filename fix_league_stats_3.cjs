const fs = require('fs');
let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

const searchStr = `    // Check if preseason (0 goals league-wide)
    const isPreseason = playersList.every(p => (p.goals || 0) === 0);

    if (isPreseason) {
      return playersList.map(player => {
        return {
          player,
          value: player.position,
          displaySub: \`Team: \$\{teamsMap.get(player.teamId)?.name || 'Unknown'\}\`
        };
      }).sort((a, b) => (a.player.name || '').localeCompare(b.player.name || ''));
    }`;

content = content.replace(searchStr, '');
fs.writeFileSync('src/components/LeagueStats.tsx', content, 'utf8');
