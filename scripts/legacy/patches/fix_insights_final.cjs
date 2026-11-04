const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

// The original line was: {activeTab === 'insights' && (
// Let's find it.
const regex = /\{activeTab === 'insights' && \(/;
const replacement = `{activeTab === 'insights' && (!players || players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4 font-bold animate-pulse">Loading fantasy stats...</p>
        </div>
      ) : (`;

code = code.replace(regex, replacement);

// Now find the closing parenthesis for this block.
// It ends with:
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
// We want to replace it with:
//               </div>
//             </div>
//           </div>
//         </div>
//       ))}

code = code.replace(/          <\/div>\n        <\/div>\n      \)\}/, `          </div>
        </div>
      ))}`);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
