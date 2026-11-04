import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src', 'components', 'UserAuthDeckModal.tsx');
let content = fs.readFileSync(file, 'utf-8');

// Use URL Modal for stage
content = content.replace(
  /const \[viewMode, setViewMode\] = useState<'profile' \| 'settings' \| 'login' \| 'edit_profile'>\('profile'\);\n\s*const \{ isOpen, closeModal \} = useURLModal\('authDeck'\);/,
  `const { isOpen, closeModal, modalData } = useURLModal<{ stage?: 'profile' | 'settings' | 'login' | 'edit_profile' }>('authDeck');
  const navigate = useNavigate();
  const viewMode = modalData?.stage || (!currentUser ? 'login' : 'profile');
  const setViewMode = (mode: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('stage', mode);
    navigate(\`?\${params.toString()}\`, { state: modalData });
  };`
);

content = content.replace(
  /import \{ useURLModal \} from '\.\.\/hooks\/useURLModal';/,
  `import { useURLModal } from '../hooks/useURLModal';\nimport { useNavigate } from 'react-router-dom';`
);

content = content.replace(
  /const \[showCustomAvatarUploader, setShowCustomAvatarUploader\] = useState\(false\);/,
  `const { isOpen: showCustomAvatarUploader, openModal: setShowCustomAvatarUploaderInner, closeModal: closeCustomAvatarUploader } = useURLModal('customAvatarUploader');
  const setShowCustomAvatarUploader = (val: boolean) => val ? setShowCustomAvatarUploaderInner() : closeCustomAvatarUploader();`
);

content = content.replace(
  /const \[showDeleteConfirm, setShowDeleteConfirm\] = useState\(false\);/,
  `const { isOpen: showDeleteConfirm, openModal: setShowDeleteConfirmInner, closeModal: closeDeleteConfirm } = useURLModal('deleteConfirm');
  const setShowDeleteConfirm = (val: boolean) => val ? setShowDeleteConfirmInner() : closeDeleteConfirm();`
);

content = content.replace(
  /const \[showSupportModal, setShowSupportModal\] = useState\(false\);/,
  `const { isOpen: showSupportModal, openModal: setShowSupportModalInner, closeModal: closeSupportModal } = useURLModal('supportModal');
  const setShowSupportModal = (val: boolean) => val ? setShowSupportModalInner() : closeSupportModal();`
);

// We need to fix the default state logic for viewMode
content = content.replace(
  /if \(!isOpen\) return null;/,
  `if (!isOpen && !showCustomAvatarUploader && !showDeleteConfirm && !showSupportModal) return null;`
);

fs.writeFileSync(file, content);
