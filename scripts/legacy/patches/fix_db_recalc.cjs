const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const regex = /if \(\(m\.status === 'Full-Time' \|\| m\.status === 'Penalties'\) && m\.competition_type !== 'Cup'\) \{/g;
code = code.replace(regex, "if (m.isStatsCommitted && (m.status === 'Full-Time' || m.status === 'Penalties') && m.competition_type !== 'Cup') {");

fs.writeFileSync('src/server/db.ts', code);
