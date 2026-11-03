import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src', 'components', 'MatchDetailModal.tsx');
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<'timeline' \| 'lineups' \| 'stats' \| 'chat'>\('timeline'\);/,
  `const { isOpen, closeModal, modalData } = useURLModal<{ matchId: string, stage?: 'timeline' | 'lineups' | 'stats' | 'chat' }>('matchDetail');\n  const activeTab = modalData?.stage || 'timeline';\n  const setActiveTab = (tab: string) => {\n    const params = new URLSearchParams(window.location.search);\n    params.set('stage', tab);\n    navigate(\`?\${params.toString()}\`, { state: modalData });\n  };`
);

content = content.replace(
  /const \{ isOpen, closeModal, modalData \} = useURLModal<\{ matchId: string \}>\('matchDetail'\);\n  const navigate = useNavigate\(\);\n  const \[activeTab, setActiveTab\] = useState<'timeline' \| 'lineups' \| 'stats' \| 'chat'>\('timeline'\);/,
  `const { isOpen, closeModal, modalData } = useURLModal<{ matchId: string, stage?: 'timeline' | 'lineups' | 'stats' | 'chat' }>('matchDetail');\n  const navigate = useNavigate();\n  const activeTab = modalData?.stage || 'timeline';\n  const setActiveTab = (tab: string) => {\n    const params = new URLSearchParams(window.location.search);\n    params.set('stage', tab);\n    navigate(\`?\${params.toString()}\`, { state: modalData });\n  };`
);

fs.writeFileSync(file, content);
