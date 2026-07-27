const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

if (!appContent.includes('backManager')) {
  appContent = appContent.replace(
    "import { AboutPage } from './components/AboutPage';",
    "import { AboutPage } from './components/AboutPage';\nimport { handleBack, useBackHandler } from './utils/backManager';"
  );
}

const backHandlerLogic = `
  // Hardware Back Button Integration
  useEffect(() => {
    // Push dummy state to catch the back event
    window.history.pushState({ isAppBack: true }, '', window.location.href);

    const onPopState = (e: PopStateEvent) => {
      const handled = handleBack();
      if (handled) {
        // If handled by our router, restore the back-stop dummy state
        window.history.pushState({ isAppBack: true }, '', window.location.href);
      } else {
        // Not handled -> we are at root, exit the app natively.
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useBackHandler(() => {
    if (showOfflineModal) return false; // Don't close offline modal with back

    if (selectedMatch) {
      setSelectedMatch(null);
      return true;
    }
    if (selectedTeamProfile) {
      setSelectedTeamProfile(null);
      return true;
    }
    if (isAuthDeckOpen) {
      setIsAuthDeckOpen(false);
      return true;
    }
    if (activeTab !== 'matches') {
      setActiveTab('matches');
      return true;
    }
    return false;
  }, [selectedMatch, selectedTeamProfile, isAuthDeckOpen, activeTab, showOfflineModal]);
`;

if (!appContent.includes('useBackHandler(() => {')) {
  appContent = appContent.replace(
    "  // Network connectivity state",
    backHandlerLogic + "\n  // Network connectivity state"
  );
  fs.writeFileSync('src/App.tsx', appContent);
  console.log('App.tsx updated');
} else {
  console.log('Already updated');
}
