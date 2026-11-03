const fs = require('fs');
let content = fs.readFileSync('src/services/api.ts', 'utf8');

const importStr = `import { collection, getDocs } from 'firebase/firestore';\nimport { db } from '../firebase';\n`;

content = importStr + content;

const getTeamsTarget = `  async getTeams(): Promise<Team[]> {
    const res = await fetch('/api/teams');
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },`;

const getTeamsReplacement = `  async getTeams(): Promise<Team[]> {
    console.log("Attempting to fetch teams...");
    try {
      const teamsRef = collection(db, 'teams');
      const teamsSnapshot = await getDocs(teamsRef);
      console.log("Raw Teams Data:", teamsSnapshot.docs.map(doc => doc.data()));
      return teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
    } catch (error) {
      console.error("Firebase Fetch Error (Teams):", error);
      // Fallback to API if requested
      const res = await fetch('/api/teams');
      return res.json();
    }
  },`;

content = content.replace(getTeamsTarget, getTeamsReplacement);

const getPlayersTarget = `  async getPlayers(teamId?: string): Promise<Player[]> {
    if (teamId) {
       const res = await fetch(\`/api/players?teamId=\${teamId}\`);
       return res.json();
    }
    
    // Check version
    try {
        const verRes = await fetch('/api/player-version');
        const verData = await verRes.json();
        const serverVersion = verData.last_updated || 0;
        const localVersion = localStorage.getItem('player_version');
        
        if (serverVersion > 0 && localVersion && Number(localVersion) === serverVersion) {
            const cachedPlayers = localStorage.getItem('cached_players');
            if (cachedPlayers) {
                const parsed = JSON.parse(cachedPlayers);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        }
        
        const res = await fetch('/api/players');
        if (!res.ok) throw new Error('Failed to fetch players');
        const players = await res.json();
        
        if (Array.isArray(players) && players.length > 0) {
            localStorage.setItem('cached_players', JSON.stringify(players));
            localStorage.setItem('player_version', (serverVersion || Date.now()).toString());
        } else {
            localStorage.removeItem('cached_players');
            localStorage.removeItem('player_version');
        }
        
        return players;
    } catch(e) {
        console.error('Error fetching players with versioning', e);
        const res = await fetch('/api/players');
        return res.json();
    }
  },`;

const getPlayersReplacement = `  async getPlayers(teamId?: string): Promise<Player[]> {
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
  },`;

content = content.replace(getPlayersTarget, getPlayersReplacement);

fs.writeFileSync('src/services/api.ts', content, 'utf8');
