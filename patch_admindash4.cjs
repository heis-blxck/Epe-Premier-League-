const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /  Trophy, Match, Team, Player,/,
  " Match, Team, Player,"
);

if (!code.includes('Trophy,') && !code.includes('Trophy }')) {
  code = code.replace(
    '  ShieldAlert,',
    '  Trophy,\n  ShieldAlert,'
  );
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
