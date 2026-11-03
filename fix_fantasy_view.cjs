const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const regex = /  \/\/ --- INSIGHTS COMPUTATIONS ---[\s\S]*?const captaincyFavorite = mostCaptainedPlayers\.length > 0 \? mostCaptainedPlayers\[0\] : null;/;

const replacement = `  const [statsData, setStatsData] = useState<any>(null);
  
  useEffect(() => {
    if (activeTab === 'insights' && !statsData) {
       api.getFantasyDashboardStats().then(setStatsData).catch(console.error);
    }
  }, [activeTab]);

  // --- INSIGHTS COMPUTATIONS ---
  const topPerformers = statsData?.topPerformers || [];
  const mostOwnedPlayers = statsData?.mostOwnedPlayers || [];
  const mostCaptainedPlayers = statsData?.mostCaptainedPlayers || [];
  const captaincyFavorite = mostCaptainedPlayers.length > 0 ? mostCaptainedPlayers[0] : null;`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
