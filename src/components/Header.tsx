import React, { useState, useEffect } from 'react';
import { useURLModal } from '../hooks/useURLModal';
import { Trophy, Radio, BarChart3, Newspaper, ShieldAlert, RefreshCw, ShieldCheck, User, Sparkles, Moon, Sun, Bell, Info, Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { AdminUser, UserAccount, AppNotification, ThemeMode, AppSettings } from '../types';
import { EpeLogo } from './EpeLogo';
import { NotificationTray } from './NotificationTray';

interface HeaderProps {
  activeTab: 'matches' | 'standings' | 'news' | 'fantasy' | 'cup' | 'admin' | 'about';
  setActiveTab: (tab: 'matches' | 'standings' | 'news' | 'fantasy' | 'cup' | 'admin' | 'about') => void;
  liveCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
  currentUser: UserAccount | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearNotifications: () => void;
  onTriggerTestNotification: () => void;
  theme: ThemeMode;
  onToggleTheme: (mode: ThemeMode) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  onOpenAuthDeck: () => void;
  settings?: AppSettings | null;
}

const isPwaInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem('epl_app_installed') === 'true') {
    return true;
  }
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone) {
    localStorage.setItem('epl_app_installed', 'true');
    return true;
  }
  return false;
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  liveCount,
  onRefresh,
  isRefreshing,
  currentUser,
  isAdmin,
  isSuperAdmin,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onTriggerTestNotification,
  theme,
  onToggleTheme,
  notificationsEnabled,
  onToggleNotifications,
  onOpenAuthDeck,
  settings
}) => {
  const isDark = theme === 'dark';
  const [isInstalled, setIsInstalled] = useState<boolean>(isPwaInstalled);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { isOpen: showIosPrompt, closeModal: closeIosPrompt, openModal: openIosPrompt } = useURLModal('iosInstallPrompt');

  useEffect(() => {
    if (isPwaInstalled()) {
      setIsInstalled(true);
      return;
    }

    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      localStorage.setItem('epl_app_installed', 'true');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        localStorage.setItem('epl_app_installed', 'true');
        setIsInstalled(true);
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, []);

  const handleGetAppClick = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredPwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        localStorage.setItem('epl_app_installed', 'true');
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    } else {
      openIosPrompt();
    }
  };

  const handleConfirmInstalled = () => {
    localStorage.setItem('epl_app_installed', 'true');
    setIsInstalled(true);
    closeIosPrompt();
  };

  return (
    <header className={`shadow-2xl sticky top-0 z-40 border-b transition-colors pt-safe ${
      isDark 
        ? 'bg-gradient-to-r from-[#800020] via-[#58061e] to-[#881337] text-white border-rose-950/80' 
        : 'bg-gradient-to-r from-[#800020] via-[#6b092b] to-[#881337] text-white border-rose-900'
    }`}>
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between flex-nowrap h-16 sm:h-20 gap-2 sm:gap-4 w-full">
          {/* Logo & League Name (Left Side) */}
          <div 
            onClick={() => setActiveTab('matches')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white p-1 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-200 border-2 border-amber-400/80 shrink-0 overflow-hidden">
              <EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight text-white leading-none uppercase truncate">
                  {settings?.appName || 'EPE PREMIER LEAGUE'}
                </h1>
                <span className="hidden md:inline-block bg-amber-400/20 text-amber-300 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/40 uppercase shrink-0">
                  {settings?.seasonLabel || settings?.leagueSeason || '2026 SEASON'}
                </span>
              </div>
              <p className="text-[9px] sm:text-xs text-orange-100 font-medium tracking-wide truncate">
                Official Mobile App
              </p>
            </div>
          </div>

          {/* Right Actions Toolbar (Anchored Far Right) */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-nowrap shrink-0">
            {liveCount > 0 && (
              <div 
                onClick={() => setActiveTab('matches')}
                className="hidden sm:flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border border-red-400/50 cursor-pointer animate-pulse shadow-lg shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>{liveCount} LIVE</span>
              </div>
            )}

            {/* GET APP Download Button */}
            {!isInstalled && (
              <button
                onClick={handleGetAppClick}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 border border-amber-200 hover:brightness-110 transition-all shadow-lg cursor-pointer shrink-0"
                title="Install Epe Premier League Native App"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="uppercase tracking-wider font-extrabold hidden xs:inline">GET APP</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-orange-950/80 hover:bg-orange-900 text-orange-100 transition-colors border border-orange-800/60 flex items-center justify-center cursor-pointer shadow-sm shrink-0"
              title="Refresh Scores"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* User Profile Pill / Login Button */}
            <button
              onClick={onOpenAuthDeck}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-md border cursor-pointer shrink-0 ${
                currentUser
                  ? 'bg-slate-950 border-amber-400/80 text-amber-300 hover:border-amber-300'
                  : 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold hover:bg-amber-300'
              }`}
            >
              {currentUser ? (
                <>
                  <img 
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
                    alt={currentUser.name} 
                    className="w-5 h-5 rounded-full object-cover border border-amber-400 shrink-0"
                  />
                  <span className="hidden sm:inline max-w-[90px] truncate">{currentUser.name}</span>
                  {isAdmin && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-amber-400 text-slate-950 shrink-0">
                      {isSuperAdmin ? 'Super' : 'Admin'}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* iOS & Browser PWA Installation Instruction Modal */}
      {showIosPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
            <button 
              onClick={() => closeIosPrompt()}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#800020] to-rose-950 p-2 border border-amber-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-300 uppercase tracking-tight">Install EPL Native App</h3>
                <p className="text-xs text-slate-300">Enjoy offline access & instant live match notifications</p>
              </div>
            </div>

            <div className="space-y-3 my-5 text-sm bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <p className="text-xs text-slate-200">
                  Tap the <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 font-semibold text-amber-300"><Share className="w-3 h-3 mr-1" /> Share</span> button in your browser toolbar.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <p className="text-xs text-slate-200">
                  Scroll down and select <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-800 font-semibold text-amber-300"><PlusSquare className="w-3 h-3 mr-1" /> Add to Home Screen</span>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <p className="text-xs text-slate-200">
                  Tap <strong className="text-amber-300">Add</strong> to launch directly from your device home screen.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleConfirmInstalled}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wide hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I've Installed It</span>
              </button>
              <button
                onClick={() => closeIosPrompt()}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


