const fs = require('fs');

let content = fs.readFileSync('src/components/NewsFeed.tsx', 'utf8');

if (!content.includes('backManager')) {
  content = content.replace(
    "import React, { useState } from \"react\";",
    "import React, { useState } from \"react\";\nimport { useBackHandler } from '../utils/backManager';"
  );
  content = content.replace(
    "import React, { useState, useEffect } from \"react\";",
    "import React, { useState, useEffect } from \"react\";\nimport { useBackHandler } from '../utils/backManager';"
  );
}

const backHandlerLogic = `
  useBackHandler(() => {
    if (selectedArticle) {
      setSelectedArticle(null);
      return true;
    }
    if (showAllNewsModal) {
      setShowAllNewsModal(false);
      return true;
    }
    return false;
  }, [selectedArticle, showAllNewsModal]);
`;

if (!content.includes('useBackHandler(() => {')) {
  content = content.replace(
    "  const [copiedLink, setCopiedLink] = useState(false);",
    "  const [copiedLink, setCopiedLink] = useState(false);\n" + backHandlerLogic
  );
  fs.writeFileSync('src/components/NewsFeed.tsx', content);
  console.log('NewsFeed updated');
} else {
  console.log('Already updated');
}
