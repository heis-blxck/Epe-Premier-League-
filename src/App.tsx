import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useURLModal } from './hooks/useURLModal';
import { App as CapacitorApp } from '@capacitor/app';
import { Match, Team, Player, NewsArticle, LeagueStats as LeagueStatsType, AdminUser, UserAccount, AppNotification, ThemeMode, AppSettings, Advertisement } from './types';
import { api } from './services/api';
import { signupUserToSupabase } from './services/userService';
import { isSupabaseConfigured } from './supabase';
import { AdDisplay } from './components/AdDisplay';
import { Header } from './components/Header';
import { EpeLogo } from './components/EpeLogo';


import { TodayMatchesStrip } from './components/TodayMatchesStrip';
import { SponsorshipBanner } from './components/SponsorshipBanner';
import { MatchdayPredictor } from './components/MatchdayPredictor';
import { StandingsTable } from './components/StandingsTable';
import { LeagueStats } from './components/LeagueStats';
import { NewsFeed } from './components/NewsFeed';
import { AdminDashboard } from './components/AdminDashboard';
import { FantasyLeagueView } from './components/FantasyLeagueView';
import { CupPanel } from './components/CupPanel';
import { MatchDetailModal } from './components/MatchDetailModal';
import { TeamProfileModal } from './components/TeamProfileModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { UserAuthDeckModal } from './components/UserAuthDeckModal';
import { MandatoryLoginGate } from './components/MandatoryLoginGate';
import { AboutPage } from './components/AboutPage';
import { TabContentSkeleton } from './components/TabContentSkeleton';

