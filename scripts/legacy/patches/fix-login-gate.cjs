const fs = require('fs');

let code = fs.readFileSync('src/components/MandatoryLoginGate.tsx', 'utf8');

const oldCode = `      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(file);`;

const newCode = `      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_WIDTH) { height = Math.round(height * (MAX_WIDTH / width)); width = MAX_WIDTH; }
            } else {
              if (height > MAX_HEIGHT) { width = Math.round(width * (MAX_HEIGHT / height)); height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              setSelectedAvatar(canvas.toDataURL('image/webp', 0.8));
              setErrorMsg(null);
            } else {
              setSelectedAvatar(reader.result);
              setErrorMsg(null);
            }
          };
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/MandatoryLoginGate.tsx', code);
console.log('Fixed login gate uploader');
