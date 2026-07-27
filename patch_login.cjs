const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /  const handleLogin = async \(email: string, name\?: string, favoriteTeamId\?: string, avatarUrl\?: string\) => \{\s*const user = await api\.loginUser\(email, name, favoriteTeamId, avatarUrl\);\s*if \(user\.notificationsEnabled && 'Notification' in window && Notification\.permission !== 'granted'\) \{\s*Notification\.requestPermission\(\);\s*\}/,
  `  const handleLogin = async (email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string) => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
    const user = await api.loginUser(email, name, favoriteTeamId, avatarUrl);`
);
fs.writeFileSync('src/App.tsx', code);
