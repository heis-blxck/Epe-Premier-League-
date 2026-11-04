const fs = require('fs');
let content = fs.readFileSync('src/services/api.ts', 'utf8');

const target = `  async getStandings(): Promise<Team[]> {
    const res = await fetch('/api/standings');
    if (!res.ok) throw new Error('Failed to fetch standings');
    return res.json();
  },`;

const replacement = `  async getStandings(): Promise<Team[]> {
    console.log("Attempting to fetch standings (from teams collection)...");
    try {
      const teamsRef = collection(db, 'teams');
      const teamsSnapshot = await getDocs(teamsRef);
      let teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      
      // Sort teams by points desc, goalDifference desc, goalsFor desc, name asc
      teams.sort((a, b) => {
        if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
        if (b.goalDifference !== a.goalDifference) return (b.goalDifference || 0) - (a.goalDifference || 0);
        if (b.goalsFor !== a.goalsFor) return (b.goalsFor || 0) - (a.goalsFor || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
      return teams;
    } catch (error) {
      console.error("Firebase Fetch Error (Standings):", error);
      const res = await fetch('/api/standings');
      return res.json();
    }
  },`;

content = content.replace(target, replacement);
fs.writeFileSync('src/services/api.ts', content, 'utf8');
