const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<EpeLogo className="w-full h-full" />',
  '<EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full" />'
);

code = code.replace(
  '<EpeLogo className="w-full h-full" />',
  '<EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full" />'
);

fs.writeFileSync('src/App.tsx', code);
