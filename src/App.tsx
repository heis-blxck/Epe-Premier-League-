import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import React, { useState, useEffect, useRef } from 'react';
import { Match, Team, Player, NewsArticle, LeagueStats as LeagueStatsType, AdminUser, UserAccount, AppNotification, ThemeMode, AppSettings, Advertisement } from './types';
import { api } from './services/api';
import { AdDisplay } from './components/AdDisplay';
import { Header } from './components/Header';
import { EpeLogo } from './components/EpeLogo';


import { TodayMatchesStrip } from './components/TodayMatchesStrip';
import { StandingsTable } from './components/StandingsTable';
import { LeagueStats } from './components/LeagueStats';
import { NewsFeed } from './components/NewsFeed';
import { AdminDashboard } from './components/AdminDashboard';
import { FantasyLeagueView } from './components/FantasyLeagueView';
import { CupPanel } from './components/CupPanel';
import { MatchDetailModal } from './components/MatchDetailModal';
import { TeamProfileModal } from './components/TeamProfileModal';
import { UserAuthDeckModal } from './components/UserAuthDeckModal';
import { MandatoryLoginGate } from './components/MandatoryLoginGate';
import { AboutPage } from './components/AboutPage';
import { handleBack, useBackHandler } from './utils/backManager';
import { Shield, Sparkles, RefreshCw, Trophy, Radio, Newspaper, Goal, X, Bell, Star, WifiOff } from 'lucide-react';

