const fs = require('fs');
let content = fs.readFileSync('src/components/TodayMatchesStrip.tsx', 'utf8');

if (!content.includes('backManager')) {
  content = content.replace(
    "import React, { useState, useEffect, useRef } from 'react';",
    "import React, { useState, useEffect, useRef } from 'react';\nimport { useBackHandler } from '../utils/backManager';"
  );
}

const backHandlerLogic = `
  useBackHandler(() => {
    if (showFilterModal) {
      setShowFilterModal(false);
      return true;
    }
    return false;
  }, [showFilterModal]);
`;

if (!content.includes('useBackHandler(() => {')) {
  content = content.replace(
    "  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);",
    "  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);\n" + backHandlerLogic
  );
  fs.writeFileSync('src/components/TodayMatchesStrip.tsx', content);
  console.log('TodayMatchesStrip updated');
} else {
  console.log('Already updated');
}
