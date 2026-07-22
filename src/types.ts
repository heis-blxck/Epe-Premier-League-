export type AdminRole = 'super_admin' | 'sub_admin' | 'news_reporter';
export type UserRole = 'super_admin' | 'sub_admin' | 'news_reporter' | 'fan';
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
  notificationsEnabled: boolean;
  themePreference: ThemeMode;
  avatarUrl?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'match_goal' | 'match_period' | 'news' | 'system' | 'admin_alert';
  timestamp: string;
  read: boolean;
  linkMatchId?: string;
}

export type MatchStatus = 'Scheduled' | 'Live' | 'Half-Time' | 'Full-Time';
export type MatchPeriod = 'Pre-Match' | '1st Half' | 'Half-Time' | '2nd Half' | 'Full-Time';
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type EventType = 'Goal' | 'Yellow Card' | 'Red Card' | 'Sub' | 'Own Goal' | 'Penalty Goal';

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

export interface AppSettings {
  appName: string;
  appLogoUrl: string;
  primaryColor: string;
  accentColor: string;
  defaultTheme: ThemeMode;
  leagueSeason: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
  goals: number;
  assists: number;
  cleanSheets: number;
  photoUrl: string;
  shirtNumber: number;
  ratingAverage?: number;
  age?: number;
  height?: string;
  weight?: string;
  preferredFoot?: 'Right' | 'Left' | 'Both';
  nationality?: string;
  bio?: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerName?: string;
  eventType: EventType;
  minute: number;
  detail?: string;
  assisterId?: string;
  assisterName?: string;
  subInPlayerId?: string;
  subInPlayerName?: string;
}

export interface LineupPlayer {
  playerId: string;
  name: string;
  number: number;
  position: PlayerPosition;
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
  date: string;
  time: string;
  venue: string;
  matchday: number;
  homeLineup?: MatchLineup;
  awayLineup?: MatchLineup;
  events?: MatchEvent[];
  ratings?: Record<string, number>; // playerId -> rating out of 10
  stats?: MatchStats;
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
  content: string;
  coverImage: string;
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
  comments?: ArticleComment[];
}

export interface LeagueStats {
  topScorers: Player[];
  topAssists: Player[];
  cleanSheets: Player[];
}
