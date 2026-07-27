sed -i '/const \[activeCategory/i\
  const [activeCompetition, setActiveCompetition] = useState<"league" | "cup">("league");\
' src/components/LeagueStats.tsx

sed -i '/const getPlayersList/c\
  const getPlayersList = (): { players: Player[]; label: string; metricName: string; valKey: string } => {\
    if (activeCompetition === "cup") {\
      if (activeCategory === "assists") {\
        return { players: stats.cupTopAssists || [], label: "Playmaker Award", metricName: "Assists", valKey: "cupAssists" };\
      }\
      if (activeCategory === "cleanSheets") {\
        return { players: stats.cupCleanSheets || [], label: "Golden Glove Award", metricName: "Clean Sheets", valKey: "cupCleanSheets" };\
      }\
      return { players: stats.cupTopScorers || [], label: "Golden Boot Leaderboard", metricName: "Goals", valKey: "cupGoals" };\
    }\
    if (activeCategory === "assists") {\
      return { players: stats.topAssists, label: "Playmaker Award", metricName: "Assists", valKey: "assists" };\
    }\
    if (activeCategory === "cleanSheets") {\
      return { players: stats.cleanSheets, label: "Golden Glove Award", metricName: "Clean Sheets", valKey: "cleanSheets" };\
    }\
    return { players: stats.topScorers, label: "Golden Boot Leaderboard", metricName: "Goals", valKey: "goals" };\
  };' src/components/LeagueStats.tsx

sed -i '/const { players, label, metricName } = getPlayersList();/c\
  const { players, label, metricName, valKey } = getPlayersList();' src/components/LeagueStats.tsx

sed -i "s/top3\[1\].assists : activeCategory === 'cleanSheets' ? top3\[1\].cleanSheets : top3\[1\].goals/top3[1][valKey as keyof Player] || 0/g" src/components/LeagueStats.tsx
sed -i "s/top3\[0\].assists : activeCategory === 'cleanSheets' ? top3\[0\].cleanSheets : top3\[0\].goals/top3[0][valKey as keyof Player] || 0/g" src/components/LeagueStats.tsx
sed -i "s/top3\[2\].assists : activeCategory === 'cleanSheets' ? top3\[2\].cleanSheets : top3\[2\].goals/top3[2][valKey as keyof Player] || 0/g" src/components/LeagueStats.tsx
sed -i "s/activeCategory === 'assists' ? player.assists : activeCategory === 'cleanSheets' ? player.cleanSheets : player.goals/player[valKey as keyof Player] || 0/g" src/components/LeagueStats.tsx

sed -i '/<div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">/a\
        <div className="flex gap-2 w-full sm:w-auto">\
          <button\
            onClick={() => setActiveCompetition("league")}\
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCompetition === "league" ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}\
          >\
            League\
          </button>\
          <button\
            onClick={() => setActiveCompetition("cup")}\
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCompetition === "cup" ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}\
          >\
            League Cup\
          </button>\
        </div>' src/components/LeagueStats.tsx
