import React from 'react';
import { Trophy, Radio, BarChart3, Newspaper, ShieldAlert, RefreshCw, ShieldCheck, User, Sparkles, Moon, Sun, Bell } from 'lucide-react';
import { AdminUser, UserAccount, AppNotification, ThemeMode, AppSettings } from '../types';
import { EpeLogo } from './EpeLogo';
import { NotificationTray } from './NotificationTray';

interface HeaderProps {
  activeTab: 'matches' | 'standings' | 'stats' | 'news' | 'admin';
  setActiveTab: (tab: 'matches' | 'standings' | 'stats' | 'news' | 'admin') => void;
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

  return (
    <header className={`shadow-2xl sticky top-0 z-40 border-b transition-colors ${
      isDark 
        ? 'bg-[#800020] text-white border-rose-950/80' 
        : 'bg-gradient-to-r from-[#800020] via-rose-900 to-[#800020] text-white border-rose-800'
    }`}>
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & League Name */}
          <div 
            onClick={() => setActiveTab('matches')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-950 p-1 flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-200 border-2 border-amber-400/80 shrink-0 overflow-hidden">
              <EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-none uppercase">
                  {settings?.appName || 'EPE PREMIER LEAGUE'}
                </h1>
                <span className="hidden sm:inline-block bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/40 uppercase">
                  {settings?.seasonLabel || settings?.leagueSeason || '2026 SEASON'}
                </span>
              </div>
              <p className="text-xs text-rose-200/90 font-medium tracking-wide">
                Official Live Updates & Match Command Center
              </p>
            </div>
          </div>

          {/* Right Actions Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {liveCount > 0 && (
              <div 
                onClick={() => setActiveTab('matches')}
                className="flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold border border-red-400/50 cursor-pointer animate-pulse shadow-lg"
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>{liveCount} LIVE {liveCount === 1 ? 'MATCH' : 'MATCHES'}</span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-100 transition-colors border border-rose-800/60 flex items-center justify-center cursor-pointer shadow-sm"
              title="Refresh Scores"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Notification Tray */}
            <NotificationTray
              notifications={notifications}
              onMarkRead={onMarkNotificationRead}
              onMarkAllRead={onMarkAllNotificationsRead}
              onClearAll={onClearNotifications}
              onTriggerTestNotif={onTriggerTestNotification}
              theme={theme}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={onToggleNotifications}
            />

            {/* Light / Dark Mode Quick Switcher */}
            <button
              onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-100 transition-colors border border-rose-800/60 flex items-center justify-center cursor-pointer shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-amber-200" />
              )}
            </button>

            {/* User Account / Login Deck Trigger Button */}
            <button
              onClick={onOpenAuthDeck}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md border cursor-pointer ${
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
                  <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
                  {isAdmin && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-amber-400 text-slate-950">
                      {isSuperAdmin ? 'Super' : 'Admin'}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Login Deck</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 border-t border-rose-950/60">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-slate-950 text-amber-300 border border-amber-400/40 shadow-lg'
                : 'text-rose-100 hover:bg-rose-900/60'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>Matches & Live</span>
          </button>

          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'standings'
                ? 'bg-slate-950 text-amber-300 border border-amber-400/40 shadow-lg'
                : 'text-rose-100 hover:bg-rose-900/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>League Standings</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-slate-950 text-amber-300 border border-amber-400/40 shadow-lg'
                : 'text-rose-100 hover:bg-rose-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Player Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'news'
                ? 'bg-slate-950 text-amber-300 border border-amber-400/40 shadow-lg'
                : 'text-rose-100 hover:bg-rose-900/60'
            }`}
          >
            <Newspaper className="w-4 h-4 text-amber-400" />
            <span>League News</span>
          </button>

          {/* Admin Center Tab - VISIBLE IF USER HAS ADMIN ROLE */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ml-auto cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                  : 'text-amber-300 hover:bg-rose-900/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Admin Center</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


