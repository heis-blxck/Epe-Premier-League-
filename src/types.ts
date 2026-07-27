export type AdminRole = 'super_admin' | 'sub_admin' | 'news_reporter' | 'spokesperson' | 'official_league' | 'OFFICIAL_LEAGUE';
export type UserRole = 'super_admin' | 'sub_admin' | 'news_reporter' | 'spokesperson' | 'official_league' | 'OFFICIAL_LEAGUE' | 'fan';
export type ThemeMode = 'dark' | 'light';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  appointedAt: string;
  appointedBy?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  favoriteTeamId?: string;
  fantasyTeamName?: string;
  notificationsEnabled: boolean;
  themePreference: ThemeMode;
  avatarUrl?: string;
  createdAt: string;
}

export type WhitelistedNotificationEvent =
  | 'Fixtures'
  | 'Kickoff'
  | 'Halftime'
  | 'Full-Time'
  | 'Penalty Shootout'
  | 'Goal'
  | 'Red Card'
  | 'Penalty awarded'
  | 'Player Transfer'
  | 'Published News'
  | 'MOTM'
  | 'POTW'
  | 'Player of the Month Uploads'
  | 'Lineups Published'
  | 'Sponsored Ad Broadcasts';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'match_goal' | 'match_period' | 'news' | 'system' | 'admin_alert' | 'ad_broadcast';
  eventType: WhitelistedNotificationEvent;
  timestamp: string;
  read: boolean;
  linkMatchId?: string;
  idempotencyKey?: string;
}

export type MatchStatus = 'Scheduled' | 'Live' | 'Half-Time' | 'Full-Time' | 'Penalties';
export type CompetitionType = 'League' | 'Cup';
export type MatchPeriod = 'Pre-Match' | '1st Half' | 'Half-Time' | '2nd Half' | 'Full-Time';
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type EventType = 'Goal' | 'Yellow Card' | 'Red Card' | 'Sub' | 'penalty_miss';
export type GoalType = 'standard' | 'penalty' | 'own_goal';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  points: number;
  goalDifference: number;
  matchesPlayed: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  coach: string;
  coachPhotoUrl?: string;
  stadium: string;
  manualOverride?: boolean;
  pointsDeduction?: number;
}

export interface Advertisement {
  id: string;
  companyName: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  position: 'top' | 'sidebar' | 'footer';
}

export interface AppSettings {
  appName: string;
  appLogoUrl: string;
  primaryColor: string;
  accentColor: string;
  defaultTheme: ThemeMode;
  leagueSeason: string;
  visionText?: string;
  leadership?: {
    name: string;
    role: string;
    imageUrl: string;
  }[];
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
  goals: number;
  assists: number;
  cleanSheets: number;
  cupGoals?: number;
  cupAssists?: number;
  cupCleanSheets?: number;
  photoUrl: string;
  shirtNumber: number;
  ratingAverage?: number;
  fantasyPoints?: number;
  bonusPoints?: number;
  price?: number; // e.g. 8.5 (₦m)
  isSuspended?: boolean;
  suspensionWeeks?: number; // 1 or 2 gameweeks
  isInjured?: boolean;
  injuryStatus?: 'Fit' | 'Injured' | 'Doubtful';
  age?: number;
  height?: string;
  weight?: string;
  preferredFoot?: 'Right' | 'Left' | 'Both';
  nationality?: string;
  bio?: string;
  goalsConceded?: number;
}

export interface FixtureChatMessage {
  id: string;
  matchId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  timestamp: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerName?: string;
  eventType: EventType;
  goalType?: GoalType;
  minute: number;
  detail?: string;
  assisterId?: string;
  assisterName?: string;
  subInPlayerId?: string;
  subInPlayerName?: string;
  skipScoreIncrement?: boolean;
}

export type TacticalPositionTag = 'GK' | 'LB' | 'CB' | 'RB' | 'DM' | 'CM' | 'LM' | 'RM' | 'CAM' | 'LW' | 'RW' | 'ST';

export interface LineupPlayer {
  playerId: string;
  name: string;
  number: number;
  position: TacticalPositionTag | PlayerPosition | string;
  isCaptain?: boolean;
  rating?: number;
}

