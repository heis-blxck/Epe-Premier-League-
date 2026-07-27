cat << 'APP_EOF' >> src/App.tsx
              {activeTab === "cup" && (
                <div className="space-y-8">
                  {/* Fixtures (Blank for now) */}
                  <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-slate-800">
                    <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                      Cup Fixtures
                    </h2>
                    <div className="flex items-center justify-center py-12 text-slate-400 font-medium border border-dashed border-slate-700 rounded-2xl bg-slate-950">
                      No fixtures scheduled at this moment.
                    </div>
                  </div>

                  {/* Cup Bracket */}
                  <LeagueCupBracket
                    matches={matches}
                    teams={teams}
                    standings={standings}
                    onSelectMatch={setSelectedMatch}
                    currentAdmin={currentAdmin}
                    onScheduleCupMatch={async (cupMatchData) => {
                      await api.saveMatch(cupMatchData);
                      triggerToast("League Cup Match Scheduled!");
                      loadData();
                    }}
                  />

                  {/* Cup Player Stats */}
                  <LeagueStats stats={stats} teams={teams} competition="cup" />
                </div>
              )}

              {/* TAB 6: FANTASY LEAGUE */}
              {activeTab === 'fantasy' && currentUser && (
                <FantasyLeagueView
                  players={players}
                  teams={teams}
                  matches={matches}
                  currentUser={currentUser}
                  onShowToast={triggerToast}
                />
              )}
              {/* TAB 5: ADMIN COMMAND CENTER */}
              {activeTab === 'admin' && isAdmin && (
                <AdminDashboard
                  matches={matches}
                  teams={teams}
                  players={players}
                  news={news}
                  onRefreshAll={loadData}
                  currentUserEmail={currentUser?.email || 'itzjeda10@gmail.com'}
                  currentAdmin={currentAdmin}
                  isAdmin={isAdmin}
                  isSuperAdmin={isSuperAdmin}
                  admins={admins}
                  onAppointAdmin={handleAppointAdmin}
                  onDismissAdmin={handleDismissAdmin}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}
            </>
          )}
          
          <AdDisplay advertisements={advertisements} position="footer" />
        </main>
      </div>

      {/* User & Admin Login Deck Modal */}
      <UserAuthDeckModal
        isOpen={isAuthDeckOpen}
        onClose={() => setIsAuthDeckOpen(false)}
        currentUser={currentUser}
        teams={teams}
        admins={admins}
        isAdmin={isAdmin}
        onLogin={handleLogin}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        settings={settings}
      />

      {/* Match Detail Modal Popup */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Footer */}
      <footer className={`py-8 border-t transition-colors mt-12 ${
        isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-200 text-slate-700 border-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 p-1 flex items-center justify-center border border-amber-400/50 shadow-md shrink-0">
              <EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full" />
            </div>
            <div>
              <div className="font-black text-amber-500 uppercase tracking-widest text-sm">EPE PREMIER LEAGUE</div>
              <div className="text-[10px] text-slate-500 font-bold">Official Match Center &copy; 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isAdmin) {
                  setActiveTab('admin');
                } else {
                  setIsAuthDeckOpen(true);
                }
              }}
              className="text-amber-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAdmin ? 'Admin Command Center' : 'My Account & Preferences'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
APP_EOF
