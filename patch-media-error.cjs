const fs = require('fs');
let code = fs.readFileSync('src/components/MediaUploader.tsx', 'utf8');

code = code.replace(
  "img.onload = () => {",
  "img.onerror = () => { if (onErrorToast) onErrorToast('Failed to load image format.'); setUploadError('Invalid image format'); };\n          img.onload = () => {"
);

fs.writeFileSync('src/components/MediaUploader.tsx', code);
