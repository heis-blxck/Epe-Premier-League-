const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const savePayload = `
      await api.saveMatch({
        id: selectedMatch.id,
        motmPlayerId,
        motmGraphicUrl,
        bonusPointsAllocations: {
          firstPlacePlayerId: bonusFirstPlace,
          secondPlacePlayerId: bonusSecondPlace,
          thirdPlacePlayerId: bonusThirdPlace
        },
`;

code = code.replace(
  /await api\.saveMatch\(\{\s*id: selectedMatch\.id,/,
  savePayload
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
