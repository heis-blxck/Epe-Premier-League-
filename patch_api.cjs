const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const potwApi = `
  async getPlayerOfTheWeek(): Promise<any[]> {
    const res = await fetch('/api/player-of-the-week');
    if (!res.ok) throw new Error('Failed to fetch POTW');
    return res.json();
  }

  async savePlayerOfTheWeek(potw: any): Promise<any> {
    const res = await fetch('/api/player-of-the-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(potw),
    });
    if (!res.ok) throw new Error('Failed to save POTW');
    return res.json();
  }
`;

code = code.replace(
  'async getSettings()',
  potwApi + '\n\n  async getSettings()'
);

fs.writeFileSync('src/services/api.ts', code);
