sed -i '/await api.saveMatch({/i \
      let homePointsToAdd = 0;\
      let awayPointsToAdd = 0;\
      let homeWon = 0;\
      let awayWon = 0;\
      let homeDrawn = 0;\
      let awayDrawn = 0;\
      let homeLost = 0;\
      let awayLost = 0;\
      if (!selectedMatch.isStatsCommitted && selectedMatch.status === '\''Full-Time'\'') {\
        if (selectedMatch.homeScore > selectedMatch.awayScore) {\
          homePointsToAdd = 3;\
          homeWon = 1;\
          awayLost = 1;\
        } else if (selectedMatch.homeScore < selectedMatch.awayScore) {\
          awayPointsToAdd = 3;\
          awayWon = 1;\
          homeLost = 1;\
        } else {\
          homePointsToAdd = 1;\
          awayPointsToAdd = 1;\
          homeDrawn = 1;\
          awayDrawn = 1;\
        }\
        \
        if (selectedMatch.homeTeamId) {\
           const hT = teams.find(t => t.id === selectedMatch.homeTeamId);\
           if (hT) {\
             await api.updateTeamStandingsOverride(hT.id, {\
               points: (hT.points || 0) + homePointsToAdd,\
               won: (hT.won || 0) + homeWon,\
               drawn: (hT.drawn || 0) + homeDrawn,\
               lost: (hT.lost || 0) + homeLost,\
               goalsFor: (hT.goalsFor || 0) + selectedMatch.homeScore,\
               goalsAgainst: (hT.goalsAgainst || 0) + selectedMatch.awayScore,\
               goalDifference: (hT.goalDifference || 0) + (selectedMatch.homeScore - selectedMatch.awayScore),\
               matchesPlayed: (hT.matchesPlayed || 0) + 1\
             });\
           }\
        }\
        if (selectedMatch.awayTeamId) {\
           const aT = teams.find(t => t.id === selectedMatch.awayTeamId);\
           if (aT) {\
             await api.updateTeamStandingsOverride(aT.id, {\
               points: (aT.points || 0) + awayPointsToAdd,\
               won: (aT.won || 0) + awayWon,\
               drawn: (aT.drawn || 0) + awayDrawn,\
               lost: (aT.lost || 0) + awayLost,\
               goalsFor: (aT.goalsFor || 0) + selectedMatch.awayScore,\
               goalsAgainst: (aT.goalsAgainst || 0) + selectedMatch.homeScore,\
               goalDifference: (aT.goalDifference || 0) + (selectedMatch.awayScore - selectedMatch.homeScore),\
               matchesPlayed: (aT.matchesPlayed || 0) + 1\
             });\
           }\
        }\
      }\
' src/components/AdminDashboard.tsx
