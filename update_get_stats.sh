sed -i '/public getStats() {/,/return {/c\
  public getStats() {\
    this.recalculateLeagueStatsAndStandings();\
    const topScorers = [...this.data.players]\
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)\
      .slice(0, 10);\
    const topAssists = [...this.data.players]\
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)\
      .slice(0, 10);\
    const cleanSheets = [...this.data.players]\
      .filter(p => p.position === "GK" || p.position === "DEF")\
      .sort((a, b) => b.cleanSheets - a.cleanSheets)\
      .slice(0, 10);\
    const cupTopScorers = [...this.data.players]\
      .sort((a, b) => (b.cupGoals || 0) - (a.cupGoals || 0) || (b.cupAssists || 0) - (a.cupAssists || 0))\
      .slice(0, 10);\
    const cupTopAssists = [...this.data.players]\
      .sort((a, b) => (b.cupAssists || 0) - (a.cupAssists || 0) || (b.cupGoals || 0) - (a.cupGoals || 0))\
      .slice(0, 10);\
    const cupCleanSheets = [...this.data.players]\
      .filter(p => p.position === "GK" || p.position === "DEF")\
      .sort((a, b) => (b.cupCleanSheets || 0) - (a.cupCleanSheets || 0))\
      .slice(0, 10);\
    return {\
      topScorers,\
      topAssists,\
      cleanSheets,\
      cupTopScorers,\
      cupTopAssists,\
      cupCleanSheets\
    };\
  }' src/server/db.ts
