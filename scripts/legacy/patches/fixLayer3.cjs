const fs = require('fs');
let content = fs.readFileSync('src/components/UserAuthDeckModal.tsx', 'utf8');

const regex = /\{\/\* Layer 3: Username Row \*\/\}\s*<div className="mt-4 text-center">\s*\{currentUser \? \(\s*<h3 className="font-black text-white tracking-tight text-xl">\s*\{currentUser.name\}\s*<\/h3>\s*\) : \(\s*<h3 className="font-extrabold text-white text-lg">\s*Welcome to EPL Premier League\s*<\/h3>\s*\)\}\s*<\/div>/;

const replacement = `{/* Layer 3: Username Row */}
              <div className="mt-4 text-center flex items-center justify-center gap-2">
                {currentUser ? (
                  <h3 className="font-black text-white tracking-tight text-xl">
                    {currentUser.name}
                  </h3>
                ) : (
                  <h3 className="font-extrabold text-white text-lg">
                    Welcome to EPL Premier League
                  </h3>
                )}
                <button 
                  onClick={() => setShowShareModal(true)} 
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white" 
                  title="Share App"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/UserAuthDeckModal.tsx', content);
