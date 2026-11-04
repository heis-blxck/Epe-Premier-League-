const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /  \/\/ Sync state when selected match changes\n  useEffect\(\(\) => \{\n    if \(selectedMatch\) \{\n      setClockMinute/g;
const replacement = `  // Sync state when selected match changes
  const prevMatchIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (selectedMatch && selectedMatch.id !== prevMatchIdRef.current) {
      prevMatchIdRef.current = selectedMatch.id;
      setClockMinute`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
