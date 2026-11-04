const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const oldLogic = `  // 1. Global Gameweek Deadline Lock Calculation
  const activeMatch = (matches || []).find(m => 
    m.status === 'Live' || m.status === 'Half-Time' || m.status === 'Penalties'
  );

  const pastKickoffMatch = (matches || []).find(m => {
    if (m.status === 'Scheduled' && m.date && m.time) {
      const kickoff = new Date(\`\${m.date}T\${m.time}:00\`);
      return !isNaN(kickoff.getTime()) && new Date() >= kickoff;
    }
    return false;
  });

  const isGameweekLocked = Boolean(activeMatch || pastKickoffMatch);
  const lockReason = activeMatch 
    ? \`Gameweek In Progress - Match Live (\${teamMap.get(activeMatch.homeTeamId)?.shortName || 'Home'} vs \${teamMap.get(activeMatch.awayTeamId)?.shortName || 'Away'})\`
    : pastKickoffMatch 
      ? \`Gameweek Deadline Passed (Kickoff Reached for Matchday \${pastKickoffMatch.matchday})\` 
      : '';`;

const newLogic = `  // 1. Global Gameweek Deadline Lock Calculation
  const activeMatch = (matches || []).find(m => 
    m.status === 'Live' || m.status === 'Half-Time' || m.status === 'Penalties'
  );

  const pastKickoffMatch = (matches || []).find(m => {
    if (m.status === 'Scheduled' && m.date && m.time) {
      const kickoff = new Date(\`\${m.date}T\${m.time}:00\`);
      if (isNaN(kickoff.getTime())) return false;
      const deadline = new Date(kickoff.getTime() - 4 * 60 * 60 * 1000); // 4 hours before kickoff
      return new Date() >= deadline;
    }
    return false;
  });

  const isGameweekLocked = Boolean(activeMatch || pastKickoffMatch);
  const lockReason = activeMatch 
    ? \`Gameweek In Progress - Match Live (\${teamMap.get(activeMatch.homeTeamId)?.shortName || 'Home'} vs \${teamMap.get(activeMatch.awayTeamId)?.shortName || 'Away'})\`
    : pastKickoffMatch 
      ? \`Gameweek Deadline Passed (Locked 4 hours before kickoff for Matchday \${pastKickoffMatch.matchday})\` 
      : '';`;

if (code.includes('return !isNaN(kickoff.getTime()) && new Date() >= kickoff;')) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
  console.log("Deadline logic patched");
} else {
  console.log("Could not find the target string.");
}
