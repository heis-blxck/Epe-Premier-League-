const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const insightsLogic = `
  // --- INSIGHTS COMPUTATIONS ---
  // Top Performers (Highest total points)
  const topPerformers = [...(players || [])].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)).slice(0, 5);
  
  // Ownership Counts (Most Bought/Owned)
  const ownershipCount = new Map<string, number>();
  const captaincyCount = new Map<string, number>();
  
  allSquads.forEach(sq => {
    (sq.playerIds || []).forEach(pid => {
      ownershipCount.set(pid, (ownershipCount.get(pid) || 0) + 1);
    });
    if (sq.captainPlayerId) {
      captaincyCount.set(sq.captainPlayerId, (captaincyCount.get(sq.captainPlayerId) || 0) + 1);
    }
  });

  const mostOwnedPlayers = [...(players || [])].sort((a, b) => (ownershipCount.get(b.id) || 0) - (ownershipCount.get(a.id) || 0)).slice(0, 3);
  
  const mostCaptainedPlayerId = [...captaincyCount.entries()].sort((a, b) => b[1] - a[1])?.[0]?.[0];
  const captaincyFavorite = mostCaptainedPlayerId ? players.find(p => p.id === mostCaptainedPlayerId) : null;
`;

// Insert it right before the `return` statement.
code = code.replace(
  /  return \(\n    \<div className="space-y-6"\>/,
  insightsLogic + '\n  return (\n    <div className="space-y-6">'
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
