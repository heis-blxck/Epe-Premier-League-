import React, { useState } from 'react';
import { UserAccount, Team, AdminUser, ThemeMode, AppSettings } from '../types';
import { EpeLogo } from './EpeLogo';
import { 
  Mail, 
  ArrowRight,
  Shield,
  Lock,
  UserCheck,
  UserPlus,
  Sparkles,
  Heart,
  Check
} from 'lucide-react';

interface MandatoryLoginGateProps {
  teams: Team[];
  admins: AdminUser[];
  onLogin: (email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string) => Promise<void>;
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
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>(teams[0]?.id || 'team-1');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onLogin(
        emailInput.trim(), 
        authMode === 'signup' ? nameInput.trim() || undefined : undefined, 
        selectedTeam,
        authMode === 'signup' ? selectedAvatar : undefined
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#800020] selection:text-amber-300 font-sans relative overflow-hidden">
      {/* Background Decorative Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#800020]/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-3 bg-slate-900/90 border-2 border-amber-400/80 px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-slate-950 p-1 border border-amber-400 shrink-0 overflow-hidden flex items-center justify-center">
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

        {/* Clean Auth Form Container (No Shortcuts) */}
        <div className="max-w-md w-full mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
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
                    Full Name / Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Babatunde Epe"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Support Club Preference
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
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
                    Choose Profile Picture
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
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
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Password
              </label>
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

          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800/60 leading-relaxed">
            Note: Appointed league administrators are automatically recognized by email and granted admin access upon signing in.
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950/80">
        &copy; 2026 Epe Premier League &bull; Local Football Council of Epe Division
      </footer>
    </div>
  );
};
