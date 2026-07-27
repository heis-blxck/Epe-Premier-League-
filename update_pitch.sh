sed -i '312,363d' src/components/Pitch2D.tsx
sed -i '311a \
          <button\
            type="button"\
            onClick={() => setActiveFilter('\''market_value'\'')}\
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${\
              activeFilter === '\''market_value'\''\
                ? '\''bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'\''\
                : '\''bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'\''\
            }`}\
          >\
            <DollarSign className="w-3.5 h-3.5" />\
            <span>Market Value</span>\
          </button>\
          <button\
            type="button"\
            onClick={() => setActiveFilter('\''fantasy_pts'\'')}\
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${\
              activeFilter === '\''fantasy_pts'\''\
                ? '\''bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'\''\
                : '\''bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'\''\
            }`}\
          >\
            <Trophy className="w-3.5 h-3.5" />\
            <span>Fantasy Pts</span>\
          </button>\
' src/components/Pitch2D.tsx
