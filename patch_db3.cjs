const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const bonusInit = `
    const playerGoalsMap = new Map<string, number>();
    const playerAssistsMap = new Map<string, number>();
    const playerCleanSheetsMap = new Map<string, number>();
    const playerBonusMap = new Map<string, number>();

    this.data.players.forEach(p => {
      playerGoalsMap.set(p.id, 0);
      playerAssistsMap.set(p.id, 0);
      playerCleanSheetsMap.set(p.id, 0);
      playerBonusMap.set(p.id, 0);
    });
`;

code = code.replace(
  /const playerGoalsMap = new Map<string, number>\(\);\s*const playerAssistsMap = new Map<string, number>\(\);\s*const playerCleanSheetsMap = new Map<string, number>\(\);\s*this\.data\.players\.forEach\(p => {\s*playerGoalsMap\.set\(p\.id, 0\);\s*playerAssistsMap\.set\(p\.id, 0\);\s*playerCleanSheetsMap\.set\(p\.id, 0\);\s*}\);/,
  bonusInit
);

const bonusLogic = `
    // Count bonus points from matches
    this.data.matches.forEach(m => {
      if (m.status === 'Full-Time' && m.bonusPointsAllocations) {
        if (m.bonusPointsAllocations.firstPlacePlayerId) {
          playerBonusMap.set(m.bonusPointsAllocations.firstPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.firstPlacePlayerId) || 0) + 3);
        }
        if (m.bonusPointsAllocations.secondPlacePlayerId) {
          playerBonusMap.set(m.bonusPointsAllocations.secondPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.secondPlacePlayerId) || 0) + 2);
        }
        if (m.bonusPointsAllocations.thirdPlacePlayerId) {
          playerBonusMap.set(m.bonusPointsAllocations.thirdPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.thirdPlacePlayerId) || 0) + 1);
        }
      }
    });

    this.data.players.forEach(p => {
      p.goals = playerGoalsMap.get(p.id) || 0;
      p.assists = playerAssistsMap.get(p.id) || 0;
      p.cleanSheets = playerCleanSheetsMap.get(p.id) || 0;
      p.bonusPoints = playerBonusMap.get(p.id) || 0;
    });
`;

code = code.replace(
  /this\.data\.players\.forEach\(p => {\s*p\.goals = playerGoalsMap\.get\(p\.id\) \|\| 0;\s*p\.assists = playerAssistsMap\.get\(p\.id\) \|\| 0;\s*p\.cleanSheets = playerCleanSheetsMap\.get\(p\.id\) \|\| 0;\s*}\);/,
  bonusLogic
);

fs.writeFileSync('src/server/db.ts', code);
