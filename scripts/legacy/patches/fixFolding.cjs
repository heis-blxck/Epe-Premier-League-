const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

const heroHeaderRegex = /\s*\{\/\* FOLDING HERO HEADER \*\/\}\s*\{viewMode \!\=\= 'settings' \&\& \(\s*<div className=\{\`sticky top-0 z-10 bg-\[\#800020\] text-white border-b border-rose-900\/60 shrink-0 transition-all duration-300 \$\{isHeaderCollapsed \? 'p-3' : 'p-5 pb-6'\}\`\}>[\s\S]*?<\/h3>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}/;

const match = content.match(heroHeaderRegex);
if (match) {
  let heroHeader = match[0];
  
  // Remove "sticky top-0 z-10 " from the class since it will be part of the flex col now
  heroHeader = heroHeader.replace('sticky top-0 z-10 ', '');
  
  // Remove from the current location
  content = content.replace(match[0], '');
  
  // Insert it right before the SCROLLABLE BODY CONTENT CONTAINER
  const scrollContainerRegex = /\s*\{\/\* SCROLLABLE BODY CONTENT CONTAINER \*\/\}\s*<div className="flex-1 overflow-y-auto ios-scroll" onScroll=\{handleScroll\}>/;
  
  content = content.replace(scrollContainerRegex, heroHeader + '\n\n        {/* SCROLLABLE BODY CONTENT CONTAINER */}\n        <div className="flex-1 overflow-y-auto ios-scroll" onScroll={handleScroll}>');
  
  fs.writeFileSync('src/components/UserAuthDeckModal.tsx', content);
  console.log('Fixed folding header');
} else {
  console.log('Could not find folding header');
}
