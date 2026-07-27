const fs = require('fs');
let code = fs.readFileSync('src/components/MediaUploader.tsx', 'utf8');

if (!code.includes('accept?: string;')) {
  code = code.replace(
    'onErrorToast?: (msg: string) => void;',
    'onErrorToast?: (msg: string) => void;\n  accept?: string;'
  );
  code = code.replace(
    'export const MediaUploader: React.FC<MediaUploaderProps> = ({',
    'export const MediaUploader: React.FC<MediaUploaderProps> = ({ accept = "image/*",'
  );
  code = code.replace(
    'accept="image/*"',
    'accept={accept}'
  );
  fs.writeFileSync('src/components/MediaUploader.tsx', code);
}
