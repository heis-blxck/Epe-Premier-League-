const fs = require('fs');

let content = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

if (!content.includes('backManager')) {
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { useBackHandler } from '../utils/backManager';"
  );
}

const backHandlerLogic = `
  useBackHandler(() => {
    if (selectedProfilePlayer) {
      setSelectedProfilePlayer(null);
      return true;
    }
    if (selectedManagerSquad) {
      setSelectedManagerSquad(null);
      return true;
    }
    return false;
  }, [selectedProfilePlayer, selectedManagerSquad]);
`;

if (!content.includes('useBackHandler(() => {')) {
  content = content.replace(
    "  const [selectedManagerSquad, setSelectedManagerSquad] = useState<FantasySquad | null>(null);",
    "  const [selectedManagerSquad, setSelectedManagerSquad] = useState<FantasySquad | null>(null);\n" + backHandlerLogic
  );
  fs.writeFileSync('src/components/FantasyLeagueView.tsx', content);
  console.log('FantasyLeagueView updated');
} else {
  console.log('Already updated');
}
