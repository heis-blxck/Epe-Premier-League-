const fs = require('fs');
let content = fs.readFileSync('src/components/NewsFeed.tsx', 'utf8');

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
  }, [selectedArticle, showAllNewsModal]);`;

content = content.replace(backHandlerLogic, "");
content = content.replace(
  "const [showAllNewsModal, setShowAllNewsModal] = useState(false);",
  "const [showAllNewsModal, setShowAllNewsModal] = useState(false);\n" + backHandlerLogic
);

fs.writeFileSync('src/components/NewsFeed.tsx', content);
