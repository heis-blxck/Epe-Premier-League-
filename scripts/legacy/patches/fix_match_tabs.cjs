const fs = require('fs');
let content = fs.readFileSync('src/components/MatchDetailModal.tsx', 'utf8');

const target = `  // moved to end
  const activeTab = modalData?.stage || 'timeline';
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(location.search);
    params.set('stage', tab);
    navigate(\`?\${params.toString()}\`, { state: modalData });
  };`;

const replacement = `  const [activeTab, setActiveTabState] = useState<'timeline' | 'lineups' | 'stats' | 'chat'>(modalData?.stage || 'timeline');
  
  useEffect(() => {
    if (modalData?.stage) {
      setActiveTabState(modalData.stage);
    } else {
      setActiveTabState('timeline');
    }
  }, [modalData?.matchId, modalData?.stage]);

  const setActiveTab = (tab: any) => {
    setActiveTabState(tab);
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/MatchDetailModal.tsx', content, 'utf8');
