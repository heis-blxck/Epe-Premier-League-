import React, { useState, useEffect, useRef } from 'react';
import { useBackHandler } from '../utils/backManager';
import {
  Match, Team, Player, MatchPeriod, EventType, GoalType, MatchEvent, LineupPlayer, AdminUser, AppSettings, MatchStats, NewsArticle } from '../types';
import { api } from '../services/api';
import { useMatchClock, calculateMatchClock } from '../utils/matchClock';
import { MediaUploader } from './MediaUploader';
import { RatingBadge } from './RatingBadge';
import { BulkUploadManager } from './BulkUploadManager';
import { BulkTeamUploadManager } from './BulkTeamUploadManager';
import { PlayerAvailabilityManager } from './PlayerAvailabilityManager';
import { AdsManager } from './AdsManager';
import { PotmManager } from './PotmManager';
import { PlayerValuationManager } from './PlayerValuationManager';
import { LineupBuilder } from './LineupBuilder';
import { VerifiedBadge } from './VerifiedBadge';
import { EplHighlightAdmin } from './EplHighlightAdmin';
import { VideoHighlightsAdmin } from './VideoHighlightsAdmin';
import {
  Trophy,
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
  X,
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
  Download,
  Goal,
  Megaphone,
  Shield
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
  onAppointAdmin: (email: string, name: string, role: 'super_admin' | 'sub_admin' | 'news_reporter' | 'official_league' | 'OFFICIAL_LEAGUE') => Promise<void>;
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
  const [activePanel, setActivePanel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [adminTab, setAdminTab] = useState<'controller' | 'events' | 'ratings' | 'squads' | 'transfers' | 'players' | 'teams' | 'standings' | 'branding' | 'news' | 'highlights' | 'videos' | 'admins' | 'fixtures' | 'bulk_upload' | 'bulk_teams' | 'valuations' | 'availability' | 'ads' | 'potm' | 'lineups'>('controller');

  const isNewsReporter = currentAdmin?.role === 'news_reporter';
  const isOfficialLeague = currentAdmin?.role === 'official_league' || currentAdmin?.role === 'OFFICIAL_LEAGUE' || currentAdmin?.role === 'spokesperson';
  const isSubAdmin = currentAdmin?.role === 'sub_admin';
  const isLimitedMediaRole = isNewsReporter || (isOfficialLeague && !isSuperAdmin);

  useEffect(() => {
    if (isNewsReporter) {
      setActivePanel(5);
      setAdminTab('news');
    } else if (isOfficialLeague && !isSuperAdmin) {
      if (!['news', 'videos', 'highlights', 'potm'].includes(adminTab)) {
        setActivePanel(5);
        setAdminTab('news');
      }
    } else if (isSubAdmin && !isSuperAdmin) {
      if (!['controller', 'lineups', 'events', 'ratings'].includes(adminTab)) {
        setActivePanel(1);
        setAdminTab('controller');
      }
    }
  }, [isNewsReporter, isOfficialLeague, isSubAdmin, isSuperAdmin, adminTab]);

  // Selected Match for actions
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || '');
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMsg(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
      toastTimeoutRef.current = null;
    }, 3500);
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

  // MOTM & Bonus Points states
  const [motmPlayerId, setMotmPlayerId] = useState<string>(selectedMatch?.motmPlayerId || '');
  const [motmGraphicUrl, setMotmGraphicUrl] = useState<string>(selectedMatch?.motmGraphicUrl || '');
  const [bonusFirstPlace, setBonusFirstPlace] = useState<string>(selectedMatch?.bonusPointsAllocations?.firstPlacePlayerId || '');
  const [bonusSecondPlace, setBonusSecondPlace] = useState<string>(selectedMatch?.bonusPointsAllocations?.secondPlacePlayerId || '');
  const [bonusThirdPlace, setBonusThirdPlace] = useState<string>(selectedMatch?.bonusPointsAllocations?.thirdPlacePlayerId || '');


  // Penalty Shootout Scores State
  const [homePenalties, setHomePenalties] = useState<number>(selectedMatch?.homePenalties || 0);
  const [awayPenalties, setAwayPenalties] = useState<number>(selectedMatch?.awayPenalties || 0);

  // Live timestamp match clock hook (consumes zero continuous database reads/writes)
  const liveClock = useMatchClock(selectedMatch);

  // Sync state when selected match changes
  useEffect(() => {
    if (selectedMatch) {
      setClockMinute(liveClock.calculatedMinute || selectedMatch.matchMinute || 0);
      setStoppage1st(selectedMatch.firstHalfStoppage ?? selectedMatch.stoppageTime1stHalf ?? 2);
      setStoppage2nd(selectedMatch.secondHalfStoppage ?? selectedMatch.stoppageTime2ndHalf ?? 4);
      setHomePenalties(selectedMatch.homePenalties || 0);
      setAwayPenalties(selectedMatch.awayPenalties || 0);
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

      setMotmPlayerId(selectedMatch.manOfTheMatchPlayerId || selectedMatch.motmPlayerId || '');
      setMotmGraphicUrl(selectedMatch.motmGraphicUrl || '');
      setBonusFirstPlace(selectedMatch.fantasyBonus1stPlayerId || selectedMatch.bonusPointsAllocations?.firstPlacePlayerId || '');
      setBonusSecondPlace(selectedMatch.fantasyBonus2ndPlayerId || selectedMatch.bonusPointsAllocations?.secondPlacePlayerId || '');
      setBonusThirdPlace(selectedMatch.fantasyBonus3rdPlayerId || selectedMatch.bonusPointsAllocations?.thirdPlacePlayerId || '');
    }
  }, [selectedMatchId, matches]);

  // QUICK GOAL INSTANT TRIGGER STATES
  const [quickGoalModalOpen, setQuickGoalModalOpen] = useState<boolean>(false);
  const [quickGoalData, setQuickGoalData] = useState<{
    side: 'home' | 'away';
    teamId: string;
    teamName: string;
    newHomeScore: number;
    newAwayScore: number;
    minute: number;
  } | null>(null);

  const [quickGoalPlayerId, setQuickGoalPlayerId] = useState<string>('');
  const [quickGoalAssisterId, setQuickGoalAssisterId] = useState<string>('');
  const [quickGoalType, setQuickGoalType] = useState<GoalType>('standard');
  const [quickGoalMinute, setQuickGoalMinute] = useState<number>(1);
  const [quickGoalSavingDetails, setQuickGoalSavingDetails] = useState<boolean>(false);

  // 2. LIVE EVENT LOGGER STATES
  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [eventTypeToLog, setEventTypeToLog] = useState<EventType>('Goal');
  const [goalTypeToLog, setGoalTypeToLog] = useState<GoalType>('standard');
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
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [showBulkDeletePlayerConfirm, setShowBulkDeletePlayerConfirm] = useState<boolean>(false);
  const [isBulkDeletingPlayers, setIsBulkDeletingPlayers] = useState<boolean>(false);
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
  const [teamFormCoachPhotoUrl, setTeamFormCoachPhotoUrl] = useState<string>('');
  const [teamFormStadium, setTeamFormStadium] = useState<string>('');

  // 8. BRANDING & SETTINGS STATES (SUPER ADMIN)
  const [brandAppName, setBrandAppName] = useState<string>(settings?.appName || 'Epe Premier League');
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>(settings?.appLogoUrl || '');
  const [brandColor, setBrandColor] = useState<string>(settings?.primaryColor || '#800020');
  const [brandSeason, setBrandSeason] = useState<string>(settings?.seasonLabel || '2026 Season');
  const [visionText, setVisionText] = useState<string>(settings?.visionText || '');
  const [leadership, setLeadership] = useState<{name: string, role: string, imageUrl: string}[]>(
    settings?.leadership || [
      { name: 'Mujib Bankole-Otedola', role: 'Committee Chair', imageUrl: '' },
      { name: 'Ayodele Adio', role: 'FA President', imageUrl: '' },
      { name: 'Ahmad Garbadeen', role: 'Lead Developer', imageUrl: '' }
    ]
  );

  useEffect(() => {
    if (settings) {
      setBrandAppName(settings.appName);
      setBrandLogoUrl(settings.appLogoUrl);
      setBrandColor(settings.primaryColor);
      setBrandSeason(settings.seasonLabel || settings.leagueSeason || '2026 Season');
      if (settings.visionText) setVisionText(settings.visionText);
      if (settings.leadership) setLeadership(settings.leadership);
    }
  }, [settings]);

  // 9. SUBSTACK NEWS PUBLISHER STATES
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  useBackHandler(() => {
    if (editingPlayerId) {
      setEditingPlayerId(null);
      return true;
    }
    if (editingTeamId) {
      setEditingTeamId(null);
      return true;
    }
    if (editingNewsId) {
      setEditingNewsId(null);
      return true;
    }
    return false;
  }, [editingPlayerId, editingTeamId, editingNewsId]);
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
  const [appointRole, setAppointRole] = useState<'sub_admin' | 'super_admin' | 'news_reporter' | 'official_league'>('sub_admin');
  const [isAppointing, setIsAppointing] = useState(false);

  // 11. DATA RESET CONFIRMATION STATES (SUPER ADMIN EXCLUSIVE)
  const [resetTableConfirming, setResetTableConfirming] = useState<boolean>(false);

  // 11. FIXTURES & BULK MATCH SCHEDULER STATES (FOR ALL ADMINS)
  const [fixtureFormHomeTeam, setFixtureFormHomeTeam] = useState<string>(teams[0]?.id || '');
  const [fixtureFormAwayTeam, setFixtureFormAwayTeam] = useState<string>(teams[1]?.id || '');
  const [fixtureFormMatchday, setFixtureFormMatchday] = useState<number>(1);
  const [finalizeGameweekId, setFinalizeGameweekId] = useState<number>(1);
  const [fixtureFormDate, setFixtureFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fixtureFormTime, setFixtureFormTime] = useState<string>('16:00');
  const [fixtureFormVenue, setFixtureFormVenue] = useState<string>('');
  const [fixtureFormCompetitionType, setFixtureFormCompetitionType] = useState<'League' | 'Cup'>('League');
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
            (t.name || '').toLowerCase() === (item.homeTeam || item.homeTeamName || '').toLowerCase() ||
            (t.shortName || '').toLowerCase() === (item.homeTeam || item.homeTeamName || '').toLowerCase() ||
            t.id === item.homeTeamId
          );
          const awayT = teams.find(t => 
            (t.name || '').toLowerCase() === (item.awayTeam || item.awayTeamName || '').toLowerCase() ||
            (t.shortName || '').toLowerCase() === (item.awayTeam || item.awayTeamName || '').toLowerCase() ||
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
          (t.name || '').toLowerCase() === (homeStr || '').toLowerCase() ||
          (t.shortName || '').toLowerCase() === (homeStr || '').toLowerCase() ||
          t.id === homeStr ||
          (t.name || '').toLowerCase().includes((homeStr || '').toLowerCase())
        );

        const awayT = teams.find(t => 
          (t.name || '').toLowerCase() === (awayStr || '').toLowerCase() ||
          (t.shortName || '').toLowerCase() === (awayStr || '').toLowerCase() ||
          t.id === awayStr ||
          (t.name || '').toLowerCase().includes((awayStr || '').toLowerCase())
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
        competition_type: fixtureFormCompetitionType,
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
  const handleStart1stHalf = async () => {
    if (!selectedMatch) return;
    const nowIso = new Date().toISOString();
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        status: 'Live',
        period: '1st Half',
        firstHalfStartTime: nowIso,
        firstHalfStoppage: Number(stoppage1st),
        stoppageTime1stHalf: Number(stoppage1st),
        matchMinute: 0
      });
      showToast('1st Half Started (40-min half clock ticking)!');
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error starting 1st Half: ${e.message}`);
    }
  };

  const handleEnd1stHalf = async () => {
    if (!selectedMatch) return;
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        status: 'Half-Time',
        period: 'Half-Time',
        matchMinute: 40
      });
      showToast('1st Half Ended (Half-Time)!');
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error ending 1st Half: ${e.message}`);
    }
  };

  const handleStart2ndHalf = async () => {
    if (!selectedMatch) return;
    const nowIso = new Date().toISOString();
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        status: 'Live',
        period: '2nd Half',
        secondHalfStartTime: nowIso,
        secondHalfStoppage: Number(stoppage2nd),
        stoppageTime2ndHalf: Number(stoppage2nd),
        matchMinute: 40
      });
      showToast('2nd Half Started (40-min half clock ticking)!');
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error starting 2nd Half: ${e.message}`);
    }
  };

  const handleEndMatch = async () => {
    if (!selectedMatch) return;
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        status: 'Full-Time',
        period: 'Full-Time',
        matchMinute: 80
      });
      showToast('Match Ended (Full-Time)!');
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error ending match: ${e.message}`);
    }
  };

  const handleSet1stHalfExtraTime = async () => {
    if (!selectedMatch) return;
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        firstHalfStoppage: Number(stoppage1st),
        stoppageTime1stHalf: Number(stoppage1st)
      });
      showToast(`1st Half Stoppage Time set to +${stoppage1st}'`);
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error setting stoppage time: ${e.message}`);
    }
  };

  const handleSet2ndHalfExtraTime = async () => {
    if (!selectedMatch) return;
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        secondHalfStoppage: Number(stoppage2nd),
        stoppageTime2ndHalf: Number(stoppage2nd)
      });
      showToast(`2nd Half Stoppage Time set to +${stoppage2nd}'`);
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error setting stoppage time: ${e.message}`);
    }
  };

  const handleUpdateStatus = async (period: MatchPeriod, customStatus?: 'Scheduled' | 'Live' | 'Half-Time' | 'Full-Time' | 'Penalties') => {
    if (!selectedMatch) return;
    let status: 'Scheduled' | 'Live' | 'Half-Time' | 'Full-Time' | 'Penalties' = customStatus || 'Scheduled';
    if (!customStatus) {
      if (period === '1st Half' || period === '2nd Half') status = 'Live';
      if (period === 'Half-Time') status = 'Half-Time';
      if (period === 'Full-Time') status = 'Full-Time';
    }

    try {
      
      await api.saveMatch({
        id: selectedMatch.id,
        motmPlayerId,
        motmGraphicUrl,
        bonusPointsAllocations: {
          firstPlacePlayerId: bonusFirstPlace,
          secondPlacePlayerId: bonusSecondPlace,
          thirdPlacePlayerId: bonusThirdPlace
        },

        period,
        status,
        matchMinute: clockMinute,
        homePenalties: homePenalties,
        awayPenalties: awayPenalties
      });
      showToast(`Match status updated to ${customStatus || period}`);
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleSavePenalties = async () => {
    if (!selectedMatch) return;
    try {
      await api.saveMatch({
        id: selectedMatch.id,
        status: 'Penalties',
        homePenalties: Number(homePenalties),
        awayPenalties: Number(awayPenalties)
      });
      showToast(`Penalty Shootout Scores Saved (${homePenalties} - ${awayPenalties} PKs)!`);
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

  // INSTANT QUICK GOAL TRIGGER (Home or Away)
  const handleQuickGoal = async (side: 'home' | 'away') => {
    if (!selectedMatch) return;

    const currentHome = Number(selectedMatch.homeScore || 0);
    const currentAway = Number(selectedMatch.awayScore || 0);
    const newHome = side === 'home' ? currentHome + 1 : currentHome;
    const newAway = side === 'away' ? currentAway + 1 : currentAway;
    const teamId = side === 'home' ? selectedMatch.homeTeamId : selectedMatch.awayTeamId;
    const teamObj = side === 'home' ? selectedMatch.homeTeam : selectedMatch.awayTeam;
    const teamName = teamObj?.shortName || teamObj?.name || (side === 'home' ? 'Home' : 'Away');
    const min = liveClock.calculatedMinute || selectedMatch.matchMinute || 1;

    try {
      // 1. INSTANT DB & SCORE UPDATE IN FIRESTORE / BACKEND
      await api.saveMatch({
        id: selectedMatch.id,
        homeScore: newHome,
        awayScore: newAway
      });

      // PUSH STAGE 1 HIGH-PRIORITY GOAL NOTIFICATION
      try {
        await api.createNotification({
          title: `⚽ GOAL! ${teamName} scores!`,
          message: `${selectedMatch.homeTeam?.shortName || 'Home'} ${newHome} - ${newAway} ${selectedMatch.awayTeam?.shortName || 'Away'} (${min}')`,
          type: 'match_goal',
          eventType: 'Goal',
          linkMatchId: selectedMatch.id
        });
      } catch (notifErr) {
        console.error('Error creating Stage 1 notification:', notifErr);
      }

      showToast(`⚽ GOAL! Score instantly updated: ${selectedMatch.homeTeam?.shortName || 'HOME'} ${newHome} - ${newAway} ${selectedMatch.awayTeam?.shortName || 'AWAY'}`);

      // Push real-time refresh to connected fans & state
      onRefreshAll();

      // 2. OPEN PROMPT FOR GOALSCORER & ASSIST DETAILS
      setQuickGoalData({
        side,
        teamId,
        teamName,
        newHomeScore: newHome,
        newAwayScore: newAway,
        minute: min
      });
      setQuickGoalPlayerId('');
      setQuickGoalAssisterId('');
      setQuickGoalType('standard');
      setQuickGoalMinute(min);
      setQuickGoalModalOpen(true);
    } catch (err: any) {
      showToast(`Error updating score: ${err.message || 'Failed to update live score'}`);
    }
  };

  // SAVE QUICK GOAL DETAILS & EVENT
  const handleSaveQuickGoalDetails = async () => {
    if (!selectedMatch || !quickGoalData) return;
    setQuickGoalSavingDetails(true);
    try {
      const teamPlayers = players.filter(p => p.teamId === quickGoalData.teamId);
      const scorerObj = teamPlayers.find(p => p.id === quickGoalPlayerId);
      const assisterObj = teamPlayers.find(p => p.id === quickGoalAssisterId);

      const scorerName = scorerObj ? scorerObj.name : 'Goalscorer';
      const assisterName = assisterObj ? assisterObj.name : undefined;

      await api.addEvent(selectedMatch.id, {
        teamId: quickGoalData.teamId,
        playerId: quickGoalPlayerId || 'unassigned',
        playerName: scorerName,
        assisterId: quickGoalAssisterId || undefined,
        assisterName: assisterName,
        eventType: 'Goal',
        goalType: quickGoalType,
        minute: Number(quickGoalMinute || quickGoalData.minute || 1),
        detail: quickGoalType === 'penalty' ? 'Penalty Goal' : quickGoalType === 'own_goal' ? 'Own Goal' : 'Goal',
        skipScoreIncrement: true
      });

      // PUSH STAGE 2 DETAILED PLAYER NOTIFICATION
      try {
        await api.createNotification({
          title: `⚽ Goal Detail: ${scorerName}`,
          message: `⚽ ${scorerName} scores!${assisterName ? ` (Assist: ${assisterName})` : ''} (${quickGoalMinute || quickGoalData.minute || 1}')`,
          type: 'match_goal',
          eventType: 'Goal',
          linkMatchId: selectedMatch.id
        });
      } catch (notifErr) {
        console.error('Error creating Stage 2 notification:', notifErr);
      }

      showToast(`Goal details saved for ${scorerName}! Player stats updated.`);
      setQuickGoalModalOpen(false);
      setQuickGoalData(null);
      onRefreshAll();
    } catch (err: any) {
      showToast(`Error logging goal details: ${err.message}`);
    } finally {
      setQuickGoalSavingDetails(false);
    }
  };

  // SAVE GAME DETAILED STATISTICS
  const handleSaveMatchStats = async () => {
    if (!selectedMatch) return;
    try {
      const statsObj: MatchStats = {
        homePossession: Number(statsHomePossession) || 0,
        awayPossession: Number(statsAwayPossession) || 0,
        homeShots: Number(statsHomeShots) || 0,
        awayShots: Number(statsAwayShots) || 0,
        homeShotsOnTarget: Number(statsHomeShotsOnTarget) || 0,
        awayShotsOnTarget: Number(statsAwayShotsOnTarget) || 0,
        homeCorners: Number(statsHomeCorners) || 0,
        awayCorners: Number(statsAwayCorners) || 0,
        homeFouls: Number(statsHomeFouls) || 0,
        awayFouls: Number(statsAwayFouls) || 0
      };

      await api.saveMatch({
        id: selectedMatch.id,
        stats: statsObj,
        motmPlayerId: motmPlayerId || undefined,
        manOfTheMatchPlayerId: motmPlayerId || undefined,
        motmGraphicUrl: motmGraphicUrl || undefined,
        bonusPointsAllocations: {
          firstPlacePlayerId: bonusFirstPlace || undefined,
          secondPlacePlayerId: bonusSecondPlace || undefined,
          thirdPlacePlayerId: bonusThirdPlace || undefined
        },
        fantasyBonus1stPlayerId: bonusFirstPlace || undefined,
        fantasyBonus2ndPlayerId: bonusSecondPlace || undefined,
        fantasyBonus3rdPlayerId: bonusThirdPlace || undefined
      });
      showToast(`Match detailed statistics and awards saved!`);
      onRefreshAll();
    } catch (e: any) {
      showToast(`Error saving match stats: ${e.message}`);
    }
  };

  // OPEN LOG EVENT MODAL
  const handleOpenEventModal = (type: EventType, gType: GoalType = 'standard') => {
    setEventTypeToLog(type);
    if (type === 'Goal') {
      setGoalTypeToLog(gType);
    }
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
        goalType: eventTypeToLog === 'Goal' ? goalTypeToLog : undefined,
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
      setSelectedPlayerIds(prev => prev.filter(id => id !== pId));
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete player');
    }
  };

  // BULK DELETE PLAYERS
  const handleBulkDeletePlayers = async () => {
    if (selectedPlayerIds.length === 0) return;
    setIsBulkDeletingPlayers(true);
    try {
      await api.deletePlayersBulk(selectedPlayerIds);
      showToast(`Successfully deleted ${selectedPlayerIds.length} players!`);
      setSelectedPlayerIds([]);
      setShowBulkDeletePlayerConfirm(false);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to bulk delete players');
    } finally {
      setIsBulkDeletingPlayers(false);
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
        coachPhotoUrl: teamFormCoachPhotoUrl.trim() || undefined,
        stadium: teamFormStadium.trim() || 'Epe Arena'
      });

      showToast(editingTeamId ? 'Team info updated!' : 'New team registered successfully!');
      setEditingTeamId(null);
      setTeamFormName('');
      setTeamFormShort('');
      setTeamFormLogo('');
      setTeamFormCoach('');
                        setTeamFormCoachPhotoUrl('');
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
        seasonLabel: brandSeason,
        visionText: visionText,
        leadership: leadership
      });
      showToast('League app branding & icon updated!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      
      {/* FIXED BOTTOM NAV FOR ADMIN */}
      <div 
        className="fixed bottom-0 left-0 right-0 w-full z-[9999] bg-[#800020] border-t border-[#5a0016] shadow-[0_-10px_30px_-10px_rgba(128,0,32,0.4)] pb-safe m-0"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', zIndex: 9999, margin: 0 }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-2">
          {!isLimitedMediaRole && (
            <>
              <button
                onClick={() => { setActivePanel(1); setAdminTab('fixtures'); }}
                className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activePanel === 1 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Play className={`transition-all ${activePanel === 1 ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span className={`font-bold tracking-wide transition-all ${activePanel === 1 ? 'text-[11px]' : 'text-[10px]'}`}>Matches</span>
              </button>
              <button
                onClick={() => { setActivePanel(2); setAdminTab('standings'); }}
                className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activePanel === 2 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Shield className={`transition-all ${activePanel === 2 ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span className={`font-bold tracking-wide transition-all ${activePanel === 2 ? 'text-[11px]' : 'text-[10px]'}`}>Clubs</span>
              </button>
              <button
                onClick={() => { 
                  setActivePanel(3); 
                  setAdminTab('players'); 
                  window.dispatchEvent(new Event('reset-profile-tab'));
                }}
                className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activePanel === 3 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Users className={`transition-all ${activePanel === 3 ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span className={`font-bold tracking-wide transition-all ${activePanel === 3 ? 'text-[11px]' : 'text-[10px]'}`}>Profiles</span>
              </button>
              <button
                onClick={() => { setActivePanel(4); setAdminTab('valuations'); }}
                className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activePanel === 4 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Sparkles className={`transition-all ${activePanel === 4 ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span className={`font-bold tracking-wide transition-all ${activePanel === 4 ? 'text-[11px]' : 'text-[10px]'}`}>Fantasy</span>
              </button>
            </>
          )}
          <button
            onClick={() => { setActivePanel(5); setAdminTab('news'); }}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activePanel === 5 ? 'text-[#800020] bg-amber-400 scale-110 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Sliders className={`transition-all ${activePanel === 5 ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`font-bold tracking-wide transition-all ${activePanel === 5 ? 'text-[11px]' : 'text-[10px]'}`}>Controls</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-amber-300 font-extrabold px-5 py-3 rounded-2xl shadow-2xl border border-amber-400 flex items-center justify-between gap-3 animate-bounce max-w-md">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm">{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
              }
              setToastMsg(null);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-2"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
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

      {/* Contextual Sub-Panel Dropdown & Match Selector (if Panel 1 / Match Control) */}
      {isOfficialLeague && !isSuperAdmin ? (
        <div className="bg-[#800020]/90 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-100 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-300 flex items-center gap-1.5">
                <span>Official League Desk</span>
                <VerifiedBadge role="official_league" />
              </h4>
              <p className="text-xs text-rose-200/90 font-medium">You have exclusive media publishing rights to post News, Match Videos, EPL Highlights, and Player of the Month awards.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={adminTab}
              onChange={(e) => setAdminTab(e.target.value as any)}
              className="bg-slate-950 border border-amber-500/60 font-black text-amber-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400 cursor-pointer flex-1 sm:min-w-[200px]"
            >
              <option value="news">News & Gazette</option>
              <option value="videos">Match Videos Hub</option>
              <option value="highlights">EPL Highlights Poster</option>
              <option value="potm">Player of the Month (POTM)</option>
            </select>
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-2 rounded-xl shrink-0">
              FA Official
            </span>
          </div>
        </div>
      ) : isNewsReporter ? (
        <div className="bg-purple-950/80 border border-purple-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-purple-100 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-purple-200 flex items-center gap-1.5">
                <span>Press Officer & News Reporter Desk</span>
                <VerifiedBadge role="news_reporter" />
              </h4>
              <p className="text-xs text-purple-300/80">You have dedicated access to draft, edit, and submit news dispatches. Submitted articles require Super Admin verification before going live.</p>
            </div>
          </div>
          <span className="bg-purple-800 text-purple-100 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-purple-600 shrink-0">
            Reporter Mode
          </span>
        </div>
      ) : isSubAdmin && !isSuperAdmin ? (
        <div className="bg-slate-900/90 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-100 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-300 flex items-center gap-1.5">
                <span>Sub-Admin Match Operations Desk</span>
                <VerifiedBadge role="sub_admin" />
              </h4>
              <p className="text-xs text-amber-200/90 font-medium">Designated access to Match Clock, Lineups, Event Logger, and Live Ratings.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={adminTab}
              onChange={(e) => setAdminTab(e.target.value as any)}
              className="bg-slate-950 border border-amber-500/60 font-black text-amber-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-400 cursor-pointer flex-1 sm:min-w-[200px]"
            >
              <option value="controller">Match Clock & Stats</option>
              <option value="lineups">Lineups</option>
              <option value="events">Goal & Event Logger</option>
              <option value="ratings">Live Player Ratings & MOTM</option>
            </select>
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-2 rounded-xl shrink-0">
              Sub-Admin
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/90 rounded-2xl p-4 shadow-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Sliders className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Active Section</span>
              <select
                value={adminTab}
                onChange={(e) => setAdminTab(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 font-bold text-slate-100 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800020] min-w-[220px]"
              >
                {activePanel === 1 && (
                  <>
                    <option value="fixtures">Fixtures & Scheduler</option>
                    <option value="controller">Match Clock & Stats</option>
                    <option value="lineups">Lineups</option>
                    <option value="events">Goal & Event Logger</option>
                    <option value="ratings">Live Player Ratings & MOTM</option>
                  </>
                )}
                {activePanel === 2 && (
                  <>
                    {isSuperAdmin && <option value="standings">Standings Override</option>}
                    <option value="teams">Team Manager</option>
                    <option value="squads">Squad Manager</option>
                    <option value="transfers">Transfer Engine</option>
                    <option value="bulk_teams">Bulk Team Upload</option>
                  </>
                )}
                {activePanel === 3 && (
                  <>
                    <option value="players">Player Roster</option>
                    {(isSuperAdmin || isOfficialLeague) && <option value="potm">Player of the Month (POTM)</option>}
                    <option value="bulk_upload">Bulk Upload Player Roster</option>
                  </>
                )}
                {activePanel === 4 && (
                  <>
                    <option value="valuations">Player Valuations</option>
                    <option value="availability">Player Availability</option>
                  </>
                )}
                {activePanel === 5 && (
                  <>
                    <option value="news">News & Gazette</option>
                    {(isSuperAdmin || isOfficialLeague) && <option value="highlights">EPL Highlights Poster</option>}
                    {(isSuperAdmin || isOfficialLeague) && <option value="videos">Match Videos Hub</option>}
                    {isSuperAdmin && <option value="ads">Ad Placement</option>}
                    {isSuperAdmin && <option value="branding">App Branding & About</option>}
                    {isSuperAdmin && <option value="admins">Admin Management</option>}
                  </>
                )}
              </select>
            </div>
          </div>

          {activePanel === 1 && (
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider whitespace-nowrap">Match Context:</span>
              <select
                value={selectedMatchId}
                onChange={(e) => handleSelectMatch(e.target.value)}
                className="bg-slate-950 border border-slate-800 font-bold text-slate-100 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800020] flex-1 sm:max-w-xs"
              >
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    [{m.status}] M{m.matchday}: {m.homeTeam?.name} vs {m.awayTeam?.name} ({m.homeScore}-{m.awayScore})
                  </option>
                ))}
              </select>
            </div>
          )}
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
          <div className="bg-slate-950 text-white rounded-2xl p-6 text-center space-y-4 border border-slate-800 relative shadow-xl">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-widest">
              <span>State: {selectedMatch.period} ({selectedMatch.status})</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${liveClock.badgeColor}`}>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                <span>{liveClock.displayString} {liveClock.overflowText ? `(${liveClock.overflowText})` : ''}</span>
              </span>
            </div>

            <div className="text-3xl sm:text-5xl font-mono font-black text-white">
              {selectedMatch.homeTeam?.name} <span className="text-amber-300">{selectedMatch.homeScore} - {selectedMatch.awayScore}</span> {selectedMatch.awayTeam?.name}
            </div>

            {/* RAPID-FIRE QUICK GOAL BUTTONS */}
            <div className="pt-2">
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 shadow-inner space-y-2 max-w-2xl mx-auto">
                <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>⚡ Quick Goal Instant Trigger</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Push live score immediately to fans</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickGoal('home')}
                    className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer border border-emerald-400/50 transition-all"
                  >
                    <span className="text-base sm:text-lg">⚽</span>
                    <span>+1 {selectedMatch.homeTeam?.shortName || 'HOME'} Goal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickGoal('away')}
                    className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer border border-emerald-400/50 transition-all"
                  >
                    <span className="text-base sm:text-lg">⚽</span>
                    <span>+1 {selectedMatch.awayTeam?.shortName || 'AWAY'} Goal</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-center gap-3">
              <span>Local Ticking Clock: <strong className="text-amber-300 font-bold">{liveClock.displayString}</strong></span>
              {liveClock.overflowText && (
                <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded text-[11px] font-bold">
                  Extra Time Overflow: {liveClock.overflowText}
                </span>
              )}
            </div>
          </div>

          {/* 40-MINUTE HALVES MATCH STATE CONTROLS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Match State Controls (40-Min Halves + Referee Stoppage):</span>
              <span className="text-[10px] text-amber-400 font-mono">Timestamp Clock • Zero DB Ticker Reads</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={handleStart1stHalf}
                className={`p-3.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  selectedMatch.period === '1st Half'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-100 border-slate-800'
                }`}
              >
                <span className="text-base">⏱️</span>
                <span>Start 1st Half</span>
                <span className="text-[10px] text-slate-400 font-normal">Kickoff (00:00 - 40:00)</span>
              </button>

              <button
                type="button"
                onClick={handleEnd1stHalf}
                className={`p-3.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  selectedMatch.period === 'Half-Time'
                    ? 'bg-amber-950 text-amber-300 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-100 border-slate-800'
                }`}
              >
                <span className="text-base">⏸️</span>
                <span>End 1st Half</span>
                <span className="text-[10px] text-slate-400 font-normal">Half-Time (HT)</span>
              </button>

              <button
                type="button"
                onClick={handleStart2ndHalf}
                className={`p-3.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  selectedMatch.period === '2nd Half'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-100 border-slate-800'
                }`}
              >
                <span className="text-base">⏱️</span>
                <span>Start 2nd Half</span>
                <span className="text-[10px] text-slate-400 font-normal">Resume (40:00 - 80:00)</span>
              </button>

              <button
                type="button"
                onClick={handleEndMatch}
                className={`p-3.5 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  selectedMatch.period === 'Full-Time'
                    ? 'bg-rose-950 text-rose-300 border-rose-500 ring-2 ring-rose-500/30 shadow-lg'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-100 border-slate-800'
                }`}
              >
                <span className="text-base">🏁</span>
                <span>End Match</span>
                <span className="text-[10px] text-slate-400 font-normal">Full-Time (FT 80')</span>
              </button>
            </div>
          </div>

          {/* CUP TIE-BREAKER: PENALTY SHOOTOUT CONTROLLER */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span>🏆 Cup Tie-Breaker: Penalty Shootout (PK Controller)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                Type: {selectedMatch?.competition_type || 'League'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {selectedMatch?.homeTeam?.name || 'Home Team'} Penalties Scored
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={homePenalties}
                  onChange={(e) => setHomePenalties(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-black text-amber-300 w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {selectedMatch?.awayTeam?.name || 'Away Team'} Penalties Scored
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={awayPenalties}
                  onChange={(e) => setAwayPenalties(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-black text-amber-300 w-full"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSavePenalties}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Save Penalty Shootout Score & Mark Penalties
              </button>
            </div>
          </div>

          {/* Stoppage / Extra Time Setter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase block">
                1st Half Extra / Stoppage Time (+mins)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={stoppage1st}
                  onChange={(e) => setStoppage1st(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-amber-300 w-20 text-center"
                />
                <button
                  type="button"
                  onClick={handleSet1stHalfExtraTime}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
                >
                  Set 1st Half Extra Time (+{stoppage1st}')
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Updates 1st half extra time badge when referee announces stoppage.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase block">
                2nd Half Extra / Stoppage Time (+mins)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={stoppage2nd}
                  onChange={(e) => setStoppage2nd(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-amber-300 w-20 text-center"
                />
                <button
                  type="button"
                  onClick={handleSet2ndHalfExtraTime}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
                >
                  Set 2nd Half Extra Time (+{stoppage2nd}')
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Updates 2nd half extra time badge when referee announces stoppage.</p>
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
              {/* MOTM & FANTASY BONUS */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Match Awards & Fantasy Bonus Points
                </div>
                {selectedMatch.status === 'Full-Time' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-bold block">Man of the Match</label>
                      <select
                        value={motmPlayerId}
                        onChange={(e) => setMotmPlayerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-100"
                      >
                        <option value="">-- Select MOTM --</option>
                        {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.teamId === selectedMatch.homeTeamId ? selectedMatch.homeTeam?.shortName : selectedMatch.awayTeam?.shortName})</option>
                        ))}
                      </select>
                    </div>
                    {motmPlayerId && (
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 font-bold block">MOTM Graphic (JPEG, Max 2MB)</label>
                        <MediaUploader
                          accept="image/jpeg, image/jpg"
                          onUploadComplete={setMotmGraphicUrl}
                          label="Upload MOTM Image"
                        />
                        {motmGraphicUrl && (
                          <div className="mt-2 border rounded-lg border-slate-800 overflow-hidden bg-slate-950 p-2">
                            <img src={motmGraphicUrl} alt="Preview" className="w-full h-auto object-cover rounded" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="pt-2 space-y-3 border-t border-slate-800">
                      <label className="text-[10px] text-slate-400 font-bold block uppercase text-emerald-400">Fantasy Bonus Allocation</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">1st Place (3 pts)</label>
                          <select
                            value={bonusFirstPlace}
                            onChange={(e) => setBonusFirstPlace(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-100"
                          >
                            <option value="">-- Select --</option>
                            {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">2nd Place (2 pts)</label>
                          <select
                            value={bonusSecondPlace}
                            onChange={(e) => setBonusSecondPlace(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-100"
                          >
                            <option value="">-- Select --</option>
                            {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold block mb-1">3rd Place (1 pt)</label>
                          <select
                            value={bonusThirdPlace}
                            onChange={(e) => setBonusThirdPlace(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-100"
                          >
                            <option value="">-- Select --</option>
                            {players.filter(p => p.teamId === selectedMatch.homeTeamId || p.teamId === selectedMatch.awayTeamId).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-500 italic p-2 text-center bg-slate-950 rounded-lg border border-slate-800 border-dashed">
                    Match must be 'Full-Time' to allocate awards and bonus points.
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveMatchStats}
              className="w-full bg-gradient-to-r from-[#800020] via-rose-900 to-amber-700 text-amber-300 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40 hover:brightness-110 active:scale-[0.99] transition-all"
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

          {/* RAPID QUICK GOAL TRIGGER BAR */}
          <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-400 tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>⚡ Instant Quick Goal Action</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Instant Score Update + Follow-up Details</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickGoal('home')}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
              >
                <span className="text-xl">⚽</span>
                <span>+1 {selectedMatch.homeTeam?.shortName || 'HOME'} Goal</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickGoal('away')}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-emerald-400/40"
              >
                <span className="text-xl">⚽</span>
                <span>+1 {selectedMatch.awayTeam?.shortName || 'AWAY'} Goal</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <button
              onClick={() => handleOpenEventModal('Goal', 'standard')}
              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-emerald-400/30"
            >
              <span className="text-2xl">⚽</span>
              <span>GOAL</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Goal', 'penalty')}
              className="p-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-teal-400/30"
            >
              <span className="text-2xl">🎯</span>
              <span>PENALTY</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Goal', 'own_goal')}
              className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-purple-400/30"
            >
              <span className="text-2xl">🔴⚽</span>
              <span>OWN GOAL</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('penalty_miss')}
              className="p-3.5 rounded-2xl bg-rose-700 hover:bg-rose-600 text-white font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-rose-400/30"
            >
              <span className="text-2xl">❌🥅</span>
              <span>PEN. MISS</span>
            </button>

            <button
              onClick={() => handleOpenEventModal('Yellow Card')}
              className="p-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex flex-col items-center gap-1.5 shadow-lg hover:scale-105 transition-all cursor-pointer border border-amber-500/30"
            >
              <span className="text-2xl">🟨</span>
              <span>YELLOW</span>
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

      {/* MODULE: LIVE PLAYER RATINGS (1.0 - 10.0) */}
      {adminTab === 'ratings' && selectedMatch && (
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Real-Time Live Player Performance Ratings</span>
                <span className="bg-[#800020] text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Matchday {selectedMatch.matchday}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Assign performance ratings (1.0 - 10.0) for match players. Color codes: Red (&lt;5.0), Orange (5.0-6.9), Green (7.0-8.4), Blue (8.5+).
              </p>
            </div>

            <button
              onClick={async () => {
                try {
                  await api.saveRatings(selectedMatch.id, ratingsState);
                  showToast('Player ratings saved & updated across public views!');
                  onRefreshAll();
                } catch (e: any) {
                  showToast(`Error saving ratings: ${e.message}`);
                }
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Save Player Ratings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HOME TEAM PLAYERS */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
                  <img src={selectedMatch.homeTeam?.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span>{selectedMatch.homeTeam?.name || 'Home Team'} Roster</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">Home Squad</span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {players
                  .filter(p => p.teamId === selectedMatch.homeTeamId)
                  .map(p => {
                    const currentVal = ratingsState[p.id] ?? 6.5;
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                          <div>
                            <div className="text-xs font-bold text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">#{p.shirtNumber} • {p.position}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <RatingBadge rating={currentVal} size="sm" showLabel={false} />
                          <input
                            type="number"
                            min="1.0"
                            max="10.0"
                            step="0.1"
                            value={currentVal}
                            onChange={(e) => {
                              const v = Math.min(10, Math.max(1, Number(e.target.value)));
                              setRatingsState(prev => ({ ...prev, [p.id]: v }));
                            }}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 text-center"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* AWAY TEAM PLAYERS */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
                  <img src={selectedMatch.awayTeam?.logoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span>{selectedMatch.awayTeam?.name || 'Away Team'} Roster</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">Away Squad</span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {players
                  .filter(p => p.teamId === selectedMatch.awayTeamId)
                  .map(p => {
                    const currentVal = ratingsState[p.id] ?? 6.5;
                    return (
                      <div key={p.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                          <div>
                            <div className="text-xs font-bold text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">#{p.shirtNumber} • {p.position}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <RatingBadge rating={currentVal} size="sm" showLabel={false} />
                          <input
                            type="number"
                            min="1.0"
                            max="10.0"
                            step="0.1"
                            value={currentVal}
                            onChange={(e) => {
                              const v = Math.min(10, Math.max(1, Number(e.target.value)));
                              setRatingsState(prev => ({ ...prev, [p.id]: v }));
                            }}
                            className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 text-center"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
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

      {adminTab === 'potm' && (isSuperAdmin || isOfficialLeague) && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Player of the Month (POTM)
            </h2>
            <p className="text-sm text-slate-400 mt-1">Upload and manage the Player of the Month award graphics.</p>
          </div>
          <PotmManager players={players} teams={teams} />
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
                        setTeamFormCoachPhotoUrl('');
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
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coach Profile Picture URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://example.com/coach.jpg"
                      value={teamFormCoachPhotoUrl}
                      onChange={(e) => setTeamFormCoachPhotoUrl(e.target.value)}
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
                        setTeamFormCoachPhotoUrl('');
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
                          setTeamFormCoachPhotoUrl(t.coachPhotoUrl || '');
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

      {/* MODULE: SQUAD MANAGER (SQUADS & PLAYERS MANAGEMENT) */}
      {adminTab === 'squads' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-400" />
                Team Squad Manager & Roster Control
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect players in every team, edit player details, update squad photos, transfer or remove players from team rosters.
              </p>
            </div>

            {/* Team Roster Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={playerRosterTeamFilter}
                onChange={(e) => setPlayerRosterTeamFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 font-extrabold text-amber-300 text-xs rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="all">All Teams ({players.length} Players)</option>
                {teams.map(t => {
                  const count = players.filter(p => p.teamId === t.id).length;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({count} Players)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Team Info Header if team selected */}
          {playerRosterTeamFilter !== 'all' && (() => {
            const currentTeam = teams.find(t => t.id === playerRosterTeamFilter);
            if (!currentTeam) return null;
            const teamPlayers = players.filter(p => p.teamId === currentTeam.id);
            const gkCount = teamPlayers.filter(p => p.position === 'GK').length;
            const defCount = teamPlayers.filter(p => p.position === 'DEF').length;
            const midCount = teamPlayers.filter(p => p.position === 'MID').length;
            const fwdCount = teamPlayers.filter(p => p.position === 'FWD').length;

            return (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={currentTeam.logoUrl} alt={currentTeam.name} className="w-14 h-14 rounded-2xl object-contain bg-slate-900 p-1.5 border border-amber-400/40 shadow-lg" />
                  <div>
                    <h4 className="font-black text-base text-amber-300 flex items-center gap-2">
                      <span>{currentTeam.name}</span>
                      <span className="text-slate-400 font-mono text-xs">({currentTeam.shortName})</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Head Coach: <strong className="text-slate-200">{currentTeam.coach}</strong> &bull; Stadium: <strong className="text-slate-200">{currentTeam.stadium}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Players</span>
                    <span className="text-sm font-black text-amber-300">{teamPlayers.length}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">GK / DEF / MID / FWD</span>
                    <span className="text-xs font-extrabold text-slate-200">{gkCount} GK • {defCount} DEF • {midCount} MID • {fwdCount} FWD</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Player Roster Grid & Edit Modal Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Add / Edit Player Form */}
            <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-black text-sm uppercase text-amber-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>{editingPlayerId ? 'Edit Player Squad Details' : 'Register New Player'}</span>
                </h4>
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
                    className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSavePlayerProfile} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Player Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Segun Samson"
                    value={playerFormName}
                    onChange={(e) => setPlayerFormName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Team *</label>
                    <select
                      value={playerFormTeamId || (playerRosterTeamFilter !== 'all' ? playerRosterTeamFilter : teams[0]?.id)}
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
                      onChange={(e) => setPlayerFormPos(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-100 cursor-pointer"
                    >
                      <option value="GK">🧤 Goalkeeper (GK)</option>
                      <option value="DEF">🛡️ Defender (DEF)</option>
                      <option value="MID">⚙️ Midfielder (MID)</option>
                      <option value="FWD">⚽ Forward (FWD)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shirt Number (#)</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={playerFormShirt}
                      onChange={(e) => setPlayerFormShirt(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nationality</label>
                    <input
                      type="text"
                      placeholder="e.g. Nigeria"
                      value={playerFormNationality}
                      onChange={(e) => setPlayerFormNationality(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Player Profile Photo</label>
                  <MediaUploader
                    currentUrl={playerFormPhoto}
                    onMediaSelect={(url) => setPlayerFormPhoto(url)}
                    label="Upload Player Photo"
                    presetCategory="player_photo"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPlayer}
                  className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isSavingPlayer ? (
                    <span>Saving Squad Data...</span>
                  ) : (
                    <span>{editingPlayerId ? 'Save Updated Player Info' : 'Add Player to Squad'}</span>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Interactive Squad Players Roster */}
            <div className="lg:col-span-7 space-y-3 max-h-[750px] overflow-y-auto pr-1 no-scrollbar">
              {(() => {
                const filteredPlayers = players.filter(p => playerRosterTeamFilter === 'all' || p.teamId === playerRosterTeamFilter);

                if (filteredPlayers.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-bold text-xs">No players found in this team squad.</p>
                      <p className="text-[11px] text-slate-500">Use the form on the left to add players to this squad.</p>
                    </div>
                  );
                }

                const allFilteredSelected = filteredPlayers.length > 0 && filteredPlayers.every(p => selectedPlayerIds.includes(p.id));

                return (
                  <div className="space-y-3">
                    {/* Bulk Selection & Action Bar */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md shadow-md">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 hover:text-white select-none">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const filteredIds = filteredPlayers.map(p => p.id);
                                setSelectedPlayerIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                              } else {
                                const filteredSet = new Set(filteredPlayers.map(p => p.id));
                                setSelectedPlayerIds(prev => prev.filter(id => !filteredSet.has(id)));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500"
                          />
                          <span>Select All ({filteredPlayers.length})</span>
                        </label>

                        {selectedPlayerIds.length > 0 && (
                          <span className="text-xs font-mono font-bold bg-amber-400/10 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                            {selectedPlayerIds.length} Selected
                          </span>
                        )}
                      </div>

                      {selectedPlayerIds.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPlayerIds([])}
                            className="text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                          >
                            Deselect All
                          </button>

                          {showBulkDeletePlayerConfirm ? (
                            <div className="flex items-center gap-1.5 bg-rose-950 p-1 rounded-xl border border-rose-800">
                              <button
                                type="button"
                                disabled={isBulkDeletingPlayers}
                                onClick={handleBulkDeletePlayers}
                                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-[11px] font-black px-3 py-1 rounded-lg cursor-pointer"
                              >
                                {isBulkDeletingPlayers ? 'Deleting...' : `Confirm Delete (${selectedPlayerIds.length})`}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowBulkDeletePlayerConfirm(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowBulkDeletePlayerConfirm(true)}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Selected ({selectedPlayerIds.length})</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Players Roster */}
                    {filteredPlayers.map(p => {
                      const pTeam = teams.find(t => t.id === p.teamId);
                      const isSelected = selectedPlayerIds.includes(p.id);

                      return (
                        <div 
                          key={p.id} 
                          className={`p-4 rounded-2xl bg-slate-950 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isSelected ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-950/20' :
                            editingPlayerId === p.id ? 'border-amber-400 ring-1 ring-amber-400/50 bg-slate-900/90' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPlayerIds(prev => [...prev, p.id]);
                                } else {
                                  setSelectedPlayerIds(prev => prev.filter(id => id !== p.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500 shrink-0"
                            />
                            <img 
                              src={p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                              alt={p.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" 
                            />
                            <div>
                              <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                                <span>{p.name}</span>
                                <span className="text-amber-400 font-mono text-xs">#{p.shirtNumber}</span>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                                  {p.position}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>Club: <strong className="text-slate-300">{pTeam?.shortName || 'Free Agent'}</strong></span>
                                <span>•</span>
                                <span>Value: <strong className="text-emerald-400">₦{p.price || 6.0}M</strong></span>
                                <span>•</span>
                                <span>Goals: <strong className="text-amber-300">{p.goals || 0}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                            {/* Edit Player Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPlayerId(p.id);
                                setPlayerFormName(p.name);
                                setPlayerFormTeamId(p.teamId);
                                setPlayerFormPos(p.position);
                                setPlayerFormShirt(p.shirtNumber || 10);
                                setPlayerFormPhoto(p.photoUrl || '');
                                setPlayerFormHeight(p.height || '180 cm');
                                setPlayerFormWeight(p.weight || '75 kg');
                                setPlayerFormNationality(p.nationality || 'Nigeria');
                                setPlayerFormBio(p.bio || '');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Player Button */}
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
                                title="Delete Player from Squad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
                League Branding & About Page Controls
              </h3>
              <p className="text-xs text-slate-400">
                Customize the app title, logo icon, primary theme color, season label, and about page content.
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

              <div className="pt-6 border-t border-slate-800">
                <h4 className="text-lg font-bold text-amber-300 mb-4">About Page Content</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Our Vision Text
                    </label>
                    <textarea
                      value={visionText}
                      onChange={(e) => setVisionText(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500"
                      placeholder="Enter the vision and overview of the league..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-3">
                      Leadership & Governance Roster (3 Slots)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[0, 1, 2].map(index => (
                        <div key={index} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                          <div className="text-amber-400 font-bold text-xs">Slot {index + 1}</div>
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase mb-1">Name</label>
                            <input
                              type="text"
                              value={leadership[index]?.name || ''}
                              onChange={(e) => {
                                const newLeadership = [...leadership];
                                newLeadership[index] = { ...newLeadership[index], name: e.target.value };
                                setLeadership(newLeadership);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase mb-1">Role</label>
                            <input
                              type="text"
                              value={leadership[index]?.role || ''}
                              onChange={(e) => {
                                const newLeadership = [...leadership];
                                newLeadership[index] = { ...newLeadership[index], role: e.target.value };
                                setLeadership(newLeadership);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase mb-1">Profile Picture</label>
                            <MediaUploader
                              currentUrl={leadership[index]?.imageUrl || ''}
                              onSelectUrl={(url) => {
                                const newLeadership = [...leadership];
                                newLeadership[index] = { ...newLeadership[index], imageUrl: url };
                                setLeadership(newLeadership);
                              }}
                              label="Upload Avatar"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                <Save className="w-5 h-5" />
                <span>Save League Branding & About Content</span>
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
              const defaultStatus = 'published';
              const defaultPublished = true;
              const finalAuthor = isOfficialLeague ? 'EPL Official' : (newsAuthor || currentAdmin?.name || 'Segun Samson');
              const finalAuthorTitle = isOfficialLeague ? '' : (newsAuthorTitle || 'Senior Football Writer');

              const saved = await api.saveNews({
                ...(editingNewsId ? { id: editingNewsId } : {}),
                title: newsTitle,
                subtitle: newsSubtitle,
                summary: newsSummary || newsContent.slice(0, 140),
                content: newsContent,
                coverImage: newsCoverUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
                category: newsCategory,
                issueLabel: newsIssueLabel || 'EPL Dispatch',
                readTime: newsReadTime || '3 min read',
                author: finalAuthor,
                authorTitle: finalAuthorTitle,
                authorAvatar: newsAuthorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                isSubstackExclusive: newsIsSubstackExclusive,
                featured: newsFeatured,
                status: defaultStatus,
                isPublished: defaultPublished,
                authorRole: isOfficialLeague ? 'official_league' : (currentAdmin?.role || 'news_reporter'),
                authorEmail: currentUserEmail
              });

              showToast(editingNewsId ? 'Article updated and published live!' : 'Article published live to news feed!');

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
                {isOfficialLeague ? (
                  <div className="w-full bg-slate-950/90 border border-amber-500/50 rounded-xl px-3 py-2 text-xs font-black text-amber-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>EPL Official</span>
                      <VerifiedBadge role="official_league" />
                    </span>
                    <span className="text-[10px] text-amber-400/80 uppercase font-mono tracking-wide">Locked</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={newsAuthor}
                    onChange={(e) => setNewsAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100"
                  />
                )}
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
                {editingNewsId ? 'Update & Publish Dispatch Live' : 'Publish Substack Dispatch Live'}
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
                            <span className="flex items-center gap-1">
                              Author: <strong className="text-slate-200">{item.author}</strong>
                              <VerifiedBadge role={item.authorRole || (item.author?.toLowerCase().includes("official") ? 'official_league' : 'news_reporter')} />
                            </span>
                            <span>&bull;</span>
                            <span>{new Date(item.date).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos' })}</span>
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
                                      isPublished: true,
                                      isSuperAdminAction: true
                                    } as any);
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
                                      isPublished: false,
                                      isSuperAdminAction: true
                                    } as any);
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
                        {(isSuperAdmin || isOfficialLeague || item.authorEmail === currentUserEmail || (currentAdmin?.role === 'news_reporter' && item.authorEmail === currentUserEmail)) && (
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
                        )}

                        {/* DELETE BUTTON (SUPER ADMIN, OFFICIAL LEAGUE, OR AUTHOR) */}
                        {(isSuperAdmin || isOfficialLeague || item.authorEmail === currentUserEmail || (currentAdmin?.role === 'news_reporter' && item.authorEmail === currentUserEmail)) && (
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

      {/* MODULE: EPL HIGHLIGHTS */}
      {adminTab === 'highlights' && (isSuperAdmin || isOfficialLeague) && (
        <EplHighlightAdmin currentAdmin={currentAdmin} showToast={showToast} />
      )}

      {/* MODULE: VIDEOS HUB */}
      {adminTab === 'videos' && (isSuperAdmin || isOfficialLeague) && (
        <VideoHighlightsAdmin currentAdmin={currentAdmin} showToast={showToast} />
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
                      <option value="official_league">Official League (Media & Official Content)</option>
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
                const isMainSuperAdmin = (adm.email || '').toLowerCase() === 'itzjeda10@gmail.com';
                const isSelf = (adm.email || '').toLowerCase() === (currentUserEmail || '').toLowerCase();

                return (
                  <div key={adm.email} className="p-5 rounded-2xl border bg-slate-950 border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-100">{adm.name || adm.email.split('@')[0]}</span>
                        {isMainSuperAdmin ? (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">Founder Super Admin</span>
                        ) : adm.role === 'super_admin' ? (
                          <span className="bg-amber-400/30 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-amber-400/40">Super Admin</span>
                        ) : (adm.role === 'official_league' || adm.role === 'OFFICIAL_LEAGUE' || adm.role === 'spokesperson') ? (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-amber-500/40 flex items-center gap-1">
                            Official League
                            <VerifiedBadge role="official_league" />
                          </span>
                        ) : adm.role === 'news_reporter' ? (
                          <span className="bg-purple-900/80 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-purple-700 flex items-center gap-1">
                            News Reporter
                            <VerifiedBadge role="news_reporter" />
                          </span>
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

      {/* MODULE: LINEUPS BUILDER */}
      {adminTab === 'lineups' && (
        <LineupBuilder
          matches={matches}
          teams={teams}
          players={players}
          onSuccess={onRefreshAll}
          onShowToast={showToast}
          onClose={() => setAdminTab('controller')}
        />
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

                {/* Competition Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Competition Type *</label>
                  <select
                    value={fixtureFormCompetitionType}
                    onChange={(e) => setFixtureFormCompetitionType(e.target.value as 'League' | 'Cup')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-100 cursor-pointer focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="League">League (Standings)</option>
                    <option value="Cup">Cup (Knockout Bracket)</option>
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
                              <td className="py-2.5 px-3 font-mono text-slate-300">{item.date} @ {item.time} WAT</td>
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
                      <span>{m.date} @ {m.time} WAT</span>
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

      {/* BULK DATA INGESTION TAB (SUPER ADMIN RESTRICTED) */}
      {adminTab === 'bulk_upload' && (
        <BulkUploadManager
          teams={teams}
          onSuccess={onRefreshAll}
          onShowToast={showToast}
        />
      )}

      {adminTab === 'bulk_teams' && (
        <BulkTeamUploadManager
          teams={teams}
          onSuccess={onRefreshAll}
          onShowToast={showToast}
        />
      )}

      {adminTab === 'availability' && (
        <PlayerAvailabilityManager
          players={players}
          teams={teams}
          onRefresh={onRefreshAll}
          onShowToast={showToast}
        />
      )}

      {/* ADS MANAGER TAB (SUPER ADMIN RESTRICTED) */}
      {adminTab === 'ads' && (
        <AdsManager
          onShowToast={showToast}
        />
      )}

      {/* PLAYER VALUATION CONTROL TAB */}
      {adminTab === 'valuations' && (
        <PlayerValuationManager
          players={players}
          teams={teams}
          onRefresh={onRefreshAll}
          onShowToast={showToast}
        />
      )}

      {/* QUICK GOAL FOLLOW-UP DETAILS MODAL */}
      {quickGoalModalOpen && quickGoalData && selectedMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xl flex items-center justify-center">
                  ⚽
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>Goal Details: {quickGoalData.teamName}</span>
                  </h3>
                  <p className="text-xs text-emerald-400 font-bold">
                    Score Live: {selectedMatch.homeTeam?.shortName} {quickGoalData.newHomeScore} - {quickGoalData.newAwayScore} {selectedMatch.awayTeam?.shortName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuickGoalModalOpen(false);
                  setQuickGoalData(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-amber-300">Live Score Updated Successfully!</div>
              <div>Optionally tag the Goalscorer and Assist provider to log player stats, fantasy points, and feed ticker details.</div>
            </div>

            <div className="space-y-4">
              {/* Goalscorer Dropdown */}
              <div>
                <label className="text-xs font-bold text-amber-300 uppercase block mb-1">
                  Goal Scorer ({quickGoalData.teamName})
                </label>
                <select
                  value={quickGoalPlayerId}
                  onChange={(e) => setQuickGoalPlayerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Goal Scorer --</option>
                  {players
                    .filter(p => p.teamId === quickGoalData.teamId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.shirtNumber} {p.name} ({p.position})
                      </option>
                    ))}
                </select>
              </div>

              {/* Assist Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Assist Provider (Optional)
                </label>
                <select
                  value={quickGoalAssisterId}
                  onChange={(e) => setQuickGoalAssisterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Unassisted / No Assist --</option>
                  {players
                    .filter(p => p.teamId === quickGoalData.teamId && p.id !== quickGoalPlayerId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.shirtNumber} {p.name} ({p.position})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Goal Type */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Goal Type
                  </label>
                  <select
                    value={quickGoalType}
                    onChange={(e) => setQuickGoalType(e.target.value as GoalType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 cursor-pointer"
                  >
                    <option value="standard">Standard Regular</option>
                    <option value="penalty">Penalty Kick</option>
                    <option value="freekick">Free Kick</option>
                    <option value="header">Header</option>
                    <option value="own_goal">Own Goal</option>
                  </select>
                </div>

                {/* Minute */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Match Minute
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={quickGoalMinute}
                    onChange={(e) => setQuickGoalMinute(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setQuickGoalModalOpen(false);
                  setQuickGoalData(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Skip Details
              </button>
              <button
                type="button"
                disabled={quickGoalSavingDetails}
                onClick={handleSaveQuickGoalDetails}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {quickGoalSavingDetails ? 'Saving Event...' : 'Save Goal Details & Event'}
              </button>
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

          
      {adminTab === 'fantasy_config' && (
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-6 backdrop-blur-sm text-slate-100">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Fantasy League Control
            </h3>
            <p className="text-xs text-slate-400">
              Manage marketplace adjustments, budget configurations, global metrics, and chip usage overview.
            </p>
          </div>
          
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
             <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-800">
               <Sliders className="w-8 h-8 text-amber-400 opacity-50" />
             </div>
             <div>
               <h4 className="font-bold text-lg text-white">Fantasy Engine Configuration</h4>
               <p className="text-sm text-slate-500 max-w-md mt-2">
                 Marketplace budget algorithms, chip tracking metrics, and points engine parameters are active. Global metrics will be generated after Gameweek 1.
               </p>
             </div>
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
               <div className="flex items-center gap-2">
                 <label className="text-white text-sm font-medium">Gameweek:</label>
                 <input 
                   type="number" 
                   min="1" 
                   value={finalizeGameweekId}
                   onChange={e => setFinalizeGameweekId(parseInt(e.target.value) || 1)}
                   className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-white text-sm"
                 />
               </div>
               <button 
                 onClick={async () => {
                   if (!confirm(`Are you sure you want to Finalize Gameweek ${finalizeGameweekId}? This runs auto-subs, locks scores with strict BPS from live controllers, and is irreversible.`)) return;
                   try {
                     const res = await fetch('/api/admin/finalize-gameweek', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ gameweekId: finalizeGameweekId })
                     });
                     
                     const data = await res.json();
                     if (!res.ok) throw new Error(data.error || 'Failed to finalize gameweek');
                     
                     showToast(`Gameweek ${finalizeGameweekId} Finalized! Auto-subs executed and points locked.`);
                     onRefreshAll();
                   } catch (err: any) {
                     showToast(`Error: ${err.message}`);
                   }
                 }}
                 className="px-6 py-2 bg-[#800020] hover:bg-rose-900 text-white font-bold text-sm rounded-xl border border-rose-800 cursor-pointer shadow-lg transition-colors"
               >
                 Finalize Gameweek {finalizeGameweekId} (Auto-Sub & Lock)
               </button>
             </div>
          </div>
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
