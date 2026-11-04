const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

// We will add getFantasyDashboardStats and getPlayerVersion
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
    // Return a dummy version if we don't have one stored, maybe from fantasy_dashboard_stats or just return current time if not set
    // In our finalizeGameweek we save it to firestore, but not to this.data. Let's save it to this.data.
    return { last_updated: this.data.playerVersion || 0 };
  }
`;

// Wait, we need to update finalizeGameweek to set this.data.playerVersion.
code = code.replace(/this\.saveData\(this\.data\);\n    return \{ success: true, processedSquads \};\n  \}/, `this.data.playerVersion = Date.now();
    this.saveData(this.data);
    return { success: true, processedSquads };
  }`);

// Add methods before final bracket
code = code.replace(/}\nexport const db = new DBStore\(\);/, methodsToAdd + '\n}\nexport const db = new DBStore();');

fs.writeFileSync('src/server/db.ts', code);
