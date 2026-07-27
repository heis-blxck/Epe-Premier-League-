const fs = require('fs');
const emptyDb = {
  settings: {
    appName: "Epe Premier League",
    leagueSeason: "2026 Season",
    primaryColor: "#800020",
    accentColor: "#facc15",
    appLogoUrl: "/logo.svg",
    defaultTheme: "dark",
    id: "global"
  },
  teams: [], players: [], matches: [], events: [], news: [], 
  admins: [{
    id: 'admin-super-1',
    name: 'Jeda (Super Admin)',
    email: 'itzjeda10@gmail.com',
    role: 'super_admin',
    appointedAt: '2026-01-01T00:00:00Z',
    appointedBy: 'System Registry'
  }], 
  users: [{
    id: 'user-super-1',
    name: 'Jeda',
    email: 'itzjeda10@gmail.com',
    role: 'super_admin',
    createdAt: '2026-01-01T00:00:00Z',
    themePreference: 'light',
    notificationsEnabled: true
  }], 
  notifications: [], ratings: {}, predictions: [], 
  fantasySquads: [], miniLeagues: [], advertisements: [], playerOfTheWeek: [], system: []
};
fs.writeFileSync('data/epe_league_db.json', JSON.stringify(emptyDb, null, 2));
console.log('JSON wiped');
