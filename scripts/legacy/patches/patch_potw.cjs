const fs = require('fs');
let code = fs.readFileSync('src/components/PotwManager.tsx', 'utf8');

code = code.replace(
  '<MediaUploader',
  '<MediaUploader accept="image/jpeg, image/jpg"'
);

fs.writeFileSync('src/components/PotwManager.tsx', code);