const splashLogo = '/logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'news' | 'fantasy' | 'cup' | 'admin' | 'about'>('matches');

  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Team[]>([]);
  const [stats, setStats] = useState<LeagueStatsType>({ topScorers: [], topAssists: [], cleanSheets: [] });
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings | undefined>(undefined);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);

  // User & Theme State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('epl_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  const currentUserRef = useRef<UserAccount | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('epl_theme') as ThemeMode) || 'dark';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [isAuthDeckOpen, setIsAuthDeckOpen] = useState<boolean>(false);
  const [toastNotif, setToastNotif] = useState<AppNotification | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayToast = (notif: AppNotification | null, duration = 3500) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastNotif(notif);
    if (notif) {
      toastTimeoutRef.current = setTimeout(() => {
        setToastNotif(null);
        toastTimeoutRef.current = null;
      }, duration);
    }
  };

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedTeamProfile, setSelectedTeamProfile] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);


  // Network connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);

  // Hardware Back Button Integration
  useEffect(() => {
    // Push dummy state to catch the back event
    window.history.pushState({ isAppBack: true }, '', window.location.href);

    const onPopState = (e: PopStateEvent) => {
      const handled = handleBack();
      if (handled) {
        // If handled by our router, restore the back-stop dummy state
        window.history.pushState({ isAppBack: true }, '', window.location.href);
      } else {
        // Not handled -> we are at root, exit the app natively.
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useBackHandler(() => {
    if (showOfflineModal) return false; // Don't close offline modal with back

    if (selectedMatch) {
      setSelectedMatch(null);
      return true;
    }
    if (selectedTeamProfile) {
      setSelectedTeamProfile(null);
      return true;
    }
    if (isAuthDeckOpen) {
      setIsAuthDeckOpen(false);
      return true;
    }
    if (activeTab !== 'matches') {
      setActiveTab('matches');
      return true;
    }
    return false;
  }, [selectedMatch, selectedTeamProfile, isAuthDeckOpen, activeTab, showOfflineModal]);


  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineModal(false);
      loadData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineModal(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerToast = (msg: string) => {
    displayToast({
      id: `toast-${Date.now()}`,
      title: 'League Update',
      message: msg,
      timestamp: 'Just now',
      type: 'admin_alert',
      eventType: 'Lineups Published',
      read: false
    });
  };

  // Derive admin status from currentUser and admins list
  const currentAdmin = admins.find(a => currentUser && (a.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase()) || null;
  const isAdmin = Boolean(currentAdmin) || ['super_admin', 'sub_admin', 'news_reporter', 'official_league', 'OFFICIAL_LEAGUE', 'spokesperson'].includes(currentUser?.role || '');
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentAdmin?.role === 'super_admin';

  // Persist user session to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('epl_active_user', JSON.stringify(currentUser));
      if (notificationsEnabled) {
        requestFCMToken();
      }
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
        api.getSettings(),
        api.getAdvertisements(),
        api.getUsers()
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
        resSettings,
        resAds,
        resUsers
      ] = results;

      const anySuccess = results.some(r => r.status === 'fulfilled');
      if (anySuccess) {
        setIsOnline(true);
        setShowOfflineModal(false);
      }

      if (resMatches.status === 'fulfilled') setMatches(resMatches.value);
      if (resStandings.status === 'fulfilled') setStandings(resStandings.value);
      if (resStats.status === 'fulfilled') setStats(resStats.value);
      if (resNews.status === 'fulfilled') setNews(resNews.value);
      if (resTeams.status === 'fulfilled') setTeams(resTeams.value);
      if (resPlayers.status === 'fulfilled') setPlayers(resPlayers.value);
      if (resAdmins.status === 'fulfilled') setAdmins(resAdmins.value);
      if (resSettings.status === 'fulfilled') setSettings(resSettings.value);
      if (resAds.status === 'fulfilled') setAdvertisements(resAds.value);
      if (resUsers.status === 'fulfilled') {
        setUsers(resUsers.value);
        const activeUser = currentUserRef.current;
        if (activeUser) {
          const updatedSelf = resUsers.value.find(u => (u.email || '').toLowerCase() === (activeUser?.email || '').toLowerCase());
          if (updatedSelf) {
            setCurrentUser(prev => {
              if (!prev) return updatedSelf;
              return { ...prev, ...updatedSelf };
            });
          }
        }
      }

      if (resNotifs.status === 'fulfilled') {
        const fetchedNotifs = resNotifs.value;
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




  // Server-Sent Events for Real-Time Notifications
  useEffect(() => {
    const sse = new EventSource('/api/notifications/stream');
    
    sse.onmessage = async (event) => {
      try {
        const notif = JSON.parse(event.data);
        if (!notif || !notif.id) return;
        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        displayToast(notif, 4000);
        
        // Play in-app sound if enabled
        if (notificationsEnabled) {
          try {
            const audio = new Audio('/epe_alert.mp3');
            audio.play().catch(e => console.warn('In-app audio play blocked:', e));
          } catch(e) {}
        }


        // Show Native OS Notification
        if (notificationsEnabled) {
          if (Notification.permission === 'granted') {
            const swRegistration = await navigator.serviceWorker.getRegistration();
            const notifOpts = {
              body: notif.message,
              icon: '/logo.png',
              silent: false,
              requireInteraction: true,
              vibrate: [200, 100, 200, 100, 200, 100, 200]
            };
            if (swRegistration) {
              swRegistration.showNotification(notif.title, notifOpts);
            } else {
              new Notification(notif.title, notifOpts);
            }
          }
        }
      } catch (e) {

      }
    };

    return () => {
      sse.close();
    };
  }, [currentUser]);


  
  useEffect(() => {

  }, [currentUser, notificationsEnabled]);

  useEffect(() => {
    loadData();

    // Safety fallback: ensure loading splash screen resolves after 1 second max
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Auto refresh live scores & notifications every 8 seconds
    const interval = setInterval(() => {
      loadData();
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // User Auth Deck Handlers
  const handleLogin = async (email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string, fantasyTeamName?: string) => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
    const user = await api.loginUser(email, name, favoriteTeamId, avatarUrl, fantasyTeamName);
    currentUserRef.current = user;
    setCurrentUser(user);
    if (user.themePreference) setTheme(user.themePreference);
    
    // Always route directly to the Matches page (the primary Match Center) post-login
    setActiveTab('matches');
    await loadData();
  };

  const handleUpdateProfile = async (data: Partial<UserAccount> & { email: string }) => {
    const updated = await api.updateUserProfile(data);
    currentUserRef.current = updated;
    setCurrentUser(updated);
  };

  const handleLogout = () => {
    localStorage.removeItem('epl_active_user');
    currentUserRef.current = null;
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('matches');
    }
  };

  const handleDeleteAccount = async (email: string) => {
    await api.deleteAccount(email);
    currentUserRef.current = null;
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('matches');
    }
    await loadData();
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
      title: `⚽ TEST ALERT: ${randomTeam?.name || 'Epe Club'} Scores!`,
      message: `Thunderous strike from 25 yards out into the top corner!`,
      type: 'match_goal'
    };

    displayToast({
      id: `toast-${Date.now()}`,
      title: newNotif.title,
      message: newNotif.message,
      type: 'match_goal',
      eventType: 'Goal',
      timestamp: new Date().toISOString(),
      read: false
    }, 4000);

    // Play in-app sound if enabled
    if (notificationsEnabled) {
      try {
        const audio = new Audio('/epe_alert.mp3');
        audio.play().catch(e => console.warn('In-app audio play blocked:', e));
      } catch(e) {}
    }

    // Show Native OS Notification
    if (notificationsEnabled) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notifOpts = {
          body: newNotif.message,
          icon: '/logo.png',
          silent: false,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200, 100, 200]
        };
        new Notification(newNotif.title, notifOpts);
      }
    }
  };

  const handleToggleTheme = (mode: ThemeMode) => {
    setTheme(mode);
    if (currentUser) {
      handleUpdateProfile({ email: currentUser.email, themePreference: mode });
    }
  };




  const requestFCMToken = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return;
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const configRes = await fetch('/api/firebase-config');
        if (!configRes.ok) return;
        const config = await configRes.json();
        
        const app = initializeApp(config);
        const messaging = getMessaging(app);
        
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) return;

        const swReadyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 2000));
        const swRegistration = await Promise.race([swReadyPromise, timeoutPromise]);
        if (!swRegistration) return;

        const currentToken = await getToken(messaging, { 
          vapidKey,
          serviceWorkerRegistration: swRegistration
        });
        
        if (currentToken && currentUser) {
          console.log('FCM Token acquired', currentToken);
        }
      }
    } catch (e) {
      console.warn('FCM token acquisition skipped or failed:', e);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled && currentUser) {
      requestFCMToken();
    }
    if (currentUser) {
      await handleUpdateProfile({ email: currentUser.email, notificationsEnabled: enabled });
    }
  };

