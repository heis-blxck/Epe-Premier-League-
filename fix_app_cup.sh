sed -i '/{\/\* TAB 5: LEAGUE CUP BRACKET \*\//,/{\/\* TAB 6: FANTASY LEAGUE \*\//c\
              {/* TAB 5: LEAGUE CUP */}\
              {activeTab === "cup" && (\
                <div className="space-y-8">\
                  {/* Fixtures (Blank for now) */}\
                  <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-slate-800">\
                    <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">\
                      Cup Fixtures\
                    </h2>\
                    <div className="flex items-center justify-center py-12 text-slate-400 font-medium border border-dashed border-slate-700 rounded-2xl bg-slate-950">\
                      No fixtures scheduled at this moment.\
                    </div>\
                  </div>\
\
                  {/* Cup Bracket */}\
                  <LeagueCupBracket\
                    matches={matches}\
                    teams={teams}\
                    standings={standings}\
                    onSelectMatch={setSelectedMatch}\
                    currentAdmin={currentAdmin}\
                    onScheduleCupMatch={async (cupMatchData) => {\
                      await api.saveMatch(cupMatchData);\
                      triggerToast("League Cup Match Scheduled!");\
                      loadData();\
                    }}\
                  />\
\
                  {/* Cup Player Stats */}\
                  <LeagueStats stats={stats} teams={teams} competition="cup" />\
                </div>\
              )}\
\
              {/* TAB 6: FANTASY LEAGUE */}' src/App.tsx
