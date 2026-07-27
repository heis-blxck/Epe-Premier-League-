const fs = require('fs');

let content = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

if (!content.includes('backManager')) {
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport { useBackHandler } from '../utils/backManager';"
  );
}

const backHandlerLogic = `
  useBackHandler(() => {
    if (!isOpen) return false;
    
    if (showCustomAvatarUploader) {
      setShowCustomAvatarUploader(false);
      return true;
    }
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
      return true;
    }
    if (showSupportModal) {
      setShowSupportModal(false);
      return true;
    }
    if (showInviteModal) {
      setShowInviteModal(false);
      return true;
    }
    if (showShareModal) {
      setShowShareModal(false);
      return true;
    }
    if (viewMode !== 'profile' && viewMode !== 'login') {
      setViewMode(currentUser ? 'profile' : 'login');
      return true;
    }
    
    return false; // Let App.tsx handle closing the main deck modal
  }, [isOpen, showCustomAvatarUploader, showDeleteConfirm, showSupportModal, showInviteModal, showShareModal, viewMode, currentUser]);
`;

if (!content.includes('useBackHandler(() => {')) {
  content = content.replace(
    "  const [copiedLink, setCopiedLink] = useState(false);",
    "  const [copiedLink, setCopiedLink] = useState(false);\n" + backHandlerLogic
  );
  fs.writeFileSync('src/components/UserAuthDeckModal.tsx', content);
  console.log('UserAuthDeckModal updated');
} else {
  console.log('Already updated');
}
