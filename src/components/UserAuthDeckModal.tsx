import React, { useState, useEffect, useRef } from 'react';
import { useURLModal } from '../hooks/useURLModal';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { UserAccount, Team, AdminUser, ThemeMode, AppSettings } from '../types';
import { VerifiedBadge } from './VerifiedBadge';
import { EpeLogo } from './EpeLogo';
import { MediaUploader } from './MediaUploader';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  User, 
  Mail, 
  Bell, 
  Moon, 
  Sun, 
  Check, 
  LogOut, 
  Sparkles, 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  UserPlus, 
  UserCheck, 
  Lock, 
  Camera, 
  Save, 
  Settings, 
  MessageSquare, 
  Send,
  Share2,
  ChevronRight,
  Trophy,
  Target,
  BarChart3,
  HelpCircle,
  Headphones,
  Star,
  Volume2,
  Trash2,
  Pencil,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Gift,
  Award,
  Users,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

import { api } from '../services/api';

interface UserAuthDeckModalProps {
  currentUser: UserAccount | null;
  teams: Team[];
  admins: AdminUser[];
  isAdmin?: boolean;
  onLogin: (email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string, fantasyTeamName?: string, password?: string) => Promise<{ pendingConfirmation: true; email: string; message: string } | void>;
  onUpdateProfile: (data: Partial<UserAccount> & { email: string }) => Promise<void>;
  onLogout: () => void;
  onDeleteAccount?: (email: string) => Promise<void>;
  onNavigateToAdmin?: () => void;
  onNavigateToTab?: (tab: string) => void;
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
  currentUser,
  teams,
  admins,
  isAdmin = false,
  onLogin,
  onUpdateProfile,
  onLogout,
  onDeleteAccount,
  onNavigateToAdmin,
  onNavigateToTab,
  theme,
  onToggleTheme,
  notificationsEnabled,
  onToggleNotifications,
  settings
}) => {
  const { isOpen, closeModal, modalData } = useURLModal<{ stage?: 'profile' | 'settings' | 'login' | 'edit_profile' | 'avatar_upload' | 'delete_confirm' | 'support' | 'signup' }>('authDeck');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const urlStage = searchParams.get('stage') || modalData?.stage;
  const validStages = ['profile', 'settings', 'login', 'edit_profile', 'avatar_upload', 'delete_confirm', 'support', 'signup'];

  const getInitialStage = () => {
    if (urlStage && validStages.includes(urlStage)) {
      return urlStage;
    }
    return !currentUser ? 'login' : 'profile';
  };

  const [viewModeState, setViewModeState] = useState(getInitialStage);

  const prevIsOpenRef = useRef(isOpen);
  const prevUrlStageRef = useRef(urlStage);
  const prevUserEmailRef = useRef(currentUser?.email);

  React.useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    const urlStageChanged = prevUrlStageRef.current !== urlStage;
    const userEmailChanged = prevUserEmailRef.current !== currentUser?.email;

    prevIsOpenRef.current = isOpen;
    prevUrlStageRef.current = urlStage;
    prevUserEmailRef.current = currentUser?.email;

    if (!isOpen) {
      if (urlStage && validStages.includes(urlStage)) {
        setViewModeState(urlStage);
      } else {
        setViewModeState(!currentUser ? 'login' : 'profile');
      }
      return;
    }

    // Modal is OPEN:
    // 1) Just opened now
    if (!wasOpen && isOpen) {
      if (urlStage && validStages.includes(urlStage)) {
        setViewModeState(urlStage);
      } else {
        setViewModeState(!currentUser ? 'login' : 'profile');
      }
      return;
    }

    // 2) Explicit stage change via URL/modalData
    if (urlStageChanged && urlStage && validStages.includes(urlStage)) {
      setViewModeState(urlStage);
      return;
    }

    // 3) Auth status change (login/logout)
    if (userEmailChanged) {
      if (!currentUser) {
        setViewModeState('login');
      } else if (viewModeState === 'login' || viewModeState === 'signup') {
        setViewModeState('profile');
      }
      return;
    }

    // DO NOT reset viewModeState on parent re-renders or background data sync!
  }, [isOpen, urlStage, currentUser?.email]);

  const viewMode = viewModeState;
  const setViewMode = (mode: string) => {
    setViewModeState(mode);
  };
  const authMode: 'signin' | 'signup' = viewMode === 'signup' ? 'signup' : 'signin';
  const setAuthMode = (mode: 'signin' | 'signup') => setViewMode(mode);

  // Audio Alerts State
  const [soundFxEnabled, setSoundFxEnabled] = useState<boolean>(() => {
    return localStorage.getItem('epl_sound_fx') !== 'false';
  });

  // Auth form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [signupAvatar, setSignupAvatar] = useState<string>(AVATAR_PRESETS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Profile management state
  const [profileName, setProfileName] = useState('');
  const [profileFantasyTeam, setProfileFantasyTeam] = useState('');
  const [profileTeam, setProfileTeam] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [showCustomAvatarUploader, setShowCustomAvatarUploader] = useState(modalData?.stage === 'avatar_upload');
  const [profileStatusMsg, setProfileStatusMsg] = useState<string | null>(null);
  const showDeleteConfirm = modalData?.stage === 'delete_confirm';
  const setShowDeleteConfirm = (val: boolean) => setViewMode(val ? 'delete_confirm' : 'settings');

  // Support & Toast state
  const [supportCategory, setSupportCategory] = useState<'Complaint' | 'Suggestion' | 'General Feedback'>('Suggestion');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const showSupportModal = isSupportOpen || viewMode === 'support' || modalData?.stage === 'support';
  const setShowSupportModal = (val: boolean) => {
    setIsSupportOpen(val);
    setViewMode(val ? 'support' : 'profile');
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isOpen: showInviteModal, closeModal: closeInviteModal, openModal: openInviteModal } = useURLModal('inviteFriends');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);
  const showShareModal = isShareModalOpen;
  const [copiedLink, setCopiedLink] = useState(false);

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileFantasyTeam(currentUser.fantasyTeamName || `${currentUser.name || 'Manager'}'s XI`);
      setProfileTeam(currentUser.favoriteTeamId || '');
      setProfileAvatar(currentUser.avatarUrl || AVATAR_PRESETS[0].url);
    } else {
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
      setStatusMsg(null);
    }
  }, [currentUser, teams]);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const toggleSoundFx = () => {
    const next = !soundFxEnabled;
    setSoundFxEnabled(next);
    localStorage.setItem('epl_sound_fx', next ? 'true' : 'false');
    triggerToast(`Audio Goal FX: ${next ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleCopyShareLink = () => {
    const shareUrl = 'https://epe-premier-league.ai.studio';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      triggerToast('App share link copied to clipboard!');
    } else {
      triggerToast('Share URL: ' + shareUrl);
    }
  };

  const checkUsernameAvailability = async (val: string) => {
    if (!val.trim()) {
      setUsernameError(null);
      return;
    }
    try {
      const res = await api.checkAvailability(val.trim());
      if (!res.usernameAvailable) {
        setUsernameError(res.usernameError || `Username '${val.trim()}' is already taken.`);
      } else {
        setUsernameError(null);
      }
    } catch (e) {
      // transient
    }
  };

  const handleCustomLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formPassword = new FormData(e.currentTarget).get('password');
    const password = typeof formPassword === 'string' ? formPassword : passwordInput;
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setStatusMsg('Please enter a valid email address.');
      return;
    }
    if (authMode === 'signup') {
      if (!nameInput.trim()) {
        setStatusMsg('Please enter a manager username.');
        return;
      }
      try {
        const availability = await api.checkAvailability(nameInput.trim());
        if (!availability.usernameAvailable) {
          setUsernameError(availability.usernameError || `Username '${nameInput.trim()}' is already taken.`);
          setStatusMsg(`Username '${nameInput.trim()}' is already taken. Please choose a different username.`);
          return;
        }
      } catch (err) {
        // continue
      }
    }
    if (!password) {
      setStatusMsg('Please enter your password.');
      return;
    }
    if (authMode === 'signup' && password.length < 6) {
      setStatusMsg('Password must be at least 6 characters long.');
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const result = await onLogin(
        emailInput.trim(), 
        authMode === 'signup' ? nameInput.trim() || undefined : undefined, 
        authMode === 'signup' ? (selectedTeam || undefined) : undefined,
        authMode === 'signup' ? signupAvatar : undefined,
        undefined,
        password
      );
      if (result && result.pendingConfirmation) {
        setStatusMsg(result.message);
        return;
      }
      if (onNavigateToTab) onNavigateToTab('matches');
      setStatusMsg('Successfully authenticated!');
      setViewMode('profile');
      closeModal();
    } catch (err: any) {
      console.error("User Auth/Signup Error:", err);
      const msgStr = err?.message || (typeof err === 'string' ? err : 'Authentication failed');
      setStatusMsg(msgStr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!currentUser || !onDeleteAccount) return;
    setIsSubmitting(true);
    try {
      await onDeleteAccount(currentUser.email);
      setShowDeleteConfirm(false);
      closeModal();
    } catch (err: any) {
      setProfileStatusMsg(err.message || 'Failed to delete account');
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
        fantasyTeamName: profileFantasyTeam.trim() || currentUser.fantasyTeamName,
        favoriteTeamId: profileTeam,
        avatarUrl: profileAvatar
      });
      setProfileStatusMsg('Profile details & avatar updated successfully!');
      setTimeout(() => {
        setViewMode('profile');
        setProfileStatusMsg(null);
      }, 1200);
    } catch (err: any) {
      setProfileStatusMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactEmail = currentUser?.email || emailInput.trim();
    if (!contactEmail) {
      setSupportStatus('Please provide a valid email address.');
      return;
    }
    if (!supportMessage.trim()) {
      setSupportStatus('Please enter your complaint or suggestion message.');
      return;
    }
    setIsSubmitting(true);
    setSupportStatus(null);
    try {
      await api.submitSupportTicket({
        email: contactEmail,
        name: currentUser?.name || nameInput.trim() || 'Visitor',
        category: supportCategory,
        message: supportMessage.trim()
      });

      // Construct mailto link to official email
      const officialEmail = "lasuitesepepremierleague@gmail.com";
      const subject = encodeURIComponent(`[EPL ${supportCategory}] Feedback from ${currentUser?.name || 'Fan'}`);
      const body = encodeURIComponent(`Name: ${currentUser?.name || nameInput || 'Fan'}\nEmail: ${contactEmail}\nCategory: ${supportCategory}\n\nMessage / Feedback:\n${supportMessage.trim()}`);
      
      // Open mail client
      window.location.href = `mailto:${officialEmail}?subject=${subject}&body=${body}`;

      setSupportStatus('Feedback submitted! Opening email app to route directly to lasuitesepepremierleague@gmail.com');
      setSupportMessage('');
    } catch (err: any) {
      setSupportStatus(err.message || 'Failed to submit support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  const isDark = theme === 'dark';
  const favClub = teams.find(t => t.id === currentUser?.favoriteTeamId);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col w-full h-full min-h-screen overflow-hidden animate-fadeIn pt-safe pb-safe px-safe ios-scroll"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full h-full flex flex-col transition-all overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative max-w-3xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-50 bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (toastTimeoutRef.current) {
                  clearTimeout(toastTimeoutRef.current);
                  toastTimeoutRef.current = null;
                }
                setToastMessage(null);
              }}
              className="text-slate-950/70 hover:text-slate-950 p-1 transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCROLLABLE BODY CONTENT CONTAINER */}
        <div className="flex-1 overflow-y-auto ios-scroll flex flex-col relative" onScroll={handleScroll}>
          {/* LAYER 1: STICKY COMPACT TOP BAR (The Top Mask) */}
          <div className="sticky top-0 z-[100] bg-gradient-to-r from-[#800020] to-[#881337] text-white px-5 py-4 border-b border-[#881337]/50 flex items-center justify-between shadow-md shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (viewMode === 'settings' || viewMode === 'edit_profile') {
                  setViewMode('profile');
                } else if (viewMode === 'avatar_upload') {
                  setViewMode('edit_profile');
                } else if (viewMode === 'delete_confirm' || viewMode === 'support') {
                  setViewMode('settings');
                } else {
                  closeModal();
                }
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black tracking-tight text-white uppercase font-sans">
              {viewMode === 'settings' ? 'Settings' : viewMode === 'edit_profile' ? 'Edit Profile' : viewMode === 'login' ? 'Authentication' : 'Profile'}
            </h2>
            <div className="flex items-center gap-2">
              {currentUser && viewMode === 'profile' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewMode('settings');
                  }}
                  className="p-2 rounded-full transition-colors cursor-pointer bg-white/10 hover:bg-white/20 text-white"
                  title="Open Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* FOLDING HERO HEADER (Layer 2 & 3) */}
          {viewMode !== 'settings' && (
            <div className="bg-gradient-to-b from-[#800020] to-[#800020] text-white shrink-0 flex flex-col items-center justify-center pt-2 pb-6 border-b border-[#881337]/50 relative z-10">
              {/* Layer 2: Avatar Row */}
              <div 
                className="flex flex-col items-center transition-opacity" 
                style={{ 
                  opacity: Math.max(0, 1 - scrollY / 60)
                }}
              >
                <div className="text-[11px] text-rose-100/90 font-medium text-center mb-3">
                  Joined: {currentUser ? '26.07.2023.' : 'Guest Visitor'}
                </div>
                <div className="relative group">
                  <img 
                    src={(viewMode === 'edit_profile' || viewMode === 'avatar_upload') ? (profileAvatar || currentUser?.avatarUrl || AVATAR_PRESETS[0].url) : (currentUser?.avatarUrl || AVATAR_PRESETS[0].url)} 
                    alt={currentUser?.name || 'Manager Avatar'}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-2xl bg-slate-900 border-4 ring-4 border-amber-400/90 ring-white/10"
                  />
                </div>
              </div>

              {/* Layer 3: Username Row */}
              <div className="mt-4 text-center flex items-center justify-center gap-2">
                {currentUser ? (
                  <h3 className="font-black text-white tracking-tight text-xl flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <VerifiedBadge role={currentUser.role} />
                  </h3>
                ) : (
                  <h3 className="font-extrabold text-white text-lg">
                    Welcome to EPL Premier League
                  </h3>
                )}
              </div>
            </div>
          )}

          <div className="p-4 space-y-4">
            
            {/* ================= 1. PROFILE VIEW ================= */}
          {currentUser && viewMode === 'profile' && (
            <div className="space-y-4">
              
              {/* Grouped Feature Options Menu Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                
                {/* Weekly Challenge */}
                <button
                  onClick={() => {
                    if (onNavigateToTab) onNavigateToTab('fantasy');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Weekly Challenge</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Leaderboards */}
                <button
                  onClick={() => {
                    if (onNavigateToTab) onNavigateToTab('standings');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Leaderboards & Standings</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* My Favorite Club */}
                {favClub && (
                  <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Favorite Club</span>
                        <span className="text-[11px] text-amber-500 font-bold">{favClub.name}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewMode('edit_profile')}
                      className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Support Section Grouped Card */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider px-2">Support</h5>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  
                  {/* Give us feedback */}
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 dark:text-violet-400 group-hover:scale-110 transition-transform">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Give us feedback</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* About Epe Premier League */}
                  <button
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab('about');
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">About Epe Premier League</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>
              </div>

            </div>
          )}

          {/* ================= 2. SETTINGS VIEW ================= */}
          {currentUser && viewMode === 'settings' && (
            <div className="space-y-4">
              
              {/* General Section */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider text-center">General</h5>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  
                  {/* Notifications */}
                  <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                        <Bell className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Notifications</span>
                    </div>
                    <button
                      onClick={() => onToggleNotifications(!notificationsEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Preferences / Theme Mode */}
                  <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Dark Mode</span>
                    </div>
                    <button
                      onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                </div>
              </div>

              {/* Account Section */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider text-center">Account</h5>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  
                  {/* Edit profile */}
                  <button
                    onClick={() => setViewMode('edit_profile')}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <Pencil className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Edit profile</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Subscription / Role */}
                  <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Role & Badges</span>
                        <span className="text-[11px] text-amber-500 font-bold uppercase flex items-center gap-1">
                          {(currentUser.role === 'official_league' || currentUser.role === 'OFFICIAL_LEAGUE' || currentUser.role === 'spokesperson')
                            ? 'Official League FA'
                            : currentUser.role === 'super_admin'
                            ? 'Super Admin'
                            : currentUser.role === 'news_reporter'
                            ? 'News Reporter'
                            : currentUser.role === 'sub_admin'
                            ? 'Sub-Admin'
                            : 'Fan'}
                          <VerifiedBadge role={currentUser.role} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Center Launcher (If Admin) */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (onNavigateToAdmin) onNavigateToAdmin();
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between bg-amber-400/10 hover:bg-amber-400/20 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <span className="text-xs sm:text-sm font-black text-amber-500 dark:text-amber-300">Launch Full Admin Center</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                </div>
              </div>

              {/* App Section */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider text-center">App</h5>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  
                  {/* Share App */}
                  <button
                    onClick={() => openShareModal()}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">Share App</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>
              </div>

              {/* Login & Account Actions Section */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider text-center">Login</h5>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  
                  {/* Sign out */}
                  <button
                    onClick={() => {
                      onLogout();
                      setViewMode('login');
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400">Sign out</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Delete account */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">Delete account</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                  </button>

                </div>

                {showDeleteConfirm && (
                  <div className="p-4 rounded-2xl bg-rose-950 border border-rose-600 space-y-3 mt-3 animate-fadeIn text-white">
                    <p className="text-xs font-bold text-rose-200">
                      Permanently delete account (<strong className="text-white">{currentUser?.email}</strong>)? All stats and fantasy teams will be erased.
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeleteAccount}
                        disabled={isSubmitting}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 text-white hover:bg-rose-500 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= 3. EDIT PROFILE VIEW ================= */}
          {currentUser && (viewMode === 'edit_profile' || viewMode === 'avatar_upload') && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">Update Profile Details</h4>

                {/* Avatar Chooser */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-500" />
                      <span>Choose Avatar</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomAvatarUploader(!showCustomAvatarUploader)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {showCustomAvatarUploader ? 'Use Preset Photos' : 'Upload Custom Photo'}
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
                            profileAvatar === av.url ? 'border-amber-400 scale-105 shadow-md' : 'border-slate-300 dark:border-slate-800 opacity-60 hover:opacity-100'
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

                {/* Display Name Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* Favorite Team Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">
                    Favorite EPL Club
                  </label>
                  <select
                    value={profileTeam}
                    onChange={(e) => setProfileTeam(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                {profileStatusMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                    {profileStatusMsg}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('profile')}
                    className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ================= 4. AUTH / LOGIN VIEW (When not logged in) ================= */}
          {(!currentUser || viewMode === 'login') && !currentUser && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              
              {/* Tab Selector: Sign In / Sign Up */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setStatusMsg(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>

              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. supporter@epeleague.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full rounded-xl pl-9 pr-4 py-3 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CoachJeda"
                        value={nameInput}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          if (usernameError) setUsernameError(null);
                        }}
                        onBlur={() => checkUsernameAvailability(nameInput)}
                        className={`w-full rounded-xl px-4 py-3 text-xs font-bold border ${
                          usernameError
                            ? 'border-rose-500 focus:ring-rose-500 text-rose-600 dark:text-rose-300'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-amber-400'
                        } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none`}
                      />
                      {usernameError ? (
                        <div className="mt-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-200 text-[11px] font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{usernameError}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-1">Unique username required across the league.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">
                        Favorite EPL Club (Optional)
                      </label>
                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full rounded-xl px-3 py-3 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      >
                        <option value="">-- None / Neutral Fan --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.shortName})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Avatar Selector */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Choose Avatar *</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCustomAvatarUploader(!showCustomAvatarUploader)}
                          className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 underline cursor-pointer"
                        >
                          {showCustomAvatarUploader ? 'Use Presets' : 'Upload Photo'}
                        </button>
                      </div>

                      {showCustomAvatarUploader ? (
                        <MediaUploader
                          currentUrl={signupAvatar}
                          onMediaSelect={(url) => setSignupAvatar(url)}
                          label="Upload Custom Profile Picture"
                          presetCategory="player_photo"
                        />
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {AVATAR_PRESETS.map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSignupAvatar(av.url)}
                              className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-transform cursor-pointer group ${
                                signupAvatar === av.url ? 'border-amber-400 scale-105 shadow-md' : 'border-slate-300 dark:border-slate-800 opacity-60 hover:opacity-100'
                              }`}
                              title={av.label}
                            >
                              <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                              {signupAvatar === av.url && (
                                <div className="absolute inset-0 bg-amber-400/40 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-slate-950 font-black" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      minLength={authMode === 'signup' ? 6 : undefined}
                      autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (statusMsg) setStatusMsg(null);
                      }}
                      className="w-full rounded-xl pl-9 pr-12 py-3 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(visible => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {authMode === 'signup' ? 'Use at least 6 characters.' : 'Enter the password linked to your account.'}
                  </p>
                </div>

                {statusMsg && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-rose-950/90 text-rose-200 border border-rose-700 text-xs font-bold flex items-start gap-2.5 animate-[shake_0.4s_ease-in-out]"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="flex-1">{statusMsg}</span>
                    <button
                      type="button"
                      onClick={() => setStatusMsg(null)}
                      aria-label="Dismiss error"
                      className="text-rose-400 hover:text-rose-200 shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#800020] hover:bg-rose-900 text-amber-300 font-black py-3.5 rounded-xl text-xs transition-all shadow-lg border border-rose-800 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === 'signin' ? 'Sign In to Account' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
        </div>
      </div>

      {/* Invite Friends Modal Popup */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 mx-auto flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Invite Squad Friends</h3>
            <p className="text-xs text-slate-300">
              Share your league link with friends to build mini-leagues and unlock exclusive fantasy chips!
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-amber-300">
              <span className="truncate">https://epe-premier-league.ai.studio</span>
              <button
                onClick={() => {
                  handleCopyShareLink();
                  closeInviteModal();
                }}
                className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 cursor-pointer shrink-0 ml-2"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => closeInviteModal()}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Support & Feedback Submission Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Support & Feedback Center</h3>
                  <p className="text-xs text-slate-400">Routes to official email: <strong className="text-amber-400">lasuitesepepremierleague@gmail.com</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSupportModal(false);
                  setSupportStatus(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSupport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 text-slate-300">Category</label>
                <select
                  value={supportCategory}
                  onChange={(e: any) => setSupportCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-bold text-amber-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="Suggestion">💡 Feature Suggestion</option>
                  <option value="Complaint">⚠️ Complaint / Bug Report</option>
                  <option value="General Feedback">💬 General Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 text-slate-300">Your Email / Contact</label>
                <input
                  type="email"
                  value={currentUser?.email || emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.email@domain.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5 text-slate-300">Message / Complaint Details</label>
                <textarea
                  rows={4}
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your complaint or feedback clearly..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-bold text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                />
              </div>

              {supportStatus && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-bold text-center">
                  {supportStatus}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#800020] hover:bg-rose-900 text-amber-300 border border-rose-800 font-black py-3 rounded-xl text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE APP POPUP MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-2xl relative space-y-4 text-center">
            <button
              onClick={() => {
                closeShareModal();
                setCopiedLink(false);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto shadow-md">
              <Share2 className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Share App</h3>
              <p className="text-xs text-slate-400 mt-1">Spread the word and invite managers to the official Epe Premier League!</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 truncate select-all">
              https://epe-premier-league.ai.studio
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={async () => {
                  const shareUrl = window.location.origin || 'https://epe-premier-league.ai.studio';
                  let shared = false;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Epe Premier League',
                        text: 'Check out the official Epe Premier League App!',
                        url: shareUrl,
                      });
                      triggerToast('Shared successfully!');
                      closeShareModal();
                      shared = true;
                    } catch (e) {
                      // Native share rejected or blocked in iframe
                    }
                  }
                  if (!shared) {
                    if (navigator.clipboard) {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setCopiedLink(true);
                        triggerToast('App link copied to clipboard!');
                        setTimeout(() => setCopiedLink(false), 2000);
                      } catch (err) {
                        triggerToast('App Link: ' + shareUrl);
                      }
                    } else {
                      triggerToast('App Link: ' + shareUrl);
                    }
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>Copy Link / Share App</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
