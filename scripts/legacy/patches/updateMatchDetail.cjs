const fs = require('fs');

let content = fs.readFileSync('src/components/MatchDetailModal.tsx', 'utf8');

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
    return false;
  }, [selectedProfilePlayer]);
`;

if (!content.includes('useBackHandler(() => {')) {
  content = content.replace(
    "  const [sendingChat, setSendingChat] = useState(false);",
    "  const [sendingChat, setSendingChat] = useState(false);\n" + backHandlerLogic
  );
  fs.writeFileSync('src/components/MatchDetailModal.tsx', content);
  console.log('MatchDetailModal updated');
} else {
  console.log('Already updated');
}
