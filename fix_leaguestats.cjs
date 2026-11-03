const fs = require('fs');
let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

const replacement = `  const getLeaderboardData = () => {
    let playersList: Player[] = players && players.length > 0 ? players : [];
    
    // Check if preseason (0 goals league-wide)
    const isPreseason = playersList.every(p => (p.goals || 0) === 0);

    if (isPreseason) {
      return playersList.map(player => {
        return {
          player,
          value: player.position,
          displaySub: \`Team: \${teamsMap.get(player.teamId)?.name || 'Unknown'}\`
        };
      }).sort((a, b) => (a.player.name || '').localeCompare(b.player.name || ''));
    }

    if (competition === "cup") {
      playersList = playersList.filter(p => (p.cupGoals || 0) > 0 || (p.cupAssists || 0) > 0 || (p.cupCleanSheets || 0) > 0);
    }

    return playersList.map(player => {
      const isCup = competition === 'cup';
      const g = isCup ? (player.cupGoals || 0) : player.goals;
      const a = isCup ? (player.cupAssists || 0) : player.assists;
      const cs = isCup ? (player.cupCleanSheets || 0) : player.cleanSheets;
      const rating = player.ratingAverage || 6.0;

      let value: number | string = 0;
      let displaySub = '';

      if (activeCategory === 'topPerformers') {
        const csPts = (player.position === 'DEF' || player.position === 'GK') ? cs * 5 : (player.position === 'MID' ? cs * 2 : 0);
        const impactScore = g * 5 + a * 3 + csPts + Math.max(0, (rating - 5.0) * 4);
        value = Math.round(impactScore);
        displaySub = \`⚽ \${g} Goals | 👟 \${a} Assists | 🛡️ \${cs} CS | ⭐ \${rating.toFixed(2)}\`;
      } else if (activeCategory === 'goals') {
        value = g;
        displaySub = \`Rating: \${rating.toFixed(2)}\`;
      } else if (activeCategory === 'assists') {
        value = a;
        displaySub = \`Goals: \${g}\`;
      } else if (activeCategory === 'cleanSheets') {
        value = cs;
        displaySub = \`Position: \${player.position}\`;
      }

      return {
        player,
        value,
        displaySub
      };
    }).sort((x, y) => Number(y.value) - Number(x.value)).slice(0, 15);
  };

  const currentData = getLeaderboardData();
  const isPreseason = players && players.length > 0 && players.every(p => (p.goals || 0) === 0);

  const getTitleAndSubtitle = () => {
    if (isPreseason) {
      return { title: 'Preseason Roster', subtitle: 'All registered players across the league.' };
    }
    const compName = competition === 'cup' ? 'Cup' : 'League';
    if (activeCategory === 'goals') return { title: \`\${compName} Golden Boot (Top Scorers)\`, subtitle: \`Leading goalscorers across all \${compName.toLowerCase()} fixtures.\` };
    if (activeCategory === 'assists') return { title: \`\${compName} Playmaker Award (Top Assists)\`, subtitle: \`Most assists provided in \${compName.toLowerCase()} fixtures.\` };
    if (activeCategory === 'cleanSheets') return { title: \`\${compName} Golden Glove (Clean Sheets)\`, subtitle: \`Goalkeepers and defenders with clean sheets in \${compName.toLowerCase()} fixtures.\` };
    return { title: \`\${compName} \${competition === 'cup' ? 'Cup Stars' : 'League Stars'}\`, subtitle: \`Highest impact scores based on goals, assists, clean sheets & ratings.\` };
  };

  const { title, subtitle } = getTitleAndSubtitle();
  const metricLabel = isPreseason ? 'Position' : (activeCategory === 'topPerformers' ? 'Impact Score' : activeCategory === 'goals' ? 'Goals' : activeCategory === 'assists' ? 'Assists' : 'Clean Sheets');
  const starsLabel = competition === 'cup' ? 'Cup Stars' : 'League Stars';`;

const targetRegex = /  const getLeaderboardData = \(\) => \{[\s\S]*?const starsLabel = competition === 'cup' \? 'Cup Stars' : 'League Stars';/m;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/components/LeagueStats.tsx', content, 'utf8');
