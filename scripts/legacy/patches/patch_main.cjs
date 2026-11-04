const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const reg = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')!).render(
`;

code = code.replace(/createRoot\(document\.getElementById\('root'\)!\)\.render\(/, reg);
fs.writeFileSync('src/main.tsx', code);
