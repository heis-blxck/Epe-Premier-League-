sed -i '/{activeTab === "cup" && (/,/<\/div>\n              )}/c\
              {activeTab === "cup" && (\
                <CupPanel\
                  matches={matches}\
                  teams={teams}\
                  standings={standings}\
                  stats={stats}\
                  setSelectedMatch={setSelectedMatch}\
                  currentAdmin={currentAdmin}\
                  triggerToast={triggerToast}\
                  loadData={loadData}\
                />\
              )}' src/App.tsx
