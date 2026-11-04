const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      if (resMatches.status === 'fulfilled') setMatches((resMatches.value || []).filter(Boolean));
      if (resStandings.status === 'fulfilled') setStandings((resStandings.value || []).filter(Boolean));
      if (resTeams.status === 'fulfilled') setTeams((resTeams.value || []).filter(Boolean));
      if (resPlayers.status === 'fulfilled') setPlayers((resPlayers.value || []).filter(Boolean));`;

const replacement = `      const loadedTeams = resTeams.status === 'fulfilled' ? (resTeams.value || []).filter(Boolean) : [];
      if (resTeams.status === 'fulfilled') setTeams(loadedTeams);

      let loadedMatches = resMatches.status === 'fulfilled' ? (resMatches.value || []).filter(Boolean) : [];
      loadedMatches = loadedMatches.map(m => ({
          ...m,
          homeTeam: m.homeTeam || loadedTeams.find(t => t.id === m.homeTeamId),
          awayTeam: m.awayTeam || loadedTeams.find(t => t.id === m.awayTeamId),
      }));
      if (resMatches.status === 'fulfilled') setMatches(loadedMatches);

      if (resStandings.status === 'fulfilled') setStandings((resStandings.value || []).filter(Boolean));
      if (resPlayers.status === 'fulfilled') setPlayers((resPlayers.value || []).filter(Boolean));`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content, 'utf8');
