const fs = require('fs');
let content = fs.readFileSync('src/components/TeamProfileModal.tsx', 'utf8');

const target = `  const activeTab = searchParams.get('stage') || modalData?.stage || 'overview';
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'teamProfile');
    params.set('stage', tab);
    navigate(\`?\${params.toString()}\`, { replace: true });
  };`;

const replacement = `  const [activeTabState, setActiveTabState] = useState(searchParams.get('stage') || modalData?.stage || 'overview');
  
  React.useEffect(() => {
    if (modalData?.stage) setActiveTabState(modalData.stage);
    else setActiveTabState(searchParams.get('stage') || 'overview');
  }, [modalData?.teamId, modalData?.stage]);

  const activeTab = activeTabState;
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/TeamProfileModal.tsx', content, 'utf8');
