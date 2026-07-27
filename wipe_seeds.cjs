const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf-8');

content = content.replace(/const INITIAL_TEAMS: Team\[\] = \[[\s\S]*?\];/m, 'const INITIAL_TEAMS: Team[] = [];');
content = content.replace(/const INITIAL_PLAYERS: Player\[\] = \[[\s\S]*?\];/m, 'const INITIAL_PLAYERS: Player[] = [];');
content = content.replace(/const INITIAL_MATCHES: Match\[\] = \[[\s\S]*?\];/m, 'const INITIAL_MATCHES: Match[] = [];');
content = content.replace(/const INITIAL_EVENTS: MatchEvent\[\] = \[[\s\S]*?\];/m, 'const INITIAL_EVENTS: MatchEvent[] = [];');
content = content.replace(/const INITIAL_RATINGS: Record<string, Record<string, number>> = \{[\s\S]*?\};/m, 'const INITIAL_RATINGS: Record<string, Record<string, number>> = {};');
content = content.replace(/const INITIAL_NEWS: NewsArticle\[\] = \[[\s\S]*?\];/m, 'const INITIAL_NEWS: NewsArticle[] = [];');
content = content.replace(/const INITIAL_NOTIFICATIONS: AppNotification\[\] = \[[\s\S]*?\];/m, 'const INITIAL_NOTIFICATIONS: AppNotification[] = [];');

// Keep super admin in users and admins? 
// User said "entirely clean board all round okay? Clear the firebase to totally empty and awaiting input no demo display blank"
// It might be safer to keep the super admin so they can login. 
// Let's just wipe the demo ones and keep the super admin for itzjeda10@gmail.com
const adminsRegex = /const INITIAL_ADMINS: AdminUser\[\] = \[([\s\S]*?)\];/;
const adminsMatch = content.match(adminsRegex);
if (adminsMatch) {
    const newAdmins = `const INITIAL_ADMINS: AdminUser[] = [\n  {\n    id: 'admin-super-1',\n    name: 'Jeda (Super Admin)',\n    email: 'itzjeda10@gmail.com',\n    role: 'super_admin',\n    appointedAt: '2026-01-01T00:00:00Z',\n    appointedBy: 'System Registry'\n  }\n];`;
    content = content.replace(adminsRegex, newAdmins);
}

const usersRegex = /const INITIAL_USERS: UserAccount\[\] = \[([\s\S]*?)\];/;
const usersMatch = content.match(usersRegex);
if (usersMatch) {
    const newUsers = `const INITIAL_USERS: UserAccount[] = [\n  {\n    id: 'user-super-1',\n    name: 'Jeda',\n    email: 'itzjeda10@gmail.com',\n    role: 'super_admin',\n    createdAt: '2026-01-01T00:00:00Z',\n    themePreference: 'light',\n    notificationsEnabled: true\n  }\n];`;
    content = content.replace(usersRegex, newUsers);
}

fs.writeFileSync('src/server/db.ts', content, 'utf-8');
console.log('Seeds wiped.');
