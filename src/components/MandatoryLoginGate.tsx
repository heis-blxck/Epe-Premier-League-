import React, { useState } from 'react';
import { UserAccount, Team, AdminUser, ThemeMode, AppSettings } from '../types';
import { EpeLogo } from './EpeLogo';
import { api } from '../services/api';
import { 
  Mail, 
  ArrowRight,
  Shield,
  Lock,
  UserCheck,
  UserPlus,
  Sparkles,
  Heart,
  Check,
  Upload,
  Camera,
  KeyRound,
  Send,
  ArrowLeft
} from 'lucide-react';

interface MandatoryLoginGateProps {
  teams: Team[];
  admins: AdminUser[];
  onLogin: (email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string, fantasyTeamName?: string) => Promise<void>;
  theme: ThemeMode;
  settings?: AppSettings | null;
}

const AVATAR_PRESETS = [
  { label: 'Star Forward', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=80' },
  { label: 'Playmaker', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=80' },
  { label: 'Keeper Wall', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=80' },
  { label: 'Defender', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=180&q=80' },
  { label: 'Ultra Supporter', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=180&q=80' }
];

export const MandatoryLoginGate: React.FC<MandatoryLoginGateProps> = ({
  teams,
  admins,
  onLogin,
  theme,
  settings
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Uploaded photo must be smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (authMode === 'signup') {
      if (!nameInput.trim()) {
        setErrorMsg('Please enter a username.');
        return;
      }
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onLogin(
        emailInput.trim(), 
        authMode === 'signup' ? nameInput.trim() || undefined : undefined, 
        authMode === 'signup' ? (selectedTeam || undefined) : undefined,
        authMode === 'signup' ? selectedAvatar : undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    setForgotSuccessMsg(null);
    try {
      const res = await api.forgotPassword(emailInput.trim());
      setForgotSuccessMsg(res.message || 'Password recovery instructions and instant login link sent successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process password recovery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-viewport-height bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#800020] selection:text-amber-300 font-sans relative overflow-y-auto pt-safe pb-safe px-safe ios-scroll">
      {/* Background Decorative Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#800020]/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-3 bg-slate-900/90 border-2 border-amber-400/80 px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-white p-1 border border-amber-400 shrink-0 overflow-hidden flex items-center justify-center">
              <EpeLogo logoUrl={settings?.appLogoUrl} className="w-full h-full" />
            </div>
            <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-widest">
              {settings?.appName || 'Epe Premier League Portal'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Official <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">League Central</span> Access
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto font-medium">
            Welcome to the official digital portal for {settings?.appName || 'Epe Premier League'}. Please sign in or create an account to proceed.
          </p>
        </div>

        {/* Clean Auth Form Container */}
        <div className="max-w-md w-full mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
          
          {isForgotPassword ? (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                  <KeyRound className="w-5 h-5" />
                  <span>Password Recovery</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg(null);
                    setForgotSuccessMsg(null);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Enter your account email address below. We will instantly dispatch password recovery instructions and notify the Epe Premier League founder admin (<span className="text-amber-300 font-mono">itzjeda10@gmail.com</span>) to ensure you never lose account data.
              </p>

              {errorMsg && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl font-bold">
                  {errorMsg}
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs rounded-xl font-bold space-y-2">
                  <p>{forgotSuccessMsg}</p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await onLogin(emailInput.trim());
                      } catch (e) {}
                    }}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-2 rounded-lg text-xs cursor-pointer shadow"
                  >
                    Instantly Log In Now
                  </button>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Your Account Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. your.email@domain.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#800020] hover:bg-rose-900 text-amber-300 border border-rose-800 font-black py-3.5 rounded-xl text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Recovery Instructions...' : 'Recover Account Access'}</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Mode Tabs: Sign In / Sign Up */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl font-bold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Username / Profile Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JedaOfficial"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Your display name across match discussions and fan updates.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Favorite Epe League Club (Optional)
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        >
                          <option value="">None / Select Later</option>
                          {teams.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.shortName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Profile Picture / Upload Custom Photo
                      </label>
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                        <label 
                          className={`relative w-11 h-11 rounded-full border-2 border-dashed flex flex-col items-center justify-center shrink-0 cursor-pointer transition-all ${
                            !AVATAR_PRESETS.some(p => p.url === selectedAvatar)
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300 scale-110 shadow-lg'
                              : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                          }`}
                          title="Upload custom photo from your device"
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCustomAvatarUpload}
                            className="hidden"
                          />
                          {!AVATAR_PRESETS.some(p => p.url === selectedAvatar) && selectedAvatar ? (
                            <img src={selectedAvatar} alt="Custom upload" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </label>

                        {AVATAR_PRESETS.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAvatar(av.url)}
                            className={`relative w-11 h-11 rounded-full border-2 overflow-hidden shrink-0 transition-transform cursor-pointer ${
                              selectedAvatar === av.url ? 'border-amber-400 scale-110 shadow-lg' : 'border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                            title={av.label}
                          >
                            <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                            {selectedAvatar === av.url && (
                              <div className="absolute inset-0 bg-amber-400/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-slate-950 font-black" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      {!AVATAR_PRESETS.some(p => p.url === selectedAvatar) && selectedAvatar && (
                        <p className="text-[10px] text-amber-300 font-bold mt-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-amber-400" /> Custom profile picture selected
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase">
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMsg(null);
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#800020] via-rose-900 to-amber-700 hover:from-rose-900 hover:to-amber-600 text-amber-300 border border-amber-400/40 font-black py-3.5 rounded-xl text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Authenticating Account...</span>
                  ) : (
                    <>
                      <span>{authMode === 'signin' ? 'Sign In to Portal' : 'Create Account & Proceed'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </div>

      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950/80">
        &copy; 2026 Epe Premier League Football Association
      </footer>
    </div>
  );
};
