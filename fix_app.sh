sed -i '/{\/\* TAB 2: STANDINGS \*\//,/{\/\* TAB 4: NEWS \*\//c\
              {/* TAB 2: STANDINGS */}\
              {activeTab === "standings" && (\
                <div className="space-y-8">\
                  <StandingsTable standings={standings} />\
                  <LeagueStats stats={stats} teams={teams} competition="league" />\
                </div>\
              )}\
\
              {/* TAB 4: NEWS */}' src/App.tsx
