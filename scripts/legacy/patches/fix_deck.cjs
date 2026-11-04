const fs = require('fs');
let deckContent = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

deckContent = deckContent.replace(
  'onChange={(e) => setNameInput(e.target.value)} readOnly disabled className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border opacity-70 cursor-not-allowed ${\n                          className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border ${\n                            isDark',
  'onChange={(e) => setNameInput(e.target.value)} readOnly disabled\n                          className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border opacity-70 cursor-not-allowed ${\n                            isDark'
);
fs.writeFileSync('src/components/UserAuthDeckModal.tsx', deckContent);
