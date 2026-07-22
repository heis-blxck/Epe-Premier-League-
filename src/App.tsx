import React, { useState, useEffect } from 'react';
import { Match, Team, Player, NewsArticle, LeagueStats as LeagueStatsType, AdminUser, UserAccount, AppNotification, ThemeMode, AppSettings } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { EpeLogo } from './components/EpeLogo';
import { TodayMatchesStrip } from './components/TodayMatchesStrip';
import { StandingsTable } from './components/StandingsTable';
import { LeagueStats } from './components/LeagueStats';
import { NewsFeed } from './components/NewsFeed';
import { AdminDashboard } from './components/AdminDashboard';
import { MatchDetailModal } from './components/MatchDetailModal';
import { UserAuthDeckModal } from './components/UserAuthDeckModal';
import { MandatoryLoginGate } from './components/MandatoryLoginGate';
import { Shield, Sparkles, RefreshCw, Trophy, Radio, Newspaper, Goal, X, Bell } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'stats' | 'news' | 'admin'>('matches');

  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Team[]>([]);
  const [stats, setStats] = useState<LeagueStatsType>({ topScorers: [], topAssists: [], cleanSheets: [] });
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings | undefined>(undefined);

  // User & Theme State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('epl_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('epl_theme') as ThemeMode) || 'dark';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [isAuthDeckOpen, setIsAuthDeckOpen] = useState<boolean>(false);
  const [toastNotif, setToastNotif] = useState<AppNotification | null>(null);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Derive admin status from currentUser and admins list
  const currentAdmin = admins.find(a => currentUser && a.email.toLowerCase() === currentUser.email.toLowerCase()) || null;
  const isAdmin = Boolean(currentAdmin) || currentUser?.role === 'super_admin' || currentUser?.role === 'sub_admin' || currentUser?.role === 'news_reporter';
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentAdmin?.role === 'super_admin';

  // Persist user session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('epl_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('epl_active_user');
    }
  }, [currentUser]);

  // Apply theme class to document body / root
  useEffect(() => {
    localStorage.setItem('epl_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // FETCH ALL DATA & NOTIFICATIONS
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        api.getMatches(),
        api.getStandings(),
        api.getStats(),
        api.getNews(),
        api.getTeams(),
        api.getPlayers(),
        api.getAdmins(),
        api.getNotifications(),
        api.getSettings()
      ]);

      const [
        resMatches,
        resStandings,
        resStats,
        resNews,
        resTeams,
        resPlayers,
        resAdmins,
        resNotifs,
        resSettings
      ] = results;

      if (resMatches.status === 'fulfilled') setMatches(resMatches.value);
      if (resStandings.status === 'fulfilled') setStandings(resStandings.value);
      if (resStats.status === 'fulfilled') setStats(resStats.value);
      if (resNews.status === 'fulfilled') setNews(resNews.value);
      if (resTeams.status === 'fulfilled') setTeams(resTeams.value);
      if (resPlayers.status === 'fulfilled') setPlayers(resPlayers.value);
      if (resAdmins.status === 'fulfilled') setAdmins(resAdmins.value);
      if (resSettings.status === 'fulfilled') setSettings(resSettings.value);

      if (resNotifs.status === 'fulfilled') {
        const fetchedNotifs = resNotifs.value;
        if (fetchedNotifs.length > 0) {
          const latestNotif = fetchedNotifs[0];
          if (!latestNotif.read && notifications.length > 0 && notifications[0]?.id !== latestNotif.id) {
            if (notificationsEnabled) {
              setToastNotif(latestNotif);
              setTimeout(() => setToastNotif(null), 5000);
            }
          }
        }
        setNotifications(fetchedNotifs);
      }

      if (resMatches.status === 'fulfilled' && selectedMatch) {
        const updated = resMatches.value.find(m => m.id === selectedMatch.id);
        if (updated) setSelectedMatch(updated);
      }
    } catch (error) {
      console.warn('Error fetching league data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto refresh live scores & notifications every 8 seconds
    const interval = setInterval(() => {
      loadData();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // User Auth Deck Handlers
  const handleLogin = async (email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string) => {
    const user = await api.loginUser(email, name, favoriteTeamId, avatarUrl);
    setCurrentUser(user);
    if (user.themePreference) setTheme(user.themePreference);
    
    // Check if admin to jump to admin tab
    const foundAdmin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (foundAdmin) {
      setActiveTab('admin');
    }
    await loadData();
  };

  const handleUpdateProfile = async (data: Partial<UserAccount> & { email: string }) => {
    const updated = await api.updateUserProfile(data);
    setCurrentUser(updated);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('matches');
    }
  };

  // Notification Handlers
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = async () => {
    await api.clearNotifications();
    setNotifications([]);
  };

  const handleTriggerTestNotification = async () => {
    const randomTeam = teams[Math.floor(Math.random() * teams.length)] || teams[0];
    const newNotif = {
      title: `⚽ GOAL ALERT: ${randomTeam?.name || 'Epe Club'} Scores!`,
      message: `Thunderous strike from 25 yards out into the top corner!`,
      type: 'match_goal' as const
    };
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif)
    });
    await loadData();
    setToastNotif({
      id: `toast-${Date.now()}`,
      title: newNotif.title,
      message: newNotif.message,
      type: 'match_goal',
      timestamp: new Date().toISOString(),
      read: false
    });
    setTimeout(() => setToastNotif(null), 5000);
  };

  const handleToggleTheme = (mode: ThemeMode) => {
    setTheme(mode);
    if (currentUser) {
      handleUpdateProfile({ email: currentUser.email, themePreference: mode });
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (currentUser) {
      handleUpdateProfile({ email: currentUser.email, notificationsEnabled: enabled });
    }
  };

  const handleAppointAdmin = async (email: string, name: string, role: 'super_admin' | 'sub_admin' | 'news_reporter') => {
    await api.appointAdmin({
      email,
      name,
      role,
      appointedBy: currentUser?.email || 'itzjeda10@gmail.com'
    });
    await loadData();
  };

  const handleDismissAdmin = async (email: string) => {
    await api.dismissAdmin(email);
    await loadData();
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await api.saveSettings(newSettings);
    setSettings(updated);
    await loadData();
  };

  const liveMatches = matches.filter(m => m.status === 'Live');
  const isDark = theme === 'dark';

  // MANDATORY LOGIN GATE IF USER IS NOT AUTHENTICATED
  if (!currentUser) {
    return (
      <MandatoryLoginGate
        teams={teams}
        admins={admins}
        onLogin={handleLogin}
        theme={theme}
        settings={settings}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-950 text-slate-100 selection:bg-[#800020] selection:text-amber-300' 
        : 'bg-slate-100 text-slate-900 selection:bg-amber-400 selection:text-slate-950'
    }`}>
      <div>
        {/* Real-time Push Alert Toast Banner */}
        {toastNotif && (
          <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-slate-900 text-white border-2 border-amber-400 p-4 rounded-2xl shadow-2xl animate-bounce flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-black shrink-0">
                <Goal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-xs text-amber-300 uppercase tracking-wide">
                  {toastNotif.title}
                </h4>
                <p className="text-xs text-slate-300">{toastNotif.message}</p>
              </div>
            </div>

            <button
              onClick={() => setToastNotif(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          liveCount={liveMatches.length}
          onRefresh={loadData}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onClearNotifications={handleClearNotifications}
          onTriggerTestNotification={handleTriggerTestNotification}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          onOpenAuthDeck={() => setIsAuthDeckOpen(true)}
          settings={settings}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-950 p-2 flex items-center justify-center shadow-2xl border-2 border-amber-400/80 animate-pulse">
                <EpeLogo className="w-full h-full" />
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Connecting to Epe Premier League Live Feeds...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: MATCHES & LIVE DASHBOARD */}
              {activeTab === 'matches' && (
                <div className="space-y-8">
                  {/* Today's Matches Strip */}
                  <TodayMatchesStrip
                    matches={matches}
                    onSelectMatch={(m) => setSelectedMatch(m)}
                    selectedMatchId={selectedMatch?.id}
                  />

                  {/* 2-Column Section: Standings Preview & News Highlights */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <StandingsTable standings={standings} />
                    </div>

                    <div className="space-y-6">
                      {/* Live Quick Stats Widget */}
                      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-[#800020] text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-rose-900/60 pb-3">
                          <span className="font-black text-sm uppercase tracking-wider text-amber-300 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" /> Golden Boot Leader
                          </span>
                          <span className="text-[11px] text-rose-200 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                            Matchday {matches[0]?.matchday || 12}
                          </span>
                        </div>

                        {stats.topScorers[0] && (
                          <div className="flex items-center gap-4 pt-1">
                            <img
                              src={stats.topScorers[0].photoUrl}
                              alt={stats.topScorers[0].name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-lg ring-2 ring-amber-400/20"
                            />
                            <div>
                              <h4 className="font-extrabold text-base text-white">{stats.topScorers[0].name}</h4>
                              <p className="text-xs text-rose-200/80">{teams.find(t => t.id === stats.topScorers[0].teamId)?.name}</p>
                              <div className="mt-1 font-mono font-black text-amber-300 text-sm">
                                {stats.topScorers[0].goals} Goals Scored
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Latest News Preview */}
                      <div className={`rounded-3xl p-6 shadow-2xl border space-y-4 backdrop-blur-sm ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <h3 className={`font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            <Newspaper className="w-4 h-4 text-rose-500" />
                            League News
                          </h3>
                          <button
                            onClick={() => setActiveTab('news')}
                            className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
                          >
                            View All &rarr;
                          </button>
                        </div>

                        <div className="space-y-3">
                          {news.slice(0, 3).map(n => (
                            <div
                              key={n.id}
                              onClick={() => setActiveTab('news')}
                              className="group cursor-pointer space-y-1 py-1"
                            >
                              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">{n.category}</div>
                              <h4 className={`font-extrabold text-xs line-clamp-2 group-hover:text-amber-500 transition-colors ${
                                isDark ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {n.title}
                              </h4>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STANDINGS */}
              {activeTab === 'standings' && (
                <StandingsTable standings={standings} />
              )}

              {/* TAB 3: STATS */}
              {activeTab === 'stats' && (
                <LeagueStats stats={stats} teams={teams} />
              )}

              {/* TAB 4: NEWS */}
              {activeTab === 'news' && (
                <NewsFeed news={news} />
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
              <EpeLogo className="w-full h-full" />
            </div>
            <div>
              <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                EPE PREMIER LEAGUE &bull; OFFICIAL APP
              </p>
              <p className={isDark ? 'text-slate-500' : 'text-slate-600'}>
                Powered by Local Football Governing Council of Epe Division
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span>© 2026 Epe Premier League</span>
            <span>&bull;</span>
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

