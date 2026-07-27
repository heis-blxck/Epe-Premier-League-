sed -i '/\/\/ Recalculate Player Goals, Assists, Clean Sheets/,/this.saveData(this.data);/c\
    \/\/ Recalculate Player Goals, Assists, Clean Sheets\
    const playerGoalsMap = new Map<string, number>();\
    const playerAssistsMap = new Map<string, number>();\
    const playerCleanSheetsMap = new Map<string, number>();\
    const playerCupGoalsMap = new Map<string, number>();\
    const playerCupAssistsMap = new Map<string, number>();\
    const playerCupCleanSheetsMap = new Map<string, number>();\
    const playerBonusMap = new Map<string, number>();\
\
    this.data.players.forEach(p => {\
      playerGoalsMap.set(p.id, 0);\
      playerAssistsMap.set(p.id, 0);\
      playerCleanSheetsMap.set(p.id, 0);\
      playerCupGoalsMap.set(p.id, 0);\
      playerCupAssistsMap.set(p.id, 0);\
      playerCupCleanSheetsMap.set(p.id, 0);\
      playerBonusMap.set(p.id, 0);\
    });\
\
    \/\/ Count goals & assists from events\
    this.data.events.forEach(e => {\
      if (e.eventType === "Goal" || e.eventType === "Penalty Goal") {\
        const match = this.data.matches.find(m => m.id === e.matchId);\
        const isCup = match?.competition_type === "Cup";\
\
        if (e.playerId) {\
          if (isCup) playerCupGoalsMap.set(e.playerId, (playerCupGoalsMap.get(e.playerId) || 0) + 1);\
          else playerGoalsMap.set(e.playerId, (playerGoalsMap.get(e.playerId) || 0) + 1);\
        }\
        if (e.assisterId) {\
          if (isCup) playerCupAssistsMap.set(e.assisterId, (playerCupAssistsMap.get(e.assisterId) || 0) + 1);\
          else playerAssistsMap.set(e.assisterId, (playerAssistsMap.get(e.assisterId) || 0) + 1);\
        }\
      }\
    });\
\
    \/\/ Count clean sheets from Full-Time matches\
    this.data.matches.forEach(m => {\
      if (m.status === "Full-Time") {\
        const isCup = m.competition_type === "Cup";\
        if (m.awayScore === 0) {\
          this.data.players\
            .filter(p => p.teamId === m.homeTeamId && (p.position === "GK" || p.position === "DEF"))\
            .forEach(p => {\
              if (isCup) playerCupCleanSheetsMap.set(p.id, (playerCupCleanSheetsMap.get(p.id) || 0) + 1);\
              else playerCleanSheetsMap.set(p.id, (playerCleanSheetsMap.get(p.id) || 0) + 1);\
            });\
        }\
        if (m.homeScore === 0) {\
          this.data.players\
            .filter(p => p.teamId === m.awayTeamId && (p.position === "GK" || p.position === "DEF"))\
            .forEach(p => {\
              if (isCup) playerCupCleanSheetsMap.set(p.id, (playerCupCleanSheetsMap.get(p.id) || 0) + 1);\
              else playerCleanSheetsMap.set(p.id, (playerCleanSheetsMap.get(p.id) || 0) + 1);\
            });\
        }\
      }\
    });\
\
    \/\/ Count bonus points from matches\
    this.data.matches.forEach(m => {\
      if (m.status === "Full-Time" && m.bonusPointsAllocations) {\
        if (m.bonusPointsAllocations.firstPlacePlayerId) {\
          playerBonusMap.set(m.bonusPointsAllocations.firstPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.firstPlacePlayerId) || 0) + 3);\
        }\
        if (m.bonusPointsAllocations.secondPlacePlayerId) {\
          playerBonusMap.set(m.bonusPointsAllocations.secondPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.secondPlacePlayerId) || 0) + 2);\
        }\
        if (m.bonusPointsAllocations.thirdPlacePlayerId) {\
          playerBonusMap.set(m.bonusPointsAllocations.thirdPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.thirdPlacePlayerId) || 0) + 1);\
        }\
      }\
    });\
\
    this.data.players.forEach(p => {\
      p.goals = playerGoalsMap.get(p.id) || 0;\
      p.assists = playerAssistsMap.get(p.id) || 0;\
      p.cleanSheets = playerCleanSheetsMap.get(p.id) || 0;\
      p.cupGoals = playerCupGoalsMap.get(p.id) || 0;\
      p.cupAssists = playerCupAssistsMap.get(p.id) || 0;\
      p.cupCleanSheets = playerCupCleanSheetsMap.get(p.id) || 0;\
      p.bonusPoints = playerBonusMap.get(p.id) || 0;\
    });\
\
    this.saveData(this.data);\
  }' src/server/db.ts
