const fs = require('fs');
let code = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

const updatedHandler = `
  const handleToggleCustomSound = async () => {
    const newValue = !customSoundEnabled;
    setCustomSoundEnabled(newValue);
    await setCustomSoundPreference(newValue);
    if (newValue) {
      // Play a quick test sound to preview it and unlock the AudioContext for this session
      try {
        const audio = new Audio('/epe_alert.mp3');
        audio.play().catch(e => console.warn('Audio play blocked:', e));
      } catch (e) {
        console.error('Audio initialization error:', e);
      }
    }
  };
`;

code = code.replace(
  /  const handleToggleCustomSound = async \(\) => \{[\s\S]*?  \};\n/,
  updatedHandler
);

fs.writeFileSync('src/components/UserAuthDeckModal.tsx', code);