const handleAppointAdmin = async (email: string, name: string, role: 'super_admin' | 'sub_admin' | 'news_reporter' | 'official_league' | 'OFFICIAL_LEAGUE') => {
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

  // GATE 1: MANDATORY APP SIGN UP / LOGIN GATE (To access the app & create profile)
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
    <div className={`app-min-viewport-height font-sans antialiased flex flex-col justify-between transition-colors duration-300 ios-scroll ${
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
              type="button"
              onClick={() => displayToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Dismiss notification"
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
          onOpenAuthDeck={() => {
            setIsAuthDeckOpen(true);
            window.dispatchEvent(new Event('reset-profile-tab'));
          }}
          settings={settings}
        />

        {/* Main Content Area */}
        <main className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-safe-nav space-y-6 sm:space-y-8">
          <AdDisplay advertisements={advertisements} position="top" />
          
          {isLoading || !isOnline ? (
            <div className="fixed inset-0 z-[10000] bg-[#800020] flex items-center justify-center p-4">
              <img 
                src="https://i.postimg.cc/hjmBHkfN/08469fba-3b41-4117-964b-745b2eca53f4-20260726-052311-0000.png" 
                alt="Epe Premier League" 
                loading="eager" 
                fetchPriority="high"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== '/logo.png') {
                    target.src = '/logo.png';
                  }
                }}
                style={{
                  width: '200px',
                  height: 'auto',
                  objectFit: 'contain',
                  zIndex: 10,
                  display: 'block',
                  margin: 'auto',
                  background: 'transparent'
                }}
              />
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
                </div>
              )}

              {/* TAB 2: STANDINGS */}
              {activeTab === "standings" && (
                <div className="space-y-8">
                  <StandingsTable 
                    standings={standings} 
                    matches={matches} 
                    onSelectTeam={setSelectedTeamProfile} 
                    isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'super_admin'}
                  />
                  <LeagueStats stats={stats} teams={teams} competition="league" players={players} />
                </div>
              )}

              {/* TAB 4: NEWS */}
              {activeTab === 'news' && (
                <NewsFeed
                  news={news}
                  currentUser={currentUser}
                  currentAdmin={currentAdmin}
                  onShowToast={triggerToast}
                  onNewsUpdated={loadData}
                />
              )}

              {/* TAB 5: LEAGUE CUP */}
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


              {/* TAB 6: FANTASY LEAGUE */}
              {activeTab === 'fantasy' && (
                <FantasyLeagueView
                  players={players}
                  teams={teams}
                  matches={matches}
                  currentUser={currentUser}
                  onShowToast={triggerToast}
                  onUpdateProfile={handleUpdateProfile}
                  onExit={() => setActiveTab('matches')}
                />
              )}
              {/* ABOUT PAGE */}
              {activeTab === 'about' && (
                <AboutPage settings={settings} theme={theme} />
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
        onDeleteAccount={handleDeleteAccount}
        onNavigateToAdmin={() => setActiveTab('admin')}
        onNavigateToTab={(tab: string) => setActiveTab(tab as any)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        settings={settings}
      />

      {/* Team Profile Modal Popup */}
      {selectedTeamProfile && (
        <TeamProfileModal
          team={selectedTeamProfile}
          standings={standings}
          players={players}
          matches={matches}
          users={users}
          onClose={() => setSelectedTeamProfile(null)}
        />
      )}

      {/* Match Detail Modal Popup */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          players={players}
          teams={teams}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Bottom Navigation Bar */}
      {activeTab !== 'admin' && activeTab !== 'fantasy' && !isAuthDeckOpen && (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#800020] border-t border-[#5a0016] shadow-[0_-10px_30px_-10px_rgba(128,0,32,0.4)] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-2 relative">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'matches' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Radio className={`transition-all ${activeTab === 'matches' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'matches' ? 'text-[11px]' : 'text-[10px]'}`}>Matches</span>
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'standings' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Goal className={`transition-all ${activeTab === 'standings' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'standings' ? 'text-[11px]' : 'text-[10px]'}`}>League</span>
          </button>
          
          {/* Prominent Center Hero Button (For You) */}
          <div className="relative min-w-[72px] flex items-center justify-center z-50">
            <button
              onClick={() => setActiveTab('news')}
              className="flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer group transition-all duration-300"
            >
              {/* Invisible spacer matching other icons' height to keep text perfectly aligned */}
              <div className="w-5 h-6 opacity-0 mb-2"></div>
              <span className={`font-bold tracking-wide transition-all ${activeTab === 'news' ? 'text-amber-400 text-[11px]' : 'text-white/70 group-hover:text-white text-[10px]'}`}>For You</span>
            </button>
            
            {/* The Center Button */}
            <div className="absolute top-[-28px] left-1/2 -translate-x-1/2 pointer-events-none">
              <button 
                onClick={() => setActiveTab('news')} 
                className={`pointer-events-auto flex items-center justify-center w-[62px] h-[62px] rounded-full transition-all duration-300 ${activeTab === 'news' ? 'bg-amber-400 text-[#800020] scale-110 shadow-[0_4px_15px_rgba(251,191,36,0.4)]' : 'bg-white text-slate-800 hover:text-[#800020]'}`}
              >
                <Newspaper className={`transition-all ${activeTab === 'news' ? 'w-6 h-6' : 'w-5 h-5'}`} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('cup')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'cup' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Trophy className={`transition-all ${activeTab === 'cup' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'cup' ? 'text-[11px]' : 'text-[10px]'}`}>Cup</span>
          </button>
          <button
            onClick={() => setActiveTab('fantasy')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'fantasy' ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Sparkles className={`transition-all ${activeTab === 'fantasy' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'fantasy' ? 'text-[11px]' : 'text-[10px]'}`}>Fantasy</span>
          </button>
        </div>
      </div>
      )}

      {/* Footer */}
      <footer className={`py-8 pb-28 border-t transition-colors mt-auto ${
        isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-200 text-slate-700 border-slate-300'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center border border-amber-400/50 shadow-md shrink-0">
              <EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full" />
            </div>
            <div>
              <div className="font-black text-amber-500 uppercase tracking-widest text-sm">EPE PREMIER LEAGUE</div>
              <div className="text-[10px] text-slate-500 font-bold">Official Match Center &copy; 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            
          </div>
        </div>
      </footer>

      {/* Offline Alert Modal */}
      {showOfflineModal && !isOnline && (
        <div className="fixed inset-0 z-[10001] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <WifiOff className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">No Internet Connection</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                No Internet Connection Detected. Please connect to Wi-Fi or cellular data to access the live server.
              </p>
            </div>
            <button
              onClick={() => {
                const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
                setIsOnline(online);
                if (online) {
                  setShowOfflineModal(false);
                  loadData();
                } else {
                  setShowOfflineModal(true);
                }
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#800020] hover:bg-rose-900 text-white font-bold text-sm shadow-lg hover:shadow-rose-900/30 transition-all cursor-pointer border border-rose-700/50 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
