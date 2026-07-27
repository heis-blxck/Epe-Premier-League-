const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const newStates = `
  const [statsHomeFouls, setStatsHomeFouls] = useState<number>(selectedMatch?.stats?.homeFouls || 8);
  const [statsAwayFouls, setStatsAwayFouls] = useState<number>(selectedMatch?.stats?.awayFouls || 11);

  // MOTM & Bonus Points states
  const [motmPlayerId, setMotmPlayerId] = useState<string>(selectedMatch?.motmPlayerId || '');
  const [motmGraphicUrl, setMotmGraphicUrl] = useState<string>(selectedMatch?.motmGraphicUrl || '');
  const [bonusFirstPlace, setBonusFirstPlace] = useState<string>(selectedMatch?.bonusPointsAllocations?.firstPlacePlayerId || '');
  const [bonusSecondPlace, setBonusSecondPlace] = useState<string>(selectedMatch?.bonusPointsAllocations?.secondPlacePlayerId || '');
  const [bonusThirdPlace, setBonusThirdPlace] = useState<string>(selectedMatch?.bonusPointsAllocations?.thirdPlacePlayerId || '');
`;

code = code.replace(
  /const \[statsHomeFouls, setStatsHomeFouls\] = useState\<number\>\(selectedMatch\?\.stats\?\.homeFouls \|\| 8\);\s*const \[statsAwayFouls, setStatsAwayFouls\] = useState\<number\>\(selectedMatch\?\.stats\?\.awayFouls \|\| 11\);/,
  newStates
);

// We need to update these states when selectedMatch changes.
const newEffects = `
    setStatsAwayFouls(match?.stats?.awayFouls || 11);
    setMotmPlayerId(match?.motmPlayerId || '');
    setMotmGraphicUrl(match?.motmGraphicUrl || '');
    setBonusFirstPlace(match?.bonusPointsAllocations?.firstPlacePlayerId || '');
    setBonusSecondPlace(match?.bonusPointsAllocations?.secondPlacePlayerId || '');
    setBonusThirdPlace(match?.bonusPointsAllocations?.thirdPlacePlayerId || '');
`;

code = code.replace(
  /setStatsAwayFouls\(match\?\.stats\?\.awayFouls \|\| 11\);/,
  newEffects
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
