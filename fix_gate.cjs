const fs = require('fs');

let gateContent = fs.readFileSync('src/components/MandatoryLoginGate.tsx', 'utf8');
gateContent = gateContent.replace(
  'onChange={(e) => setNameInput(e.target.value)} readOnly disabled className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 opacity-70 cursor-not-allowed`}\n                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"',
  'onChange={(e) => setNameInput(e.target.value)} readOnly disabled\n                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 opacity-70 cursor-not-allowed"'
);
fs.writeFileSync('src/components/MandatoryLoginGate.tsx', gateContent);

let deckContent = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');
deckContent = deckContent.replace(
  'onChange={(e) => setNameInput(e.target.value)} readOnly disabled className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border opacity-70 cursor-not-allowed ${\n                            isDark',
  'readOnly disabled\n                          className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border opacity-70 cursor-not-allowed ${\n                            isDark'
);
fs.writeFileSync('src/components/UserAuthDeckModal.tsx', deckContent);
