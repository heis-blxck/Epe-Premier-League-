const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /  useEffect\(\(\) => \{\n    if \(settings\) \{\n      setBrandAppName/g;
const replacement = `  const prevSettingsIdRef = useRef<boolean>(false);
  useEffect(() => {
    if (settings && !prevSettingsIdRef.current) {
      prevSettingsIdRef.current = true;
      setBrandAppName`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
