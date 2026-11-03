const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const regex = /  async getPlayers\(teamId\?: string\): Promise<Player\[\]> \{\n    const url = teamId \? `\/api\/players\?teamId=\$\{teamId\}` : '\/api\/players';\n    const res = await fetch\(url\);\n    if \(!res\.ok\) throw new Error\('Failed to fetch players'\);\n    return res\.json\(\);\n  \},/g;

const replacement = `  async getPlayers(teamId?: string): Promise<Player[]> {
    if (teamId) {
       const res = await fetch(\`/api/players?teamId=\$\{teamId\}\`);
       return res.json();
    }
    
    // Check version
    try {
        const verRes = await fetch('/api/player-version');
        const verData = await verRes.json();
        const serverVersion = verData.last_updated;
        const localVersion = localStorage.getItem('player_version');
        
        if (localVersion && Number(localVersion) === serverVersion) {
            const cachedPlayers = localStorage.getItem('cached_players');
            if (cachedPlayers) {
                return JSON.parse(cachedPlayers);
            }
        }
        
        const res = await fetch('/api/players');
        if (!res.ok) throw new Error('Failed to fetch players');
        const players = await res.json();
        
        localStorage.setItem('cached_players', JSON.stringify(players));
        localStorage.setItem('player_version', serverVersion.toString());
        
        return players;
    } catch(e) {
        const res = await fetch('/api/players');
        return res.json();
    }
  },
  
  async getFantasyDashboardStats(): Promise<any> {
    const res = await fetch('/api/fantasy-dashboard-stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/services/api.ts', code);
