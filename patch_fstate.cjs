const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

code = code.replace(
  /const \[activeTab, setActiveTab\] = useState\<'my_team' \| 'transfers' \| 'leaderboard' \| 'mini_leagues'\>\('my_team'\);/,
  "const [activeTab, setActiveTab] = useState<'my_team' | 'transfers' | 'leaderboard' | 'mini_leagues' | 'insights'>('insights');"
);

// Add the filter states
code = code.replace(
  "const [teamFilter, setTeamFilter] = useState<string>('ALL');",
  "const [teamFilter, setTeamFilter] = useState<string>('ALL');\n  const [priceFilter, setPriceFilter] = useState<string>('ALL');\n  const [sortByPoints, setSortByPoints] = useState<boolean>(false);"
);

// We need to implement filteredMarketplace
const filteredMarketplaceStr = `
  const filteredMarketplace = (players || []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (teamMap.get(p.teamId)?.name.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesPos = positionFilter === 'ALL' || p.position === positionFilter;
    const matchesTeam = teamFilter === 'ALL' || p.teamId === teamFilter;
    
    let matchesPrice = true;
    const pPrice = p.price || 6.0;
    if (priceFilter === 'UNDER_6') matchesPrice = pPrice < 6.0;
    else if (priceFilter === '6_TO_8') matchesPrice = pPrice >= 6.0 && pPrice <= 8.0;
    else if (priceFilter === 'OVER_8') matchesPrice = pPrice > 8.0;

    return matchesSearch && matchesPos && matchesTeam && matchesPrice;
  }).sort((a, b) => {
    const isFiltered = teamFilter !== 'ALL' || priceFilter !== 'ALL' || positionFilter !== 'ALL' || searchQuery.trim() !== '';
    if (sortByPoints) {
      return (b.fantasyPoints || 0) - (a.fantasyPoints || 0);
    }
    // Strict Default Sorting: Price tags (Highest to Lowest), then Total Points (Secondary)
    if (!isFiltered || !sortByPoints) {
      const priceDiff = (b.price || 6.0) - (a.price || 6.0);
      if (priceDiff !== 0) return priceDiff;
      return (b.fantasyPoints || 0) - (a.fantasyPoints || 0);
    }
    return 0;
  });
`;

code = code.replace(
  /const filteredMarketplace = \(players \|\| \[\]\)\.filter\(p =\> \{[\s\S]*?\}\);/,
  filteredMarketplaceStr
);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
