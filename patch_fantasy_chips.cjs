const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

// Import ManagerChips
if (!code.includes('ManagerChips')) {
  code = code.replace(
    'FantasySquad, MiniLeague, UserAccount } from \'../types\';',
    'FantasySquad, MiniLeague, UserAccount, ManagerChips } from \'../types\';'
  );
}

// Add state
if (!code.includes('const [chips, setChips]')) {
  code = code.replace(
    'const [isSaving, setIsSaving] = useState(false);',
    `const [isSaving, setIsSaving] = useState(false);
  
  // Chips State
  const [chips, setChips] = useState<ManagerChips>({
    userId: currentUser.id,
    tripleCaptainAvailable: true,
    benchBoostAvailable: true,
    wildcardAvailable: true
  });
  const [activeChipThisGW, setActiveChipThisGW] = useState<'TC' | 'BB' | 'WC' | null>(null);`
  );
}

// Add to loadFantasyData
if (!code.includes('api.getManagerChips(')) {
  code = code.replace(
    'api.getMiniLeagues()',
    'api.getMiniLeagues(),\n        api.getManagerChips(currentUser.id)'
  );
  code = code.replace(
    'const [squadsRes, miniRes] = await Promise.all',
    'const [squadsRes, miniRes, chipsRes] = await Promise.all'
  );
  code = code.replace(
    'setMiniLeagues(miniRes);',
    `setMiniLeagues(miniRes);
      if (chipsRes) {
        setChips(chipsRes);
      }`
  );
}

// Add function to activate chip
if (!code.includes('handleActivateChip')) {
  code = code.replace(
    '// 3. Auto-Select Captain logic',
    `const handleActivateChip = async (chipType: 'TC' | 'BB' | 'WC') => {
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
  
  // 3. Auto-Select Captain logic`
  );
}

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
console.log("Chips states patched");
