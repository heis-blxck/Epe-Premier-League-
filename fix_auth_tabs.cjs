const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

const target = `  const rawStage = searchParams.get('stage') || modalData?.stage || (!currentUser ? 'login' : 'profile');
  const viewMode = ['profile', 'settings', 'login', 'edit_profile', 'avatar_upload', 'delete_confirm', 'support'].includes(rawStage) ? rawStage : (!currentUser ? 'login' : 'profile');
  const setViewMode = (mode: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'authDeck');
    params.set('stage', mode);
    navigate(\`?\${params.toString()}\`, { replace: true });
  };`;

const replacement = `  const [viewModeState, setViewModeState] = useState(searchParams.get('stage') || modalData?.stage || (!currentUser ? 'login' : 'profile'));
  
  React.useEffect(() => {
    const rawStage = searchParams.get('stage') || modalData?.stage || (!currentUser ? 'login' : 'profile');
    setViewModeState(['profile', 'settings', 'login', 'edit_profile', 'avatar_upload', 'delete_confirm', 'support'].includes(rawStage) ? rawStage : (!currentUser ? 'login' : 'profile'));
  }, [modalData?.stage, searchParams, currentUser]);

  const viewMode = viewModeState;
  const setViewMode = (mode: string) => {
    setViewModeState(mode);
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/UserAuthDeckModal.tsx', content, 'utf8');
