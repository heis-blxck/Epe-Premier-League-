const fs = require('fs');
let api = fs.readFileSync('src/services/api.ts', 'utf8');

if (!api.includes('getManagerChips')) {
  const newMethods = `
  async getManagerChips(userId: string): Promise<any> {
    const res = await fetch(\`/api/manager-chips/\${userId}\`);
    if (!res.ok) throw new Error('Failed to fetch manager chips');
    return res.json();
  },

  async saveManagerChips(chips: any): Promise<any> {
    const res = await fetch('/api/manager-chips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chips),
    });
    if (!res.ok) throw new Error('Failed to save manager chips');
    return res.json();
  },
`;
  api = api.replace('async getPlayerOfTheWeek', newMethods + '\n  async getPlayerOfTheWeek');
  fs.writeFileSync('src/services/api.ts', api);
}
console.log("API client patched");
