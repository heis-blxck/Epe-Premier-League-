import React, { useState, useEffect } from 'react';
import { Match, Team, Player, MatchPeriod, EventType, MatchEvent, LineupPlayer, AdminUser, AppSettings, MatchStats, NewsArticle } from '../types';
import { api } from '../services/api';
import { MediaUploader } from './MediaUploader';
import {
  ShieldAlert,
  Play,
  Pause,
  PlusCircle,
  Users,
  LayoutGrid,
  Newspaper,
  Database,
  Save,
  Trash2,
  Check,
  CheckCircle,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  UserPlus,
  UserX,
  Crown,
  Palette,
  Image,
  Building2,
  Edit3,
  Sliders,
  User,
  Sparkles,
  Clock,
  Send,
  Lock,
  Upload,
  Calendar,
  AlertTriangle,
  Download
} from 'lucide-react';

interface AdminDashboardProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  news?: NewsArticle[];
  onRefreshAll: () => void;
  currentUserEmail: string;
  currentAdmin: AdminUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  admins: AdminUser[];
  onAppointAdmin: (email: string, name: string, role: 'super_admin' | 'sub_admin' | 'news_reporter') => Promise<void>;
  onDismissAdmin: (email: string) => Promise<void>;
  settings?: AppSettings;
  onUpdateSettings?: (settings: Partial<AppSettings>) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  matches,
  teams,
  players,
  news = [],
  onRefreshAll,
  currentUserEmail,
  currentAdmin,
  isAdmin,
  isSuperAdmin,
  admins,
  onAppointAdmin,
  onDismissAdmin,
  settings,
  onUpdateSettings
}) => {
  const [adminTab, setAdminTab] = useState<'controller' | 'events' | 'ratings' | 'squads' | 'transfers' | 'players' | 'teams' | 'standings' | 'branding' | 'news' | 'admins' | 'fixtures'>('controller');

  const isNewsReporter = currentAdmin?.role === 'news_reporter';

  useEffect(() => {
    if (isNewsReporter) {
      setAdminTab('news');
    }
  }, [isNewsReporter]);

  // Selected Match for actions
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || '');
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. LIVE MATCH CONTROLLER & STATS STATES
  const [clockMinute, setClockMinute] = useState<number>(selectedMatch?.matchMinute || 0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [stoppage1st, setStoppage1st] = useState<number>(selectedMatch?.stoppageTime1stHalf || 2);
  const [stoppage2nd, setStoppage2nd] = useState<number>(selectedMatch?.stoppageTime2ndHalf || 4);

  // Match Detailed Stats State
  const [statsHomePossession, setStatsHomePossession] = useState<number>(selectedMatch?.stats?.homePossession || 50);
  const [statsAwayPossession, setStatsAwayPossession] = useState<number>(selectedMatch?.stats?.awayPossession || 50);
  const [statsHomeShots, setStatsHomeShots] = useState<number>(selectedMatch?.stats?.homeShots || 10);
  const [statsAwayShots, setStatsAwayShots] = useState<number>(selectedMatch?.stats?.awayShots || 8);
  const [statsHomeShotsOnTarget, setStatsHomeShotsOnTarget] = useState<number>(selectedMatch?.stats?.homeShotsOnTarget || 4);
  const [statsAwayShotsOnTarget, setStatsAwayShotsOnTarget] = useState<number>(selectedMatch?.stats?.awayShotsOnTarget || 3);
  const [statsHomeCorners, setStatsHomeCorners] = useState<number>(selectedMatch?.stats?.homeCorners || 5);
  const [statsAwayCorners, setStatsAwayCorners] = useState<number>(selectedMatch?.stats?.awayCorners || 4);
  const [statsHomeFouls, setStatsHomeFouls] = useState<number>(selectedMatch?.stats?.homeFouls || 8);
  const [statsAwayFouls, setStatsAwayFouls] = useState<number>(selectedMatch?.stats?.awayFouls || 11);

  // Live match ticker interval effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && selectedMatch) {
      interval = setInterval(() => {
        setClockMinute(m => {
          const next = m + 1;
          api.saveMatch({ id: selectedMatch.id, matchMinute: next });
          return next;
        });
      }, 3000); // ticks every 3 seconds for smooth real-time match simulation
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, selectedMatch]);

  // Sync state when selected match changes
  useEffect(() => {
    if (selectedMatch) {
      setClockMinute(selectedMatch.matchMinute || 0);
      setStoppage1st(selectedMatch.stoppageTime1stHalf || 2);
      setStoppage2nd(selectedMatch.stoppageTime2ndHalf || 4);
      const st = selectedMatch.stats || {
        homePossession: 50,
        awayPossession: 50,
        homeShots: 10,
        awayShots: 8,
        homeShotsOnTarget: 4,
        awayShotsOnTarget: 3,
        homeCorners: 5,
        awayCorners: 4,
        homeFouls: 8,
        awayFouls: 11
      };
      setStatsHomePossession(st.homePossession);
      setStatsAwayPossession(st.awayPossession);
      setStatsHomeShots(st.homeShots);
      setStatsAwayShots(st.awayShots);
      setStatsHomeShotsOnTarget(st.homeShotsOnTarget);
      setStatsAwayShotsOnTarget(st.awayShotsOnTarget);
      setStatsHomeCorners(st.homeCorners);
      setStatsAwayCorners(st.awayCorners);
      setStatsHomeFouls(st.homeFouls);
      setStatsAwayFouls(st.awayFouls);
    }
  }, [selectedMatchId, matches]);

  // 2. LIVE EVENT LOGGER STATES
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [eventTypeToLog, setEventTypeToLog] = useState<EventType>('Goal');
  const [eventTeamId, setEventTeamId] = useState<string>(selectedMatch?.homeTeamId || '');
  const [eventPlayerId, setEventPlayerId] = useState<string>('');
  const [eventCustomPlayerName, setEventCustomPlayerName] = useState<string>('');
  const [eventAssisterId, setEventAssisterId] = useState<string>('');
  const [eventSubInPlayerId, setEventSubInPlayerId] = useState<string>('');
  const [eventMinute, setEventMinute] = useState<number>(selectedMatch?.matchMinute || 1);
  const [eventDetail, setEventDetail] = useState<string>('');

  // STANDINGS OVERRIDE MAP
  const [standingsOverrideMap, setStandingsOverrideMap] = useState<Record<string, Partial<Team>>>({});

  // 3. POST-MATCH RATINGS GRID STATES
  const [ratingsState, setRatingsState] = useState<Record<string, number>>(selectedMatch?.ratings || {});

  // 4. SQUAD & FORMATION BUILDER STATES
  const [squadTeam, setSquadTeam] = useState<'home' | 'away'>('home');
  const [selectedFormation, setSelectedFormation] = useState<string>('4-3-3');
  const [startingXIPicker, setStartingXIPicker] = useState<string[]>([]);
  const [subsPicker, setSubsPicker] = useState<string[]>([]);

  // 5. INTER-TEAM TRANSFER HUB STATES
  const [transferPlayerId, setTransferPlayerId] = useState<string>(players[0]?.id || '');
  const [transferTargetTeamId, setTransferTargetTeamId] = useState<string>(teams[1]?.id || teams[0]?.id || '');
  const [transferNewShirtNumber, setTransferNewShirtNumber] = useState<number>(10);
  const [isTransferring, setIsTransferring] = useState(false);

  // 6. PLAYER PROFILES & PICTURES STATES
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerFormName, setPlayerFormName] = useState<string>('');
  const [playerFormTeamId, setPlayerFormTeamId] = useState<string>(teams[0]?.id || '');
  const [playerFormPos, setPlayerFormPos] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [playerFormShirt, setPlayerFormShirt] = useState<number>(10);
  const [playerFormPhoto, setPlayerFormPhoto] = useState<string>('');
  const [playerFormHeight, setPlayerFormHeight] = useState<string>('180 cm');
  const [playerFormWeight, setPlayerFormWeight] = useState<string>('75 kg');
  const [playerFormNationality, setPlayerFormNationality] = useState<string>('Nigeria');
  const [playerFormBio, setPlayerFormBio] = useState<string>('');
  const [playerRosterTeamFilter, setPlayerRosterTeamFilter] = useState<string>('all');
  const [deletingPlayerIdConfirm, setDeletingPlayerIdConfirm] = useState<string | null>(null);
  const [isSavingPlayer, setIsSavingPlayer] = useState<boolean>(false);

  // Helper to normalize position code cleanly
  const normalizePosition = (pos?: string): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    if (!pos) return 'MID';
    const u = pos.trim().toUpperCase();
    if (u === 'GK' || u.includes('GOAL') || u.includes('KEEP')) return 'GK';
    if (u === 'DEF' || u.includes('DEF') || u.includes('BACK') || u === 'CB' || u === 'LB' || u === 'RB') return 'DEF';
    if (u === 'FWD' || u.includes('FWD') || u.includes('FORW') || u.includes('ATT') || u === 'ST' || u === 'RW' || u === 'LW' || u.includes('STRIKE')) return 'FWD';
    if (u === 'MID' || u.includes('MID') || u.includes('CENT') || u === 'CM' || u === 'CAM' || u === 'CDM') return 'MID';
    return 'MID';
  };

  // Keep playerFormTeamId synchronized when teams arrive
  useEffect(() => {
    if (!playerFormTeamId && teams.length > 0) {
      setPlayerFormTeamId(teams[0].id);
    }
  }, [teams, playerFormTeamId]);

  // 7. TEAM MANAGEMENT STATES (SUPER ADMIN)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [deletingTeamIdConfirm, setDeletingTeamIdConfirm] = useState<string | null>(null);
  const [resetConfirming, setResetConfirming] = useState<boolean>(false);
  const [isSavingTeam, setIsSavingTeam] = useState<boolean>(false);
  const [teamFormName, setTeamFormName] = useState<string>('');
  const [teamFormShort, setTeamFormShort] = useState<string>('');
  const [teamFormLogo, setTeamFormLogo] = useState<string>('');
  const [teamFormCoach, setTeamFormCoach] = useState<string>('');
  const [teamFormStadium, setTeamFormStadium] = useState<string>('');

  // 8. BRANDING & SETTINGS STATES (SUPER ADMIN)
  const [brandAppName, setBrandAppName] = useState<string>(settings?.appName || 'Epe Premier League');
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>(settings?.appLogoUrl || '');
  const [brandColor, setBrandColor] = useState<string>(settings?.primaryColor || '#800020');
  const [brandSeason, setBrandSeason] = useState<string>(settings?.seasonLabel || '2026 Season');

  useEffect(() => {
    if (settings) {
      setBrandAppName(settings.appName);
      setBrandLogoUrl(settings.appLogoUrl);
      setBrandColor(settings.primaryColor);
      setBrandSeason(settings.seasonLabel);
    }
  }, [settings]);

  // 9. SUBSTACK NEWS PUBLISHER STATES
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsFilter, setNewsFilter] = useState<'all' | 'pending' | 'published' | 'draft'>('all');
  const [newsTitle, setNewsTitle] = useState<string>('');
  const [newsSubtitle, setNewsSubtitle] = useState<string>('');
  const [newsCoverUrl, setNewsCoverUrl] = useState<string>('');
  const [newsSummary, setNewsSummary] = useState<string>('');
  const [newsContent, setNewsContent] = useState<string>('');
  const [newsCategory, setNewsCategory] = useState<string>('Match Report');
  const [newsIssueLabel, setNewsIssueLabel] = useState<string>('EPL Dispatch');
  const [newsReadTime, setNewsReadTime] = useState<string>('3 min read');
  const [newsAuthor, setNewsAuthor] = useState<string>('Segun Samson');
  const [newsAuthorTitle, setNewsAuthorTitle] = useState<string>('Senior Football Writer');
  const [newsAuthorAvatar, setNewsAuthorAvatar] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
  const [newsIsSubstackExclusive, setNewsIsSubstackExclusive] = useState<boolean>(false);
  const [newsFeatured, setNewsFeatured] = useState<boolean>(true);

  // 10. SUB-ADMIN APPOINTMENT STATES
  const [appointEmail, setAppointEmail] = useState('');
  const [appointName, setAppointName] = useState('');
  const [appointRole, setAppointRole] = useState<'sub_admin' | 'super_admin' | 'news_reporter'>('sub_admin');
  const [isAppointing, setIsAppointing] = useState(false);

  // 11. DATA RESET CONFIRMATION STATES (SUPER ADMIN EXCLUSIVE)
  const [resetTableConfirming, setResetTableConfirming] = useState<boolean>(false);

  // 11. FIXTURES & BULK MATCH SCHEDULER STATES (FOR ALL ADMINS)
  const [fixtureFormHomeTeam, setFixtureFormHomeTeam] = useState<string>(teams[0]?.id || '');
  const [fixtureFormAwayTeam, setFixtureFormAwayTeam] = useState<string>(teams[1]?.id || '');
  const [fixtureFormMatchday, setFixtureFormMatchday] = useState<number>(1);
  const [fixtureFormDate, setFixtureFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fixtureFormTime, setFixtureFormTime] = useState<string>('16:00');
  const [fixtureFormVenue, setFixtureFormVenue] = useState<string>('');
  const [isSavingFixture, setIsSavingFixture] = useState<boolean>(false);

  // Sync fixture form team defaults when teams arrive
  useEffect(() => {
    if (!fixtureFormHomeTeam && teams.length > 0) {
      setFixtureFormHomeTeam(teams[0].id);
      if (teams.length > 1) setFixtureFormAwayTeam(teams[1].id);
    }
  }, [teams, fixtureFormHomeTeam]);

  // Bulk Upload States
  const [bulkMode, setBulkMode] = useState<'single' | 'bulk'>('single');
  const [bulkCsvText, setBulkCsvText] = useState<string>('');
  const [parsedFixtures, setParsedFixtures] = useState<Array<{
    matchday: number;
    homeTeamName: string;
    homeTeamId?: string;
    awayTeamName: string;
    awayTeamId?: string;
    date: string;
    time: string;
    venue: string;
    isValid: boolean;
    errorMsg?: string;
  }>>([]);
  const [isUploadingBulk, setIsUploadingBulk] = useState<boolean>(false);
  const [deletingMatchIdConfirm, setDeletingMatchIdConfirm] = useState<string | null>(null);
  const [fixtureFilterMatchday, setFixtureFilterMatchday] = useState<string>('all');

  // CSV/JSON Parser for Bulk Fixture Upload
  const handleParseCsv = (text: string) => {
    setBulkCsvText(text);
    if (!text.trim()) {
      setParsedFixtures([]);
      return;
    }

    try {
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const jsonData = JSON.parse(text);
        const list = Array.isArray(jsonData) ? jsonData : [jsonData];
        const parsed = list.map((item: any) => {
          const homeT = teams.find(t => 
            t.name.toLowerCase() === (item.homeTeam || item.homeTeamName || '').toLowerCase() ||
            t.shortName.toLowerCase() === (item.homeTeam || item.homeTeamName || '').toLowerCase() ||
            t.id === item.homeTeamId
          );
          const awayT = teams.find(t => 
            t.name.toLowerCase() === (item.awayTeam || item.awayTeamName || '').toLowerCase() ||
            t.shortName.toLowerCase() === (item.awayTeam || item.awayTeamName || '').toLowerCase() ||
            t.id === item.awayTeamId
          );
          
          const isValid = !!(homeT && awayT && homeT.id !== awayT.id);
          let errorMsg = undefined;
          if (!homeT) errorMsg = `Home team "${item.homeTeam || item.homeTeamName}" not found`;
          else if (!awayT) errorMsg = `Away team "${item.awayTeam || item.awayTeamName}" not found`;
          else if (homeT.id === awayT.id) errorMsg = `Home and Away team cannot be identical`;

          return {
            matchday: Number(item.matchday || 1),
            homeTeamName: item.homeTeam || item.homeTeamName || homeT?.name || 'Unknown',
            homeTeamId: homeT?.id,
            awayTeamName: item.awayTeam || item.awayTeamName || awayT?.name || 'Unknown',
            awayTeamId: awayT?.id,
            date: item.date || new Date().toISOString().split('T')[0],
            time: item.time || '16:00',
            venue: item.venue || homeT?.stadium || 'Epe Township Stadium',
            isValid,
            errorMsg
          };
        });
        setParsedFixtures(parsed);
        return;
      }

      const lines = text.trim().split('\n');
      if (lines.length === 0) {
        setParsedFixtures([]);
        return;
      }

      let startIndex = 0;
      const firstLineLower = lines[0].toLowerCase();
      if (firstLineLower.includes('home') || firstLineLower.includes('matchday') || firstLineLower.includes('team')) {
        startIndex = 1;
      }

      const parsed = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 3) continue;

        let matchday = 1;
        let homeStr = '';
        let awayStr = '';
        let dateStr = new Date().toISOString().split('T')[0];
        let timeStr = '16:00';
        let venueStr = '';

        if (!isNaN(Number(parts[0]))) {
          matchday = Number(parts[0]) || 1;
          homeStr = parts[1] || '';
          awayStr = parts[2] || '';
          if (parts[3]) dateStr = parts[3];
          if (parts[4]) timeStr = parts[4];
          if (parts[5]) venueStr = parts[5];
        } else {
          homeStr = parts[0] || '';
          awayStr = parts[1] || '';
          if (parts[2] && !isNaN(Number(parts[2]))) matchday = Number(parts[2]);
          if (parts[3]) dateStr = parts[3];
          if (parts[4]) timeStr = parts[4];
          if (parts[5]) venueStr = parts[5];
        }

        const homeT = teams.find(t => 
          t.name.toLowerCase() === homeStr.toLowerCase() ||
          t.shortName.toLowerCase() === homeStr.toLowerCase() ||
          t.id === homeStr ||
          t.name.toLowerCase().includes(homeStr.toLowerCase())
        );

        const awayT = teams.find(t => 
          t.name.toLowerCase() === awayStr.toLowerCase() ||
          t.shortName.toLowerCase() === awayStr.toLowerCase() ||
          t.id === awayStr ||
          t.name.toLowerCase().includes(awayStr.toLowerCase())
        );

        const isValid = !!(homeT && awayT && homeT.id !== awayT.id);
        let errorMsg = undefined;
        if (!homeT) errorMsg = `Home team "${homeStr}" not found`;
        else if (!awayT) errorMsg = `Away team "${awayStr}" not found`;
        else if (homeT && awayT && homeT.id === awayT.id) errorMsg = `Home and Away team cannot be identical`;

        parsed.push({
          matchday,
          homeTeamName: homeStr || homeT?.name || 'Unknown',
          homeTeamId: homeT?.id,
          awayTeamName: awayStr || awayT?.name || 'Unknown',
          awayTeamId: awayT?.id,
          date: dateStr,
          time: timeStr,
          venue: venueStr || homeT?.stadium || 'Epe Township Stadium',
          isValid,
          errorMsg
        });
      }

      setParsedFixtures(parsed);
    } catch (err: any) {
      showToast(`CSV format error: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        handleParseCsv(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCopySampleCsv = () => {
    const sample = `Matchday,HomeTeam,AwayTeam,Date,Time,Venue
1,${teams[0]?.name || 'Lagos City FC'},${teams[1]?.name || 'Epe Warriors'},2026-08-15,16:00,Epe Township Stadium
1,${teams[2]?.name || 'Ikorodu United'},${teams[3]?.name || 'Badagry Stars'},2026-08-15,18:30,Ikorodu Township Stadium
2,${teams[1]?.name || 'Epe Warriors'},${teams[2]?.name || 'Ikorodu United'},2026-08-22,16:00,Epe Township Stadium`;
    
    navigator.clipboard.writeText(sample);
    setBulkCsvText(sample);
    handleParseCsv(sample);
    showToast('Sample CSV template loaded & copied to clipboard!');
  };

  const handleSaveSingleFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixtureFormHomeTeam || !fixtureFormAwayTeam) {
      showToast('Please select both Home and Away teams');
      return;
    }
    if (fixtureFormHomeTeam === fixtureFormAwayTeam) {
      showToast('Home and Away teams must be different');
      return;
    }

    setIsSavingFixture(true);
    try {
      const homeT = teams.find(t => t.id === fixtureFormHomeTeam);
      await api.saveMatch({
        homeTeamId: fixtureFormHomeTeam,
        awayTeamId: fixtureFormAwayTeam,
        matchday: Number(fixtureFormMatchday || 1),
        date: fixtureFormDate,
        time: fixtureFormTime,
        venue: fixtureFormVenue.trim() || homeT?.stadium || 'Epe Township Stadium',
        status: 'Scheduled',
        period: 'Pre-Match',
        homeScore: 0,
        awayScore: 0,
        matchMinute: 0
      });

      showToast('New fixture scheduled successfully!');
      setFixtureFormVenue('');
      onRefreshAll();
    } catch (err: any) {
      showToast(`Error creating fixture: ${err.message || 'Failed to save fixture'}`);
    } finally {
      setIsSavingFixture(false);
    }
  };

  const handleConfirmBulkUpload = async () => {
    const validMatches = parsedFixtures.filter(f => f.isValid && f.homeTeamId && f.awayTeamId);
    if (validMatches.length === 0) {
      showToast('No valid fixtures to upload');
      return;
    }

    setIsUploadingBulk(true);
    try {
      const matchesToSave = validMatches.map(f => {
        const homeT = teams.find(t => t.id === f.homeTeamId);
        return {
          homeTeamId: f.homeTeamId!,
          awayTeamId: f.awayTeamId!,
          matchday: f.matchday,
          date: f.date,
          time: f.time,
          venue: f.venue || homeT?.stadium || 'Epe Township Stadium',
          status: 'Scheduled' as const,
          period: 'Pre-Match' as const,
          homeScore: 0,
          awayScore: 0,
          matchMinute: 0
        };
      });

      await api.saveMatchesBulk(matchesToSave);
      showToast(`Successfully uploaded and scheduled ${validMatches.length} fixtures!`);
      setBulkCsvText('');
      setParsedFixtures([]);
      onRefreshAll();
    } catch (err: any) {
      showToast(`Error uploading bulk fixtures: ${err.message}`);
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const handleDeleteFixture = async (mId: string) => {
    try {
      await api.deleteMatch(mId);
      showToast('Fixture deleted successfully!');
      setDeletingMatchIdConfirm(null);
      onRefreshAll();
    } catch (err: any) {
      showToast(`Error deleting match: ${err.message}`);
    }
  };

  // Player Photo Presets
  const photoPresets = [
    { label: 'Striker 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { label: 'Winger 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { label: 'Midfielder 3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
    { label: 'Defender 4', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80' },
    { label: 'Goalkeeper 5', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80' }
  ];

  // Helper when selecting match
  const handleSelectMatch = (mId: string) => {
    setSelectedMatchId(mId);
    const m = matches.find(match => match.id === mId);
    if (m) {
      setClockMinute(m.matchMinute);
      setEventTeamId(m.homeTeamId);
      setRatingsState(m.ratings || {});
    }
  };

  // HANDLE STATUS UPDATE
  const handleUpdateStatus = async (period: MatchPeriod) => {
    if (!selectedMatch) return;
    let status: 'Scheduled' | 'Live' | 'Half-Time' | 'Full-Time' = 'Scheduled';
    if (period === '1st Half' || period === '2nd Half') status = 'Live';
    if (period === 'Half-Time') status = 'Half-Time';
    if (period === 'Full-Time') status = 'Full-Time';

    try {
      await api.saveMatch({
        id: selectedMatch.id,
        period,
        status,
        matchMinute: clockMinute
      });
      showToast(`Match status updated to ${period}`);
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // HANDLE CLOCK SYNC
  const handleSyncClock = async () => {
    if (!selectedMatch) return;
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        matchMinute: Number(clockMinute)
      });
      showToast(`Match clock synced to ${clockMinute}'`);
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // SAVE GAME DETAILED STATISTICS
  const handleSaveMatchStats = async () => {
    if (!selectedMatch) return;
    try {
      const statsObj: MatchStats = {
        homePossession: Number(statsHomePossession),
        awayPossession: Number(statsAwayPossession),
        homeShots: Number(statsHomeShots),
        awayShots: Number(statsAwayShots),
        homeShotsOnTarget: Number(statsHomeShotsOnTarget),
        awayShotsOnTarget: Number(statsAwayShotsOnTarget),
        homeCorners: Number(statsHomeCorners),
        awayCorners: Number(statsAwayCorners),
        homeFouls: Number(statsHomeFouls),
        awayFouls: Number(statsAwayFouls)
      };

      await api.saveMatch({
        id: selectedMatch.id,
        stats: statsObj
      });
      showToast(`Match detailed statistics saved!`);
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error saving match stats: ${e.message}`);
    }
  };

  // OPEN LOG EVENT MODAL
  const handleOpenEventModal = (type: EventType) => {
    setEventTypeToLog(type);
    setEventMinute(clockMinute || selectedMatch?.matchMinute || 1);
    if (selectedMatch) {
      setEventTeamId(selectedMatch.homeTeamId);
    }
    setEventPlayerId('');
    setEventCustomPlayerName('');
    setEventAssisterId('');
    setEventSubInPlayerId('');
    setEventDetail('');
    setEventModalOpen(true);
  };

  // SUBMIT MATCH EVENT
  const handleSubmitEvent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedMatch) {
      showToast('No active match selected!');
      return;
    }

    const currentTeamId = eventTeamId || selectedMatch.homeTeamId;
    const teamPlayers = players.filter(p => p.teamId === currentTeamId);
    let mainPlayerName = '';

    if (eventPlayerId) {
      const p = teamPlayers.find(pl => pl.id === eventPlayerId) || players.find(pl => pl.id === eventPlayerId);
      if (p) mainPlayerName = p.name;
    }

    if (!mainPlayerName && eventCustomPlayerName.trim()) {
      mainPlayerName = eventCustomPlayerName.trim();
    }

    if (!mainPlayerName) {
      showToast('Please select a player or enter a player name!');
      return;
    }

    const assister = teamPlayers.find(p => p.id === eventAssisterId) || players.find(p => p.id === eventAssisterId);
    const subInPlayer = teamPlayers.find(p => p.id === eventSubInPlayerId) || players.find(p => p.id === eventSubInPlayerId);

    try {
      await api.addEvent(selectedMatch.id, {
        teamId: currentTeamId,
        playerId: eventPlayerId || `custom-${Date.now()}`,
        playerName: mainPlayerName,
        eventType: eventTypeToLog,
        minute: Number(eventMinute || clockMinute || 1),
        detail: eventDetail,
        assisterId: eventAssisterId || undefined,
        assisterName: assister?.name || undefined,
        subInPlayerId: eventSubInPlayerId || undefined,
        subInPlayerName: subInPlayer?.name || undefined
      });

      showToast(`⚽ ${eventTypeToLog} logged at ${eventMinute}'! Leaderboards & standings auto-updated.`);
      setEventModalOpen(false);
      setEventPlayerId('');
      setEventCustomPlayerName('');
      setEventAssisterId('');
      setEventSubInPlayerId('');
      setEventDetail('');
      onRefreshAll();
    } catch (err: any) {
      showToast(`Error logging event: ${err.message}`);
    }
  };

  // EXECUTE INTER-TEAM TRANSFER
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferPlayerId || !transferTargetTeamId) {
      showToast('Please select a player and destination team.');
      return;
    }

    setIsTransferring(true);
    try {
      await api.transferPlayer(transferPlayerId, transferTargetTeamId, transferNewShirtNumber);
      showToast('Inter-team transfer executed successfully!');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  // SAVE PLAYER PROFILE
  const handleSavePlayerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerFormName.trim()) {
      showToast('Please enter the player full name.');
      return;
    }
    const targetTeamId = playerFormTeamId || teams[0]?.id;
    if (!targetTeamId) {
      showToast('No team selected. Please register or select a team first.');
      return;
    }

    setIsSavingPlayer(true);
    try {
      const pData: Partial<Player> = {
        id: editingPlayerId || undefined,
        name: playerFormName.trim(),
        teamId: targetTeamId,
        position: playerFormPos,
        shirtNumber: Number(playerFormShirt) || 10,
        photoUrl: playerFormPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        height: playerFormHeight || '180 cm',
        weight: playerFormWeight || '75 kg',
        nationality: playerFormNationality || 'Nigeria',
        bio: playerFormBio || ''
      };

      await api.savePlayer(pData);
      showToast(editingPlayerId ? 'Player profile updated!' : 'New player added to team roster!');
      setEditingPlayerId(null);
      setPlayerFormName('');
      setPlayerFormShirt(10);
      setPlayerFormPos('MID');
      setPlayerFormPhoto('');
      setPlayerFormBio('');
      onRefreshAll();
    } catch (err: any) {
      showToast(`Error saving player: ${err.message || 'Failed to save player profile'}`);
    } finally {
      setIsSavingPlayer(false);
    }
  };

  // DELETE PLAYER
  const handleDeletePlayer = async (pId: string, pName: string) => {
    try {
      await api.deletePlayer(pId);
      showToast(`Player ${pName} deleted`);
      setDeletingPlayerIdConfirm(null);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete player');
    }
  };

  // SAVE TEAM
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormName.trim()) {
      showToast('Please enter the team name.');
      return;
    }

    setIsSavingTeam(true);
    try {
      await api.saveTeam({
        id: editingTeamId || undefined,
        name: teamFormName.trim(),
        shortName: teamFormShort.trim() || teamFormName.trim().slice(0, 3).toUpperCase(),
        logoUrl: teamFormLogo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80',
        coach: teamFormCoach.trim() || 'Head Coach',
        stadium: teamFormStadium.trim() || 'Epe Arena'
      });

      showToast(editingTeamId ? 'Team info updated!' : 'New team registered successfully!');
      setEditingTeamId(null);
      setTeamFormName('');
      setTeamFormShort('');
      setTeamFormLogo('');
      setTeamFormCoach('');
      setTeamFormStadium('');
      onRefreshAll();
    } catch (err: any) {
      showToast(`Error saving team: ${err.message || 'Failed to save team'}`);
    } finally {
      setIsSavingTeam(false);
    }
  };

  // DELETE TEAM
  const handleDeleteTeam = async (tId: string, tName: string) => {
    if (!isSuperAdmin) {
      showToast('Super Admin access required to delete a team');
      return;
    }
    try {
      await api.deleteTeam(tId);
      showToast(`Team ${tName} deleted permanently`);
      setDeletingTeamIdConfirm(null);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete team');
    }
  };

  // SAVE BRANDING / SETTINGS
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSettings) return;

    try {
      await onUpdateSettings({
        appName: brandAppName,
        appLogoUrl: brandLogoUrl,
        primaryColor: brandColor,
        seasonLabel: brandSeason
      });
      showToast('League app branding & icon updated!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-amber-300 font-extrabold px-5 py-3 rounded-2xl shadow-2xl border border-amber-400 flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Command Banner */}
      <div className="bg-gradient-to-r from-[#800020] via-rose-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-rose-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-300 tracking-tight flex items-center gap-2">
              EPL DATA COMMAND & GOVERNANCE
              {isSuperAdmin && <Crown className="w-4 h-4 text-amber-400" />}
            </h2>
            <p className="text-xs text-rose-200/80 font-medium">
              Match Controls, Statistics, Player Transfers, Team CRUD & App Branding
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {resetTableConfirming ? (
              <div className="flex items-center gap-2 bg-rose-950 p-2 rounded-xl border border-rose-700">
                <span className="text-[11px] font-bold text-amber-300 px-1">Reset all table standings & stats to ZERO?</span>
                <button
                  onClick={async () => {
                    await api.resetTableZero();
                    showToast('All league table data, scores & stats reset to ZERO!');
                    setResetTableConfirming(false);
                    onRefreshAll();
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Yes, Zero All Data
                </button>
                <button
                  onClick={() => setResetTableConfirming(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : resetConfirming ? (
              <div className="flex items-center gap-2 bg-rose-950 p-2 rounded-xl border border-rose-700">
                <span className="text-[11px] font-bold text-rose-200 px-1">Reset full database seed?</span>
                <button
                  onClick={async () => {
                    await api.resetDemo();
                    showToast('Database reset to initial factory seed!');
                    setResetConfirming(false);
                    onRefreshAll();
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Confirm Seed Reset
                </button>
                <button
                  onClick={() => setResetConfirming(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResetTableConfirming(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer"
                  title="Zero out all points, goals, matches played, clean sheets, and match events"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Table Data to Zero 👑</span>
                </button>

                <button
                  onClick={() => setResetConfirming(true)}
                  className="bg-rose-900/80 hover:bg-rose-800 text-rose-100 px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-700/60 flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Factory Seed Reset</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Select Match Bar (Hidden for News Reporter) */}
      {!isNewsReporter && (
        <div className="bg-slate-900/90 rounded-2xl p-4 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
          <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
            <span>Active Match Context:</span>
          </label>
          <select
            value={selectedMatchId}
            onChange={(e) => handleSelectMatch(e.target.value)}
            className="w-full sm:w-auto flex-1 bg-slate-950 border border-slate-800 font-bold text-slate-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#800020]"
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                [{m.status}] Matchday {m.matchday}: {m.homeTeam?.name} vs {m.awayTeam?.name} ({m.homeScore}-{m.awayScore})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Tabs */}
      {isNewsReporter ? (
        <div className="bg-purple-950/80 border border-purple-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-purple-100 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-purple-200">Press Officer & News Reporter Desk</h4>
              <p className="text-xs text-purple-300/80">You have dedicated access to draft, edit, and submit news dispatches. Submitted articles require Super Admin verification before going live.</p>
            </div>
          </div>
          <span className="bg-purple-800 text-purple-100 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-purple-600 shrink-0">
            Reporter Mode
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setAdminTab('controller')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'controller'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Play className="w-4 h-4 text-amber-400" />
            <span>Match Clock & Stats</span>
          </button>

          <button
            onClick={() => setAdminTab('events')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'events'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Goal & Event Logger</span>
          </button>

          <button
            onClick={() => setAdminTab('fixtures')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'fixtures'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md ring-2 ring-amber-400/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Upload Fixtures & Schedule</span>
          </button>

          <button
            onClick={() => setAdminTab('transfers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'transfers'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <span>Inter-Team Transfers</span>
          </button>

          <button
            onClick={() => setAdminTab('players')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'players'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>Player Profiles & Pictures</span>
          </button>

          <button
            onClick={() => setAdminTab('teams')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'teams'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Team Roster Management {isSuperAdmin && '👑'}</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setAdminTab('standings')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                adminTab === 'standings'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg ring-2 ring-amber-300/30'
                  : 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-400/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>League Standings Override 👑</span>
            </button>
          )}

          <button
            onClick={() => setAdminTab('branding')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'branding'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>App Icon & Branding {isSuperAdmin && '👑'}</span>
          </button>

          <button
            onClick={() => setAdminTab('news')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'news'
                ? 'bg-[#800020] text-amber-300 border border-rose-800 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Newspaper className="w-4 h-4 text-amber-400" />
            <span>News Publisher</span>
          </button>

          <button
            onClick={() => setAdminTab('admins')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              adminTab === 'admins'
                ? 'bg-amber-400 text-slate-950 font-black shadow-lg ring-2 ring-amber-300/30'
                : 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-400/30'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Admin Roster</span>
          </button>
        </div>
      )}

      {/* MODULE 1: MATCH CONTROLLER & GAME STATISTICS */}
      {adminTab === 'controller' && selectedMatch && (
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-6 backdrop-blur-sm text-slate-100">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              Live Match Controller & Game Statistics
            </h3>
            <p className="text-xs text-slate-400">
              Adjust match clock, status, and edit possession, shots, corners, and fouls stats.
            </p>
          </div>

          {/* Current Score & Real-Time Ticker Display */}
          <div className="bg-slate-950 text-white rounded-2xl p-6 text-center space-y-4 border border-slate-800 relative">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-widest">
              <span>Current Match State: {selectedMatch.period}</span>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 cursor-pointer border transition-all ${
                  isTimerRunning
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'MATCH TICKER RUNNING' : 'PAUSED'}</span>
              </button>
            </div>

            <div className="text-3xl sm:text-5xl font-mono font-black text-white">
              {selectedMatch.homeTeam?.name} <span className="text-amber-300">{selectedMatch.homeScore} - {selectedMatch.awayScore}</span> {selectedMatch.awayTeam?.name}
            </div>

            <div className="text-sm font-extrabold text-slate-300 font-mono">
              Display Time: {clockMinute >= 90 ? `90+${clockMinute - 90}'` : clockMinute >= 45 && selectedMatch.period === '1st Half' ? `45+${clockMinute - 45}'` : `${clockMinute}'`}
            </div>
          </div>

          {/* Quick Match Phase Jumps */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quick Match Phase Jump (45-min Standard + Stoppage):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <button
                onClick={() => {
                  setClockMinute(0);
                  handleUpdateStatus('1st Half');
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
              >
                ⏱️ Kickoff (0')
              </button>

              <button
                onClick={() => {
                  setClockMinute(45);
                  handleUpdateStatus('1st Half');
                }}
                className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
              >
                ⌛ 45' (+{stoppage1st}m ET)
              </button>

              <button
                onClick={() => {
                  setClockMinute(45 + stoppage1st);
                  handleUpdateStatus('Half-Time');
                  setIsTimerRunning(false);
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
              >
                ⏸️ Half-Time (HT)
              </button>

              <button
                onClick={() => {
                  setClockMinute(46);
                  handleUpdateStatus('2nd Half');
                }}
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
              >
                ⏱️ 2nd Half (46')
              </button>

              <button
                onClick={() => {
                  setClockMinute(90);
                  handleUpdateStatus('2nd Half');
                }}
                className="bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
              >
                ⌛ 90' (+{stoppage2nd}m ET)
              </button>

              <button
                onClick={() => {
                  setClockMinute(90 + stoppage2nd);
                  handleUpdateStatus('Full-Time');
                  setIsTimerRunning(false);
                }}
                className="bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 font-bold p-2.5 rounded-xl text-xs cursor-pointer"
              >
                🏁 Full-Time (FT)
              </button>
            </div>
          </div>

          {/* Stoppage Time Setter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-amber-300 uppercase block mb-1">
                1st Half Stoppage Time (+mins)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={stoppage1st}
                  onChange={(e) => setStoppage1st(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 w-24"
                />
                <span className="text-xs text-slate-400">minutes added</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-amber-300 uppercase block mb-1">
                2nd Half Stoppage Time (+mins)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={stoppage2nd}
                  onChange={(e) => setStoppage2nd(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 w-24"
                />
                <span className="text-xs text-slate-400">minutes added</span>
              </div>
            </div>
          </div>

          {/* Match Clock Sync Controls */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Match Clock Setter (Minutes):</span>
              <span className="font-mono text-base font-black text-amber-300">{clockMinute}'</span>
            </label>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="120"
                value={clockMinute}
                onChange={(e) => setClockMinute(Number(e.target.value))}
                className="flex-1 accent-[#800020] h-3 rounded-lg cursor-pointer"
              />
              <button
                onClick={() => setClockMinute(m => Math.min(120, m + 1))}
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs border border-slate-800 cursor-pointer"
              >
                +1m
              </button>
              <button
                onClick={() => setClockMinute(m => Math.min(120, m + 5))}
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs border border-slate-800 cursor-pointer"
              >
                +5m
              </button>
              <button
                onClick={handleSyncClock}
                className="bg-[#800020] hover:bg-rose-900 text-amber-300 font-extrabold px-5 py-2 rounded-xl text-xs shadow-md border border-rose-800 cursor-pointer"
              >
                Sync Clock
              </button>
            </div>
          </div>

          {/* GAME STATISTICS EDITOR SECTION */}
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4 pt-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-100">
                  Edit Game Statistics (Possession, Shots, Corners & Fouls)
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                Admin Privilege
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Possession Stats */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-300 uppercase flex justify-between">
                  <span>Ball Possession %</span>
                  <span>{statsHomePossession}% - {statsAwayPossession}%</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {selectedMatch.homeTeam?.shortName} Home %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={statsHomePossession}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStatsHomePossession(val);
                        setStatsAwayPossession(Math.max(0, 100 - val));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {selectedMatch.awayTeam?.shortName} Away %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={statsAwayPossession}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStatsAwayPossession(val);
                        setStatsHomePossession(Math.max(0, 100 - val));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Total Shots Stats */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-300 uppercase">
                  Total Shots
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {selectedMatch.homeTeam?.shortName} Home Shots
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={statsHomeShots}
                      onChange={(e) => setStatsHomeShots(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {selectedMatch.awayTeam?.shortName} Away Shots
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={statsAwayShots}
                      onChange={(e) => setStatsAwayShots(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Shots on Target */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-300 uppercase">
                  Shots on Target
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {selectedMatch.homeTeam?.shortName} Home On Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={statsHomeShotsOnTarget}
                      onChange={(e) => setStatsHomeShotsOnTarget(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {selectedMatch.awayTeam?.shortName} Away On Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={statsAwayShotsOnTarget}
                      onChange={(e) => setStatsAwayShotsOnTarget(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Corners & Fouls */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-300 uppercase">
                  Corners & Fouls
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      Corners (H / A)
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={statsHomeCorners}
                        onChange={(e) => setStatsHomeCorners(Number(e.target.value))}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-100"
                      />
                      <input
                        type="number"
                        value={statsAwayCorners}
                        onChange={(e) => setStatsAwayCorners(Number(e.target.value))}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      Fouls (H / A)
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={statsHomeFouls}
                        onChange={(e) => setStatsHomeFouls(Number(e.target.value))}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-100"
                      />
                      <input
                        type="number"
                        value={statsAwayFouls}
                        onChange={(e) => setStatsAwayFouls(Number(e.target.value))}
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveMatchStats}
              className="w-full bg-gradient-to-r from-[#800020] via-rose-900 to-amber-700 text-amber-300 font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-amber-400/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Game Statistics to Match Data</span>
            </button>
          </div>
        </div>
      )}

      {/* MODULE 2: GOAL & EVENT LOGGER */}
      {adminTab === 'events' && selectedMatch && (
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>Live Event Logger & Match Ticker</span>
                <span className="bg-[#800020] text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Matchday {selectedMatch.matchday}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Log goals, assists, yellow/red cards, and substitutions. Scores, goal difference, clean sheets, and player leaderboards automatically update in real-time!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                {selectedMatch.homeTeam?.shortName || 'HOME'} {selectedMatch.homeScore} - {selectedMatch.awayScore} {selectedMatch.awayTeam?.shortName || 'AWAY'} ({clockMinute}')
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <button
              onClick={() => handleOpenEventModal('Goal')}
              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-emerald-400/30"
            >
              <span className="text-2xl">⚽</span>
              <span>GOAL</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Penalty Goal')}
              className="p-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-teal-400/30"
            >
              <span className="text-2xl">🎯</span>
              <span>PENALTY</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Own Goal')}
              className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-purple-400/30"
            >
              <span className="text-2xl">⚠️</span>
              <span>OWN GOAL</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Yellow Card')}
              className="p-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-amber-500/30"
            >
              <span className="text-2xl">🟨</span>
              <span>YELLOW CARD</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Red Card')}
              className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-rose-400/30"
            >
              <span className="text-2xl">🟥</span>
              <span>RED CARD</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Sub')}
              className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-blue-400/30"
            >
              <span className="text-2xl">🔄</span>
              <span>SUB</span>
            </button>
          </div>

          {/* INLINE EVENT LOGGING FORM */}
          <form onSubmit={handleSubmitEvent} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Direct Sideline Event Entry
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Event: <strong className="text-white">{eventTypeToLog}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Event Type Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Event Category
                </label>
                <select
                  value={eventTypeToLog}
                  onChange={(e) => setEventTypeToLog(e.target.value as EventType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300"
                >
                  <option value="Goal">⚽ Goal</option>
                  <option value="Penalty Goal">🎯 Penalty Goal</option>
                  <option value="Own Goal">⚠️ Own Goal</option>
                  <option value="Yellow Card">🟨 Yellow Card</option>
                  <option value="Red Card">🟥 Red Card</option>
                  <option value="Sub">🔄 Substitution</option>
                </select>
              </div>

              {/* Team Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Team
                </label>
                <select
                  value={eventTeamId || selectedMatch.homeTeamId}
                  onChange={(e) => {
                    setEventTeamId(e.target.value);
                    setEventPlayerId('');
                    setEventAssisterId('');
                    setEventSubInPlayerId('');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                >
                  <option value={selectedMatch.homeTeamId}>
                    {selectedMatch.homeTeam?.name} (Home)
                  </option>
                  <option value={selectedMatch.awayTeamId}>
                    {selectedMatch.awayTeam?.name} (Away)
                  </option>
                </select>
              </div>

              {/* Minute Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Match Minute (')
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={eventMinute}
                  onChange={(e) => setEventMinute(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                />
              </div>

              {/* Main Player Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Primary Player
                </label>
                <select
                  value={eventPlayerId}
                  onChange={(e) => setEventPlayerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                >
                  <option value="">-- Select Team Player --</option>
                  {players
                    .filter(p => p.teamId === (eventTeamId || selectedMatch.homeTeamId))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.shirtNumber} {p.name} ({p.position})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Custom Player Name Fallback (if not in team list) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Or Custom Player Name (if not listed above)
              </label>
              <input
                type="text"
                placeholder="e.g. Victor Osimhen"
                value={eventCustomPlayerName}
                onChange={(e) => setEventCustomPlayerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200"
              />
            </div>

            {/* Secondary Player (Assist or Sub In) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(eventTypeToLog === 'Goal' || eventTypeToLog === 'Penalty Goal') && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Assist Player (Optional)
                  </label>
                  <select
                    value={eventAssisterId}
                    onChange={(e) => setEventAssisterId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                  >
                    <option value="">-- No Assist / Unassisted --</option>
                    {players
                      .filter(p => p.teamId === (eventTeamId || selectedMatch.homeTeamId) && p.id !== eventPlayerId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.shirtNumber} {p.name} ({p.position})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {eventTypeToLog === 'Sub' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Player Coming ON (Sub In)
                  </label>
                  <select
                    value={eventSubInPlayerId}
                    onChange={(e) => setEventSubInPlayerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400"
                  >
                    <option value="">-- Select Sub In Player --</option>
                    {players
                      .filter(p => p.teamId === (eventTeamId || selectedMatch.homeTeamId) && p.id !== eventPlayerId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.shirtNumber} {p.name} ({p.position})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Event Notes / Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Freekick into top corner / Tactical foul on counter attack"
                  value={eventDetail}
                  onChange={(e) => setEventDetail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-[#800020] hover:brightness-110 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>LOG {eventTypeToLog.toUpperCase()} & UPDATE LEAGUE TABLE</span>
            </button>
          </form>

          {/* Recorded Events List */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Recorded Events in this Match ({selectedMatch.events?.length || 0})</span>
              <span className="text-slate-500 text-[11px]">Click delete icon to retract event</span>
            </h4>

            {(!selectedMatch.events || selectedMatch.events.length === 0) ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 text-center italic">
                No events logged yet for this match. Use the buttons above to record match action!
              </div>
            ) : (
              selectedMatch.events.map(evt => (
                <div key={evt.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="bg-[#800020] text-amber-300 font-mono px-2 py-0.5 rounded-md text-[10px]">
                      {evt.minute}'
                    </span>
                    <span className="text-amber-400">{evt.eventType}:</span>
                    <span className="text-white">{evt.playerName}</span>
                    {evt.assisterName && <span className="text-slate-400 font-normal">(Assist: {evt.assisterName})</span>}
                    {evt.subInPlayerName && <span className="text-emerald-400 font-normal">(In: {evt.subInPlayerName})</span>}
                    {evt.detail && <span className="text-slate-500 italic text-[11px]">- {evt.detail}</span>}
                  </div>

                  <button
                    onClick={async () => {
                      await api.deleteEvent(selectedMatch.id, evt.id);
                      showToast('Event removed & match recalculated');
                      onRefreshAll();
                    }}
                    className="text-rose-400 hover:text-rose-200 p-1 cursor-pointer"
                    title="Remove Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODULE 3: INTER-TEAM TRANSFER HUB */}
      {adminTab === 'transfers' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
            <ArrowRightLeft className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-xl font-black text-slate-100">
                Inter-Team Transfer Portal
              </h3>
              <p className="text-xs text-slate-400">
                Permits instant transfer of players between teams at any time. Broadcasts transfer news automatically.
              </p>
            </div>
          </div>

          <form onSubmit={handleExecuteTransfer} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Select Player to Transfer *
                </label>
                <select
                  value={transferPlayerId}
                  onChange={(e) => setTransferPlayerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-amber-300 focus:ring-2 focus:ring-emerald-400"
                >
                  {players.map(p => {
                    const currentTeam = teams.find(t => t.id === p.teamId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (#{p.shirtNumber} - {p.position}) [{currentTeam?.shortName || 'Free Agent'}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Destination Team *
                </label>
                <select
                  value={transferTargetTeamId}
                  onChange={(e) => setTransferTargetTeamId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-emerald-300 focus:ring-2 focus:ring-emerald-400"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shortName}) - Coach: {t.coach}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  New Squad Shirt Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={transferNewShirtNumber}
                  onChange={(e) => setTransferNewShirtNumber(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isTransferring}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ArrowRightLeft className="w-5 h-5" />
              <span>{isTransferring ? 'Processing Transfer...' : 'Complete Inter-Team Transfer'}</span>
            </button>
          </form>
        </div>
      )}

      {/* MODULE 4: PLAYER PROFILES & PICTURES */}
      {adminTab === 'players' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                Player Profiles & Pictures Roster
              </h3>
              <p className="text-xs text-slate-400">
                Upload player profiles, photos, height, weight, preferred foot, and editing access.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Player Form */}
            <form onSubmit={handleSavePlayerProfile} className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-black text-sm uppercase text-amber-300 border-b border-slate-800 pb-2">
                {editingPlayerId ? 'Edit Player Profile' : 'Add New Player Profile'}
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Player Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victor Osimhen"
                  value={playerFormName}
                  onChange={(e) => setPlayerFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team *</label>
                  <select
                    value={playerFormTeamId}
                    onChange={(e) => setPlayerFormTeamId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300 cursor-pointer"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Position *</label>
                  <select
                    value={playerFormPos}
                    onChange={(e) => setPlayerFormPos(e.target.value as 'GK' | 'DEF' | 'MID' | 'FWD')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-100 cursor-pointer focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="GK">GK (Goalkeeper)</option>
                    <option value="DEF">DEF (Defender)</option>
                    <option value="MID">MID (Midfielder)</option>
                    <option value="FWD">FWD (Forward)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jersey / Shirt # *</label>
                <input
                  type="number"
                  value={playerFormShirt}
                  onChange={(e) => setPlayerFormShirt(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Player Profile Photo (Media Upload or Preset)</label>
                <MediaUploader
                  currentUrl={playerFormPhoto}
                  onSelectUrl={(url) => setPlayerFormPhoto(url)}
                  label="Upload Player Photo"
                  presets={photoPresets}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Short Player Bio</label>
                <textarea
                  rows={2}
                  placeholder="Key player background and highlights..."
                  value={playerFormBio}
                  onChange={(e) => setPlayerFormBio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingPlayer}
                  className="flex-1 bg-[#800020] hover:bg-rose-900 disabled:opacity-50 text-amber-300 font-black py-3 rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingPlayer ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <span>{editingPlayerId ? 'Save Changes' : 'Add Player Profile'}</span>
                  )}
                </button>
                {editingPlayerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlayerId(null);
                      setPlayerFormName('');
                      setPlayerFormShirt(10);
                      setPlayerFormPos('MID');
                      setPlayerFormPhoto('');
                      setPlayerFormBio('');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Players List */}
            <div className="lg:col-span-7 space-y-3">
              {/* Team Filter Bar */}
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Filter Roster by Club:</span>
                <select
                  value={playerRosterTeamFilter}
                  onChange={(e) => setPlayerRosterTeamFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 cursor-pointer"
                >
                  <option value="all">All Teams ({players.length} players)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {players
                  .filter(p => playerRosterTeamFilter === 'all' || p.teamId === playerRosterTeamFilter)
                  .map(p => {
                    const team = teams.find(t => t.id === p.teamId);
                    return (
                      <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={p.photoUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                          <div>
                            <div className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                              <span>{p.name}</span>
                              <span className="text-amber-400 font-mono text-xs">#{p.shirtNumber}</span>
                              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">{p.position}</span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              {team?.name || 'Unassigned'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlayerId(p.id);
                              setPlayerFormName(p.name);
                              setPlayerFormTeamId(p.teamId);
                              setPlayerFormPos(normalizePosition(p.position));
                              setPlayerFormShirt(p.shirtNumber);
                              setPlayerFormPhoto(p.photoUrl);
                              setPlayerFormBio(p.bio || '');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-amber-300 p-2 rounded-xl border border-slate-800 cursor-pointer"
                            title="Edit Player"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {deletingPlayerIdConfirm === p.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-950 p-1.5 rounded-xl border border-rose-800">
                              <button
                                type="button"
                                onClick={() => handleDeletePlayer(p.id, p.name)}
                                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingPlayerIdConfirm(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingPlayerIdConfirm(p.id)}
                              className="bg-rose-950 hover:bg-rose-900 text-rose-300 p-2 rounded-xl border border-rose-800 cursor-pointer"
                              title="Delete Player"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: SUPER ADMIN TEAM MANAGEMENT */}
      {adminTab === 'teams' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-xl font-black text-slate-100">
                  Team Roster & Info Management {isSuperAdmin ? '(Super Admin)' : '(Read Only)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Add, edit, and delete teams. Super Admin holds sole deletion authority.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Team Form */}
            {isAdmin ? (
              <form onSubmit={handleSaveTeam} className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-black text-sm uppercase text-amber-300">
                    {editingTeamId ? 'Edit Team Details' : 'Register New Team'}
                  </h4>
                  {editingTeamId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(null);
                        setTeamFormName('');
                        setTeamFormShort('');
                        setTeamFormLogo('');
                        setTeamFormCoach('');
                        setTeamFormStadium('');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Epe United FC"
                    value={teamFormName}
                    onChange={(e) => setTeamFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Short Code</label>
                    <input
                      type="text"
                      placeholder="e.g. EPU"
                      value={teamFormShort}
                      onChange={(e) => setTeamFormShort(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Head Coach</label>
                    <input
                      type="text"
                      placeholder="e.g. Samson Samson"
                      value={teamFormCoach}
                      onChange={(e) => setTeamFormCoach(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Home Stadium</label>
                  <input
                    type="text"
                    placeholder="e.g. Epe Township Stadium"
                    value={teamFormStadium}
                    onChange={(e) => setTeamFormStadium(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Team Crest Badge Logo (Media Upload)</label>
                  <MediaUploader
                    currentUrl={teamFormLogo}
                    onSelectUrl={(url) => setTeamFormLogo(url)}
                    label="Upload Team Crest Logo"
                    presetCategory="team_crest"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingTeam}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingTeam ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingTeamId ? 'Update Team Info' : 'Create Team'}</span>
                    )}
                  </button>
                  {editingTeamId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(null);
                        setTeamFormName('');
                        setTeamFormShort('');
                        setTeamFormLogo('');
                        setTeamFormCoach('');
                        setTeamFormStadium('');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="lg:col-span-5 p-6 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <p>
                  Administrator privileges required to register or manage league teams.
                </p>
              </div>
            )}

            {/* Teams Roster Grid */}
            <div className="lg:col-span-7 space-y-3">
              {teams.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={t.logoUrl} alt={t.name} className="w-12 h-12 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800" />
                    <div>
                      <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-amber-400 font-mono text-xs">({t.shortName})</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Coach: {t.coach} &bull; Stadium: {t.stadium}
                      </div>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeamId(t.id);
                          setTeamFormName(t.name);
                          setTeamFormShort(t.shortName);
                          setTeamFormLogo(t.logoUrl);
                          setTeamFormCoach(t.coach);
                          setTeamFormStadium(t.stadium);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-amber-300 p-2 rounded-xl border border-slate-800 cursor-pointer"
                        title="Edit Team"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {deletingTeamIdConfirm === t.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-950 p-1.5 rounded-xl border border-rose-800">
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(t.id, t.name)}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeamIdConfirm(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingTeamIdConfirm(t.id)}
                          className="bg-rose-950 hover:bg-rose-900 text-rose-300 p-2 rounded-xl border border-rose-800 cursor-pointer"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 6: BRANDING & APP ICON (SUPER ADMIN) */}
      {adminTab === 'branding' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-xl font-black text-slate-100">
                League Branding, App Logo & Theme Controls
              </h3>
              <p className="text-xs text-slate-400">
                Grant Super Admin access to customize the app title, logo icon, primary theme color, and season label.
              </p>
            </div>
          </div>

          {isSuperAdmin ? (
            <form onSubmit={handleSaveBranding} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Application Name
                  </label>
                  <input
                    type="text"
                    required
                    value={brandAppName}
                    onChange={(e) => setBrandAppName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    League Season Label
                  </label>
                  <input
                    type="text"
                    value={brandSeason}
                    onChange={(e) => setBrandSeason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-amber-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  App Badge Icon & Logo (Digital Media Upload)
                </label>
                <MediaUploader
                  currentUrl={brandLogoUrl}
                  onSelectUrl={(url) => setBrandLogoUrl(url)}
                  label="Upload App Icon / Crest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { label: 'Burgundy Maroon', hex: '#800020' },
                    { label: 'Royal Navy', hex: '#1e3a8a' },
                    { label: 'Deep Gold', hex: '#b45309' },
                    { label: 'Emerald Green', hex: '#065f46' }
                  ].map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setBrandColor(c.hex)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border flex items-center gap-2 ${
                        brandColor === c.hex ? 'ring-2 ring-amber-400 border-white' : 'border-slate-800 bg-slate-900'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: c.hex }}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>Save League Branding & App Settings</span>
              </button>
            </form>
          ) : (
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <Crown className="w-6 h-6 text-amber-400" />
              <p>
                Only the Super Admin (<strong className="text-amber-300">itzjeda10@gmail.com</strong>) has access to modify the application logo, theme colors, and season branding settings.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODULE 7: SUBSTACK NEWS PUBLISHER STUDIO & GOVERNANCE CONSOLE */}
      {adminTab === 'news' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-8 text-slate-100">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-100 font-serif flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-amber-400" />
                Substack Article & Dispatch Publishing Studio
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Draft, edit, verify, and publish Substack-formatted league news, tactical reports, and matchday dispatches.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSuperAdmin ? (
                <span className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 border border-amber-300">
                  <Crown className="w-4 h-4" />
                  Super Admin Governance
                </span>
              ) : (
                <span className="bg-purple-900/90 text-purple-200 font-bold text-xs px-3.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 border border-purple-700">
                  Press Officer Desk
                </span>
              )}
            </div>
          </div>

          {/* Form Header / Editing Notice */}
          {editingNewsId && (
            <div className="bg-amber-950/80 border border-amber-700/80 p-3.5 rounded-2xl flex items-center justify-between text-amber-200 text-xs font-bold">
              <span className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Editing existing article dispatch.
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingNewsId(null);
                  setNewsTitle('');
                  setNewsSubtitle('');
                  setNewsSummary('');
                  setNewsContent('');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-3 py-1 rounded-xl cursor-pointer"
              >
                Cancel Edit (Create New)
              </button>
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newsTitle || !newsContent) return;
            try {
              const defaultStatus = isSuperAdmin ? 'published' : 'pending_approval';
              const defaultPublished = isSuperAdmin ? true : false;

              await api.saveNews({
                ...(editingNewsId ? { id: editingNewsId } : {}),
                title: newsTitle,
                subtitle: newsSubtitle,
                summary: newsSummary || newsContent.slice(0, 140),
                content: newsContent,
                coverImage: newsCoverUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
                category: newsCategory,
                issueLabel: newsIssueLabel || 'EPL Dispatch',
                readTime: newsReadTime || '3 min read',
                author: newsAuthor || (currentAdmin?.name || 'Segun Samson'),
                authorTitle: newsAuthorTitle || 'Senior Football Writer',
                authorAvatar: newsAuthorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                isSubstackExclusive: newsIsSubstackExclusive,
                featured: newsFeatured,
                status: defaultStatus,
                isPublished: defaultPublished,
                authorRole: currentAdmin?.role || 'news_reporter'
              });

              if (isSuperAdmin) {
                showToast('Article published live to news feed!');
              } else {
                showToast('Article submitted! Sent to Super Admin for verification before going live.');
              }

              setEditingNewsId(null);
              setNewsTitle('');
              setNewsSubtitle('');
              setNewsSummary('');
              setNewsContent('');
              onRefreshAll();
            } catch (err: any) {
              showToast(err.message);
            }
          }} className="space-y-5 bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Dispatch Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tactical Breakdown: Epe United vs Lagos West..."
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-100 focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Subtitle / Sub-Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. How high pressing shaped the matchday thriller..."
                  value={newsSubtitle}
                  onChange={(e) => setNewsSubtitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Category</label>
                <select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300"
                >
                  <option value="Match Report">Match Report</option>
                  <option value="Scouting Dispatch">Scouting Dispatch</option>
                  <option value="Tactical Breakdown">Tactical Breakdown</option>
                  <option value="Transfer News">Transfer News</option>
                  <option value="Executive Statement">Executive Statement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Issue Tagline / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Issue #15 &bull; Matchday Special"
                  value={newsIssueLabel}
                  onChange={(e) => setNewsIssueLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Read Time Estimate</label>
                <input
                  type="text"
                  placeholder="e.g. 4 min read"
                  value={newsReadTime}
                  onChange={(e) => setNewsReadTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                />
              </div>
            </div>

            {/* Author Details & Avatar Upload */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Substack Author Name</label>
                <input
                  type="text"
                  value={newsAuthor}
                  onChange={(e) => setNewsAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Author Title / Designation</label>
                <input
                  type="text"
                  value={newsAuthorTitle}
                  onChange={(e) => setNewsAuthorTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">Author Avatar Upload</label>
                <MediaUploader
                  currentUrl={newsAuthorAvatar}
                  onSelectUrl={(url) => setNewsAuthorAvatar(url)}
                  label="Upload Avatar"
                />
              </div>
            </div>

            {/* Article Cover Art Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Article Cover Image Art (Media Upload)
              </label>
              <MediaUploader
                currentUrl={newsCoverUrl}
                onSelectUrl={(url) => setNewsCoverUrl(url)}
                label="Upload Article Cover Art"
              />
            </div>

            {/* Summary Brief */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Dispatch Summary Teaser
              </label>
              <textarea
                rows={2}
                placeholder="Key takeaways or summary snippet..."
                value={newsSummary}
                onChange={(e) => setNewsSummary(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
              />
            </div>

            {/* Full Story Content */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Full Substack Dispatch Content *
              </label>
              <textarea
                rows={7}
                required
                placeholder="Write the full Substack article dispatch story..."
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-serif text-slate-100 leading-relaxed"
              />
            </div>

            {/* Checkbox Toggles */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={newsIsSubstackExclusive}
                  onChange={(e) => setNewsIsSubstackExclusive(e.target.checked)}
                  className="rounded text-[#800020] accent-[#800020]"
                />
                <span>Mark as Substack Subscriber Exclusive</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={newsFeatured}
                  onChange={(e) => setNewsFeatured(e.target.checked)}
                  className="rounded text-[#800020] accent-[#800020]"
                />
                <span>Set as Featured Dispatch Hero</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#800020] hover:bg-rose-900 text-amber-300 font-black py-4 rounded-xl text-xs uppercase tracking-wider shadow-xl cursor-pointer flex items-center justify-center gap-2 border border-rose-800"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSuperAdmin
                  ? (editingNewsId ? 'Update & Publish Dispatch Live' : 'Publish Substack Dispatch Live')
                  : (editingNewsId ? 'Update & Submit for Super Admin Approval' : 'Submit Dispatch for Super Admin Verification')}
              </span>
            </button>
          </form>

          {/* PUBLICATION GOVERNANCE & VERIFICATION CONSOLE */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Publication Verification & Dispatch Management ({news.length})
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Super Admin has sole authority to verify submitted reporter dispatches before going live or delete publications.
                </p>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setNewsFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    newsFilter === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  All ({news.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNewsFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    newsFilter === 'pending' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-900 text-amber-300'
                  }`}
                >
                  Pending Approval ({news.filter(n => n.status === 'pending_approval' || (!n.isPublished && n.status !== 'draft')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setNewsFilter('published')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    newsFilter === 'published' ? 'bg-emerald-500 text-white font-black' : 'bg-slate-900 text-emerald-400'
                  }`}
                >
                  Published ({news.filter(n => n.status === 'published' || n.isPublished).length})
                </button>
              </div>
            </div>

            {/* Article Cards Grid */}
            <div className="space-y-4">
              {news
                .filter(item => {
                  if (newsFilter === 'pending') return item.status === 'pending_approval' || (!item.isPublished && item.status !== 'draft');
                  if (newsFilter === 'published') return item.status === 'published' || item.isPublished;
                  if (newsFilter === 'draft') return item.status === 'draft';
                  return true;
                })
                .map(item => {
                  const isLive = item.status === 'published' || item.isPublished;
                  const isPending = item.status === 'pending_approval' || (!item.isPublished && item.status !== 'draft');

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {item.coverImage && (
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded-md border border-amber-800">
                              {item.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.issueLabel} &bull; {item.readTime}
                            </span>
                            {/* STATUS BADGES */}
                            {isLive ? (
                              <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Published Live
                              </span>
                            ) : isPending ? (
                              <span className="bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                Pending Super Admin Approval
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                                Draft
                              </span>
                            )}
                          </div>

                          <h5 className="text-sm font-bold text-slate-100 line-clamp-1">{item.title}</h5>
                          <p className="text-xs text-slate-400 line-clamp-1">{item.summary || item.subtitle}</p>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                            <span>Author: <strong className="text-slate-200">{item.author}</strong></span>
                            <span>&bull;</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS BAR */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {/* SUPER ADMIN APPROVAL / VERIFICATION BUTTON */}
                        {isSuperAdmin && (
                          <>
                            {!isLive ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await api.saveNews({
                                      ...item,
                                      status: 'published',
                                      isPublished: true
                                    });
                                    showToast('Publication verified and published live!');
                                    onRefreshAll();
                                  } catch (err: any) {
                                    showToast(err.message);
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3.5 py-2 rounded-xl border border-emerald-500 flex items-center gap-1.5 shadow-md cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Verify & Publish Live 👑</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await api.saveNews({
                                      ...item,
                                      status: 'pending_approval',
                                      isPublished: false
                                    });
                                    showToast('Publication un-published back to pending.');
                                    onRefreshAll();
                                  } catch (err: any) {
                                    showToast(err.message);
                                  }
                                }}
                                className="bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl border border-amber-800 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Revert to Pending</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNewsId(item.id);
                            setNewsTitle(item.title);
                            setNewsSubtitle(item.subtitle || '');
                            setNewsCoverUrl(item.coverImage || '');
                            setNewsSummary(item.summary || '');
                            setNewsContent(item.content || '');
                            setNewsCategory(item.category || 'Match Report');
                            setNewsIssueLabel(item.issueLabel || 'EPL Dispatch');
                            setNewsReadTime(item.readTime || '3 min read');
                            setNewsAuthor(item.author || '');
                            setNewsAuthorTitle(item.authorTitle || '');
                            setNewsAuthorAvatar(item.authorAvatar || '');
                            setNewsIsSubstackExclusive(!!item.isSubstackExclusive);
                            setNewsFeatured(!!item.featured);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* DELETE BUTTON (SUPER ADMIN OR AUTHOR) */}
                        {(isSuperAdmin || currentAdmin?.role === 'news_reporter') && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete publication "${item.title}"?`)) {
                                try {
                                  await api.deleteNews(item.id);
                                  showToast('Publication deleted successfully!');
                                  onRefreshAll();
                                } catch (err: any) {
                                  showToast(err.message);
                                }
                              }
                            }}
                            className="bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 p-2 rounded-xl cursor-pointer"
                            title="Delete Publication"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {news.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  No publication dispatches found. Use the form above to draft and submit articles.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 8: SUB-ADMIN APPOINTMENT ROSTER */}
      {adminTab === 'admins' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-8 backdrop-blur-sm text-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-black text-slate-100 tracking-tight">
                  Super Admin Authority & Sub-Admin Roster
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Super Admins hold sole authority to appoint and dismiss administrators for the Epe Premier League.
              </p>
            </div>
          </div>

          {/* Appoint Sub-Admin Form */}
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-300 border-b border-slate-800 pb-3">
              <UserPlus className="w-5 h-5" />
              <h4 className="font-black text-sm uppercase tracking-wider">
                Appoint New Administrator
              </h4>
            </div>

            {isSuperAdmin ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!appointEmail.trim() || !appointEmail.includes('@')) {
                    showToast('Please enter a valid email address');
                    return;
                  }
                  setIsAppointing(true);
                  try {
                    await onAppointAdmin(appointEmail.trim(), appointName.trim(), appointRole);
                    showToast(`Successfully appointed ${appointEmail}`);
                    setAppointEmail('');
                    setAppointName('');
                  } catch (err: any) {
                    showToast(err.message || 'Error appointing admin');
                  } finally {
                    setIsAppointing(false);
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Admin Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. coach.samson@epeleague.com"
                    value={appointEmail}
                    onChange={(e) => setAppointEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samson Samson"
                    value={appointName}
                    onChange={(e) => setAppointName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={appointRole}
                      onChange={(e) => setAppointRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-300"
                    >
                      <option value="sub_admin">Sub-Admin (Match Duties & Scores)</option>
                      <option value="news_reporter">News Reporter / Press Officer (News Only)</option>
                      <option value="super_admin">Super Admin (Full Governance)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isAppointing}
                    className="bg-[#800020] hover:bg-rose-900 text-amber-300 border border-rose-800 font-black px-5 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer h-[42px]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Appoint</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                Only the Super Admin (<strong className="text-amber-300">itzjeda10@gmail.com</strong>) has appointment and dismissal rights.
              </div>
            )}
          </div>

          {/* Current Admin Roster List */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
              Active Admin Roster ({admins.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admins.map((adm) => {
                const isMainSuperAdmin = adm.email.toLowerCase() === 'itzjeda10@gmail.com';
                const isSelf = adm.email.toLowerCase() === currentUserEmail.toLowerCase();

                return (
                  <div key={adm.email} className="p-5 rounded-2xl border bg-slate-950 border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-100">{adm.name || adm.email.split('@')[0]}</span>
                        {isMainSuperAdmin ? (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">Founder Super Admin</span>
                        ) : adm.role === 'super_admin' ? (
                          <span className="bg-amber-400/30 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-amber-400/40">Super Admin</span>
                        ) : adm.role === 'news_reporter' ? (
                          <span className="bg-purple-900/80 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-purple-700">News Reporter</span>
                        ) : (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-emerald-500/30">Sub-Admin</span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">{adm.email}</div>
                    </div>

                    {isSuperAdmin && !isMainSuperAdmin && (
                      <button
                        onClick={async () => {
                          if (confirm(`Dismiss ${adm.email}?`)) {
                            await onDismissAdmin(adm.email);
                            showToast(`Dismissed ${adm.email}`);
                          }
                        }}
                        className="bg-rose-950 text-rose-200 border border-rose-800 px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 9: SUPER ADMIN LEAGUE STANDINGS MANUAL OVERRIDE */}
      {adminTab === 'standings' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-amber-300 tracking-tight flex items-center gap-2">
                  League Standings Manual Override Studio
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Super Admin Exclusive: Manually edit points, goal differences, match tallies, or apply point deductions in case of glitches or administrative rulings.
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  for (const team of teams) {
                    const override = standingsOverrideMap[team.id];
                    if (override) {
                      await api.updateTeamStandingsOverride(team.id, override);
                    }
                  }
                  showToast('All league table overrides saved successfully!');
                  onRefreshAll();
                } catch (err: any) {
                  showToast(`Error: ${err.message}`);
                }
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-xl flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save All Standings Overrides</span>
            </button>
          </div>

          {!isSuperAdmin ? (
            <div className="p-6 bg-rose-950/40 rounded-2xl border border-rose-800/60 text-rose-200 text-sm font-bold text-center">
              👑 Access Restricted: Only the Super Admin (itzjeda10@gmail.com) has authorization to manually override league standings.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Team</th>
                      <th className="py-3 px-2 text-center">Override?</th>
                      <th className="py-3 px-2 text-center">PTS</th>
                      <th className="py-3 px-2 text-center">MP</th>
                      <th className="py-3 px-2 text-center">W</th>
                      <th className="py-3 px-2 text-center">D</th>
                      <th className="py-3 px-2 text-center">L</th>
                      <th className="py-3 px-2 text-center">GF</th>
                      <th className="py-3 px-2 text-center">GA</th>
                      <th className="py-3 px-2 text-center">GD</th>
                      <th className="py-3 px-2 text-center text-rose-400">-Deduction</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-semibold">
                    {teams.map((t) => {
                      const override = standingsOverrideMap[t.id] || {
                        manualOverride: t.manualOverride || false,
                        points: t.points || 0,
                        matchesPlayed: t.matchesPlayed || 0,
                        won: t.won || 0,
                        drawn: t.drawn || 0,
                        lost: t.lost || 0,
                        goalsFor: t.goalsFor || 0,
                        goalsAgainst: t.goalsAgainst || 0,
                        goalDifference: t.goalDifference || 0,
                        pointsDeduction: t.pointsDeduction || 0
                      };

                      const updateField = (field: string, value: any) => {
                        setStandingsOverrideMap(prev => ({
                          ...prev,
                          [t.id]: {
                            ...override,
                            [field]: value
                          }
                        }));
                      };

                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 flex items-center gap-2">
                            <img src={t.logoUrl} alt={t.name} className="w-6 h-6 rounded-full object-contain bg-white/10 p-0.5" />
                            <span className="font-bold text-slate-100">{t.name}</span>
                            {(override.manualOverride || t.manualOverride) && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">MANUAL</span>
                            )}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(override.manualOverride ?? t.manualOverride)}
                              onChange={(e) => updateField('manualOverride', e.target.checked)}
                              className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-400 focus:ring-amber-400 cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.points ?? t.points}
                              onChange={(e) => updateField('points', Number(e.target.value))}
                              className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-300 text-xs"
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.matchesPlayed ?? t.matchesPlayed}
                              onChange={(e) => updateField('matchesPlayed', Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-100 text-xs"
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.won ?? t.won}
                              onChange={(e) => updateField('won', Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-emerald-400 text-xs"
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.drawn ?? t.drawn}
                              onChange={(e) => updateField('drawn', Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-amber-400 text-xs"
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.lost ?? t.lost}
                              onChange={(e) => updateField('lost', Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-rose-400 text-xs"
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.goalsFor ?? t.goalsFor}
                              onChange={(e) => updateField('goalsFor', Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-100 text-xs"
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.goalsAgainst ?? t.goalsAgainst}
                              onChange={(e) => updateField('goalsAgainst', Number(e.target.value))}
                              className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-slate-100 text-xs"
                            />
                          </td>

                          <td className="py-3 px-2 text-center font-black text-amber-300">
                            {(override.goalsFor ?? t.goalsFor) - (override.goalsAgainst ?? t.goalsAgainst)}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              value={override.pointsDeduction ?? t.pointsDeduction ?? 0}
                              onChange={(e) => updateField('pointsDeduction', Number(e.target.value))}
                              className="w-14 bg-rose-950/60 border border-rose-800 rounded-lg px-2 py-1 text-center font-bold text-rose-300 text-xs"
                            />
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={async () => {
                                try {
                                  await api.updateTeamStandingsOverride(t.id, override);
                                  showToast(`Updated standings override for ${t.name}!`);
                                  onRefreshAll();
                                } catch (err: any) {
                                  showToast(`Error: ${err.message}`);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm cursor-pointer transition-all"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 11: FIXTURES & BULK MATCH UPLOADER (FOR ALL ADMINS) */}
      {adminTab === 'fixtures' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100 backdrop-blur-sm">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#800020] text-amber-300 flex items-center justify-center font-black shadow-lg border border-rose-800">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-amber-300 tracking-tight flex items-center gap-2">
                  Fixture Management & Bulk Upload Studio
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Schedule individual matches or bulk upload entire season fixtures via CSV/JSON (Accessible to all Admins)
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setBulkMode('single')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  bulkMode === 'single'
                    ? 'bg-[#800020] text-amber-300 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Single Fixture
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('bulk')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bulkMode === 'bulk'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Upload (CSV)</span>
              </button>
            </div>
          </div>

          {/* SINGLE FIXTURE FORM */}
          {bulkMode === 'single' && (
            <form onSubmit={handleSaveSingleFixture} className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
              <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Schedule New Match Fixture</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Home Team *</label>
                  <select
                    value={fixtureFormHomeTeam}
                    onChange={(e) => {
                      setFixtureFormHomeTeam(e.target.value);
                      const ht = teams.find(t => t.id === e.target.value);
                      if (ht?.stadium) setFixtureFormVenue(ht.stadium);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-100 cursor-pointer focus:ring-2 focus:ring-amber-400"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                    ))}
                  </select>
                </div>

                {/* Away Team */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Away Team *</label>
                  <select
                    value={fixtureFormAwayTeam}
                    onChange={(e) => setFixtureFormAwayTeam(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-100 cursor-pointer focus:ring-2 focus:ring-amber-400"
                  >
                    {teams
                      .filter(t => t.id !== fixtureFormHomeTeam)
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.shortName})</option>
                      ))}
                  </select>
                </div>

                {/* Matchday */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Matchday *</label>
                  <input
                    type="number"
                    min="1"
                    max="38"
                    value={fixtureFormMatchday}
                    onChange={(e) => setFixtureFormMatchday(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Match Date *</label>
                  <input
                    type="date"
                    value={fixtureFormDate}
                    onChange={(e) => setFixtureFormDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Kick-off Time *</label>
                  <input
                    type="time"
                    value={fixtureFormTime}
                    onChange={(e) => setFixtureFormTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Match Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Epe Township Stadium"
                    value={fixtureFormVenue}
                    onChange={(e) => setFixtureFormVenue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingFixture}
                  className="w-full sm:w-auto bg-[#800020] hover:bg-rose-900 disabled:opacity-50 text-amber-300 font-black px-6 py-3 rounded-xl text-xs uppercase shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSavingFixture ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scheduling Match...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Add & Schedule Fixture</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* BULK UPLOAD MODE */}
          {bulkMode === 'bulk' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Bulk Fixture Importer (CSV or JSON)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Upload a CSV file or paste fixture rows to automatically import multiple matches into the schedule.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySampleCsv}
                    className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Load & Copy Sample CSV</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                      Option A: Select CSV / TXT File
                    </label>
                    <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-400/50 bg-slate-900/60 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2">
                      <Upload className="w-8 h-8 text-amber-400/80" />
                      <span className="text-xs font-bold text-slate-200">
                        Click or drag CSV file here
                      </span>
                      <span className="text-[10px] text-slate-500">Supports .csv, .txt, .json formats</span>
                      <input
                        type="file"
                        accept=".csv, .txt, .json"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                  </div>

                  {/* Raw Text Input Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                      Option B: Paste Raw CSV / JSON Text
                    </label>
                    <textarea
                      rows={5}
                      placeholder={`Matchday,HomeTeam,AwayTeam,Date,Time,Venue\n1,Lagos City FC,Epe Warriors,2026-08-15,16:00,Epe Township Stadium\n1,Ikorodu United,Badagry Stars,2026-08-15,18:30,Ikorodu Township Stadium`}
                      value={bulkCsvText}
                      onChange={(e) => handleParseCsv(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Parsed Preview Section */}
                {parsedFixtures.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          Parsed Preview ({parsedFixtures.filter(f => f.isValid).length} / {parsedFixtures.length} Valid):
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirmBulkUpload}
                        disabled={isUploadingBulk || parsedFixtures.filter(f => f.isValid).length === 0}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                      >
                        {isUploadingBulk ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Uploading Fixtures...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-white" />
                            <span>Confirm & Import {parsedFixtures.filter(f => f.isValid).length} Fixtures</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">MD</th>
                            <th className="py-2.5 px-3">Home Team</th>
                            <th className="py-2.5 px-3">Away Team</th>
                            <th className="py-2.5 px-3">Date & Time</th>
                            <th className="py-2.5 px-3">Venue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-950 font-semibold">
                          {parsedFixtures.map((item, idx) => (
                            <tr key={idx} className={item.isValid ? 'hover:bg-slate-900/40' : 'bg-rose-950/20'}>
                              <td className="py-2.5 px-3">
                                {item.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" /> Ready
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-full" title={item.errorMsg}>
                                    <AlertTriangle className="w-3 h-3 text-rose-400" /> {item.errorMsg || 'Invalid'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-amber-300">MD {item.matchday}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-100">{item.homeTeamName}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-100">{item.awayTeamName}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-300">{item.date} @ {item.time}</td>
                              <td className="py-2.5 px-3 text-slate-400">{item.venue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCHEDULED & EXISTING FIXTURES LIST */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span>All Scheduled League Fixtures ({matches.length})</span>
              </h4>

              {/* Matchday Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400">Filter Matchday:</label>
                <select
                  value={fixtureFilterMatchday}
                  onChange={(e) => setFixtureFilterMatchday(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200"
                >
                  <option value="all">All Matchdays</option>
                  {Array.from(new Set(matches.map(m => Number(m.matchday || 1)))).sort((a: number, b: number) => a - b).map(md => (
                    <option key={md} value={String(md)}>Matchday {md}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matches
                .filter(m => fixtureFilterMatchday === 'all' || String(m.matchday) === fixtureFilterMatchday)
                .map(m => (
                  <div key={m.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 relative hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="text-amber-400 font-black">MD {m.matchday || 1}</span>
                      <span className={`px-2 py-0.5 rounded-md uppercase font-black text-[10px] ${
                        m.status === 'Live' ? 'bg-rose-600 text-white animate-pulse' :
                        m.status === 'Full-Time' ? 'bg-slate-800 text-slate-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {m.homeTeam?.logoUrl && <img src={m.homeTeam.logoUrl} alt="" className="w-5 h-5 object-contain" />}
                        <span className="font-extrabold text-xs text-slate-100 truncate">{m.homeTeam?.name || 'Home Team'}</span>
                      </div>
                      <span className="font-black text-amber-300 font-mono text-sm px-1.5">
                        {m.status === 'Scheduled' ? 'vs' : `${m.homeScore} - ${m.awayScore}`}
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="font-extrabold text-xs text-slate-100 truncate text-right">{m.awayTeam?.name || 'Away Team'}</span>
                        {m.awayTeam?.logoUrl && <img src={m.awayTeam.logoUrl} alt="" className="w-5 h-5 object-contain" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2 font-mono">
                      <span>{m.date} @ {m.time}</span>
                      <span className="truncate max-w-[120px] text-right">{m.venue}</span>
                    </div>

                    {/* Quick Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900/80">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMatchId(m.id);
                          setAdminTab('controller');
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Control Match</span>
                      </button>

                      {deletingMatchIdConfirm === m.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteFixture(m.id)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] px-2 py-1 rounded cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMatchIdConfirm(null)}
                            className="bg-slate-800 text-slate-300 font-bold text-[10px] px-2 py-1 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingMatchIdConfirm(m.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                          title="Delete Fixture"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* EVENT LOGGER POPUP MODAL DIALOG */}
      {eventModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {eventTypeToLog === 'Goal' && '⚽'}
                  {eventTypeToLog === 'Penalty Goal' && '🎯'}
                  {eventTypeToLog === 'Own Goal' && '⚠️'}
                  {eventTypeToLog === 'Yellow Card' && '🟨'}
                  {eventTypeToLog === 'Red Card' && '🟥'}
                  {eventTypeToLog === 'Sub' && '🔄'}
                </span>
                <div>
                  <h3 className="text-base font-black text-amber-300">
                    Log Match Event: {eventTypeToLog}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEventModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-4">
              {/* Select Team */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Team
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEventTeamId(selectedMatch.homeTeamId);
                      setEventPlayerId('');
                      setEventAssisterId('');
                      setEventSubInPlayerId('');
                    }}
                    className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      (eventTeamId || selectedMatch.homeTeamId) === selectedMatch.homeTeamId
                        ? 'bg-[#800020] text-amber-300 border-rose-800 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <img src={selectedMatch.homeTeam?.logoUrl} alt="" className="w-5 h-5 object-contain" />
                    <span>{selectedMatch.homeTeam?.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventTeamId(selectedMatch.awayTeamId);
                      setEventPlayerId('');
                      setEventAssisterId('');
                      setEventSubInPlayerId('');
                    }}
                    className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventTeamId === selectedMatch.awayTeamId
                        ? 'bg-[#800020] text-amber-300 border-rose-800 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <img src={selectedMatch.awayTeam?.logoUrl} alt="" className="w-5 h-5 object-contain" />
                    <span>{selectedMatch.awayTeam?.name}</span>
                  </button>
                </div>
              </div>

              {/* Select Player */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Primary Player
                </label>
                <select
                  value={eventPlayerId}
                  onChange={(e) => setEventPlayerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-100"
                >
                  <option value="">-- Choose Team Player --</option>
                  {players
                    .filter(p => p.teamId === (eventTeamId || selectedMatch.homeTeamId))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.shirtNumber} {p.name} ({p.position})
                      </option>
                    ))}
                </select>
              </div>

              {/* Custom Player Name Option */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Or Enter Custom Name (if unlisted)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Victor Osimhen"
                  value={eventCustomPlayerName}
                  onChange={(e) => setEventCustomPlayerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100"
                />
              </div>

              {/* Assist / Sub In */}
              {(eventTypeToLog === 'Goal' || eventTypeToLog === 'Penalty Goal') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Assist Player (Optional)
                  </label>
                  <select
                    value={eventAssisterId}
                    onChange={(e) => setEventAssisterId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-100"
                  >
                    <option value="">-- Unassisted Goal --</option>
                    {players
                      .filter(p => p.teamId === (eventTeamId || selectedMatch.homeTeamId) && p.id !== eventPlayerId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.shirtNumber} {p.name} ({p.position})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {eventTypeToLog === 'Sub' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Player Coming ON (Sub In)
                  </label>
                  <select
                    value={eventSubInPlayerId}
                    onChange={(e) => setEventSubInPlayerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-400"
                  >
                    <option value="">-- Choose Subbed In Player --</option>
                    {players
                      .filter(p => p.teamId === (eventTeamId || selectedMatch.homeTeamId) && p.id !== eventPlayerId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.shirtNumber} {p.name} ({p.position})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Minute */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Match Minute (')
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={eventMinute}
                  onChange={(e) => setEventMinute(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-100"
                />
              </div>

              {/* Detail */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Detail / Comment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Freekick into top corner / Tactical handball"
                  value={eventDetail}
                  onChange={(e) => setEventDetail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs uppercase shadow-lg cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
