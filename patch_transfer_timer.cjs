const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const timerUI = `
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Manage your 15-man roster within ₦100.0M budget. Each user gets 2 Free Transfers per Gameweek.
                </p>
                {timeLeft && !isGameweekLocked && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300">Locks in:</span>
                    <div className="flex items-baseline gap-1 font-black text-white ml-1">
                      {timeLeft.d > 0 && <><span className="text-sm">{timeLeft.d}</span><span className="text-[9px] text-emerald-400 mr-1">d</span></>}
                      <span className="text-sm">{timeLeft.h}</span><span className="text-[9px] text-emerald-400 mr-1">h</span>
                      <span className="text-sm">{timeLeft.m}</span><span className="text-[9px] text-emerald-400 mr-1">m</span>
                      <span className="text-sm">{timeLeft.s}</span><span className="text-[9px] text-emerald-400">s</span>
                    </div>
                  </div>
                )}
`;

if (code.includes('Manage your 15-man roster')) {
  code = code.replace(
    /<p className="text-xs text-rose-200\/90 mt-0\.5">\s*Manage your 15-man roster within ₦100\.0M budget\. Each user gets 2 Free Transfers per Gameweek\.\s*<\/p>/g,
    timerUI
  );
  fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
  console.log("Transfer timer patched");
} else {
  console.log("Target not found");
}
