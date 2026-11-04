const fs = require('fs');

let content = fs.readFileSync('src/components/PlayerProfileModal.tsx', 'utf8');

const calcBlock = `
  // Match Context Computations
  let matchRating = 0;
  let matchMinutesPlayed = 0;
  let matchGoals = 0;
  let matchAssists = 0;
  let matchShotsFaced = 0;
  let matchSaves = 0;

  if (matchContext) {
    const isHome = matchContext.homeTeamId === player.teamId;
    const lineup = isHome ? matchContext.homeLineup : matchContext.awayLineup;
    const oppTeam = isHome ? matchContext.awayTeam : matchContext.homeTeam;
    
    // Rating
    matchRating = matchContext.ratings?.[player.id] || 0;
    if (!matchRating && lineup) {
      const activeLineupPlayer = [...(lineup.startingXI || []), ...(lineup.substitutes || [])].find(p => p.playerId === player.id);
      matchRating = activeLineupPlayer?.rating || 0;
    }
    
    // Goals & Assists
    matchGoals = matchContext.events?.filter(e => e.eventType === 'Goal' && e.playerId === player.id).length || 0;
    matchAssists = matchContext.events?.filter(e => e.eventType === 'Goal' && e.assisterId === player.id).length || 0;
    
    // Minutes Played calculation
    let subOnMinute = -1;
    let subOffMinute = -1;
    
    const isStarter = lineup?.startingXI?.some(p => p.playerId === player.id) ?? false;
    
    matchContext.events?.forEach(e => {
      if (e.eventType === 'Sub') {
        if (e.subInPlayerId === player.id) subOnMinute = e.minute;
        if (e.playerId === player.id) subOffMinute = e.minute;
      }
    });
    
    if (isStarter) {
      if (subOffMinute > -1) {
        matchMinutesPlayed = subOffMinute;
      } else {
        matchMinutesPlayed = matchContext.matchMinute || 90;
      }
    } else if (subOnMinute > -1) {
      if (subOffMinute > -1) {
         matchMinutesPlayed = subOffMinute - subOnMinute;
      } else {
         const currentMin = matchContext.matchMinute || 90;
         matchMinutesPlayed = currentMin - subOnMinute;
      }
    }
    
    // GK Stats
    if (player.position === 'GK' || player.position === 'GOALKEEPER') {
      const oppShotsOnTarget = isHome ? matchContext.stats?.awayShotsOnTarget : matchContext.stats?.homeShotsOnTarget;
      matchShotsFaced = oppShotsOnTarget || 0;
      
      const oppGoalsScored = isHome ? matchContext.awayScore : matchContext.homeScore;
      matchSaves = Math.max(0, matchShotsFaced - (oppGoalsScored || 0));
    }
  }

  return (
`;

content = content.replace('  return (', calcBlock);

content = content.replace(
  /<div className="flex items-center justify-between bg-slate-900 rounded-xl p-1 mb-5">/g,
  '{!matchContext && (\n          <div className="flex items-center justify-between bg-slate-900 rounded-xl p-1 mb-5">'
);

content = content.replace(
  /            <\/button>\n          <\/div>\n          <div className="grid grid-cols-2 gap-3.5">/g,
  '            </button>\n          </div>\n          )}\n          <div className="grid grid-cols-2 gap-3.5">'
);

const matchContextRenderBlock = `
            {matchContext ? (
              <>
                <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Match Rating
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                    {matchRating > 0 ? matchRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                  <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                    Minutes Played
                  </span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {matchMinutesPlayed > 0 ? \`\${matchMinutesPlayed}'\` : '0'}
                  </span>
                </div>
                {player.position === 'GK' || player.position === 'GOALKEEPER' ? (
                  <>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Shots Faced
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchShotsFaced}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Saves
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchSaves}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Goals
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchGoals}
                      </span>
                    </div>
                    <div className="bg-gradient-to-br from-[#800020] to-[#5a0016] border border-[#a0002a]/40 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-lg shadow-[#800020]/20 transition-transform hover:scale-[1.02] text-center">
                      <span className="text-rose-200/80 text-[11px] font-black uppercase tracking-wider mb-1">
                        Assists
                      </span>
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {matchAssists}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : activeTab === 'fantasy' ? (
`;

content = content.replace('{activeTab === \'fantasy\' ? (', matchContextRenderBlock);

fs.writeFileSync('src/components/PlayerProfileModal.tsx', content);
