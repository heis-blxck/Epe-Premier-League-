import React, { useState, useEffect } from 'react';
import { UserAccount, Team, AdminUser, ThemeMode, AppSettings } from '../types';
import { EpeLogo } from './EpeLogo';
import { MediaUploader } from './MediaUploader';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  User, 
  Mail, 
  Heart, 
  Bell, 
  Moon, 
  Sun, 
  Check, 
  LogOut, 
  Sparkles,
  Users,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  UserCheck,
  Lock,
  Camera,
  Newspaper,
  Save
} from 'lucide-react';

interface UserAuthDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  teams: Team[];
  admins: AdminUser[];
  isAdmin?: boolean;
  onLogin: (email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string) => Promise<void>;
  onUpdateProfile: (data: Partial<UserAccount> & { email: string }) => Promise<void>;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: (mode: ThemeMode) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: (enabled: boolean) => void;
  settings?: AppSettings | null;
}

const AVATAR_PRESETS = [
  { label: 'Star Forward', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { label: 'Midfield Ace', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { label: 'Keeper Wall', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { label: 'Solid Defender', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80' },
  { label: 'EPL Legend', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
  { label: 'Tactical Boss', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80' },
  { label: 'Ultra Fan', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' }
];

export const UserAuthDeckModal: React.FC<UserAuthDeckModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teams,
  admins,
  isAdmin = false,
  onLogin,
  onUpdateProfile,
  onLogout,
  theme,
  onToggleTheme,
  notificationsEnabled,
  onToggleNotifications,
  settings
}) => {
  const [deckTab, setDeckTab] = useState<'login' | 'profile' | 'roster'>('login');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Auth form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>(teams[0]?.id || 'team-1');
  const [signupAvatar, setSignupAvatar] = useState<string>(AVATAR_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Profile management state
  const [profileName, setProfileName] = useState('');
  const [profileTeam, setProfileTeam] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [showCustomAvatarUploader, setShowCustomAvatarUploader] = useState(false);
  const [profileStatusMsg, setProfileStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileTeam(currentUser.favoriteTeamId || teams[0]?.id || 'team-1');
      setProfileAvatar(currentUser.avatarUrl || AVATAR_PRESETS[0].url);
    }
  }, [currentUser, teams]);

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setStatusMsg('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await onLogin(
        emailInput.trim(), 
        authMode === 'signup' ? nameInput.trim() || undefined : undefined, 
        selectedTeam,
        authMode === 'signup' ? signupAvatar : undefined
      );
      setStatusMsg('Successfully authenticated!');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setStatusMsg(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setProfileStatusMsg(null);
    try {
      await onUpdateProfile({
        email: currentUser.email,
        name: profileName.trim() || currentUser.name,
        favoriteTeamId: profileTeam,
        avatarUrl: profileAvatar
      });
      setProfileStatusMsg('Profile picture & details saved successfully!');
    } catch (err: any) {
      setProfileStatusMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-xl rounded-3xl shadow-2xl border transition-all overflow-hidden ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Bar */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 p-1 border-2 border-amber-400 flex items-center justify-center shadow-lg shrink-0">
              <EpeLogo className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                EPL Portal
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Sign in, create an account, or manage your preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`px-6 pt-4 border-b flex items-center gap-2 ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/50 border-slate-200'
        }`}>
          <button
            onClick={() => setDeckTab('login')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              deckTab === 'login'
                ? 'border-amber-400 text-amber-400 bg-slate-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In / Sign Up</span>
          </button>

          {currentUser && (
            <button
              onClick={() => setDeckTab('profile')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                deckTab === 'profile'
                  ? 'border-amber-400 text-amber-400 bg-slate-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Profile & Preferences</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setDeckTab('roster')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                deckTab === 'roster'
                  ? 'border-amber-400 text-amber-400 bg-slate-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin Roster ({admins.length})</span>
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6">
          {/* TAB 1: SIGN IN / SIGN UP FORM */}
          {deckTab === 'login' && (
            <div className="space-y-6">
              {currentUser && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <img 
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} 
                      alt={currentUser.name} 
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400/80"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{currentUser.name}</span>
                        {currentUser.role === 'super_admin' && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Super Admin
                          </span>
                        )}
                        {currentUser.role === 'sub_admin' && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Sub-Admin
                          </span>
                        )}
                        {currentUser.role === 'news_reporter' && (
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                            <Newspaper className="w-3 h-3" /> News Reporter
                          </span>
                        )}
                        {currentUser.role === 'fan' && (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            EPL Supporter
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold px-3 py-2 rounded-xl text-xs border border-rose-800 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}

              {/* Clean Auth Form */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setStatusMsg(null);
                    }}
                    className={`py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'signin'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setStatusMsg(null);
                    }}
                    className={`py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>

                <form onSubmit={handleCustomLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1 text-slate-400">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="e.g. supporter@epeleague.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border ${
                          isDark 
                            ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase mb-1 text-slate-400">
                          Display Name
                        </label>
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border ${
                            isDark 
                              ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase mb-1 text-slate-400">
                          Favorite EPL Club
                        </label>
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          className={`w-full rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border ${
                            isDark ? 'bg-slate-900 border-slate-800 text-amber-300' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.shortName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1 text-slate-400">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className={`w-full rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amber-400 border ${
                          isDark 
                            ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  {statusMsg && (
                    <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold text-center">
                      {statusMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#800020] hover:bg-rose-900 text-amber-300 font-black py-3 rounded-xl text-xs transition-all shadow-lg border border-rose-800 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{authMode === 'signin' ? 'Sign In to Account' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: MY PROFILE & PREFERENCES */}
          {deckTab === 'profile' && currentUser && (
            <div className="space-y-6">
              {/* Profile Card & Details Form */}
              <form onSubmit={handleSaveProfile} className={`p-5 rounded-2xl border space-y-5 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img 
                      src={profileAvatar || currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                      alt={profileName || currentUser.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomAvatarUploader(!showCustomAvatarUploader)}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-400 text-slate-950 hover:scale-110 transition-transform shadow-lg cursor-pointer"
                      title="Change Profile Picture"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-black flex items-center gap-2">
                      {currentUser.name}
                      {currentUser.role === 'super_admin' && <Crown className="w-4 h-4 text-amber-400" />}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                        {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role === 'sub_admin' ? 'Sub-Admin' : currentUser.role === 'news_reporter' ? 'News Reporter' : 'EPL Supporter'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Picture Selector Section */}
                <div className="pt-2 border-t border-slate-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4" />
                      <span>Choose Profile Picture</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomAvatarUploader(!showCustomAvatarUploader)}
                      className="text-[11px] font-bold text-slate-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      {showCustomAvatarUploader ? 'Use Avatar Presets' : 'Upload Custom Image / URL'}
                    </button>
                  </div>

                  {showCustomAvatarUploader ? (
                    <MediaUploader
                      currentUrl={profileAvatar}
                      onMediaSelect={(url) => setProfileAvatar(url)}
                      label="Upload Custom Profile Photo"
                      presetCategory="player_photo"
                    />
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {AVATAR_PRESETS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfileAvatar(av.url)}
                          className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-transform cursor-pointer group ${
                            profileAvatar === av.url ? 'border-amber-400 scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                          title={av.label}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                          {profileAvatar === av.url && (
                            <div className="absolute inset-0 bg-amber-400/40 flex items-center justify-center">
                              <Check className="w-4 h-4 text-slate-950 font-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Editable Profile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1 text-slate-400">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your name"
                      className={`w-full rounded-xl px-3.5 py-2 text-xs font-bold border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1 text-slate-400">
                      Favorite EPL Club
                    </label>
                    <select
                      value={profileTeam}
                      onChange={(e) => setProfileTeam(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-bold border ${
                        isDark ? 'bg-slate-900 border-slate-800 text-amber-300' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.shortName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {profileStatusMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                    {profileStatusMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Changes...' : 'Save Profile Picture & Settings'}</span>
                </button>
              </form>

              {/* Theme Preference Settings */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider">Appearance Theme</h4>
                      <p className="text-xs text-slate-400">Switch between Dark Mode & High-Contrast Light Mode</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      onClick={() => onToggleTheme('dark')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark</span>
                    </button>

                    <button
                      onClick={() => onToggleTheme('light')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        theme === 'light'
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Push Notifications Toggle */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-wider">App Push Notifications</h4>
                      <p className="text-xs text-slate-400">Receive live goal scores, red cards & match alerts</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleNotifications(!notificationsEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                      notificationsEnabled
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{notificationsEnabled ? 'ON (Active)' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN ROSTER (ONLY SHOWN IF USER IS ADMIN) */}
          {deckTab === 'roster' && isAdmin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Epe Premier League Official Admin Roster
                </h3>
              </div>

              <div className="space-y-3">
                {admins.map((adm) => {
                  const isMainSuperAdmin = adm.email.toLowerCase() === 'itzjeda10@gmail.com';

                  return (
                    <div
                      key={adm.email}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                        isMainSuperAdmin
                          ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-[#800020]/40 border-amber-400/60 shadow-lg'
                          : isDark
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">{adm.name}</span>
                          {isMainSuperAdmin ? (
                            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              <Crown className="w-3 h-3" /> Founder Super Admin
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              Sub-Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{adm.email}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
