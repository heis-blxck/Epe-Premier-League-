const fs = require('fs');
let code = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

// 1. Add Volume2 icon to imports
code = code.replace(
  /Bell,/,
  "Bell,\n  Volume2,"
);

// 2. Import the IDB utilities
code = code.replace(
  /import \{ EpeLogo \} from '\.\/EpeLogo';/,
  "import { EpeLogo } from './EpeLogo';\nimport { getCustomSoundPreference, setCustomSoundPreference } from '../utils/indexedDB';"
);

// 3. Add customSoundEnabled state
code = code.replace(
  /const \[profileStatusMsg, setProfileStatusMsg\] = useState\<string \| null\>\(null\);/,
  "const [profileStatusMsg, setProfileStatusMsg] = useState<string | null>(null);\n  const [customSoundEnabled, setCustomSoundEnabled] = useState<boolean>(true);\n\n  useEffect(() => {\n    getCustomSoundPreference().then(setCustomSoundEnabled);\n  }, []);\n\n  const handleToggleCustomSound = async () => {\n    const newValue = !customSoundEnabled;\n    setCustomSoundEnabled(newValue);\n    await setCustomSoundPreference(newValue);\n  };\n"
);

// 4. Add the Custom Audio Toggle UI
const customSoundUI = `
              {/* Push Notifications Toggle */}
              <div className={\`p-5 rounded-2xl border space-y-4 \${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }\`}>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider">App Push Notifications</h4>
                      <p className="text-xs text-slate-400">Receive live goal scores, red cards & match alerts</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleNotifications(!notificationsEnabled)}
                    className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 \${
                      notificationsEnabled
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-400'
                    }\`}
                  >
                    <span>{notificationsEnabled ? 'ON (Active)' : 'OFF'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider">Custom Epe Alert Sound</h4>
                      <p className="text-[10px] sm:text-xs text-slate-400">Play 'epe_alert.mp3' on incoming notifications</p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleCustomSound}
                    className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer \${
                      customSoundEnabled ? 'bg-[#800020]' : 'bg-slate-700'
                    }\`}
                  >
                    <span
                      className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${
                        customSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }\`}
                    />
                  </button>
                </div>
              </div>
`;

code = code.replace(
  /\{\/\* Push Notifications Toggle \*\/\}[\s\S]*?\<\/button\>\s*\<\/div\>\s*\<\/div\>/,
  customSoundUI
);

fs.writeFileSync('src/components/UserAuthDeckModal.tsx', code);
