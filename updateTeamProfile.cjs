const fs = require('fs');

let content = fs.readFileSync('src/components/TeamProfileModal.tsx', 'utf8');

if (!content.includes('backManager')) {
  content = content.replace(
    "import React, { useState, useMemo } from 'react';",
    "import React, { useState, useMemo } from 'react';\nimport { useBackHandler } from '../utils/backManager';"
  );
}

const backHandlerLogic = `
  useBackHandler(() => {
    if (selectedPlayer) {
      setSelectedPlayer(null);
      return true;
    }
    return false;
  }, [selectedPlayer]);
`;

if (!content.includes('useBackHandler(() => {')) {
  content = content.replace(
    "  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);",
    "  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);\n" + backHandlerLogic
  );
  fs.writeFileSync('src/components/TeamProfileModal.tsx', content);
  console.log('TeamProfileModal updated');
} else {
  console.log('Already updated');
}
