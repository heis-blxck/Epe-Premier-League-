const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const regex = /  \/\/ --- INSIGHTS COMPUTATIONS ---[\s\S]*?const captaincyFavorite = mostCaptainedPlayerId \? players\.find\(p => p\.id === mostCaptainedPlayerId\) : null;/g;

const replacement = `  // --- INSIGHTS COMPUTATIONS ---
  // Top Performers (Highest total points)
  const topPerformers = [...(players || [])].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)).slice(0, 10);
  
  // Ownership Counts (Most Bought/Owned)
  const mostOwnedPlayers = [...(players || [])].sort((a, b) => (b.ownedByCount || 0) - (a.ownedByCount || 0)).slice(0, 5);
  
  // Captaincy
  const mostCaptainedPlayers = [...(players || [])].sort((a, b) => (b.captainedByCount || 0) - (a.captainedByCount || 0)).slice(0, 5);
  const captaincyFavorite = mostCaptainedPlayers.length > 0 ? mostCaptainedPlayers[0] : null;`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