import { Shield, Sparkles, RefreshCw, Trophy, Radio, Newspaper, Goal, X, Bell, Star, WifiOff } from 'lucide-react';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract activeTab from URL pathname, default to 'matches'
  const pathName = location.pathname.split('/')[1] || 'matches';
  const validTabs = ['matches', 'standings', 'news', 'fantasy', 'cup', 'admin', 'about'];
  const activeTab = validTabs.includes(pathName) ? pathName as any : 'matches';

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
  
  const [searchParams] = useSearchParams();
  const { openModal: openAuthDeck } = useURLModal('authDeck');
  const { modalData: matchData, openModal: openMatchModal } = useURLModal<{ matchId: string }>('matchDetail');
  const { openModal: openTeamModal } = useURLModal<{ teamId: string }>('teamProfile');

  const selectedMatch = matches.find(m => m.id === matchData?.matchId) || null;
  const setSelectedMatch = (m: Match | null) => { if (m) openMatchModal({ matchId: m.id }); };
  const setSelectedTeamProfile = (t: Team | null) => { if (t) openTeamModal({ teamId: t.id }); };
  const setIsAuthDeckOpen = (open: boolean) => { if (open) openAuthDeck(); };
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
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);


  // Network connectivity state
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const lastBackPressRef = useRef<number>(0);

  // Strict Back Navigation Interceptor Logic (Capacitor & URL-based modal aware)
  useEffect(() => {
    let capacitorListenerPromise: Promise<any> | null = null;

    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      capacitorListenerPromise = CapacitorApp.addListener('backButton', () => {
        const search = window.location.search;
        const path = window.location.pathname;
        const tab = path.split('/')[1] || 'matches';

        // 1. Check for Offline Modal or URL Modal parameter
        if (showOfflineModal) {
          setShowOfflineModal(false);
          return;
        }

        if (search.includes('modal=')) {
          // Defer to History API to close modal smoothly
          window.history.back();
          return;
        }

        // 2. No modal open -> if on non-matches tab, navigate back to 'matches'
        if (tab !== 'matches') {
          navigate('/matches', { replace: true });
          return;
        }

        // 3. No modal open AND on 'matches' tab -> Double tap back to exit app
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPressRef.current = now;
          displayToast({
            id: Date.now().toString(),
            title: 'Exit App',
            message: 'Press back again to exit',
            type: 'system',
            eventType: 'Fixtures',
            read: false,
            timestamp: new Date().toISOString()
          }, 2000);
        }
      });
    }

    return () => {
      if (capacitorListenerPromise) {
        capacitorListenerPromise.then(sub => sub.remove?.());
      }
    };
  }, [navigate, showOfflineModal]);

  const setActiveTab = (tab: string) => {
    if (tab === activeTab) return;
    if (tab === 'matches') {
      navigate('/matches', { replace: true });
    } else {
      if (activeTab === 'matches') {
        navigate(`/${tab}`);
      } else {
        navigate(`/${tab}`, { replace: true });
      }
    }
  };

  const handleTabChange = (tab: 'matches' | 'standings' | 'news' | 'fantasy' | 'cup' | 'admin' | 'about') => {
    if (tab === activeTab) return;
    if (tab === 'matches') {
      navigate('/matches', { replace: true });
    } else {
      if (activeTab === 'matches') {
        navigate(`/${tab}`);
      } else {
        navigate(`/${tab}`, { replace: true });
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


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
    } else {
      localStorage.removeItem('epl_active_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && notificationsEnabled) {
      requestFCMToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email, notificationsEnabled]);

  useEffect(() => {
    if (settings?.appName) {
      document.title = settings.appName;
    }
  }, [settings?.appName]);

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

      const loadedTeams = resTeams.status === 'fulfilled' ? (resTeams.value || []).filter(Boolean) : [];
      if (resTeams.status === 'fulfilled') setTeams(loadedTeams);

      let loadedMatches = resMatches.status === 'fulfilled' ? (resMatches.value || []).filter(Boolean) : [];
      loadedMatches = loadedMatches.map(m => ({
          ...m,
          homeTeam: m.homeTeam || loadedTeams.find(t => t.id === m.homeTeamId),
          awayTeam: m.awayTeam || loadedTeams.find(t => t.id === m.awayTeamId),
      }));
      if (resMatches.status === 'fulfilled') setMatches(loadedMatches);

      if (resStandings.status === 'fulfilled') setStandings((resStandings.value || []).filter(Boolean));
      if (resPlayers.status === 'fulfilled') setPlayers((resPlayers.value || []).filter(Boolean));

      if (resStats.status === 'fulfilled') setStats(resStats.value);
      if (resNews.status === 'fulfilled') setNews((resNews.value || []).filter(Boolean));
      if (resAdmins.status === 'fulfilled') setAdmins((resAdmins.value || []).filter(Boolean));
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
  const processedNotifs = React.useRef(new Set<string>());

  useEffect(() => {
    try {
      const stored = localStorage.getItem('processedNotifs');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((id: string) => processedNotifs.current.add(id));
      }
    } catch(e) {}

    const sse = new EventSource('/api/notifications/stream');
    
    sse.onmessage = async (event) => {
      try {
        const notif = JSON.parse(event.data);
        if (!notif || !notif.id) return;

        if (processedNotifs.current.has(notif.id)) return;
        processedNotifs.current.add(notif.id);

        try {
          const arr = Array.from(processedNotifs.current).slice(-50);
          localStorage.setItem('processedNotifs', JSON.stringify(arr));
        } catch(e) {}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email]);


  
  useEffect(() => {
    loadData();

    // Safety fallback: ensure loading splash screen resolves after 1 second max
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Auto refresh live scores & notifications every 45 seconds when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadData();
      }
    }, 45000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // User Auth Deck Handlers
  const handleLogin = async (
    email: string, 
    name?: string, 
    favoriteTeamId?: string, 
    avatarUrl?: string, 
    fantasyTeamName?: string,
    password?: string
  ) => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      void Notification.requestPermission().catch(error => {
        console.warn('Unable to request notification permission:', error);
      });
    }

    // For signup, create/verify the Supabase Auth account before writing the
    // local server profile. This prevents a local account being created when
    // the email is already registered or the password is incorrect.
    if (name && isSupabaseConfigured) {
      await signupUserToSupabase(email, password, name, favoriteTeamId, avatarUrl, fantasyTeamName);
    }

    // Verify server database availability and save the user on the server
    const user = await api.loginUser(email, name, favoriteTeamId, avatarUrl, fantasyTeamName, password);

    currentUserRef.current = user;
    setCurrentUser(user);
    if (user.themePreference) setTheme(user.themePreference);
    
    // Always route directly to the Matches page (the primary Match Center) post-login
    setActiveTab('matches');
    void loadData();
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
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err: any) {
      displayToast({
        id: `err-${Date.now()}`,
        title: 'Error',
        message: err.message || 'Failed to mark notification read',
        type: 'admin_alert',
        eventType: 'Published News',
        timestamp: new Date().toISOString(),
        read: false
      }, 5000);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err: any) {
      displayToast({
        id: `err-${Date.now()}`,
        title: 'Error',
        message: err.message || 'Failed to mark all notifications read',
        type: 'admin_alert',
        eventType: 'Published News',
        timestamp: new Date().toISOString(),
        read: false
      }, 5000);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await api.clearNotifications();
      setNotifications([]);
    } catch (err: any) {
      displayToast({
        id: `err-${Date.now()}`,
        title: 'Error',
        message: err.message || 'Failed to clear notifications',
        type: 'admin_alert',
        eventType: 'Published News',
        timestamp: new Date().toISOString(),
        read: false
      }, 5000);
    }
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

  const handleToggleTheme = async (mode: ThemeMode) => {
    setTheme(mode);
    if (currentUser) {
      try {
        await handleUpdateProfile({ email: currentUser.email, themePreference: mode });
      } catch (err: any) {
        displayToast({
          id: `err-${Date.now()}`,
          title: 'Error',
          message: err.message || 'Failed to save theme preference',
          type: 'admin_alert',
          eventType: 'Published News',
          timestamp: new Date().toISOString(),
          read: false
        }, 5000);
      }
    }
  };




  const requestFCMToken = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.warn('Notification permission check skipped or failed:', e);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled && currentUser) {
      requestFCMToken();
    }
    if (currentUser) {
      try {
        await handleUpdateProfile({ email: currentUser.email, notificationsEnabled: enabled });
      } catch (err: any) {
        displayToast({
          id: `err-${Date.now()}`,
          title: 'Error',
          message: err.message || 'Failed to save notification preference',
          type: 'admin_alert',
          eventType: 'Published News',
          timestamp: new Date().toISOString(),
          read: false
        }, 5000);
      }
    }
  };

  const handleAppointAdmin = async (email: string, name: string, role: 'super_admin' | 'sub_admin' | 'news_reporter' | 'official_league' | 'OFFICIAL_LEAGUE') => {
    try {
      await api.appointAdmin({
        email,
        name,
        role,
        appointedBy: currentUser?.email || 'itzjeda10@gmail.com'
      });
      await loadData();
    } catch (err: any) {
      console.error('Appoint admin failed:', err);
      throw new Error(err.message || 'Failed to appoint admin');
    }
  };

  const handleDismissAdmin = async (email: string) => {
    try {
      await api.dismissAdmin(email);
      await loadData();
    } catch (err: any) {
      console.error('Dismiss admin failed:', err);
      throw new Error(err.message || 'Failed to dismiss admin');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updated = await api.saveSettings(newSettings);
      setSettings(updated);
      await loadData();
      return updated;
    } catch (err: any) {
      console.error('Update settings failed:', err);
      throw new Error(err.message || 'Failed to update settings');
    }
  };

  const liveMatches = matches.filter(m => m && m.status === 'Live');
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
          onOpenAuthDeck={() => openAuthDeck()}
          settings={settings}
        />

        {/* Main Content Area */}
        <main className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-safe-nav space-y-6 sm:space-y-8">
          <AdDisplay advertisements={advertisements} position="top" />
          
          {isLoading ? (
            <TabContentSkeleton tab={activeTab} isDark={isDark} />
          ) : (
            <>
              {/* TAB 1: MATCHES & LIVE DASHBOARD */}
              {activeTab === 'matches' && (
                <div className="space-y-8">
                  {/* Premium Sponsorship Banner */}
                  <SponsorshipBanner logoUrl={settings?.sponsor_logo_url || settings?.sponsorLogoUrl} tagline="Official Match Day & Live Scores Partner" />

                  {/* Today's Matches Strip */}
                  <TodayMatchesStrip
                    matches={matches}
                    onSelectMatch={(m) => setSelectedMatch(m)}
                    selectedMatchId={selectedMatch?.id}
                  />

                  {/* Matchday Score Predictor */}
                  <MatchdayPredictor
                    matches={matches}
                    currentUser={currentUser}
                    onShowToast={triggerToast}
                    onOpenAuthDeck={() => openAuthDeck()}
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

                  {/* Official Matchday Predictor & Leaderboard */}
                  <MatchdayPredictor
                    matches={matches}
                    currentUser={currentUser}
                    onShowToast={triggerToast}
                    onOpenAuthDeck={() => openAuthDeck()}
                    defaultTab="leaderboard"
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
      <TeamProfileModal teams={teams} standings={standings} players={players} matches={matches} users={users} />

      {/* Match Detail Modal Popup */}
      <MatchDetailModal matches={matches} players={players} teams={teams} isAdmin={isAdmin} currentUser={currentUser} />

      {/* Bottom Navigation Bar */}
      {activeTab !== 'admin' && activeTab !== 'fantasy' && (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#800020] border-t border-[#881337]/50 shadow-[0_-10px_30px_-10px_rgba(128,0,32,0.6)] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-2 relative">
          <button
            onClick={() => handleTabChange('matches')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'matches' ? 'text-[#800020] bg-[#FBB931] scale-110 shadow-lg font-black' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
          >
            <Radio className={`transition-all ${activeTab === 'matches' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'matches' ? 'text-[11px]' : 'text-[10px]'}`}>Matches</span>
          </button>
          <button
            onClick={() => handleTabChange('standings')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'standings' ? 'text-[#800020] bg-[#FBB931] scale-110 shadow-lg font-black' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
          >
            <Goal className={`transition-all ${activeTab === 'standings' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'standings' ? 'text-[11px]' : 'text-[10px]'}`}>League</span>
          </button>
          
          {/* Prominent Center Hero Button (For You) */}
          <div className="relative min-w-[72px] flex items-center justify-center z-50">
            <button
              onClick={() => handleTabChange('news')}
              className="flex flex-col items-center justify-center min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer group transition-all duration-300"
            >
              {/* Invisible spacer matching other icons' height to keep text perfectly aligned */}
              <div className="w-5 h-6 opacity-0 mb-2"></div>
              <span className={`font-bold tracking-wide transition-all ${activeTab === 'news' ? 'text-[#FFE3B3] text-[11px]' : 'text-white/80 group-hover:text-white text-[10px]'}`}>For You</span>
            </button>
            
            {/* The Center Button */}
            <div className="absolute top-[-28px] left-1/2 -translate-x-1/2 pointer-events-none">
              <button 
                onClick={() => handleTabChange('news')} 
                className={`pointer-events-auto flex items-center justify-center w-[62px] h-[62px] rounded-full transition-all duration-300 ${activeTab === 'news' ? 'bg-[#FBB931] text-[#800020] scale-110 shadow-[0_4px_18px_rgba(251,185,49,0.5)] border-2 border-white' : 'bg-white text-slate-800 hover:text-[#800020]'}`}
              >
                <Newspaper className={`transition-all ${activeTab === 'news' ? 'w-6 h-6' : 'w-5 h-5'}`} />
              </button>
            </div>
          </div>

          <button
            onClick={() => handleTabChange('cup')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'cup' ? 'text-[#800020] bg-[#FBB931] scale-110 shadow-lg font-black' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
          >
            <Trophy className={`transition-all ${activeTab === 'cup' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'cup' ? 'text-[11px]' : 'text-[10px]'}`}>Cup</span>
          </button>
          <button
            onClick={() => handleTabChange('fantasy')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'fantasy' ? 'text-[#800020] bg-[#FBB931] scale-110 shadow-lg font-black' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
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

      {/* Player Profile Modal Popup (Global) */}
      <PlayerProfileModal players={players} teams={teams} matches={matches} />

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
              className="w-full py-3.5 px-4 rounded-xl bg-[#800020] hover:bg-[#58061e] text-white font-bold text-sm shadow-lg hover:shadow-rose-950/30 transition-all cursor-pointer border border-rose-900/50 flex items-center justify-center gap-2"
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
