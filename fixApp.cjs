const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Find Network connectivity state and move it above Hardware Back Button Integration

const networkState = `  // Network connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);`;

content = content.replace(networkState + "\n", "");
content = content.replace("  // Hardware Back Button Integration", networkState + "\n\n  // Hardware Back Button Integration");

fs.writeFileSync('src/App.tsx', content);
