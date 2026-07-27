const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const banner = `
      {/* GLOBAL GAMEWEEK STATUS BANNER */}
      {isGameweekLocked ? (
        <div className="bg-rose-950/90 border border-rose-600/80 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 text-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                <span>Gameweek In Progress - Team Changes Locked</span>
                <span className="px-2 py-0.5 bg-rose-900 border border-rose-500 rounded text-[10px] font-bold text-amber-300">GLOBAL LOCK</span>
              </h3>
              <p className="text-xs text-rose-200/90 mt-0.5">
                {lockReason || 'Squad substitutions, captain changes, and transfers are locked until the active matchday concludes.'}
              </p>
            </div>
          </div>
        </div>
      ) : timeLeft ? (
        <div className="bg-emerald-950/90 border border-emerald-600/80 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 text-emerald-100 flex-wrap">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
             </div>
             <div>
                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                   <span>Gameweek Transfers Open</span>
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                   Make your squad changes and transfers before the deadline.
                </p>
             </div>
          </div>
          <div className="flex flex-col items-end sm:items-center bg-emerald-900/50 px-3 py-1.5 rounded-xl border border-emerald-500/30">
             <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300 mb-0.5">Time to Deadline</span>
             <div className="flex items-baseline gap-1 font-black text-white">
                {timeLeft.d > 0 && <><span className="text-xl leading-none">{timeLeft.d}</span><span className="text-[10px] text-emerald-400 mr-1">d</span></>}
                <span className="text-xl leading-none">{timeLeft.h}</span><span className="text-[10px] text-emerald-400 mr-1">h</span>
                <span className="text-xl leading-none">{timeLeft.m}</span><span className="text-[10px] text-emerald-400 mr-1">m</span>
                <span className="text-xl leading-none">{timeLeft.s}</span><span className="text-[10px] text-emerald-400">s</span>
             </div>
          </div>
        </div>
      ) : null}
`;

const oldBanner = `      {/* GLOBAL GAMEWEEK LOCK BANNER */}
      {isGameweekLocked && (
        <div className="bg-rose-950/90 border border-rose-600/80 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 text-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                <span>Gameweek In Progress - Team Changes Locked</span>
                <span className="px-2 py-0.5 bg-rose-900 border border-rose-500 rounded text-[10px] font-bold text-amber-300">GLOBAL LOCK</span>
              </h3>
              <p className="text-xs text-rose-200/90 mt-0.5">
                {lockReason || 'Squad substitutions, captain changes, and transfers are locked until the active matchday concludes.'}
              </p>
            </div>
          </div>
        </div>
      )}`;

if (code.includes('GLOBAL GAMEWEEK LOCK BANNER')) {
  code = code.replace(oldBanner, banner);
  fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
  console.log("Banner patched");
}
