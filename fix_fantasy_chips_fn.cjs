const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const fn = `
  const handleActivateChip = async (chipType: 'TC' | 'BB' | 'WC') => {
    if (isGameweekLocked) {
      onShowToast('Gameweek is locked. Chips cannot be activated now.');
      return;
    }
    if (activeChipThisGW) {
      onShowToast('You can only activate one chip per Gameweek.');
      return;
    }

    const currentGw = matches[0]?.matchday || 1;
    let newChips = { ...chips };

    if (chipType === 'TC' && chips.tripleCaptainAvailable) {
      newChips.tripleCaptainAvailable = false;
      newChips.tripleCaptainUsedGw = currentGw;
    } else if (chipType === 'BB' && chips.benchBoostAvailable) {
      newChips.benchBoostAvailable = false;
      newChips.benchBoostUsedGw = currentGw;
    } else if (chipType === 'WC' && chips.wildcardAvailable) {
      newChips.wildcardAvailable = false;
      newChips.wildcardUsedGw = currentGw;
    } else {
      onShowToast('Chip has already been used this season.');
      return;
    }

    try {
      setIsSaving(true);
      await api.saveManagerChips(newChips);
      setChips(newChips);
      setActiveChipThisGW(chipType);
      onShowToast(\`\${chipType} Chip Activated for Gameweek \${currentGw}!\`);
    } catch (e: any) {
      onShowToast(e.message || 'Failed to activate chip');
    } finally {
      setIsSaving(false);
    }
  };
`;

if (!code.includes('const handleActivateChip = async')) {
  // Find a good place to insert it, e.g., before handleSaveTeam
  code = code.replace(
    'const handleSaveTeam = async () =>',
    fn + '\n  const handleSaveTeam = async () =>'
  );
  fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
  console.log("handleActivateChip inserted.");
}
