const fs = require('fs');

// 1. Update Header.tsx
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
header = header.replace(/\{\/\* Navigation Tabs \*\/\}.*?<\/div>\n      <\/div>\n    <\/header>\n  \);\n\};/s, '      </div>\n    </header>\n  );\n};');
fs.writeFileSync('src/components/Header.tsx', header);
console.log("Updated Header.tsx");

// 2. Update UserAuthDeckModal.tsx
let modal = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');
// Add onNavigateToAdmin to props interface
modal = modal.replace(
  'onLogout: () => void;',
  'onLogout: () => void;\n  onNavigateToAdmin?: () => void;'
);
// Add to destructuring
modal = modal.replace(
  '  onLogout,\n  theme',
  '  onLogout,\n  onNavigateToAdmin,\n  theme'
);
// Add Admin Center button below the App Push Notifications section
modal = modal.replace(
  '                </div>\n              </div>',
  '                </div>\n              </div>\n\n              {/* Admin Center Portal */}\n              {isAdmin && (\n                <div className={`p-5 rounded-2xl border space-y-4 ${\n                  isDark ? \'bg-amber-400/10 border-amber-400/30\' : \'bg-amber-50 border-amber-200\'\n                }`}>\n                  <div className="flex items-center justify-between">\n                    <div className="flex items-center gap-2">\n                      <ShieldAlert className="w-5 h-5 text-amber-500" />\n                      <div>\n                        <h4 className={`font-extrabold text-xs uppercase tracking-wider ${isDark ? \'text-amber-400\' : \'text-amber-700\'}`}>Admin Center</h4>\n                        <p className={`text-xs ${isDark ? \'text-slate-400\' : \'text-slate-600\'}`}>Manage leagues, teams, and news</p>\n                      </div>\n                    </div>\n                    <button\n                      onClick={() => { if (onNavigateToAdmin) onNavigateToAdmin(); onClose(); }}\n                      className="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400"\n                    >\n                      <span>Enter</span>\n                      <ArrowRight className="w-3.5 h-3.5" />\n                    </button>\n                  </div>\n                </div>\n              )}'
);
fs.writeFileSync('src/components/UserAuthDeckModal.tsx', modal);
console.log("Updated UserAuthDeckModal.tsx");

// 3. Update App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Update UserAuthDeckModal call in App.tsx
app = app.replace(
  'onLogout={handleLogout}',
  'onLogout={handleLogout}\n          onNavigateToAdmin={() => setActiveTab(\'admin\')}'
);

// Add Bottom Navigation Bar inside the main flex wrapper.
// We should put it at the very bottom, fixed to the screen or as part of the flex layout.
app = app.replace(
  '        {/* Footer */}\n        <footer',
  `        {/* Bottom Navigation Bar */}\n        <div className={\`fixed bottom-0 left-0 right-0 z-40 border-t shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.5)] \${isDark ? 'bg-slate-950/95 border-rose-950/60 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'}\`}>\n          <div className="flex items-center justify-around max-w-lg mx-auto py-2.5 px-4">\n            <button\n              onClick={() => setActiveTab('matches')}\n              className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all \${activeTab === 'matches' ? 'text-amber-500 scale-110' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}\`}\n            >\n              <Radio className="w-5 h-5" />\n              <span className="text-[10px] font-bold">Matches</span>\n            </button>\n            <button\n              onClick={() => setActiveTab('standings')}\n              className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all \${activeTab === 'standings' ? 'text-amber-500 scale-110' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}\`}\n            >\n              <Trophy className="w-5 h-5" />\n              <span className="text-[10px] font-bold">Standings</span>\n            </button>\n            <button\n              onClick={() => setActiveTab('cup')}\n              className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all \${activeTab === 'cup' ? 'text-amber-500 scale-110' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}\`}\n            >\n              <Goal className="w-5 h-5" />\n              <span className="text-[10px] font-bold">Cup</span>\n            </button>\n            <button\n              onClick={() => setActiveTab('fantasy')}\n              className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all \${activeTab === 'fantasy' ? 'text-amber-500 scale-110' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}\`}\n            >\n              <Sparkles className="w-5 h-5" />\n              <span className="text-[10px] font-bold">Fantasy</span>\n            </button>\n            <button\n              onClick={() => setActiveTab('news')}\n              className={\`flex flex-col items-center gap-1 min-w-[64px] cursor-pointer transition-all \${activeTab === 'news' ? 'text-amber-500 scale-110' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}\`}\n            >\n              <Newspaper className="w-5 h-5" />\n              <span className="text-[10px] font-bold">News</span>\n            </button>\n          </div>\n        </div>\n\n        {/* Footer */}\n        <footer style={{ paddingBottom: '80px' }}`
);

// Ensure the main area padding accounts for the bottom nav
// Replace `<main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">`
app = app.replace(
  '<main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">',
  '<main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24">'
);

fs.writeFileSync('src/App.tsx', app);
console.log("Updated App.tsx");
