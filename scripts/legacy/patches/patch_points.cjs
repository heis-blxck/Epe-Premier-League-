const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const marketItem = `
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block border-r border-slate-700 pr-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pts</span>
                            <span className="text-xs font-black text-white">{player.fantasyPoints || 0}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Price</span>
                            <span className="text-xs font-black text-amber-400">₦{player.price || 6.0}M</span>
                          </div>
`;

code = code.replace(
  /\<div className="flex items-center gap-3"\>\s*\<div className="text-right"\>\s*\<span className="text-\[10px\] uppercase font-bold text-slate-400 block"\>Price\<\/span\>\s*\<span className="text-xs font-black text-amber-400"\>₦\{player\.price \|\| 6\.0\}M\<\/span\>\s*\<\/div\>/,
  marketItem
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
