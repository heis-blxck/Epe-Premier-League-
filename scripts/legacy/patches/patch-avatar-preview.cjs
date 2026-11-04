const fs = require('fs');
let code = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

code = code.replace(
  "src={currentUser?.avatarUrl || profileAvatar || AVATAR_PRESETS[0].url}",
  "src={(viewMode === 'edit_profile' || viewMode === 'avatar_upload') ? (profileAvatar || currentUser?.avatarUrl || AVATAR_PRESETS[0].url) : (currentUser?.avatarUrl || AVATAR_PRESETS[0].url)}"
);

fs.writeFileSync('src/components/UserAuthDeckModal.tsx', code);
