sed -i '/{activeTab === '"'"'standings'"'"' && (/c\
              {activeTab === '"'"'standings'"'"' && (\
                <div className="space-y-6">\
                  <StandingsTable standings={standings} />\
                  <LeagueStats stats={stats} teams={teams} isCup={false} />\
                </div>\
              )}' src/App.tsx
