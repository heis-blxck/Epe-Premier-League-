import fs from 'fs';
import path from 'path';

const appFile = path.join(process.cwd(), 'src', 'App.tsx');
let appContent = fs.readFileSync(appFile, 'utf-8');
appContent = appContent.replace(
  /const listener = CapacitorApp\.addListener\('backButton', \(\) => \{\n\s*const currentSearch = window\.location\.search;\n\s*const currentPath = window\.location\.pathname;\n\s*if \(\!currentSearch && \(currentPath === '\/' \|\| currentPath === '\/matches'\)\) \{\n\s*CapacitorApp\.exitApp\(\);\n\s*\} else if \(currentSearch\) \{\n\s*navigate\(-1\);\n\s*\} else \{\n\s*navigate\('\/matches', \{ replace: true \}\);\n\s*\}\n\s*\}\);/,
  `const listener = CapacitorApp.addListener('backButton', () => {
        const currentSearch = window.location.search;
        const currentPath = window.location.pathname;
        const rootTabs = ['/', '/matches', '/fantasy', '/standings', '/news', '/cup'];
        
        if (currentSearch) {
          navigate(-1);
        } else if (currentPath === '/' || currentPath === '/matches') {
          CapacitorApp.exitApp();
        } else if (rootTabs.includes(currentPath)) {
          navigate('/matches', { replace: true });
        } else {
          navigate(-1);
        }
      });`
);
fs.writeFileSync(appFile, appContent);
