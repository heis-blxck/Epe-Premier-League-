const fs = require('fs');

let code = fs.readFileSync('src/components/MediaUploader.tsx', 'utf8');

const oldFunc = `  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_BYTES = 2 * 1024 * 1024; // 2MB Limit
      if (file.size > MAX_BYTES) {
        const msg = 'File exceeds 2MB limit. Please compress and try again.';
        setUploadError(msg);
        if (onErrorToast) {
          onErrorToast(msg);
        } else {
          alert(msg);
        }
        if (e.target) e.target.value = '';
        return;
      }

      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        if (resultUrl) {
          setPreviewUrl(resultUrl);
          notify(resultUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };`;

const newFunc = `  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const resultUrl = uploadEvent.target?.result as string;
        if (resultUrl) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round(width * (MAX_HEIGHT / height));
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedUrl = canvas.toDataURL('image/webp', 0.8);
              setPreviewUrl(compressedUrl);
              notify(compressedUrl);
            } else {
               setPreviewUrl(resultUrl);
               notify(resultUrl);
            }
          };
          img.src = resultUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/components/MediaUploader.tsx', code);
console.log('Fixed uploader');
