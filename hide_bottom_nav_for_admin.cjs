const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('activeTab !== \'admin\' && (')) {
  code = code.replace(
    '<div className="fixed bottom-0 left-0 right-0 z-40',
    '{activeTab !== \'admin\' && (\n      <div className="fixed bottom-0 left-0 right-0 z-40'
  );
  code = code.replace(
    '</button>\n        </div>\n      </div>',
    '</button>\n        </div>\n      </div>\n      )}'
  );
  fs.writeFileSync('src/App.tsx', code);
  console.log("App.tsx bottom nav patched");
}
