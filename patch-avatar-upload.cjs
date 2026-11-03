const fs = require('fs');
let code = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

code = code.replace(
  "  const showCustomAvatarUploader = modalData?.stage === 'avatar_upload';\n  const setShowCustomAvatarUploader = (val: boolean) => setViewMode(val ? 'avatar_upload' : 'edit_profile');",
  "  const [showCustomAvatarUploader, setShowCustomAvatarUploader] = useState(modalData?.stage === 'avatar_upload');"
);

code = code.replace(
  "{currentUser && viewMode === 'edit_profile' && (",
  "{currentUser && (viewMode === 'edit_profile' || viewMode === 'avatar_upload') && ("
);

fs.writeFileSync('src/components/UserAuthDeckModal.tsx', code);
