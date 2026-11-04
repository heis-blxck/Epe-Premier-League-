const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const startStr = '{/* TAB 5: LEAGUE CUP */}';
const endStr = '{/* TAB 6: FANTASY LEAGUE */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* TAB 5: LEAGUE CUP */}
              {activeTab === "cup" && (
                <CupPanel
                  matches={matches}
                  teams={teams}
                  standings={standings}
                  stats={stats}
                  setSelectedMatch={setSelectedMatch}
                  currentAdmin={currentAdmin}
                  triggerToast={triggerToast}
                  loadData={loadData}
                />
              )}

              `;
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Successfully replaced cup section');
} else {
  console.log('Could not find start or end string');
}
