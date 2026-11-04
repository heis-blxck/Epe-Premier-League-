const fs = require('fs');

let deckContent = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');
deckContent = deckContent.replace(
  'onChange={(e) => setNameInput(e.target.value)} readOnly disabled',
  'onChange={(e) => setNameInput(e.target.value)}'
);
deckContent = deckContent.replace(
  'onChange={(e) => setProfileName(e.target.value)} readOnly disabled',
  'onChange={(e) => setProfileName(e.target.value)}'
);
deckContent = deckContent.replace(
  'className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border opacity-70 cursor-not-allowed ${',
  'className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border ${'
);
deckContent = deckContent.replace(
  'className={`w-full rounded-xl px-3.5 py-2 text-xs font-bold border opacity-70 cursor-not-allowed ${',
  'className={`w-full rounded-xl px-3.5 py-2 text-xs font-bold border ${'
);
fs.writeFileSync('src/components/UserAuthDeckModal.tsx', deckContent);

let gateContent = fs.readFileSync('src/components/MandatoryLoginGate.tsx', 'utf8');
gateContent = gateContent.replace(
  'onChange={(e) => setNameInput(e.target.value)} readOnly disabled',
  'onChange={(e) => setNameInput(e.target.value)}'
);
gateContent = gateContent.replace(
  'className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 opacity-70 cursor-not-allowed"',
  'className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"'
);
fs.writeFileSync('src/components/MandatoryLoginGate.tsx', gateContent);
