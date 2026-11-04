const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

// For every instance of `{activeTab === 'insights' && (!players || players.length === 0 ? (`
// we need to make sure its corresponding closing is `))]` or rather `))}`.
// The easiest way is to just use a stack or simply replace the `)}` at the end of the `activeTab === 'insights'` block.
// Wait, they are exactly the same blocks? Why are there two?
// Let's check how many times `{activeTab === 'insights'` appears.
console.log("matches:", (code.match(/\{activeTab === 'insights' &&/g) || []).length);
