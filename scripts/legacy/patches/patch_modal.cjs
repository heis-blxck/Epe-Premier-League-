const fs = require('fs');
let code = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

// Remove import
code = code.replace(/import \{ getCustomSoundPreference, setCustomSoundPreference \} from '\.\.\/utils\/indexedDB';\n/, "");

// Remove state and handlers
code = code.replace(/  const \[customSoundEnabled, setCustomSoundEnabled\] = useState<boolean>\(true\);\n/, "");
code = code.replace(/  useEffect\(\(\) => \{\n    getCustomSoundPreference\(\)\.then\(setCustomSoundEnabled\);\n  \}, \[\]\);\n/, "");

code = code.replace(
  /  const handleToggleCustomSound = async \(\) => \{[\s\S]*?  \};\n/,
  ""
);

// Remove JSX
code = code.replace(
  /                <div className="flex items-center justify-between p-4 bg-slate-900\/50 rounded-2xl border border-slate-700\/50">[\s\S]*?<\/div>\s*<\/div>/,
  ""
);

fs.writeFileSync('src/components/UserAuthDeckModal.tsx', code);
