const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Fix the container flexbox for mobile wrap
code = code.replace(
  '<div className="flex items-center justify-between h-16 sm:h-20">',
  '<div className="flex flex-wrap items-center justify-between py-3 gap-y-3 gap-x-2 sm:py-0 sm:h-20">'
);

// Fix the logo + title section
code = code.replace(
  '<div \n            onClick={() => setActiveTab(\'matches\')} \n            className="flex items-center gap-3 cursor-pointer group"\n          >',
  '<div \n            onClick={() => setActiveTab(\'matches\')} \n            className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-1 min-w-[200px]"\n          >'
);

// Fix the logo container
code = code.replace(
  '<div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-950 p-1 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-200 border-2 border-amber-400/80 shrink-0 overflow-hidden">',
  '<div className="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-slate-950 p-1 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-200 border-2 border-amber-400/80 shrink-0 overflow-hidden">'
);

// Fix title section
code = code.replace(
  '<div>\n              <div className="flex items-center gap-2">\n                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-none uppercase">',
  '<div className="min-w-0">\n              <div className="flex items-center gap-2 flex-wrap">\n                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white leading-none uppercase truncate">'
);

// Fix subtitle
code = code.replace(
  '<p className="text-xs text-rose-200/90 font-medium tracking-wide">\n                Official Mobile App\n              </p>',
  '<p className="text-[10px] sm:text-xs text-rose-200/90 font-medium tracking-wide truncate">\n                Official Mobile App\n              </p>'
);

// Fix Right Actions Toolbar
code = code.replace(
  '<div className="flex items-center gap-2 sm:gap-3">',
  '<div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">'
);

fs.writeFileSync('src/components/Header.tsx', code);
console.log("Header fixed");
