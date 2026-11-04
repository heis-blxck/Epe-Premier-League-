const fs = require('fs');
let content = fs.readFileSync('src/components/LeagueStats.tsx', 'utf8');

// Replace getLeaderboardData
content = content.replace(/    \/\/ Check if preseason \(0 goals league-wide\)\n    const isPreseason = playersList\.every\(p => \(p\.goals \|\| 0\) === 0\);\n\n    if \(isPreseason\) \{\n      return playersList\.map\(player => \{\n        return \{\n          player,\n          value: player\.position,\n          displaySub: \`Team: \$\{teamsMap\.get\(player\.teamId\)\?\.name \|\| 'Unknown'\}\`\n        \};\n      \}\)\.sort\(\(a, b\) => String\(a\.value\)\.localeCompare\(String\(b\.value\)\)\);\n    \}/, '');

// Replace isPreseason
content = content.replace(/  const isPreseason = players && players\.length > 0 && players\.every\(p => \(p\.goals \|\| 0\) === 0\);\n/, '  const isPreseason = players && players.length > 0 && players.every(p => (p.goals || 0) === 0 && (p.assists || 0) === 0);\n\n  if (isPreseason && !latestPotm) return null;\n');

// Replace getTitleAndSubtitle
content = content.replace(/    if \(isPreseason\) \{\n      return \{ title: 'Preseason Roster', subtitle: 'All registered players across the league.' \};\n    \}\n/, '');

// Fix metricLabel
content = content.replace(/  const metricLabel = isPreseason \? 'Position' : \(activeCategory === 'topPerformers' \? 'Impact Score' : activeCategory === 'goals' \? 'Goals' : activeCategory === 'assists' \? 'Assists' : 'Clean Sheets'\);/, `  const metricLabel = activeCategory === 'topPerformers' ? 'Impact Score' : activeCategory === 'goals' ? 'Goals' : activeCategory === 'assists' ? 'Assists' : 'Clean Sheets';`);

// Fix Tab Pills condition
content = content.replace(/        \{\!isPreseason && \(\n        <div/g, '        {(!isPreseason) && (\n        <div');

// Hide MasterLeaderboardWidget if preseason
content = content.replace(/      <MasterLeaderboardWidget\n        title=\{title\}\n        subtitle=\{subtitle\}\n        players=\{currentData\}\n        teamsMap=\{teamsMap\}\n        metricLabel=\{metricLabel\}\n      \/>/g, `      {!isPreseason && (
        <MasterLeaderboardWidget
          title={title}
          subtitle={subtitle}
          players={currentData}
          teamsMap={teamsMap}
          metricLabel={metricLabel}
        />
      )}`);

fs.writeFileSync('src/components/LeagueStats.tsx', content, 'utf8');
