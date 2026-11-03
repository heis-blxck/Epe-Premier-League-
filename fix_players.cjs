const fs = require('fs');
let content = fs.readFileSync('src/services/api.ts', 'utf8');

const regex = /async getPlayers\(teamId\?: string\): Promise<Player\[\]> \{[\s\S]*?async getFantasyDashboardStats/m;

const replacement = `async getPlayers(teamId?: string): Promise<Player[]> {
    console.log("Attempting to fetch players...");
    try {
      const playersRef = collection(db, 'players');
      const playersSnapshot = await getDocs(playersRef);
      const rawPlayers = playersSnapshot.docs.map(doc => doc.data());
      console.log("Raw Players Data:", rawPlayers);
      
      let players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      if (teamId) {
         players = players.filter(p => p.teamId === teamId);
      }
      return players;
    } catch (error) {
      console.error("Firebase Fetch Error (Players):", error);
      // Fallback to API
      const res = await fetch(teamId ? \`/api/players?teamId=\${teamId}\` : '/api/players');
      return res.json();
    }
  },

  async getFantasyDashboardStats`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/services/api.ts', content, 'utf8');
