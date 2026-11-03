const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const methodsToAdd = `
  public getFantasyDashboardStats() {
    const topPerformers = [...(this.data.players || [])].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)).slice(0, 10);
    const mostOwnedPlayers = [...(this.data.players || [])].sort((a, b) => (b.ownedByCount || 0) - (a.ownedByCount || 0)).slice(0, 5);
    const mostCaptainedPlayers = [...(this.data.players || [])].sort((a, b) => (b.captainedByCount || 0) - (a.captainedByCount || 0)).slice(0, 5);
    
    return {
        topPerformers,
        mostOwnedPlayers,
        mostCaptainedPlayers,
        lastUpdated: Date.now()
    };
  }
  
  public getPlayerVersion() {
    return { last_updated: this.data.playerVersion || 0 };
  }
`;

code = code.replace(/  public likeEplHighlight[\s\S]*?}\n\nexport const db = new DBStore\(\);/, match => match.replace(/}\n\nexport const db = new DBStore\(\);/, '}\n' + methodsToAdd + '}\n\nexport const db = new DBStore();'));

fs.writeFileSync('src/server/db.ts', code);
