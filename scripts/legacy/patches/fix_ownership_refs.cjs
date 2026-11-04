const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

code = code.replace(/ownershipCount\.get\(([^)]+)\)/g, '$1.ownedByCount');
code = code.replace(/captaincyFavorite\.id\.ownedByCount/g, 'captaincyFavorite.ownedByCount');
code = code.replace(/p\.id\.ownedByCount/g, 'p.ownedByCount');

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
