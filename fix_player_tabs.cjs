const fs = require('fs');
let content = fs.readFileSync('src/components/PlayerProfileModal.tsx', 'utf8');

const target = `  const activeTab = searchParams.get('stage') || modalData?.stage || 'league';
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'playerProfile');
    params.set('stage', tab);
    navigate(\`?\${params.toString()}\`, { replace: true });
  };`;

const replacement = `  const [activeTabState, setActiveTabState] = useState(searchParams.get('stage') || modalData?.stage || 'league');
  
  React.useEffect(() => {
    if (modalData?.stage) setActiveTabState(modalData.stage);
    else setActiveTabState(searchParams.get('stage') || 'league');
  }, [modalData?.playerId, modalData?.stage]);

  const activeTab = activeTabState;
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/PlayerProfileModal.tsx', content, 'utf8');
