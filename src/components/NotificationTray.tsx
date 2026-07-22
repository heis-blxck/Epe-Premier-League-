import React, { useState } from 'react';
import { AppNotification, ThemeMode } from '../types';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Sparkles, 
  Goal, 
  Newspaper, 
  ShieldAlert, 
  Info, 
  Check, 
  Volume2,
  Send
} from 'lucide-react';

interface NotificationTrayProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onTriggerTestNotif: () => void;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
}

export const NotificationTray: React.FC<NotificationTrayProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onTriggerTestNotif,
  theme,
  notificationsEnabled,
  onToggleNotifications
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'match_goal' | 'news' | 'admin_alert'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const isDark = theme === 'dark';

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'match_goal':
        return <Goal className="w-4 h-4 text-emerald-400" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-blue-400" />;
      case 'admin_alert':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-lg scale-105'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
        }`}
        title="App Push Notifications"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#800020] text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-slate-950 animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slideout / Popover Notification Tray */}
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          <div 
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className={`fixed sm:absolute right-2 sm:right-0 top-16 sm:top-12 z-50 w-[calc(100vw-1rem)] sm:w-96 rounded-3xl shadow-2xl border transition-all overflow-hidden animate-fadeIn ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Tray Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-xs uppercase tracking-wider">
                  Live League Push Center
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification Permission Toggle Banner */}
            <div className="bg-gradient-to-r from-amber-400/20 via-rose-900/30 to-slate-950 p-3 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-extrabold text-[11px] text-amber-300">
                  Push Alerts: {notificationsEnabled ? 'Active' : 'Muted'}
                </span>
              </div>

              <button
                onClick={() => onToggleNotifications(!notificationsEnabled)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                  notificationsEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {notificationsEnabled ? 'Enabled' : 'Enable'}
              </button>
            </div>

            {/* Filter Tabs */}
            <div className={`px-3 py-2 border-b flex items-center gap-1 overflow-x-auto text-[11px] font-bold ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-amber-400 text-slate-950 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>

              <button
                onClick={() => setFilter('match_goal')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filter === 'match_goal'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Goals & Events
              </button>

              <button
                onClick={() => setFilter('admin_alert')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filter === 'admin_alert'
                    ? 'bg-amber-400 text-slate-950 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Admin
              </button>

              <button
                onClick={() => setFilter('news')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filter === 'news'
                    ? 'bg-blue-500 text-white font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                News
              </button>
            </div>

            {/* Notification Items List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 p-1">
              {filtered.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-slate-500">
                  <Bell className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                  <p className="text-xs font-bold">No notifications in this feed</p>
                </div>
              ) : (
                filtered.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => onMarkRead(notif.id)}
                    className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-start gap-3 my-1 ${
                      !notif.read
                        ? isDark
                          ? 'bg-slate-800/80 border border-amber-400/30'
                          : 'bg-amber-50 border border-amber-200'
                        : isDark
                        ? 'hover:bg-slate-800/40 opacity-75'
                        : 'hover:bg-slate-100 opacity-80'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-xs tracking-tight line-clamp-1">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions Footer */}
            <div className={`p-3 border-t flex items-center justify-between gap-2 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                onClick={onTriggerTestNotif}
                className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-extrabold px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                title="Send simulated live goal alert"
              >
                <Send className="w-3 h-3" />
                <span>Test Live Alert</span>
              </button>

              <div className="flex items-center gap-2 text-[10px]">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Read All</span>
                  </button>
                )}

                <button
                  onClick={onClearAll}
                  className="text-slate-400 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