export interface MatchLineup {
  teamId: string;
  formation: string; // e.g. '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3'
  startingXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface MatchStats {
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  period: MatchPeriod;
  matchMinute: number;
  stoppageTime1stHalf?: number;
  stoppageTime2ndHalf?: number;
  firstHalfStartTime?: string | number | null;
  secondHalfStartTime?: string | number | null;
  firstHalfStoppage?: number;
  secondHalfStoppage?: number;
  date: string;
  time: string;
  venue: string;
  matchday: number;
  competition_type?: CompetitionType;
  homePenalties?: number;
  awayPenalties?: number;
  motmPlayerId?: string;
  manOfTheMatchPlayerId?: string;
  motmGraphicUrl?: string;
  bonusPointsAllocations?: { firstPlacePlayerId?: string; secondPlacePlayerId?: string; thirdPlacePlayerId?: string; };
  fantasyBonus1stPlayerId?: string;
  fantasyBonus2ndPlayerId?: string;
  fantasyBonus3rdPlayerId?: string;
  cupRound?: 'Knockout Round 1' | 'Semi-Finals' | 'Final';
  cupMatchCode?: 'Match A' | 'Match B' | 'Semi 1' | 'Semi 2' | 'Final';
  homeLineup?: MatchLineup;
  awayLineup?: MatchLineup;
  events?: MatchEvent[];
  ratings?: Record<string, number>; // playerId -> rating out of 10
  stats?: MatchStats;
}

export interface FantasySquad {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  squadName: string;
  captainPlayerId: string;
  viceCaptainPlayerId?: string;
  startingPlayerIds?: string[];
  benchPlayerIds?: string[];
  playerIds: string[];
  savedBaselinePlayerIds?: string[];
  transfersMade?: number;
  freeTransfers?: number;
  pointHits?: number;
  totalPoints: number;
  gameweekPoints: number;
  activeChip?: 'TC' | 'BB' | 'WC' | null;
  updatedAt: string;
}

export type PredictionType = 'Home Win' | 'Draw' | 'Away Win';

export interface MatchPrediction {
  id: string;
  matchId: string;
  userSessionId: string;
  predictionType: PredictionType;
  createdAt: string;
}

export interface MatchPredictionStats {
  matchId: string;
  totalVotes: number;
  homeWinVotes: number;
  drawVotes: number;
  awayWinVotes: number;
  homeWinPercent: number;
  drawPercent: number;
  awayWinPercent: number;
  userVote?: PredictionType | null;
}

export interface MiniLeague {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  memberEmails: string[];
  createdAt: string;
}

export interface ArticleComment {
  id: string;
  authorName: string;
  authorEmail?: string;
  avatarUrl?: string;
  content: string;
  timestamp: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  subtitle?: string;
  summary: string;
  summaryExcerpt?: string; // Stage 2 Teaser
  content: string;
  fullBodyContent?: string; // Stage 3 full article
  coverImage: string;
  coverImageUrl?: string;
  publishedAt: string;
  author: string;
  authorAvatar?: string;
  authorTitle?: string;
  category: string;
  readTime?: string;
  issueLabel?: string;
  isSubstackExclusive?: boolean;
  likesCount?: number;
  featured?: boolean;
  isPublished?: boolean;
  status?: 'draft' | 'pending_approval' | 'published';
  authorRole?: string;
  authorEmail?: string;
  comments?: ArticleComment[];
}

export interface LeagueStats {
  topScorers: Player[];
  topAssists: Player[];
  cleanSheets: Player[];
  topPerformers?: Player[];
  cupTopScorers?: Player[];
  cupTopAssists?: Player[];
  cupCleanSheets?: Player[];
  cupTopPerformers?: Player[];
}

export interface PlayerOfTheMonth {
  id: string;
  month: string;
  playerName: string;
  teamLogoUrl: string;
  position: string;
  score: string;
  headline: string;
  description: string;
  graphicUrl: string;
  createdAt: string;
}

export interface ManagerChips {
  userId: string;
  tripleCaptainAvailable: boolean;
  tripleCaptainUsedGw?: number;
  benchBoostAvailable: boolean;
  benchBoostUsedGw?: number;
  wildcardAvailable: boolean;
  wildcardUsedGw?: number;
  activeChipPending?: 'TC' | 'BB' | 'WC' | null;
}

export interface EplHighlight {
  id: string;
  posterImageUrl: string;
  writeup: string;
  likesCount: number;
  author?: string;
  authorRole?: string;
  authorEmail?: string;
}

export interface MatchVideo {
  id: string;
  embed_url: string;
  thumbnail_url: string;
  source_platform: 'TikTok' | 'YouTube' | 'X/Twitter' | 'Instagram' | 'Other';
  title: string;
  description?: string;
  created_at: string;
  likesCount?: number;
  author?: string;
  authorRole?: string;
  authorEmail?: string;
}

