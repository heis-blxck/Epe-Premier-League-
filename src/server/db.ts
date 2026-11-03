import fs from 'fs';
import { EventEmitter } from 'events';
import path from 'path';
import { supabase, isSupabaseConfigured } from '../supabase';

function isMissingSchemaError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || err.details || '').toLowerCase();
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the') ||
    msg.includes('schema cache')
  );
}

function stableStringify(obj: any): string {
  if (obj === undefined) return 'undefined';
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(item => item === undefined ? 'null' : stableStringify(item)).join(',')}]`;
  const keys = Object.keys(obj).sort();
  const parts = [];
  for (let i = 0; i < keys.length; i++) {
      const val = obj[keys[i]];
      if (val !== undefined) {
          parts.push(JSON.stringify(keys[i]) + ':' + stableStringify(val));
      }
  }
  return '{' + parts.join(',') + '}';
}

/**
 * Recursively sanitizes an object to remove/default 'undefined' fields for Firestore
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val === undefined) {
      cleanObj[key] = null;
    } else if (val !== null && typeof val === 'object') {
      cleanObj[key] = sanitizeForFirestore(val);
    } else {
      cleanObj[key] = val;
    }
  }
  return cleanObj as T;
}

import { Team, Player, Match, MatchEvent, NewsArticle, AdminUser, UserAccount, AppNotification, AppSettings, MatchPrediction, MatchPredictionStats, PredictionType, FantasySquad, MiniLeague, MatchLineup, LineupPlayer, Advertisement, PlayerOfTheMonth, ManagerChips, FixtureChatMessage, MatchVideo, PredictorLeaderboardEntry, PredictionBreakdown } from '../types';

export interface ScorePredictionRecord {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  userEmail?: string;
  userName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  teams: Team[];
  players: Player[];
  matches: Match[];
  events: MatchEvent[];
  ratings: Record<string, Record<string, number>>; // matchId -> (playerId -> rating)
  news: NewsArticle[];
  admins: AdminUser[];
  users: UserAccount[];
  notifications: AppNotification[];
  dispatchedNotificationKeys?: string[];
  settings?: AppSettings;
  fantasySquads?: FantasySquad[];
  miniLeagues?: MiniLeague[];
  predictions?: MatchPrediction[];
  scorePredictions?: ScorePredictionRecord[];
  advertisements?: Advertisement[];
  playerOfTheMonth?: PlayerOfTheMonth[];
  managerChips?: ManagerChips[];
  fixture_chats?: FixtureChatMessage[];
  match_videos?: MatchVideo[];
  epl_highlights?: any[];
  playerVersion?: number;
}

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Epe Premier League',
  appLogoUrl: '/logo.png',
  primaryColor: '#800020',
  accentColor: '#FBB931',
  defaultTheme: 'dark',
  leagueSeason: '2026 Season',
  sponsor_logo_url: '',
  sponsorLogoUrl: '',
  visionText: 'The Epe Premier League (EPL) was established to revolutionize grassroots football by providing a professional, competitive, and highly organized platform for emerging talent. We believe in the power of the beautiful game to unite communities, inspire youth, and showcase the immense sporting potential within our region.\n\nThrough this digital transformation and the launch of our official application, we are bringing the excitement of the league directly to the fans. From real-time match tracking and dynamic league standings to an immersive Fantasy League experience, the EPL app bridges the gap between the pitch and the supporters, creating a deeply connected football ecosystem.',
  leadership: [
    {
      name: 'Mujib Bankole-Otedola',
      role: 'Committee Chair',
      imageUrl: ''
    },
    {
      name: 'Ayodele Adio',
      role: 'FA President',
      imageUrl: ''
    },
    {
      name: 'Ahmad Garbadeen',
      role: 'Lead Developer',
      imageUrl: ''
    }
  ]
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'epe_league_db.json');

const DELETED_SEED_TEAM_IDS = new Set([
  'team-epe-warriors',
  'team-lagos-city',
  'team-badagry-stars',
  'team-epe-academy',
  'team-lekki-lions'
]);

const DELETED_SEED_TEAM_NAMES = new Set([
  'epe warriors fc',
  'epe warriors',
  'lagos city fc',
  'lagos city',
  'badagry stars',
  'badagry stars fc',
  'epe academy fc',
  'epe academy',
  'lekki lions fc',
  'lekki lions'
]);

const INITIAL_TEAMS: Team[] = [];

const INITIAL_PLAYERS: Player[] = [];

const INITIAL_MATCHES: Match[] = [];

const INITIAL_EVENTS: MatchEvent[] = [];

const INITIAL_RATINGS: Record<string, Record<string, number>> = {};

const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin-super-1',
    name: 'Jeda (Super Admin)',
    email: 'itzjeda10@gmail.com',
    role: 'super_admin',
    appointedAt: '2026-01-01T00:00:00Z',
    appointedBy: 'System Registry'
  },
  {
    id: 'admin-fa-spokesperson',
    name: 'Official League FA Spokesperson',
    email: 'spokesperson@epeleague.com',
    role: 'official_league',
    appointedAt: '2026-01-01T00:00:00Z',
    appointedBy: 'System Registry'
  }
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-super-1',
    name: 'Jeda',
    email: 'itzjeda10@gmail.com',
    role: 'super_admin',
    createdAt: '2026-01-01T00:00:00Z',
    themePreference: 'light',
    notificationsEnabled: true
  },
  {
    id: 'user-fa-spokesperson',
    name: 'Official League FA Spokesperson',
    email: 'spokesperson@epeleague.com',
    role: 'official_league',
    createdAt: '2026-01-01T00:00:00Z',
    themePreference: 'light',
    notificationsEnabled: true
  }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export class DBStore extends EventEmitter {
  public data: DatabaseSchema;
  private lastFirestoreSyncState: Record<string, string> = {};
  private isFirestoreSynced: boolean = false;
  private isRecalculating: boolean = false;
  private consecutiveSyncFailures: number = 0;
  private maxConsecutiveSyncFailures: number = 5;
  private lastSyncFailureTime: number = 0;

  constructor() {
    super();
    this.ensureDataDir();
    this.data = this.loadData();
    // Ensure admins array exists
    if (!this.data.admins || !Array.isArray(this.data.admins)) {
      this.data.admins = INITIAL_ADMINS;
    } else {
      const exists = this.data.admins.some(a => a.email.toLowerCase() === 'itzjeda10@gmail.com');
      if (!exists) {
        this.data.admins.unshift(INITIAL_ADMINS[0]);
      }
    }

    if (!this.data.users || !Array.isArray(this.data.users)) {
      this.data.users = INITIAL_USERS;
    }
    if (!this.data.notifications || !Array.isArray(this.data.notifications)) {
      this.data.notifications = INITIAL_NOTIFICATIONS;
    }
    if (!this.data.settings) {
      this.data.settings = INITIAL_SETTINGS;
    }

    if (!this.data.teams) {
      this.data.teams = INITIAL_TEAMS;
    }
    if (!this.data.players) {
      this.data.players = INITIAL_PLAYERS;
    }
    if (!this.data.matches) {
    }

    this.sanitizeAndPurgeDeletedSeedTeams();
    this.recalculateLeagueStatsAndStandings();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      // Ignore EROFS in deployed environment
    }
  }

  public assertWritable(): void {
    if (isSupabaseConfigured && !this.isFirestoreSynced) {
      throw new Error('Database temporarily unavailable. Your change was NOT saved. Please try again.');
    }
  }

  public async forceFirestoreSync() {
    this.assertWritable();
    console.log('Forcing full Supabase sync from local db...');
    this.lastFirestoreSyncState = {}; // Clear cache so all documents get written
    this.saveData(this.data);
    
    if (isSupabaseConfigured) {
      try {
        const promises = [];
        const dataToSave = this.data;
        const collections = [
          { col: 'settings', getVal: (d: any) => [ { id: 'global', ...d.settings } ] },
          { col: 'teams', getVal: (d: any) => (d.teams || []) },
          { col: 'players', getVal: (d: any) => (d.players || []) },
          { col: 'matches', getVal: (d: any) => (d.matches || []) },
          { col: 'events', getVal: (d: any) => (d.events || []) },
          { col: 'news', getVal: (d: any) => (d.news || []) },
          { col: 'users', getVal: (d: any) => (d.users || []) },
          { col: 'admins', getVal: (d: any) => (d.admins || []) },
          { col: 'notifications', getVal: (d: any) => (d.notifications || []) },
          { col: 'ratings', getVal: (d: any) => Object.entries(d.ratings || {}).map(([id, rating]) => ({ id, rating })) },
          { col: 'predictions', getVal: (d: any) => (d.predictions || []) },
          { col: 'scorePredictions', getVal: (d: any) => (d.scorePredictions || []) },
          { col: 'fantasySquads', getVal: (d: any) => (d.fantasySquads || []) },
          { col: 'miniLeagues', getVal: (d: any) => (d.miniLeagues || []) },
          { col: 'advertisements', getVal: (d: any) => (d.advertisements || []) },
          { col: 'playerOfTheMonth', getVal: (d: any) => (d.playerOfTheMonth || []) },
          { col: 'managerChips', getVal: (d: any) => (d.managerChips || []) },
          { col: 'fixture_chats', getVal: (d: any) => (d.fixture_chats || []) },
          { col: 'match_videos', getVal: (d: any) => (d.match_videos || []) },
          { col: 'epl_highlights', getVal: (d: any) => (d.epl_highlights || []) }
        ];

        for (const colMap of collections) {
            const items = colMap.getVal(dataToSave);
            for (const item of items) {
                const sanitized = sanitizeForFirestore(item);
                const id = sanitized.id;
                if (!id) continue;
                promises.push(
                  supabase.from(colMap.col).upsert(sanitized, { onConflict: 'id' }).then(({ error }) => {
                    if (error && !isMissingSchemaError(error)) {
                      throw error;
                    }
                  })
                );
            }
        }
        await Promise.all(promises);
      } catch (err: any) {
        console.error('forceFirestoreSync failed:', err);
        throw new Error(`Supabase sync failed: ${err.message}`);
      }
    }
    return { success: true, message: 'Initiated full Supabase sync of all local data.' };
  }

  public sanitizeAndPurgeDeletedSeedTeams() {
    if (!this.data.teams) this.data.teams = [];

    if (!this.data.players) this.data.players = [];

  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    let loaded: DatabaseSchema | null = null;
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.admins) parsed.admins = INITIAL_ADMINS;
        if (!parsed.users) parsed.users = INITIAL_USERS;
        if (!parsed.notifications) parsed.notifications = INITIAL_NOTIFICATIONS;
        if (!parsed.settings) parsed.settings = INITIAL_SETTINGS;
        loaded = parsed;
      } catch (e) {
        console.error('Error reading database file, using seeds', e);
      }
    }
    const initial: DatabaseSchema = loaded || {
      teams: INITIAL_TEAMS,
      players: INITIAL_PLAYERS,
      matches: [],
      events: INITIAL_EVENTS,
      ratings: INITIAL_RATINGS,
      news: [],
      admins: INITIAL_ADMINS,
      users: INITIAL_USERS,
      notifications: INITIAL_NOTIFICATIONS,
      settings: INITIAL_SETTINGS
    };
    
    this.data = initial;
    this.sanitizeAndPurgeDeletedSeedTeams();

    if (!loaded) {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (e) {
          // Ignore EROFS in deployed environment
        }
    }

    if (isSupabaseConfigured) {
        this.isFirestoreSynced = true;
        this.syncFromFirestore().then(() => {
            this.startFirestorePolling();
        }).catch(err => {
            console.log('Supabase sync initial load skipped or failed:', err.message);
        });
    }
    return this.data;
  }

  private firestorePollInterval: NodeJS.Timeout | null = null;

  private startFirestorePolling() {
      if (!isSupabaseConfigured) return;
      
      // Clear any existing global or instance polling timers (prevents duplicate loops on process restart / hot-reload)
      if (this.firestorePollInterval) {
          clearInterval(this.firestorePollInterval);
          this.firestorePollInterval = null;
      }
      if ((globalThis as any).__firestoreGeneralPollTimer) {
          clearInterval((globalThis as any).__firestoreGeneralPollTimer);
          (globalThis as any).__firestoreGeneralPollTimer = null;
      }
      if ((globalThis as any).__firestoreLivePollTimer) {
          clearInterval((globalThis as any).__firestoreLivePollTimer);
          (globalThis as any).__firestoreLivePollTimer = null;
      }

      // 1. Live Scores & Fixture Events Polling Loop (Every 15 seconds, only while a match is live)
      const liveCollections = ['matches', 'events', 'fixture_chats'];
      const liveTimer = setInterval(async () => {
          if (!isSupabaseConfigured) return;
          const hasLiveMatch = (this.data.matches || []).some(m => {
              const s = String(m.status || '');
              return s === 'Live' || s === 'Half-Time' || s === 'Penalties' || s === 'FIRST_HALF' || s === 'SECOND_HALF';
          });
          if (!hasLiveMatch) return;
          try {
              await this.syncFromFirestore(liveCollections);
          } catch (pollErr: any) {
              const msg = pollErr?.message || pollErr?.error?.message || String(pollErr);
              console.warn('Supabase live match polling warning:', msg.slice(0, 100));
          }
      }, 15000);

      // 2. Main Database Collections Polling Loop (Every 10 minutes)
      const generalCollections = ['settings', 'teams', 'players', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'scorePredictions', 'fantasySquads', 'miniLeagues', 'advertisements', 'playerOfTheMonth', 'managerChips', 'match_videos', 'epl_highlights'];
      const generalTimer = setInterval(async () => {
          if (!isSupabaseConfigured) return;
          try {
              await this.syncFromFirestore(generalCollections);
          } catch (pollErr: any) {
              const msg = pollErr?.message || pollErr?.error?.message || String(pollErr);
              console.warn('Supabase general database polling warning:', msg.slice(0, 100));
          }
      }, 600000);

      // Save timers globally to survive module re-evaluations and re-instantiations
      (globalThis as any).__firestoreLivePollTimer = liveTimer;
      (globalThis as any).__firestoreGeneralPollTimer = generalTimer;
      this.firestorePollInterval = generalTimer;

      console.log('Started Supabase polling loops: Live matches (15s when live) & Main database (10m)');
  }

  private async syncFromFirestore(targetCols?: string[]) {
      try {
          if (!isSupabaseConfigured) return;

          // Retry backoff check if consecutive failures occurred
          if (this.consecutiveSyncFailures >= this.maxConsecutiveSyncFailures) {
              const backoffMultiplier = Math.pow(2, this.consecutiveSyncFailures - this.maxConsecutiveSyncFailures);
              const backoffDelayMs = Math.min(10000 * backoffMultiplier, 600000); // Max 10 min delay
              if (Date.now() - this.lastSyncFailureTime < backoffDelayMs) {
                  return; // Skip sync attempt while in backoff window
              }
          }

          const allCollections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'scorePredictions', 'fantasySquads', 'miniLeagues', 'advertisements', 'playerOfTheMonth', 'managerChips', 'match_videos', 'fixture_chats', 'epl_highlights'];
          const collections = targetCols || allCollections;
          
          let hasData = false;
          const updates: any = {};
          for (const col of collections) {
              const { data: rows, error } = await supabase.from(col).select('*');
              if (error) {
                  if (isMissingSchemaError(error)) {
                      continue;
                  }
                  throw error;
              }
              if (rows && rows.length > 0) {
                  hasData = true;
              }
              const items: any[] = [];
              for (const row of (rows || [])) {
                  const rawData = (row && typeof row.data === 'object' && row.data !== null && !Array.isArray(row.data))
                      ? { ...row.data, ...row }
                      : row;
                  const id = String(rawData.id || rawData.email || rawData.matchId || '');
                  if (!id) continue;
                  const sanitized = sanitizeForFirestore({ ...rawData, id });
                  const stringified = stableStringify(sanitized);
                  this.lastFirestoreSyncState[`${col}_${id}`] = stringified;
                  items.push(sanitized);
              }
              
              if (col === 'settings') {
                  updates.settings = items.length > 0 ? items[0] : this.data.settings;
              } else if (col === 'ratings') {
                  const ratingsObj: any = {};
                  items.forEach(item => { ratingsObj[item.id] = item.rating; });
                  updates.ratings = ratingsObj;
              } else {
                  updates[col] = items;
              }
          }

          if (updates.teams && Array.isArray(updates.teams)) { this.data.teams = updates.teams; }
          if (updates.players && Array.isArray(updates.players)) { this.data.players = updates.players; }
          if (updates.news) this.data.news = updates.news;
          if (updates.admins) this.data.admins = updates.admins;
          if (updates.users) this.data.users = updates.users;
          if (updates.notifications) this.data.notifications = updates.notifications;
          if (updates.settings) this.data.settings = updates.settings;
          if (updates.advertisements) this.data.advertisements = updates.advertisements;
          if (updates.fantasySquads) this.data.fantasySquads = updates.fantasySquads;
          if (updates.miniLeagues) this.data.miniLeagues = updates.miniLeagues;
          if (updates.matches) this.data.matches = updates.matches;
          if (updates.events) this.data.events = updates.events;
          if (updates.ratings) this.data.ratings = updates.ratings;
          if (updates.predictions) this.data.predictions = updates.predictions;
          if (updates.scorePredictions) this.data.scorePredictions = updates.scorePredictions;
          if (updates.fixture_chats) this.data.fixture_chats = updates.fixture_chats;
          if (updates.playerOfTheMonth) this.data.playerOfTheMonth = updates.playerOfTheMonth;
          if (updates.managerChips) this.data.managerChips = updates.managerChips;
          if (updates.match_videos) this.data.match_videos = updates.match_videos;
          if (updates.epl_highlights) this.data.epl_highlights = updates.epl_highlights;

          // Perform orphan check ONLY ONCE during the initial startup sync (!targetCols),
          // using the teams and players already fetched above (zero extra database reads).
          // Skip entirely if this.data.teams is empty, and only log orphaned players without deleting.
          if (!targetCols && this.data.teams && this.data.teams.length > 0) {
              const currentValidTeamIds = new Set(this.data.teams.map(t => t.id));
              for (const player of (this.data.players || [])) {
                  if (player.teamId && !currentValidTeamIds.has(player.teamId)) {
                      console.log(`Orphan player found: ${player.name} (team ${player.teamId} missing)`);
                  }
              }
          }

          this.recalculateLeagueStatsAndStandings();

          // Sync baseline cache with post-recalculation state so read-only recalculations don't mark unchanged docs dirty
          for (const colName of ['teams', 'players', 'fantasySquads'] as const) {
              const list = (this.data as any)[colName] || [];
              for (const item of list) {
                  const sanitized = sanitizeForFirestore(item);
                  if (sanitized.id) {
                      this.lastFirestoreSyncState[`${colName}_${sanitized.id}`] = stableStringify(sanitized);
                  }
              }
          }

          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
          } catch (e) {
            // Read-only filesystem fallback
          }

          this.isFirestoreSynced = true;
          this.consecutiveSyncFailures = 0; // Reset failure count on success
      } catch(e: any) {
          this.consecutiveSyncFailures++;
          this.lastSyncFailureTime = Date.now();
          const rawMsg = e?.message || e?.error?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
          const errMsg = typeof rawMsg === 'string' ? rawMsg.replace(/[\r\n\t]+/g, ' ').trim() : 'Supabase sync failed';
          if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit') || e?.code === 8) {
              console.warn(`Supabase sync paused due to API rate/quota limits (Failure #${this.consecutiveSyncFailures}): ${errMsg.slice(0, 120)}`);
              this.isFirestoreSynced = false;
              this.consecutiveSyncFailures = Math.max(this.consecutiveSyncFailures, this.maxConsecutiveSyncFailures + 6);
          } else if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('jwt') || errMsg.toLowerCase().includes('invalid api key') || e?.code === '42501') {
              console.warn(`Supabase sync paused: Credentials or permissions invalid (Failure #${this.consecutiveSyncFailures}). Operating in local memory mode.`);
              this.isFirestoreSynced = false;
              this.consecutiveSyncFailures = Math.max(this.consecutiveSyncFailures, this.maxConsecutiveSyncFailures + 6);
          } else {
              console.warn(`Supabase sync notice (Failure #${this.consecutiveSyncFailures}): ${errMsg.slice(0, 120)}`);
          }
      }
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      } catch (e) {
        // Ignore EROFS in deployed environment
      }
      
      if (isSupabaseConfigured && this.isFirestoreSynced) {
         const promises = [];
         
         const collections = [
           { col: 'settings', getVal: (d: any) => [ { id: 'global', ...d.settings } ] },
           { col: 'teams', getVal: (d: any) => (d.teams || []) },
           { col: 'players', getVal: (d: any) => (d.players || []) },
           { col: 'matches', getVal: (d: any) => (d.matches || []) },
           { col: 'events', getVal: (d: any) => (d.events || []) },
           { col: 'news', getVal: (d: any) => (d.news || []) },
           { col: 'users', getVal: (d: any) => (d.users || []) },
           { col: 'admins', getVal: (d: any) => (d.admins || []) },
           { col: 'notifications', getVal: (d: any) => (d.notifications || []) },
           { col: 'ratings', getVal: (d: any) => Object.entries(d.ratings || {}).map(([id, rating]) => ({ id, rating })) },
           { col: 'predictions', getVal: (d: any) => (d.predictions || []) },
           { col: 'scorePredictions', getVal: (d: any) => (d.scorePredictions || []) },
           { col: 'fantasySquads', getVal: (d: any) => (d.fantasySquads || []) },
           { col: 'miniLeagues', getVal: (d: any) => (d.miniLeagues || []) },
           { col: 'advertisements', getVal: (d: any) => (d.advertisements || []) },
           { col: 'playerOfTheMonth', getVal: (d: any) => (d.playerOfTheMonth || []) },
           { col: 'managerChips', getVal: (d: any) => (d.managerChips || []) },
           { col: 'fixture_chats', getVal: (d: any) => (d.fixture_chats || []) },
           { col: 'match_videos', getVal: (d: any) => (d.match_videos || []) },
           { col: 'epl_highlights', getVal: (d: any) => (d.epl_highlights || []) }
         ];

         for (const colMap of collections) {
             const items = colMap.getVal(dataToSave);
             const currentIds = new Set(items.map((i: any) => i.id));

             // Propagate row deletions to Supabase
             const colPrefix = `${colMap.col}_`;
             for (const cacheKey of Object.keys(this.lastFirestoreSyncState)) {
                 if (cacheKey.startsWith(colPrefix)) {
                     const docId = cacheKey.substring(colPrefix.length);
                     if (!currentIds.has(docId)) {
                         promises.push(
                             Promise.resolve(
                                 supabase.from(colMap.col).delete().eq('id', docId).then(({ error }) => {
                                     if (error) {
                                         if (isMissingSchemaError(error)) {
                                             delete this.lastFirestoreSyncState[cacheKey];
                                             return;
                                         }
                                         throw error;
                                     }
                                     delete this.lastFirestoreSyncState[cacheKey];
                                 })
                             ).catch((e: any) => {
                                 const msg = e?.message || e?.error?.message || String(e);
                                 if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('permission') || e?.code === '42501') {
                                     this.isFirestoreSynced = false;
                                 }
                                 console.warn(`Supabase delete notice (${colMap.col}/${docId}):`, msg.slice(0, 150));
                             })
                         );
                     }
                 }
             }

             for (const item of items) {
                 const sanitized = sanitizeForFirestore(item);
                 const id = sanitized.id || (sanitized as any).email || (sanitized as any).matchId;
                 if (!id) continue;
                 sanitized.id = id;
                 const stringified = stableStringify(sanitized);
                 const cacheKey = `${colMap.col}_${id}`;
                 if (this.lastFirestoreSyncState[cacheKey] !== stringified) {
                     promises.push(
                         Promise.resolve(
                             supabase.from(colMap.col).upsert(JSON.parse(stringified), { onConflict: 'id' }).then(({ error }) => {
                                 if (error) {
                                     if (isMissingSchemaError(error)) {
                                         this.lastFirestoreSyncState[cacheKey] = stringified;
                                         return;
                                     }
                                     throw error;
                                 }
                                 this.lastFirestoreSyncState[cacheKey] = stringified;
                             })
                         ).catch((e: any) => {
                             const rawMsg = e?.message || e?.error?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
                             const cleanMsg = typeof rawMsg === 'string' ? rawMsg.replace(/[\r\n\t]+/g, ' ').trim() : 'Supabase write failed';
                             if (cleanMsg.toLowerCase().includes('quota') || cleanMsg.toLowerCase().includes('permission') || e?.code === '42501') {
                                 this.isFirestoreSynced = false;
                             }
                             console.warn(`Supabase upsert notice (${colMap.col}/${id}): ${cleanMsg.slice(0, 120)}`);
                         })
                     );
                 }
             }
         }
         
         if (promises.length > 0) {
             console.log(`[Supabase Write] Persisting ${promises.length} modified record(s) to Supabase...`);
             Promise.all(promises).catch(err => {
                 const errMsg = err?.message || err?.error?.message || String(err);
                 console.warn('Supabase batch write notice:', errMsg.slice(0, 150));
             });
         }
      }
    } catch (e) {
      console.error('Failed to save database file', e);
    }
  }

  public resetTableDataToZero(): DatabaseSchema {
    this.assertWritable();

    // Reset team standings and statistics to zero without deleting documents
    this.data.teams = this.data.teams.map(t => ({
      ...t,
      matchesPlayed: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      pointsDeduction: 0,
      manualOverride: false
    }));

    // Reset player goals, assists, clean sheets, and fantasy metrics to zero
    this.data.players = this.data.players.map(p => ({
      ...p,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      cupGoals: 0,
      cupAssists: 0,
      cupCleanSheets: 0,
      fantasyPoints: 0,
      bonusPoints: 0,
      ownedByCount: 0,
      captainedByCount: 0,
      ratingAverage: undefined
    }));

    // Clear all recorded match events and player ratings
    this.data.playerVersion = Date.now();

    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
    return this.data;
  }

  public resetSeed(): DatabaseSchema {
    this.assertWritable();

    if (!this.data.admins || this.data.admins.length === 0) {
      this.data.admins = INITIAL_ADMINS;
    }

    if (!this.data.users || this.data.users.length === 0) {
      this.data.users = INITIAL_USERS;
    }

    this.resetTableDataToZero();
    return this.data;
  }

  // ADMIN MANAGEMENT
  public getAdmins(): AdminUser[] {
    if (!this.data.admins || this.data.admins.length === 0) {
      return INITIAL_ADMINS;
    }
    return this.data.admins;
  }

  public saveAdmin(admin: Partial<AdminUser>): AdminUser {
    this.assertWritable();
    if (!this.data.admins) this.data.admins = INITIAL_ADMINS;
    const email = admin.email ? admin.email.toLowerCase().trim() : '';
    if (!email) throw new Error('Email is required to save admin.');
    const adminId = admin.id || `admin-${Date.now()}`;

    const cleanAdmin: AdminUser = sanitizeForFirestore({
      id: adminId,
      email,
      name: admin.name ? admin.name.trim() : email.split('@')[0],
      role: admin.role || 'sub_admin',
      appointedAt: admin.appointedAt || new Date().toISOString(),
      appointedBy: admin.appointedBy || 'Super Admin'
    });

    const idx = this.data.admins.findIndex(a => a.email.toLowerCase() === email);
    if (idx >= 0) {
      this.data.admins[idx] = { ...this.data.admins[idx], ...cleanAdmin };
    } else {
      this.data.admins.push(cleanAdmin);
    }
    if (this.data.users) {
      const uIdx = this.data.users.findIndex(u => u.email.toLowerCase() === email);
      if (uIdx >= 0) {
        this.data.users[uIdx].role = cleanAdmin.role as any;
      }
    }
    this.saveData(this.data);
    return cleanAdmin;
  }

  public deleteAdmin(email: string) {
    this.assertWritable();
    if (!this.data.admins) this.data.admins = INITIAL_ADMINS;
    if (email.toLowerCase() === 'itzjeda10@gmail.com') {
      throw new Error('Super Admin (itzjeda10@gmail.com) cannot be dismissed.');
    }
    this.data.admins = this.data.admins.filter(a => a.email.toLowerCase() !== email.toLowerCase());
    if (this.data.users) {
      const uIdx = this.data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (uIdx >= 0) {
        this.data.users[uIdx].role = 'fan';
      }
    }
    this.saveData(this.data);
  }

  // USER ACCOUNTS MANAGEMENT
  public getUsers(): UserAccount[] {
    if (!this.data.users || this.data.users.length === 0) {
      return INITIAL_USERS;
    }
    return this.data.users;
  }

  public checkUsernameAvailable(username: string, excludeEmail?: string): boolean {
    if (!username || !username.trim()) return true;
    const cleanName = username.trim().toLowerCase();
    const cleanExclude = excludeEmail ? excludeEmail.trim().toLowerCase() : '';

    const users = this.getUsers();
    const isTakenInUsers = users.some(u => 
      u.name && u.name.trim().toLowerCase() === cleanName && 
      u.email && u.email.toLowerCase() !== cleanExclude
    );
    if (isTakenInUsers) return false;

    const squads = this.getFantasySquads();
    const isTakenInSquads = squads.some(s => 
      s.userName && s.userName.trim().toLowerCase() === cleanName && 
      s.userEmail && s.userEmail.toLowerCase() !== cleanExclude
    );
    return !isTakenInSquads;
  }

  public checkFantasyTeamNameAvailable(teamName: string, excludeEmail?: string): boolean {
    if (!teamName || !teamName.trim()) return true;
    const cleanTeamName = teamName.trim().toLowerCase();
    const cleanExclude = excludeEmail ? excludeEmail.trim().toLowerCase() : '';

    const users = this.getUsers();
    const isTakenInUsers = users.some(u => 
      u.fantasyTeamName && 
      u.fantasyTeamName.trim().toLowerCase() === cleanTeamName && 
      u.email && u.email.toLowerCase() !== cleanExclude
    );
    if (isTakenInUsers) return false;

    const squads = this.getFantasySquads();
    const isTakenInSquads = squads.some(s => 
      s.squadName && s.squadName.trim().toLowerCase() === cleanTeamName && 
      s.userEmail && s.userEmail.toLowerCase() !== cleanExclude
    );
    return !isTakenInSquads;
  }

  public saveUser(user: Partial<UserAccount> & { email: string; fantasyTeamName?: string }): UserAccount {
    this.assertWritable();
    if (!this.data.users) this.data.users = INITIAL_USERS;
    const emailLower = (user.email || '').trim().toLowerCase();
    const idx = this.data.users.findIndex(u => u.email && u.email.toLowerCase() === emailLower);

    // Validate Username uniqueness if name provided
    if (user.name && user.name.trim()) {
      if (!this.checkUsernameAvailable(user.name, emailLower)) {
        throw new Error(`Username '${user.name.trim()}' is already taken by another user. Please choose a different username.`);
      }
    }

    // Validate Fantasy Team Name uniqueness if fantasyTeamName provided
    if (user.fantasyTeamName && user.fantasyTeamName.trim()) {
      if (!this.checkFantasyTeamNameAvailable(user.fantasyTeamName, emailLower)) {
        throw new Error(`Fantasy Team Name '${user.fantasyTeamName.trim()}' is already taken by another manager. Please choose a different team name.`);
      }
    }

    // Check if email belongs to admin list
    const adminMatch = this.getAdmins().find(a => a.email && a.email.toLowerCase() === emailLower);
    const assignedRole = adminMatch ? adminMatch.role : (user.role || 'fan');

    let updatedUser: UserAccount;
    if (idx >= 0) {
      const existingUser = this.data.users[idx];
      // Lock Fantasy Team Name once set permanently
      const lockedFantasyTeamName = (existingUser.fantasyTeamName && existingUser.fantasyTeamName.trim())
        ? existingUser.fantasyTeamName
        : (user.fantasyTeamName && user.fantasyTeamName.trim() ? user.fantasyTeamName.trim() : undefined);

      updatedUser = sanitizeForFirestore({
        ...existingUser,
        ...user,
        fantasyTeamName: lockedFantasyTeamName,
        role: assignedRole
      });
      this.data.users[idx] = updatedUser;
    } else {
      updatedUser = sanitizeForFirestore({
        id: user.id || `user-${Date.now()}`,
        email: emailLower,
        name: user.name || emailLower.split('@')[0],
        role: assignedRole,
        ...(user.favoriteTeamId ? { favoriteTeamId: user.favoriteTeamId } : {}),
        ...(user.fantasyTeamName && user.fantasyTeamName.trim() ? { fantasyTeamName: user.fantasyTeamName.trim() } : {}),
        notificationsEnabled: user.notificationsEnabled ?? true,
        themePreference: user.themePreference || 'dark',
        ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
        createdAt: new Date().toISOString()
      });
      this.data.users.push(updatedUser);
    }

    // Update corresponding fantasy squad name / username if present
    if (this.data.fantasySquads) {
      const squad = this.data.fantasySquads.find(s => s.userEmail && s.userEmail.toLowerCase() === emailLower);
      if (squad) {
        if (updatedUser.fantasyTeamName) squad.squadName = updatedUser.fantasyTeamName;
        if (updatedUser.name) squad.userName = updatedUser.name;
      }
    }

    this.saveData(this.data);
    return updatedUser;
  }

  public deleteUser(email: string): boolean {
    this.assertWritable();
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    this.data.users = (this.data.users || []).filter(u => u.email && u.email.toLowerCase() !== cleanEmail);
    this.data.fantasySquads = (this.data.fantasySquads || []).filter(s => s.userEmail && s.userEmail.toLowerCase() !== cleanEmail);
    this.saveData(this.data);
    return true;
  }

  // APP NOTIFICATIONS MANAGEMENT
  public getNotifications(): AppNotification[] {
    if (!this.data.notifications) {
      return INITIAL_NOTIFICATIONS;
    }
    return this.data.notifications;
  }

  public async addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string; idempotencyKey?: string }): Promise<AppNotification> {
    this.assertWritable();
    if (!this.data.notifications) this.data.notifications = INITIAL_NOTIFICATIONS;
    if (!this.data.dispatchedNotificationKeys) this.data.dispatchedNotificationKeys = [];
    
    const key = notification.idempotencyKey || notification.id;
    
    if (key && isSupabaseConfigured && this.isFirestoreSynced) {
      try {
        const { data: existingNotif, error: selectErr } = await supabase
          .from('sent_notifications')
          .select('id')
          .eq('id', key)
          .maybeSingle();

        if (!selectErr && existingNotif) {
          console.log(`[Notification Idempotency] Key '${key}' already fired in Supabase. Blocking duplicate notification.`);
          const existing = this.data.notifications.find(n => n.id === key || n.idempotencyKey === key);
          return existing || (notification as any);
        }

        if (!selectErr) {
          await supabase
            .from('sent_notifications')
            .upsert({ id: key, sentAt: new Date().toISOString() }, { onConflict: 'id' });
        }
      } catch (err) {
        console.error('Error in notification idempotency check:', err);
      }
    }

    if (key) {
      if (
        this.data.dispatchedNotificationKeys.includes(key) ||
        this.data.notifications.some(n => n.id === key || n.idempotencyKey === key)
      ) {
        console.log(`[Notification Idempotency] Key '${key}' already fired. Blocking duplicate notification.`);
        const existing = this.data.notifications.find(n => n.id === key || n.idempotencyKey === key);
        return existing || (notification as any);
      }
      this.data.dispatchedNotificationKeys.push(key);
      if (this.data.dispatchedNotificationKeys.length > 500) {
        this.data.dispatchedNotificationKeys = this.data.dispatchedNotificationKeys.slice(-300);
      }
    }

    // Deduplicate identical title + message dispatched within last 3 minutes
    const recentDuplicate = this.data.notifications.find(n =>
      n.title === notification.title &&
      n.message === notification.message &&
      (Date.now() - new Date(n.timestamp).getTime()) < 180000
    );
    if (recentDuplicate) {
      console.log(`[Notification Idempotency] Recent duplicate notification detected for '${notification.title}'. Blocking.`);
      return recentDuplicate;
    }

    const whitelist = [
      'Fixtures', 'Kickoff', 'Halftime', 'Full-Time', 'Penalty Shootout',
      'Goal', 'Red Card', 'Penalty awarded', 'Player Transfer',
      'Published News', 'MOTM', 'POTW', 'Player of the Month Uploads', 'Lineups Published', 'Sponsored Ad Broadcasts'
    ];
    if (!whitelist.includes(notification.eventType)) {
      console.warn(`Notification eventType '${notification.eventType}' is not in the whitelist. Ignoring notification.`);
      return notification as any;
    }

    const newNotif: any = sanitizeForFirestore({
      id: key || `notif-${Date.now()}`,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      eventType: notification.eventType,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      idempotencyKey: key,
      ...(notification.linkMatchId !== undefined ? { linkMatchId: notification.linkMatchId } : {})
    });
    
    this.data.notifications.unshift(newNotif);
    this.emit('new_notification', newNotif);
    // Keep max 50 notifications
    if (this.data.notifications.length > 50) {
      this.data.notifications = this.data.notifications.slice(0, 50);
    }
    this.saveData(this.data);
    return newNotif;
  }

  public markNotificationRead(id: string) {
    this.assertWritable();
    if (!this.data.notifications) return;
    this.data.notifications = this.data.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.saveData(this.data);
  }

  public markAllNotificationsRead() {
    this.assertWritable();
    if (!this.data.notifications) return;
    this.data.notifications = this.data.notifications.map(n => ({ ...n, read: true }));
    this.saveData(this.data);
  }

  public async clearNotifications() {
    this.assertWritable();
    this.data.notifications = [];
    this.saveData(this.data);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notifications').delete().neq('id', '');
        if (error && !isMissingSchemaError(error)) {
          console.error('Failed to wipe Supabase notifications table:', error);
        } else {
          console.log('Supabase notifications table completely wiped.');
        }
      } catch (err) {
        console.error('Failed to wipe Supabase notifications table:', err);
      }
    }
  }

  // TEAMS
  public getTeams(): Team[] {
    return this.data.teams;
  }

  public saveTeam(team: Partial<Team>): Team {
    this.assertWritable();
    if (!this.data.teams) this.data.teams = INITIAL_TEAMS;
    const teamId = team.id || `team-${Date.now()}`;
    const idx = this.data.teams.findIndex(t => t.id === teamId);
    const existing: Partial<Team> = idx >= 0 ? this.data.teams[idx] : {};

    const fullTeam: Team = sanitizeForFirestore({
      ...existing,
      ...team,
      id: teamId,
      name: team.name || existing.name || 'New Team',
      shortName: team.shortName || existing.shortName || team.name?.slice(0, 3).toUpperCase() || 'NT',
      logoUrl: team.logoUrl || existing.logoUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80',
      points: team.points ?? existing.points ?? 0,
      goalDifference: team.goalDifference ?? existing.goalDifference ?? 0,
      matchesPlayed: team.matchesPlayed ?? existing.matchesPlayed ?? 0,
      won: team.won ?? existing.won ?? 0,
      drawn: team.drawn ?? existing.drawn ?? 0,
      lost: team.lost ?? existing.lost ?? 0,
      goalsFor: team.goalsFor ?? existing.goalsFor ?? 0,
      goalsAgainst: team.goalsAgainst ?? existing.goalsAgainst ?? 0,
      coach: team.coach || existing.coach || 'Head Coach',
      stadium: team.stadium || existing.stadium || 'Epe Arena'
    });

    if (idx >= 0) {
      this.data.teams[idx] = fullTeam;
    } else {
      this.data.teams.push(fullTeam);
    }
    this.saveData(this.data);
    return fullTeam;
  }

  public deleteTeam(id: string) {
    this.assertWritable();
    this.data.teams = this.data.teams.filter(t => t.id !== id);
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
  }

  // PLAYERS
  public getPlayers(teamId?: string): Player[] {
    if (!this.data.players) this.data.players = INITIAL_PLAYERS;

    // Recalculate stats so goals, assists, clean sheets & fantasy points are ALWAYS fresh
    this.recalculateLeagueStatsAndStandings();

    const validMatchIds = new Set((this.data.matches || []).map(m => m.id));
    const allRatingsForPlayers: Record<string, number[]> = {};
    if (this.data.ratings) {
      Object.entries(this.data.ratings).forEach(([mId, matchRatings]) => {
        if (!validMatchIds.has(mId)) return;
        if (matchRatings) {
          Object.entries(matchRatings).forEach(([pId, rVal]) => {
            if (typeof rVal === 'number' && !isNaN(rVal)) {
              if (!allRatingsForPlayers[pId]) allRatingsForPlayers[pId] = [];
              allRatingsForPlayers[pId].push(rVal);
            }
          });
        }
      });
    }

    const teamsMap = new Map((this.data.teams || []).map(t => [t.id, t]));

    const processed = this.data.players.map(p => {
      const arr = allRatingsForPlayers[p.id];
      let ratingAverage: number = 0;
      if (arr && arr.length > 0) {
        const sum = arr.reduce((acc, curr) => acc + curr, 0);
        ratingAverage = Number((sum / arr.length).toFixed(2));
      }

      const rawPrice = p.price ?? p.currentPrice;
      const validPrice = (typeof rawPrice === 'number' && !isNaN(rawPrice) && rawPrice > 0)
        ? Number(rawPrice.toFixed(1))
        : 6.0;

      const teamObj = teamsMap.get(p.teamId);
      const teamName = teamObj?.name || (p as any).teamName || 'Free Agent';

      return {
        ...p,
        teamName,
        ratingAverage,
        price: validPrice,
        currentPrice: (typeof p.currentPrice === 'number' && !isNaN(p.currentPrice) && p.currentPrice > 0)
          ? Number(p.currentPrice.toFixed(1))
          : validPrice,
        fantasyPrice: validPrice
      };
    });

    if (teamId) {
      return processed.filter(p => p.teamId === teamId);
    }
    return processed;
  }

  public touchPlayerVersion() {
    this.data.playerVersion = Date.now();
  }

  public savePlayer(player: Partial<Player>): Player {
    this.assertWritable();
    if (!this.data.players) this.data.players = INITIAL_PLAYERS;
    const playerId = player.id || `p-${Date.now()}`;
    const idx = this.data.players.findIndex(p => p.id === playerId);
    const existing: Partial<Player> = idx >= 0 ? this.data.players[idx] : {};
    const resolvedTeamId = player.teamId || existing.teamId || this.data.teams?.[0]?.id;

    if (!resolvedTeamId) {
      throw new Error('Create at least one team before adding players.');
    }

    const fullPlayer: Player = sanitizeForFirestore({
      ...existing,
      ...player,
      id: playerId,
      name: player.name || existing.name || 'New Player',
      teamId: resolvedTeamId,
      position: player.position || existing.position || 'MID',
      goals: player.goals ?? existing.goals ?? 0,
      assists: player.assists ?? existing.assists ?? 0,
      cleanSheets: player.cleanSheets ?? existing.cleanSheets ?? 0,
      shirtNumber: player.shirtNumber ?? existing.shirtNumber ?? 10,
      photoUrl: player.photoUrl || existing.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      price: player.price ?? existing.price ?? 6.0,
      currentPrice: player.currentPrice ?? existing.currentPrice ?? player.price ?? 6.0,
      isSuspended: player.isSuspended ?? existing.isSuspended ?? false,
      suspensionWeeks: player.suspensionWeeks ?? existing.suspensionWeeks ?? null,
      isInjured: player.isInjured ?? existing.isInjured ?? false,
      injuryStatus: player.injuryStatus || existing.injuryStatus || 'Fit',
      height: player.height || existing.height || '180 cm',
      weight: player.weight || existing.weight || '75 kg',
      preferredFoot: player.preferredFoot || existing.preferredFoot || 'Right',
      nationality: player.nationality || existing.nationality || 'Nigeria',
      bio: player.bio || existing.bio || ''
    });

    this.touchPlayerVersion();
    if (idx >= 0) {
      this.data.players[idx] = fullPlayer;
    } else {
      this.data.players.push(fullPlayer);
    }
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
    return fullPlayer;
  }

  public deletePlayer(id: string) {
    this.assertWritable();
    this.data.players = (this.data.players || []).filter(p => p.id !== id);
    this.touchPlayerVersion();
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
  }

  public deletePlayersBulk(ids: string[]) {
    this.assertWritable();
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    this.data.players = (this.data.players || []).filter(p => !idSet.has(p.id));
    this.touchPlayerVersion();
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
  }

  // MATCHES
  public getMatches(): Match[] {
    // Populate homeTeam, awayTeam, events, ratings
    const teamsMap = new Map(this.data.teams.map(t => [t.id, t]));
    const playersMap = new Map(this.data.players.map(p => [p.id, p]));

    return this.data.matches.map(m => {
      const matchEvents = this.data.events
        .filter(e => e.matchId === m.id)
        .map(e => ({
          ...e,
          playerName: e.playerName || playersMap.get(e.playerId)?.name || 'Player',
          assisterName: e.assisterId ? (playersMap.get(e.assisterId)?.name || e.assisterName) : undefined
        }));

      return {
        ...m,
        homeTeam: teamsMap.get(m.homeTeamId),
        awayTeam: teamsMap.get(m.awayTeamId),
        events: matchEvents,
        ratings: this.data.ratings[m.id] || {}
      };
    });
  }

  public getMatch(id: string): Match | null {
    const matches = this.getMatches();
    return matches.find(m => m.id === id) || null;
  }

  public saveMatch(match: Partial<Match>): Match {
    this.assertWritable();
    const matchId = match.id || `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const teams = this.getTeams();
    const homeTeamId = match.homeTeamId || teams[0]?.id;
    const awayTeamId = match.awayTeamId || teams[1]?.id;

    if (!homeTeamId || !awayTeamId) {
      throw new Error('Create at least two teams before scheduling a match.');
    }
    if (homeTeamId === awayTeamId) {
      throw new Error('Home and away teams must be different.');
    }

    const homeTeam = teams.find(t => t.id === homeTeamId);

    const fullMatchData = {
      ...match,
      homeTeamId,
      awayTeamId,
      homeScore: Number(match.homeScore ?? 0),
      awayScore: Number(match.awayScore ?? 0),
      status: match.status || 'Scheduled',
      period: match.period || 'Pre-Match',
      matchMinute: Number(match.matchMinute ?? 0),
      stoppageTime1stHalf: Number(match.stoppageTime1stHalf ?? 2),
      stoppageTime2ndHalf: Number(match.stoppageTime2ndHalf ?? 4),
      date: match.date || new Date().toISOString().split('T')[0],
      time: match.time || '16:00',
      kickoffTime: match.kickoffTime || null,
      isDelayed: Boolean(match.isDelayed),
      venue: match.venue || homeTeam?.stadium || 'Epe Township Stadium',
      matchday: Number(match.matchday ?? 1),
      competition_type: match.competition_type || 'League',
      id: matchId
    };

    const cleanMatch = sanitizeForFirestore(fullMatchData) as Match;

    const idx = this.data.matches.findIndex(m => m.id === cleanMatch.id);
    if (idx >= 0) {
      this.data.matches[idx] = { ...this.data.matches[idx], ...cleanMatch };
    } else {
      this.data.matches.push(cleanMatch);
    }
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
    return this.getMatch(cleanMatch.id) || cleanMatch;
  }

  public saveMatchesBulk(newMatches: Partial<Match>[]): Match[] {
    this.assertWritable();
    const savedList: Match[] = [];
    const teams = this.getTeams();
    
    for (let i = 0; i < newMatches.length; i++) {
      const mData = newMatches[i];
      const homeTeam = teams.find(t => t.id === mData.homeTeamId);
      const matchId = mData.id || `m-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
      
      const fullMatch: Match = sanitizeForFirestore({
        id: matchId,
        homeTeamId: mData.homeTeamId || '',
        awayTeamId: mData.awayTeamId || '',
        homeScore: Number(mData.homeScore || 0),
        awayScore: Number(mData.awayScore || 0),
        status: mData.status || 'Scheduled',
        period: mData.period || 'Pre-Match',
        matchMinute: Number(mData.matchMinute || 0),
        stoppageTime1stHalf: Number(mData.stoppageTime1stHalf || 2),
        stoppageTime2ndHalf: Number(mData.stoppageTime2ndHalf || 4),
        date: mData.date || new Date().toISOString().split('T')[0],
        time: mData.time || '16:00',
        kickoffTime: mData.kickoffTime || null,
        isDelayed: mData.isDelayed ?? false,
        venue: mData.venue || homeTeam?.stadium || 'Epe Township Stadium',
        matchday: Number(mData.matchday || 1)
      });

      const idx = this.data.matches.findIndex(m => m.id === fullMatch.id);
      if (idx >= 0) {
        this.data.matches[idx] = { ...this.data.matches[idx], ...fullMatch };
      } else {
        this.data.matches.push(fullMatch);
      }
      savedList.push(fullMatch);
    }

    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
    return this.getMatches();
  }

  public deleteMatch(id: string): void {
    this.assertWritable();
    this.data.matches = (this.data.matches || []).filter(m => m.id !== id);
    this.data.events = (this.data.events || []).filter(e => e.matchId !== id);
    this.data.predictions = (this.data.predictions || []).filter(p => p.matchId !== id);
    this.data.fixture_chats = (this.data.fixture_chats || []).filter(c => c.matchId !== id);

    if (this.data.ratings && this.data.ratings[id]) {
      delete this.data.ratings[id];
    }

    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
  }

  // EVENTS
  public addEvent(rawEvent: MatchEvent): MatchEvent {
    this.assertWritable();
    const event: MatchEvent = sanitizeForFirestore({
      ...rawEvent,
      id: rawEvent.id || `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    });
    this.data.events.push(event);

    // If event is a Goal, auto update score in match & player goal tally!
    const match = this.data.matches.find(m => String(m.id) === String(event.matchId));
    if (match) {
      if (!match.events) match.events = [];
      const existsInMatch = match.events.some(e => String(e.id) === String(event.id));
      if (!existsInMatch) match.events.push(event);

      if ((event.eventType === 'Goal' || (event.eventType as string) === 'Penalty Goal') && !event.skipScoreIncrement) {
        if (event.goalType === 'own_goal' || (event.eventType as string) === 'Own Goal') {
          if (String(event.teamId) === String(match.homeTeamId)) {
            match.awayScore += 1;
          } else if (String(event.teamId) === String(match.awayTeamId)) {
            match.homeScore += 1;
          }
        } else {
          if (String(event.teamId) === String(match.homeTeamId)) {
            match.homeScore += 1;
          } else if (String(event.teamId) === String(match.awayTeamId)) {
            match.awayScore += 1;
          }
        }
      }
    }

    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);

    return event;
  }

  public deleteEvent(id: string) {
    this.assertWritable();
    const event = this.data.events.find(e => e.id === id);
    if (event) {
      const match = this.data.matches.find(m => m.id === event.matchId);
      if (match) {
        if (event.eventType === 'Goal') {
          if (event.goalType === 'own_goal') {
            if (event.teamId === match.homeTeamId && match.awayScore > 0) {
              match.awayScore -= 1;
            } else if (event.teamId === match.awayTeamId && match.homeScore > 0) {
              match.homeScore -= 1;
            }
          } else {
            if (event.teamId === match.homeTeamId && match.homeScore > 0) {
              match.homeScore -= 1;
            } else if (event.teamId === match.awayTeamId && match.awayScore > 0) {
              match.awayScore -= 1;
            }
          }
        }
      }
    }
    this.data.events = this.data.events.filter(e => e.id !== id);
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
  }

  public updateTeamStandingsOverride(teamId: string, overrideData: Partial<Team>) {
    this.assertWritable();
    const team = this.data.teams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');

    if (overrideData.manualOverride !== undefined) team.manualOverride = Boolean(overrideData.manualOverride);
    if (overrideData.points !== undefined) team.points = Number(overrideData.points);
    if (overrideData.won !== undefined) team.won = Number(overrideData.won);
    if (overrideData.drawn !== undefined) team.drawn = Number(overrideData.drawn);
    if (overrideData.lost !== undefined) team.lost = Number(overrideData.lost);
    if (overrideData.matchesPlayed !== undefined) team.matchesPlayed = Number(overrideData.matchesPlayed);
    if (overrideData.goalsFor !== undefined) team.goalsFor = Number(overrideData.goalsFor);
    if (overrideData.goalsAgainst !== undefined) team.goalsAgainst = Number(overrideData.goalsAgainst);
    if (overrideData.goalDifference !== undefined) {
      team.goalDifference = Number(overrideData.goalDifference);
    } else if (overrideData.goalsFor !== undefined || overrideData.goalsAgainst !== undefined) {
      team.goalDifference = team.goalsFor - team.goalsAgainst;
    }
    if (overrideData.pointsDeduction !== undefined) team.pointsDeduction = Number(overrideData.pointsDeduction);

    this.saveData(this.data);
    return team;
  }

  // RATINGS
  public saveRatings(matchId: string, newRatings: Record<string, number>) {
    this.assertWritable();
    if (!this.data.ratings[matchId]) {
      this.data.ratings[matchId] = {};
    }
    this.data.ratings[matchId] = {
      ...this.data.ratings[matchId],
      ...newRatings
    };

    // Recalculate player average ratings
    const validMatchIds = new Set((this.data.matches || []).map(m => m.id));
    const allRatingsForPlayers: Record<string, number[]> = {};
    if (this.data.ratings) {
      Object.entries(this.data.ratings).forEach(([mId, matchRatings]) => {
        if (!validMatchIds.has(mId)) return;
        if (matchRatings) {
          Object.entries(matchRatings).forEach(([pId, rVal]) => {
            if (typeof rVal === 'number' && !isNaN(rVal)) {
              if (!allRatingsForPlayers[pId]) allRatingsForPlayers[pId] = [];
              allRatingsForPlayers[pId].push(rVal);
            }
          });
        }
      });
    }

    this.data.players.forEach(p => {
      const arr = allRatingsForPlayers[p.id];
      if (arr && arr.length > 0) {
        const sum = arr.reduce((acc, curr) => acc + curr, 0);
        p.ratingAverage = Number((sum / arr.length).toFixed(2));
      } else {
        p.ratingAverage = 0;
      }
    });

    this.saveData(this.data);
    return this.data.ratings[matchId];
  }

  // NEWS
  public getNews(): NewsArticle[] {
    return this.data.news;
  }

  public saveNews(article: Partial<NewsArticle>): NewsArticle {
    this.assertWritable();
    const newsId = article.id || `news-${Date.now()}`;
    const idx = this.data.news.findIndex(n => n.id === newsId);
    const existing: Partial<NewsArticle> = idx >= 0 ? this.data.news[idx] : {};
    const isPublished = article.status === 'published' || article.isPublished !== false;

    const fullArticle: NewsArticle = sanitizeForFirestore({
      ...existing,
      ...article,
      id: newsId,
      title: article.title || existing.title || 'Untitled Article',
      subtitle: article.subtitle || existing.subtitle || '',
      summary: article.summary || existing.summary || (article.content ? article.content.substring(0, 100) : ''),
      content: article.content || existing.content || '',
      coverImage: article.coverImage || existing.coverImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
      category: article.category || existing.category || 'General',
      publishedAt: article.publishedAt || existing.publishedAt || new Date().toISOString(),
      issueLabel: article.issueLabel || existing.issueLabel || 'EPL Dispatch',
      readTime: article.readTime || existing.readTime || '3 min read',
      author: article.author || existing.author || 'Official Reporter',
      authorTitle: article.authorTitle || existing.authorTitle || 'Sports Writer',
      customReporterRole: article.customReporterRole || existing.customReporterRole || 'Reporter',
      authorAvatar: article.authorAvatar || existing.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isSubstackExclusive: article.isSubstackExclusive ?? existing.isSubstackExclusive ?? false,
      featured: article.featured ?? existing.featured ?? false,
      status: article.status || existing.status || 'published',
      isPublished,
      likesCount: article.likesCount ?? existing.likesCount ?? 0,
      authorRole: article.authorRole || existing.authorRole || 'news_reporter',
      authorEmail: article.authorEmail || existing.authorEmail || null,
      authorId: article.authorId || existing.authorId || null
    });

    if (idx >= 0) {
      this.data.news[idx] = fullArticle;
    } else {
      this.data.news.unshift(fullArticle);
    }

    if (isPublished) {
      this.addNotification({
        idempotencyKey: `notif-news-published-${fullArticle.id}`,
        title: `📰 New Article: ${fullArticle.title}`,
        message: fullArticle.summary || (fullArticle.content.substring(0, 100) + '...'),
        type: 'news',
        eventType: 'Published News'
      });
    }

    this.saveData(this.data);
    return fullArticle;
  }

  public likeNews(id: string): NewsArticle | null {
    this.assertWritable();
    const article = this.data.news.find(n => n.id === id);
    if (article) {
      article.likesCount = (article.likesCount || 0) + 1;
      this.saveData(this.data);
      return article;
    }
    return null;
  }

  public addNewsComment(articleId: string, comment: { authorName: string; avatarUrl?: string; content: string }): NewsArticle | null {
    this.assertWritable();
    const article = this.data.news.find(n => n.id === articleId);
    if (article) {
      if (!article.comments) article.comments = [];
      article.comments.push(sanitizeForFirestore({
        id: `c-${Date.now()}`,
        authorName: comment.authorName,
        avatarUrl: comment.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        content: comment.content,
        timestamp: new Date().toISOString()
      }));
      this.saveData(this.data);
      return article;
    }
    return null;
  }

  public deleteNews(id: string) {
    this.assertWritable();
    if (this.data.news) {
        this.data.news = this.data.news.filter(n => n.id !== id);
    }
    this.saveData(this.data);
  }

  // APP SETTINGS
  public getSettings(): AppSettings {
    if (!this.data.settings) {
      return INITIAL_SETTINGS;
    }
    return this.data.settings;
  }

  public getAdvertisements(): Advertisement[] {
    return this.data.advertisements || [];
  }

  public saveAdvertisement(ad: Partial<Advertisement>): Advertisement {
    this.assertWritable();
    if (!this.data.advertisements) this.data.advertisements = [];
    const adId = ad.id || `ad_${Date.now()}`;
    const index = this.data.advertisements.findIndex(a => a.id === adId);

    const fullAd: Advertisement = sanitizeForFirestore({
      id: adId,
      companyName: ad.companyName || 'Sponsor',
      mediaType: ad.mediaType || 'image',
      mediaUrl: ad.mediaUrl || ad.imageUrl || '',
      imageUrl: ad.mediaUrl || ad.imageUrl || '',
      targetLink: ad.targetLink || ad.linkUrl || '#',
      linkUrl: ad.targetLink || ad.linkUrl || '#',
      duration: ad.mediaType === 'video' ? (Number(ad.duration) || 15) : null,
      isActive: ad.isActive ?? true,
      position: ad.position || 'sidebar'
    });

    if (index >= 0) {
      this.data.advertisements[index] = fullAd;
    } else {
      this.data.advertisements.push(fullAd);
    }
    this.saveData(this.data);
    return fullAd;
  }

  public deleteAdvertisement(id: string): void {
    this.assertWritable();
    if (!this.data.advertisements) return;
    this.data.advertisements = this.data.advertisements.filter(a => a.id !== id);
    this.saveData(this.data);
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    this.assertWritable();
    if (!this.data.settings) this.data.settings = INITIAL_SETTINGS;
    this.data.settings = sanitizeForFirestore({ ...this.data.settings, ...settings });
    this.saveData(this.data);
    return this.data.settings;
  }

  // FAN PREDICTION ENGINE
  public getPredictionStats(matchId: string, userSessionId?: string): MatchPredictionStats {
    const matchPreds = this.data.predictions.filter(p => p.matchId === matchId);
    const totalVotes = matchPreds.length;
    const homeWinVotes = matchPreds.filter(p => p.predictionType === 'Home Win').length;
    const drawVotes = matchPreds.filter(p => p.predictionType === 'Draw').length;
    const awayWinVotes = matchPreds.filter(p => p.predictionType === 'Away Win').length;

    let homeWinPercent = totalVotes > 0 ? Math.round((homeWinVotes / totalVotes) * 100) : 0;
    let drawPercent = totalVotes > 0 ? Math.round((drawVotes / totalVotes) * 100) : 0;
    let awayWinPercent = totalVotes > 0 ? Math.round((awayWinVotes / totalVotes) * 100) : 0;

    if (totalVotes > 0) {
      const sum = homeWinPercent + drawPercent + awayWinPercent;
      if (sum !== 100 && sum > 0) {
        homeWinPercent += (100 - sum);
      }
    }

    let userVote: PredictionType | null = null;
    if (userSessionId) {
      const found = matchPreds.find(p => p.userSessionId === userSessionId);
      if (found) userVote = found.predictionType;
    }

    return {
      matchId,
      totalVotes,
      homeWinVotes,
      drawVotes,
      awayWinVotes,
      homeWinPercent,
      drawPercent,
      awayWinPercent,
      userVote
    };
  }

  public addPrediction(matchId: string, userSessionId: string, predictionType: PredictionType): MatchPredictionStats {
    this.assertWritable();
    const match = this.data.matches.find(m => m.id === matchId);
    if (!match) throw new Error('Match not found');

    if (match.status !== 'Scheduled') {
      throw new Error('Voting is permanently locked because this match is no longer Scheduled.');
    }

    const idx = this.data.predictions.findIndex(p => p.matchId === matchId && p.userSessionId === userSessionId);
    if (idx >= 0) {
      this.data.predictions[idx].predictionType = predictionType;
    } else {
      this.data.predictions.push({
        id: `pred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        matchId,
        userSessionId,
        predictionType,
        createdAt: new Date().toISOString()
      });
    }

    // Update aggregated vote counts directly on the match object
    const matchPreds = this.data.predictions.filter(p => p.matchId === matchId);
    match.homeVotes = matchPreds.filter(p => p.predictionType === 'Home Win').length;
    match.drawVotes = matchPreds.filter(p => p.predictionType === 'Draw').length;
    match.awayVotes = matchPreds.filter(p => p.predictionType === 'Away Win').length;

    this.saveData(this.data);
    return this.getPredictionStats(matchId, userSessionId);
  }

  // MATCHDAY SCORE PREDICTOR
  public getScorePredictions(userId?: string): ScorePredictionRecord[] {
    if (!this.data.scorePredictions) this.data.scorePredictions = [];
    if (userId) {
      return this.data.scorePredictions.filter(p => p.userId === userId);
    }
    return this.data.scorePredictions;
  }

  public saveScorePrediction(data: { userId: string; matchId: string; homeScore: number; awayScore: number; userEmail?: string; userName?: string }): ScorePredictionRecord {
    this.assertWritable();
    if (!this.data.scorePredictions) this.data.scorePredictions = [];
    const now = new Date().toISOString();
    const existingIdx = this.data.scorePredictions.findIndex(p => p.userId === data.userId && p.matchId === data.matchId);
    
    if (existingIdx >= 0) {
      const updated: ScorePredictionRecord = sanitizeForFirestore({
        ...this.data.scorePredictions[existingIdx],
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        userEmail: data.userEmail || this.data.scorePredictions[existingIdx].userEmail,
        userName: data.userName || this.data.scorePredictions[existingIdx].userName,
        updatedAt: now
      });
      this.data.scorePredictions[existingIdx] = updated;
      this.saveData(this.data);
      return updated;
    } else {
      const created: ScorePredictionRecord = sanitizeForFirestore({
        id: `score-pred-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: data.userId,
        matchId: data.matchId,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        userEmail: data.userEmail,
        userName: data.userName,
        createdAt: now,
        updatedAt: now
      });
      this.data.scorePredictions.push(created);
      this.saveData(this.data);
      return created;
    }
  }

  /**
   * Evaluates prediction points against an actual match result:
   * - 5 pts: Correct exact score (home and away match actual scores)
   * - 3 pts: Correct winner/draw outcome, but wrong score
   * - 2 pts: Correct total amount of goals in the match, but wrong winner or wrong score
   * - 1 pt: Simply predicting (participated in prediction)
   */
  public calculatePredictionScore(predHome: number, predAway: number, actualHome: number, actualAway: number): { points: number; reason: 'exact_score' | 'correct_winner' | 'correct_goals' | 'participated' } {
    // 1. Correct exact score: 5pts
    if (predHome === actualHome && predAway === actualAway) {
      return { points: 5, reason: 'exact_score' };
    }

    // Determine outcomes: 1 = home win, 0 = draw, -1 = away win
    const predOutcome = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;
    const actualOutcome = actualHome > actualAway ? 1 : actualHome < actualAway ? -1 : 0;

    // 2. Correct winner/outcome but wrong score: 3pts
    if (predOutcome === actualOutcome) {
      return { points: 3, reason: 'correct_winner' };
    }

    // 3. Correct total amount of goals but wrong winner or wrong score: 2pts
    const predTotalGoals = predHome + predAway;
    const actualTotalGoals = actualHome + actualAway;
    if (predTotalGoals === actualTotalGoals) {
      return { points: 2, reason: 'correct_goals' };
    }

    // 4. Simply predicting earns 1pt
    return { points: 1, reason: 'participated' };
  }

  public getPredictorLeaderboard(): PredictorLeaderboardEntry[] {
    const predictions = this.data.scorePredictions || [];
    const matches = this.data.matches || [];
    const users = this.data.users || [];
    const teams = this.data.teams || [];

    const matchMap = new Map<string, Match>(matches.map(m => [m.id, m]));
    const teamMap = new Map<string, string>(teams.map(t => [t.id, t.name]));
    const userMap = new Map<string, UserAccount>(users.map(u => [u.id, u]));

    // Group predictions by user (userId or userEmail)
    const userStats = new Map<string, PredictorLeaderboardEntry>();

    predictions.forEach(pred => {
      const userKey = pred.userId || pred.userEmail || 'unknown';
      if (!userStats.has(userKey)) {
        const userObj = userMap.get(pred.userId);
        const resolvedName = pred.userName || userObj?.name || (pred.userEmail ? pred.userEmail.split('@')[0] : 'Predictor');
        userStats.set(userKey, {
          userId: userKey,
          userName: resolvedName,
          userEmail: pred.userEmail || userObj?.email,
          avatarUrl: userObj?.avatarUrl,
          totalPoints: 0,
          exactScoresCount: 0,
          correctWinnersCount: 0,
          correctGoalsCount: 0,
          participationsCount: 0,
          totalPredictions: 0,
          breakdown: []
        });
      }

      const entry = userStats.get(userKey)!;
      entry.totalPredictions += 1;

      const match = matchMap.get(pred.matchId);
      const homeTeamName = match?.homeTeam?.name || teamMap.get(match?.homeTeamId || '') || 'Home Team';
      const awayTeamName = match?.awayTeam?.name || teamMap.get(match?.awayTeamId || '') || 'Away Team';
      const isFinished = match?.status === 'Full-Time' || match?.status === 'Penalties';

      if (isFinished && typeof match.homeScore === 'number' && typeof match.awayScore === 'number') {
        const evalRes = this.calculatePredictionScore(pred.homeScore, pred.awayScore, match.homeScore, match.awayScore);
        entry.totalPoints += evalRes.points;

        if (evalRes.reason === 'exact_score') entry.exactScoresCount += 1;
        else if (evalRes.reason === 'correct_winner') entry.correctWinnersCount += 1;
        else if (evalRes.reason === 'correct_goals') entry.correctGoalsCount += 1;
        else entry.participationsCount += 1;

        entry.breakdown?.push({
          matchId: pred.matchId,
          homeTeamName,
          awayTeamName,
          matchStatus: match.status,
          predictedHomeScore: pred.homeScore,
          predictedAwayScore: pred.awayScore,
          actualHomeScore: match.homeScore,
          actualAwayScore: match.awayScore,
          pointsEarned: evalRes.points,
          reason: evalRes.reason
        });
      } else {
        // Match not yet finished - prediction recorded
        entry.breakdown?.push({
          matchId: pred.matchId,
          homeTeamName,
          awayTeamName,
          matchStatus: match?.status || 'Scheduled',
          predictedHomeScore: pred.homeScore,
          predictedAwayScore: pred.awayScore,
          pointsEarned: 0,
          reason: 'pending'
        });
      }
    });

    const leaderboard = Array.from(userStats.values())
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.exactScoresCount !== a.exactScoresCount) return b.exactScoresCount - a.exactScoresCount;
        if (b.correctWinnersCount !== a.correctWinnersCount) return b.correctWinnersCount - a.correctWinnersCount;
        return b.totalPredictions - a.totalPredictions;
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    return leaderboard;
  }

  // PLAYER VALUATION CONTROL (ADMIN)
  public savePlayerValuation(playerId: string, price: number, isSuspended?: boolean, isInjured?: boolean, injuryStatus?: 'Fit' | 'Injured' | 'Doubtful', suspensionWeeks?: number): Player {
    this.assertWritable();
    const player = this.data.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    if (price !== undefined && !isNaN(price)) player.price = Number(price);
    if (isSuspended !== undefined) {
      player.isSuspended = isSuspended;
      player.suspensionWeeks = isSuspended ? (suspensionWeeks || 1) : undefined;
    }
    if (suspensionWeeks !== undefined) player.suspensionWeeks = suspensionWeeks;
    if (isInjured !== undefined) player.isInjured = isInjured;
    if (injuryStatus !== undefined) player.injuryStatus = injuryStatus;
    this.touchPlayerVersion();
    this.saveData(this.data);
    return player;
  }

  // SUPER ADMIN BULK DATA INGESTION
  public bulkUploadRoster(teamId: string, text: string): { importedCount: number } {
    this.assertWritable();
    const targetTeam = this.data.teams.find(t => t.id === teamId);
    if (!targetTeam) throw new Error(`Target team with ID ${teamId} not found.`);

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) throw new Error('No input data provided.');

    const newPlayers: Player[] = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 2) {
        throw new Error(`Error Line ${lineNum}: Format must be "[Player Name], [Position], [Fantasy Price in Millions]"`);
      }

      const [name, posStr, priceStr] = parts;
      if (!name) throw new Error(`Error Line ${lineNum}: Missing player name.`);

      let position: 'GK' | 'DEF' | 'MID' | 'FWD' = 'MID';
      const cleanPos = posStr.toLowerCase();
      if (cleanPos.includes('goalkeeper') || cleanPos === 'gk') position = 'GK';
      else if (cleanPos.includes('defender') || cleanPos === 'def') position = 'DEF';
      else if (cleanPos.includes('midfielder') || cleanPos === 'mid') position = 'MID';
      else if (cleanPos.includes('forward') || cleanPos.includes('striker') || cleanPos === 'fwd' || cleanPos === 'att') position = 'FWD';
      else throw new Error(`Error Line ${lineNum}: Unknown position "${posStr}". Expected Goalkeeper, Defender, Midfielder, or Forward.`);

      let price = 6.0;
      if (priceStr) {
        const pVal = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (isNaN(pVal) || pVal <= 0) {
          throw new Error(`Error Line ${lineNum}: Invalid price "${priceStr}". Must be a positive number.`);
        }
        price = Number(pVal.toFixed(1));
      }

      newPlayers.push({
        id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        teamId,
        position,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        shirtNumber: Math.floor(Math.random() * 89) + 10,
        price,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      });
    });

    this.data.players.push(...newPlayers);
    this.saveData(this.data);
    return { importedCount: newPlayers.length };
  }

  public bulkUploadTeams(text: string): { importedCount: number } {
    this.assertWritable();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) throw new Error('No input data provided.');

    const newTeams: Team[] = [];
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 2) {
        throw new Error(`Error Line ${lineNum}: Format must be "[Team Name], [Short Name], [Coach Name (optional)], [Stadium (optional)]"`);
      }
      const [name, shortName, coach, stadium] = parts;
      if (!name) throw new Error(`Error Line ${lineNum}: Missing team name.`);
      if (!shortName) throw new Error(`Error Line ${lineNum}: Missing short name.`);

      const existing = this.data.teams.find(t => t.name.toLowerCase() === name.toLowerCase() || t.shortName.toLowerCase() === shortName.toLowerCase());
      if (existing) {
        throw new Error(`Error Line ${lineNum}: Team "${name}" or short name "${shortName}" already exists.`);
      }

      newTeams.push({
        id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        shortName: shortName.toUpperCase(),
        logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80',
        points: 0,
        goalDifference: 0,
        matchesPlayed: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        coach: coach || 'Head Coach',
        stadium: stadium || 'Home Ground'
      });
    });

    this.data.teams.push(...newTeams);
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
    return { importedCount: newTeams.length };
  }
  public bulkUploadSchedule(text: string): { importedCount: number } {
    this.assertWritable();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) throw new Error('No input data provided.');

    const newMatches: Match[] = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 2) {
        throw new Error(`Error Line ${lineNum}: Format must be "[Home Team Name], [Away Team Name], [Competition Type]"`);
      }

      const [homeStr, awayStr, compStr] = parts;
      const homeTeam = this.data.teams.find(t => (t.name || '').toLowerCase() === (homeStr || '').toLowerCase() || (t.shortName || '').toLowerCase() === (homeStr || '').toLowerCase());
      if (!homeTeam) {
        throw new Error(`Error Line ${lineNum}: Team "${homeStr}" not found in database.`);
      }

      const awayTeam = this.data.teams.find(t => (t.name || '').toLowerCase() === (awayStr || '').toLowerCase() || (t.shortName || '').toLowerCase() === (awayStr || '').toLowerCase());
      if (!awayTeam) {
        throw new Error(`Error Line ${lineNum}: Team "${awayStr}" not found in database.`);
      }

      if (homeTeam.id === awayTeam.id) {
        throw new Error(`Error Line ${lineNum}: Home and Away teams cannot be the same (${homeTeam.name}).`);
      }

      let competition_type: 'League' | 'Cup' = 'League';
      if (compStr && compStr.toLowerCase().includes('cup')) {
        competition_type = 'Cup';
      }

      newMatches.push({
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeTeam,
        awayTeam,
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: 'Pre-Match',
        matchMinute: 0,
        date: new Date(Date.now() + 86400000 * (newMatches.length + 1)).toISOString().split('T')[0],
        time: '16:00',
        venue: homeTeam.stadium || 'Epe Township Stadium',
        matchday: 13 + newMatches.length,
        competition_type
      });
    });

    this.data.matches.push(...newMatches);
    this.saveData(this.data);
    return { importedCount: newMatches.length };
  }

  // AUTOMATIC RECALCULATION OF STANDINGS AND PLAYER LEADERBOARDS
  public recalculateLeagueStatsAndStandings() {
    if (!this.data.teams || !this.data.players || !this.data.matches) return;
    if (this.isRecalculating) return;

    this.isRecalculating = true;
    try {
      const validMatchIds = new Set(this.data.matches.map(m => m.id));

    // Purge orphan events and ratings for non-existent/deleted matches
    this.data.events = (this.data.events || []).filter(e => validMatchIds.has(e.matchId));
    if (this.data.ratings) {
      Object.keys(this.data.ratings).forEach(mId => {
        if (!validMatchIds.has(mId)) {
          delete this.data.ratings[mId];
        }
      });
    }

    // Reset teams stats
    const teamStatsMap = new Map<string, {
      points: number;
      matchesPlayed: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
    }>();

    this.data.teams.forEach(t => {
      teamStatsMap.set(t.id, {
        points: 0,
        matchesPlayed: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0
      });
    });

    // Calculate ONLY from Full-Time and Penalties finished matches (League only)
    this.data.matches.forEach(m => {
      if (m.isStatsCommitted && (m.status === 'Full-Time' || m.status === 'Penalties') && m.competition_type !== 'Cup') {
        const homeStats = teamStatsMap.get(m.homeTeamId);
        const awayStats = teamStatsMap.get(m.awayTeamId);

        if (homeStats && awayStats) {
          homeStats.matchesPlayed += 1;
          awayStats.matchesPlayed += 1;

          homeStats.goalsFor += m.homeScore;
          homeStats.goalsAgainst += m.awayScore;
          awayStats.goalsFor += m.awayScore;
          awayStats.goalsAgainst += m.homeScore;

          if (m.homeScore > m.awayScore) {
            homeStats.won += 1;
            homeStats.points += 3;
            awayStats.lost += 1;
          } else if (m.awayScore > m.homeScore) {
            awayStats.won += 1;
            awayStats.points += 3;
            homeStats.lost += 1;
          } else {
            homeStats.drawn += 1;
            homeStats.points += 1;
            awayStats.drawn += 1;
            awayStats.points += 1;
          }
        }
      }
    });

    // Update team objects
    this.data.teams.forEach(t => {
      if (t.manualOverride) {
        // Super admin manual override is active for this team: keep manual stats
        if (typeof t.pointsDeduction === 'number' && t.pointsDeduction > 0) {
          t.points = Math.max(0, t.points - t.pointsDeduction);
        }
        return;
      }

      const computed = teamStatsMap.get(t.id);
      if (computed) {
        t.matchesPlayed = computed.matchesPlayed;
        t.won = computed.won;
        t.drawn = computed.drawn;
        t.lost = computed.lost;
        t.goalsFor = computed.goalsFor;
        t.goalsAgainst = computed.goalsAgainst;
        t.goalDifference = computed.goalsFor - computed.goalsAgainst;
        t.points = Math.max(0, computed.points - (t.pointsDeduction || 0));
      }
    });

    // Recalculate Player Goals, Assists, Clean Sheets, Goals Conceded, Appearances & Average Ratings
    const playerGoalsMap = new Map<string, number>();
    const playerAssistsMap = new Map<string, number>();
    const playerCleanSheetsMap = new Map<string, number>();
    const playerGoalsConcededMap = new Map<string, number>();
    const playerCupGoalsMap = new Map<string, number>();
    const playerCupAssistsMap = new Map<string, number>();
    const playerCupCleanSheetsMap = new Map<string, number>();
    const playerCupGoalsConcededMap = new Map<string, number>();
    const playerBonusMap = new Map<string, number>();
    const playerMatchesPlayedMap = new Map<string, number>();
    const playerCupMatchesPlayedMap = new Map<string, number>();
    const playerRatingSumMap = new Map<string, number>();
    const playerRatingCountMap = new Map<string, number>();

    this.data.players.forEach(p => {
      const pidStr = String(p.id);
      playerGoalsMap.set(pidStr, 0);
      playerAssistsMap.set(pidStr, 0);
      playerCleanSheetsMap.set(pidStr, 0);
      playerGoalsConcededMap.set(pidStr, 0);
      playerCupGoalsMap.set(pidStr, 0);
      playerCupAssistsMap.set(pidStr, 0);
      playerCupCleanSheetsMap.set(pidStr, 0);
      playerCupGoalsConcededMap.set(pidStr, 0);
      playerBonusMap.set(pidStr, 0);
      playerMatchesPlayedMap.set(pidStr, 0);
      playerCupMatchesPlayedMap.set(pidStr, 0);
      playerRatingSumMap.set(pidStr, 0);
      playerRatingCountMap.set(pidStr, 0);
    });

    const resolvePlayerId = (rawId?: any, rawName?: string): string | undefined => {
      if (!rawId || rawId === 'unassigned') return undefined;
      const pidStr = String(rawId);
      if (this.data.players.some(p => String(p.id) === pidStr)) {
        return pidStr;
      }
      const searchName = (rawName || pidStr).trim().toLowerCase();
      const found = this.data.players.find(p => p.name.trim().toLowerCase() === searchName);
      if (found) return String(found.id);
      return pidStr;
    };

    // Gather all events from top-level events AND match embedded events
    const allEventsList: MatchEvent[] = [...(this.data.events || [])];
    const existingEventIds = new Set(allEventsList.map(e => e.id).filter(Boolean));
    (this.data.matches || []).forEach(m => {
      if (m.events && Array.isArray(m.events)) {
        m.events.forEach(e => {
          if (e && (!e.id || !existingEventIds.has(e.id))) {
            allEventsList.push({ ...e, matchId: e.matchId || m.id });
            if (e.id) existingEventIds.add(e.id);
          }
        });
      }
    });

    // Count goals & assists from events
    allEventsList.forEach(e => {
      const typeStr = String(e.eventType || '').trim();
      const typeLower = typeStr.toLowerCase();
      const isGoalEvent = typeLower === 'goal' || typeLower === 'penalty goal' || typeLower === 'penalty' || typeStr === 'Goal';
      const isOwnGoal = e.goalType === 'own_goal' || typeLower === 'own goal' || typeLower === 'own_goal';

      if (isGoalEvent && !isOwnGoal) {
        const match = this.data.matches.find(m => String(m.id) === String(e.matchId));
        if (!match) return;

        const isCup = match.competition_type === "Cup";

        let pId = resolvePlayerId(e.playerId, e.playerName);
        let aId = resolvePlayerId(e.assisterId || (e as any).assistPlayerId, e.assisterName);

        if (pId && pId !== 'unassigned') {
          if (isCup) playerCupGoalsMap.set(pId, (playerCupGoalsMap.get(pId) || 0) + 1);
          else playerGoalsMap.set(pId, (playerGoalsMap.get(pId) || 0) + 1);
        }
        if (aId && aId !== 'unassigned') {
          if (isCup) playerCupAssistsMap.set(aId, (playerCupAssistsMap.get(aId) || 0) + 1);
          else playerAssistsMap.set(aId, (playerAssistsMap.get(aId) || 0) + 1);
        }
      }
    });

    // Count appearances, average ratings, clean sheets and goals conceded
    this.data.matches.forEach(m => {
      const statusStr = String(m.status || '');
      const isPlayedOrLive = ['Full-Time', 'Penalties', 'Live', 'Half-Time', 'FIRST_HALF', 'SECOND_HALF'].includes(statusStr) ||
        m.period === '1st Half' || m.period === '2nd Half' || m.period === 'Half-Time' || m.period === 'Full-Time';

      if (!isPlayedOrLive) return;

      const isCup = m.competition_type === "Cup";

      // Track player appearances for this match
      const matchPlayerIds = new Set<string>();

      [m.homeLineup, m.awayLineup].forEach(lineup => {
        if (!lineup) return;
        (lineup.startingXI || []).forEach(lp => {
          if (lp && lp.playerId) {
            const pId = resolvePlayerId(lp.playerId, lp.name);
            if (pId) matchPlayerIds.add(pId);
          }
        });
        (lineup.substitutes || []).forEach(lp => {
          if (lp && lp.playerId && (lp.minutesPlayed ? lp.minutesPlayed > 0 : lp.subbedOn)) {
            const pId = resolvePlayerId(lp.playerId, lp.name);
            if (pId) matchPlayerIds.add(pId);
          }
        });
      });

      // Also include players involved in events
      (m.events || []).forEach(e => {
        if (!e) return;
        const pId = resolvePlayerId(e.playerId, e.playerName);
        if (pId) matchPlayerIds.add(pId);
        const aId = resolvePlayerId(e.assisterId || (e as any).assistPlayerId, e.assisterName);
        if (aId) matchPlayerIds.add(aId);
      });

      matchPlayerIds.forEach(pId => {
        if (isCup) {
          playerCupMatchesPlayedMap.set(pId, (playerCupMatchesPlayedMap.get(pId) || 0) + 1);
        } else {
          playerMatchesPlayedMap.set(pId, (playerMatchesPlayedMap.get(pId) || 0) + 1);
        }
      });

      // Match Ratings
      if (m.ratings && typeof m.ratings === 'object') {
        Object.entries(m.ratings).forEach(([key, val]) => {
          const numVal = Number(val);
          if (numVal > 0) {
            const pId = resolvePlayerId(key);
            if (pId) {
              playerRatingSumMap.set(pId, (playerRatingSumMap.get(pId) || 0) + numVal);
              playerRatingCountMap.set(pId, (playerRatingCountMap.get(pId) || 0) + 1);
            }
          }
        });
      }

      // Clean sheets
      if (statusStr === "Full-Time" || statusStr === "Penalties") {
        if (m.awayScore === 0) {
          this.data.players
            .filter(p => String(p.teamId) === String(m.homeTeamId) && (p.position === "GK" || p.position === "DEF" || p.position === "MID"))
            .forEach(p => {
              const pidStr = String(p.id);
              if (isCup) playerCupCleanSheetsMap.set(pidStr, (playerCupCleanSheetsMap.get(pidStr) || 0) + 1);
              else playerCleanSheetsMap.set(pidStr, (playerCleanSheetsMap.get(pidStr) || 0) + 1);
            });
        }
        if (m.homeScore === 0) {
          this.data.players
            .filter(p => String(p.teamId) === String(m.awayTeamId) && (p.position === "GK" || p.position === "DEF" || p.position === "MID"))
            .forEach(p => {
              const pidStr = String(p.id);
              if (isCup) playerCupCleanSheetsMap.set(pidStr, (playerCupCleanSheetsMap.get(pidStr) || 0) + 1);
              else playerCleanSheetsMap.set(pidStr, (playerCleanSheetsMap.get(pidStr) || 0) + 1);
            });
        }
      }

      // Goals Conceded for DEF and GK
      this.data.players
        .filter(p => String(p.teamId) === String(m.homeTeamId) && (p.position === "GK" || p.position === "DEF"))
        .forEach(p => {
          const pidStr = String(p.id);
          if (isCup) playerCupGoalsConcededMap.set(pidStr, (playerCupGoalsConcededMap.get(pidStr) || 0) + (m.awayScore || 0));
          else playerGoalsConcededMap.set(pidStr, (playerGoalsConcededMap.get(pidStr) || 0) + (m.awayScore || 0));
        });

      this.data.players
        .filter(p => String(p.teamId) === String(m.awayTeamId) && (p.position === "GK" || p.position === "DEF"))
        .forEach(p => {
          const pidStr = String(p.id);
          if (isCup) playerCupGoalsConcededMap.set(pidStr, (playerCupGoalsConcededMap.get(pidStr) || 0) + (m.homeScore || 0));
          else playerGoalsConcededMap.set(pidStr, (playerGoalsConcededMap.get(pidStr) || 0) + (m.homeScore || 0));
        });
    });

    // Count bonus points from matches
    this.data.matches.forEach(m => {
      if (m.status === "Full-Time" && m.bonusPointsAllocations) {
        if (m.bonusPointsAllocations.firstPlacePlayerId) {
          const k = String(m.bonusPointsAllocations.firstPlacePlayerId);
          playerBonusMap.set(k, (playerBonusMap.get(k) || 0) + 3);
        }
        if (m.bonusPointsAllocations.secondPlacePlayerId) {
          const k = String(m.bonusPointsAllocations.secondPlacePlayerId);
          playerBonusMap.set(k, (playerBonusMap.get(k) || 0) + 2);
        }
        if (m.bonusPointsAllocations.thirdPlacePlayerId) {
          const k = String(m.bonusPointsAllocations.thirdPlacePlayerId);
          playerBonusMap.set(k, (playerBonusMap.get(k) || 0) + 1);
        }
      }
    });

    this.data.players.forEach(p => {
      const pidStr = String(p.id);
      p.goals = playerGoalsMap.get(pidStr) || 0;
      p.assists = playerAssistsMap.get(pidStr) || 0;
      p.cleanSheets = playerCleanSheetsMap.get(pidStr) || 0;
      p.goalsConceded = playerGoalsConcededMap.get(pidStr) || 0;
      p.cupGoals = playerCupGoalsMap.get(pidStr) || 0;
      p.cupAssists = playerCupAssistsMap.get(pidStr) || 0;
      p.cupCleanSheets = playerCupCleanSheetsMap.get(pidStr) || 0;
      p.cupGoalsConceded = playerCupGoalsConcededMap.get(pidStr) || 0;
      p.bonusPoints = playerBonusMap.get(pidStr) || 0;
      p.matchesPlayed = playerMatchesPlayedMap.get(pidStr) || 0;
      p.appearances = p.matchesPlayed;
      p.cupMatchesPlayed = playerCupMatchesPlayedMap.get(pidStr) || 0;

      const rSum = playerRatingSumMap.get(pidStr) || 0;
      const rCnt = playerRatingCountMap.get(pidStr) || 0;
      if (rCnt > 0) {
        p.ratingAverage = Number((rSum / rCnt).toFixed(2));
      }
      
      // Calculate total historical fantasy points for display across the app
      p.fantasyPoints = this.calculatePlayerSeasonPoints(p);
    });

    // Recalculate Fantasy Squad points for all managers based on updated player stats
    this.recalculateAllFantasySquads();
    } finally {
      this.isRecalculating = false;
    }
  }

  public recalculateAllFantasySquads(): void {
    if (!this.data.fantasySquads || this.data.fantasySquads.length === 0) return;

    const players = this.data.players || [];
    const playerMap = new Map(players.map(p => [p.id, p]));
    const completedMatches = this.getMatches().filter(m => m.status === 'Full-Time');
    const matchesCount = completedMatches.length;

    const didPlayerPlay = (p: Player): boolean => {
      if (p.isSuspended) return false;
      if (matchesCount === 0) return false;
      const teamMatches = completedMatches.filter(m => m.homeTeamId === p.teamId || m.awayTeamId === p.teamId);
      if (teamMatches.length === 0) return false;
      const playedWithStats = (p.goals || 0) > 0 || (p.assists || 0) > 0 || (p.bonusPoints || 0) > 0 || (p.cleanSheets || 0) > 0;
      let playedInLineups = false;
      teamMatches.forEach(m => {
        const lineup = m.homeTeamId === p.teamId ? m.homeLineup : m.awayLineup;
        if (lineup) {
          if (lineup.startingXI?.some(lp => lp.playerId === p.id)) playedInLineups = true;
          if (lineup.substitutes?.some(lp => lp.playerId === p.id)) {
            if (m.events?.some(e => e.eventType === 'Sub' && e.subInPlayerId === p.id)) playedInLineups = true;
          }
        } else {
          playedInLineups = true;
        }
      });
      return playedWithStats || playedInLineups;
    };

    this.data.fantasySquads.forEach(squad => {
      const newPlayerIds = squad.playerIds || [];
      const starterIds = squad.startingPlayerIds || newPlayerIds.slice(0, 11);
      const benchIds = squad.benchPlayerIds || newPlayerIds.filter(id => !starterIds.includes(id));
      const captainId = squad.captainPlayerId || starterIds[0];
      const viceCaptainId = squad.viceCaptainPlayerId || starterIds[1] || starterIds[0];
      const activeChip = squad.activeChip || null;

      const startersList = starterIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];
      const benchList = benchIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];

      let finalStarters = [...startersList];
      const startingGK = startersList.find(p => p.position === 'GK');
      const benchGK = benchList.find(p => p.position === 'GK');

      if (startingGK && !didPlayerPlay(startingGK) && benchGK && didPlayerPlay(benchGK)) {
        finalStarters = finalStarters.map(p => p.id === startingGK.id ? benchGK : p);
      }

      const benchOutfieldAvailable = benchList.filter(p => p.position !== 'GK' && didPlayerPlay(p));
      const nonPlayingOutfieldStarters = finalStarters.filter(p => p.position !== 'GK' && !didPlayerPlay(p));

      nonPlayingOutfieldStarters.forEach(nonPlayer => {
        if (benchOutfieldAvailable.length === 0) return;

        const playingDefs = finalStarters.filter(p => p.position === 'DEF' && didPlayerPlay(p)).length;
        const playingFws = finalStarters.filter(p => p.position === 'FWD' && didPlayerPlay(p)).length;

        let subInIndex = -1;
        if (playingDefs < 3) {
          subInIndex = benchOutfieldAvailable.findIndex(p => p.position === 'DEF');
        } else if (playingFws < 1) {
          subInIndex = benchOutfieldAvailable.findIndex(p => p.position === 'FWD');
        }

        if (subInIndex === -1) {
          subInIndex = 0;
        }

        if (subInIndex >= 0 && subInIndex < benchOutfieldAvailable.length) {
          const subInPlayer = benchOutfieldAvailable.splice(subInIndex, 1)[0];
          finalStarters = finalStarters.map(p => p.id === nonPlayer.id ? subInPlayer : p);
        }
      });

      const effectiveCaptain = finalStarters.find(p => p.id === captainId && didPlayerPlay(p));
      const effectiveVice = finalStarters.find(p => p.id === viceCaptainId && didPlayerPlay(p));

      let activeMultiplierId = captainId;
      if (!effectiveCaptain && effectiveVice) {
        activeMultiplierId = viceCaptainId;
      }

      const captainMultiplier = activeChip === 'TC' ? 3 : 2;

      let computedGameweekPoints = 0;
      if (activeChip === 'BB') {
        newPlayerIds.forEach(pId => {
          const p = playerMap.get(pId);
          if (p) {
            let pts = this.calculatePlayerSeasonPoints(p);
            if (pId === activeMultiplierId) pts *= captainMultiplier;
            computedGameweekPoints += pts;
          }
        });
      } else {
        finalStarters.forEach(p => {
          let pts = this.calculatePlayerSeasonPoints(p);
          if (p.id === activeMultiplierId) pts *= captainMultiplier;
          computedGameweekPoints += pts;
        });
      }

      const totalPoints = Math.max(0, computedGameweekPoints - (squad.pointHits || 0));
      if (squad.gameweekPoints !== computedGameweekPoints || squad.totalPoints !== totalPoints) {
        squad.gameweekPoints = computedGameweekPoints;
        squad.totalPoints = totalPoints;
        squad.updatedAt = new Date().toISOString();
      }
    });
  }

  // STANDINGS COMPUTED
  public getStandings(): Team[] {
    this.recalculateLeagueStatsAndStandings();
    // Sort teams by points desc, goalDifference desc, goalsFor desc, name asc
    return [...this.data.teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });
  }

  // LEAGUE STATS
  public getStats() {
    this.recalculateLeagueStatsAndStandings();

    const computePerformanceScore = (p: Player, isCup: boolean = false) => {
      const g = isCup ? (p.cupGoals || 0) : (p.goals || 0);
      const a = isCup ? (p.cupAssists || 0) : (p.assists || 0);
      const cs = isCup ? (p.cupCleanSheets || 0) : (p.cleanSheets || 0);
      const rating = p.ratingAverage || 6.0;

      // Clean sheet points: Defenders & Goalkeepers get 5 points per clean sheet (parity with goals)
      // Midfielders get 2 points per clean sheet
      let csPoints = 0;
      if (p.position === "GK" || p.position === "DEF") {
        csPoints = cs * 5;
      } else if (p.position === "MID") {
        csPoints = cs * 2;
      }

      const goalPoints = g * 5;
      const assistPoints = a * 3;
      const ratingPoints = Math.max(0, (rating - 5.0) * 4);

      return goalPoints + assistPoints + csPoints + ratingPoints;
    };

    const topScorers = [...this.data.players]
      
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 10);
    const topAssists = [...this.data.players]
      
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
      .slice(0, 10);
    const cleanSheets = [...this.data.players]
      .filter(p => p.position === "GK")
      .sort((a, b) => b.cleanSheets - a.cleanSheets)
      .slice(0, 10);
    const topPerformers = [...this.data.players]
      .sort((a, b) => {
        const scoreA = computePerformanceScore(a, false);
        const scoreB = computePerformanceScore(b, false);
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets;
        if (b.goals !== a.goals) return b.goals - a.goals;
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      })
      .slice(0, 10);

    const cupTopScorers = [...this.data.players]
      
      .sort((a, b) => (b.cupGoals || 0) - (a.cupGoals || 0) || (b.cupAssists || 0) - (a.cupAssists || 0))
      .slice(0, 10);
    const cupTopAssists = [...this.data.players]
      
      .sort((a, b) => (b.cupAssists || 0) - (a.cupAssists || 0) || (b.cupGoals || 0) - (a.cupGoals || 0))
      .slice(0, 10);
    const cupCleanSheets = [...this.data.players]
      .filter(p => p.position === "GK")
      .sort((a, b) => (b.cupCleanSheets || 0) - (a.cupCleanSheets || 0))
      .slice(0, 10);
    const cupTopPerformers = [...this.data.players]
      .sort((a, b) => {
        const scoreA = computePerformanceScore(a, true);
        const scoreB = computePerformanceScore(b, true);
        if (scoreB !== scoreA) return scoreB - scoreA;
        if ((b.cupCleanSheets || 0) !== (a.cupCleanSheets || 0)) return (b.cupCleanSheets || 0) - (a.cupCleanSheets || 0);
        if ((b.cupGoals || 0) !== (a.cupGoals || 0)) return (b.cupGoals || 0) - (a.cupGoals || 0);
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      })
      .slice(0, 10);

    return {
      topScorers,
      topAssists,
      cleanSheets,
      topPerformers,
      cupTopScorers,
      cupTopAssists,
      cupCleanSheets,
      cupTopPerformers
    };
  }

  // FANTASY LEAGUE & MINI-LEAGUES ENGINE
  public getFantasySquads(): FantasySquad[] {
    if (!this.data.fantasySquads) this.data.fantasySquads = [];
    return this.data.fantasySquads;
  }

  public getFantasySquadByEmail(email: string): FantasySquad | null {
    if (!email) return null;
    const squads = this.getFantasySquads();
    const cleanEmail = email.trim().toLowerCase();
    return squads.find(s => s.userEmail && s.userEmail.toLowerCase() === cleanEmail) || null;
  }

  public calculatePlayerSeasonPoints(p: Player, bonusMap?: Map<string, number>): number {
    let pPts = 0;
    const validMatchIds = new Set((this.data.matches || []).map(m => m.id));

    // Gather all events from top-level events AND match embedded events
    const allEventsList: MatchEvent[] = [...(this.data.events || [])];
    const existingEventIds = new Set(allEventsList.map(e => e.id).filter(Boolean));
    (this.data.matches || []).forEach(m => {
      if (m.events && Array.isArray(m.events)) {
        m.events.forEach(e => {
          if (e && (!e.id || !existingEventIds.has(e.id))) {
            allEventsList.push({ ...e, matchId: e.matchId || m.id });
            if (e.id) existingEventIds.add(e.id);
          }
        });
      }
    });

    const playerEvents = allEventsList.filter(e => e.playerId === p.id && validMatchIds.has(e.matchId));
    let ownGoalsCount = 0;
    let penaltyMissesCount = 0;
    let penaltySavesCount = 0;
    let yellowCards = 0;
    let redCards = 0;

    playerEvents.forEach(e => {
      const typeStr = e.eventType as string;
      if (e.goalType === 'own_goal') {
        ownGoalsCount++;
      } else if (typeStr === 'penalty_miss') {
        penaltyMissesCount++;
      } else if (typeStr === 'penalty_save') {
        penaltySavesCount++;
      } else if (typeStr === 'Yellow Card') {
        yellowCards++;
      } else if (typeStr === 'Red Card') {
        redCards++;
      }
    });

    const totalGoals = (p.goals || 0) + (p.cupGoals || 0);
    const totalAssists = (p.assists || 0) + (p.cupAssists || 0);
    const totalCleanSheets = (p.cleanSheets || 0) + (p.cupCleanSheets || 0);
    const totalGoalsConceded = (p.goalsConceded || 0) + (p.cupGoalsConceded || 0);
    const bps = bonusMap ? (bonusMap.get(p.id) || 0) : (p.bonusPoints || 0);

    const pos = (p.position || '').toUpperCase();

    // 1. General Points
    pPts += totalAssists * 3;
    pPts -= yellowCards * 1;
    pPts -= redCards * 3;
    pPts -= penaltyMissesCount * 2;
    pPts -= ownGoalsCount * 2;
    pPts += bps;

    // 2. Positional Points
    if (pos === 'FWD' || pos === 'ST' || pos === 'ATT') {
      pPts += totalGoals * 4;
    } else if (pos === 'MID') {
      pPts += totalGoals * 5;
      pPts += totalCleanSheets * 1;
    } else if (pos === 'DEF') {
      pPts += totalGoals * 6;
      pPts += totalCleanSheets * 4;
      pPts += Math.floor(totalGoalsConceded / 2) * -1;
    } else if (pos === 'GK') {
      pPts += totalGoals * 6;
      pPts += totalCleanSheets * 4;
      pPts += Math.floor(totalGoalsConceded / 2) * -1;
      pPts += penaltySavesCount * 3;
    } else {
      pPts += totalGoals * 4;
    }

    // 3. Appearance / Minutes Played Points across played matches
    const playedMatches = (this.data.matches || []).filter(m => m.status === 'Full-Time' || m.status === 'Penalties' || m.status === 'Live' || m.status === 'Half-Time');

    playedMatches.forEach(m => {
      const isHome = m.homeTeamId === p.teamId;
      const isAway = m.awayTeamId === p.teamId;
      if (!isHome && !isAway) return;

      const lineup = isHome ? m.homeLineup : m.awayLineup;
      const mEvents = allEventsList.filter(e => e.matchId === m.id);
      
      let subInMinute = -1;
      let subOutMinute = -1;
      let isStarter = false;
      let playedAny = false;

      if (lineup && lineup.startingXI && lineup.startingXI.length > 0) {
        isStarter = lineup.startingXI.some(lp => lp.playerId === p.id);
        playedAny = isStarter || mEvents.some(e => e.playerId === p.id || e.subInPlayerId === p.id);
      } else {
        playedAny = mEvents.some(e => e.playerId === p.id || e.subInPlayerId === p.id);
        isStarter = playedAny;
      }

      if (!playedAny) return;

      mEvents.forEach(e => {
        if (e.eventType === 'Sub') {
          if (e.subInPlayerId === p.id) subInMinute = e.minute;
          if (e.playerId === p.id) subOutMinute = e.minute;
        }
      });

      const matchMin = (m.status === 'Full-Time' || m.status === 'Penalties') ? 90 : (typeof m.matchMinute === 'number' && m.matchMinute > 0 ? m.matchMinute : 1);
      let minutesPlayed = 0;

      if (isStarter) {
        minutesPlayed = subOutMinute > -1 ? subOutMinute : matchMin;
      } else if (subInMinute > -1) {
        const endMin = subOutMinute > -1 ? subOutMinute : matchMin;
        minutesPlayed = Math.max(0, endMin - subInMinute);
      } else {
        minutesPlayed = matchMin;
      }

      if (minutesPlayed >= 60) {
        pPts += 2;
      } else if (minutesPlayed > 0) {
        pPts += 1;
      }
    });

    return Math.max(0, pPts);
  }

  public saveFantasySquad(squadData: Partial<FantasySquad>, bonusMap?: Map<string, number>): FantasySquad {
    this.assertWritable();
    if (!this.data.fantasySquads) this.data.fantasySquads = [];
    const emailLower = squadData.userEmail ? squadData.userEmail.trim().toLowerCase() : '';
    if (!emailLower) throw new Error('User email is required');

    // Uniqueness validation for squadName
    if (squadData.squadName && squadData.squadName.trim()) {
      if (!this.checkFantasyTeamNameAvailable(squadData.squadName, emailLower)) {
        throw new Error(`Fantasy Team Name '${squadData.squadName.trim()}' is already taken by another manager. Please choose a different team name.`);
      }
    }

    // Uniqueness validation for userName
    if (squadData.userName && squadData.userName.trim()) {
      if (!this.checkUsernameAvailable(squadData.userName, emailLower)) {
        throw new Error(`Username '${squadData.userName.trim()}' is already taken by another user. Please choose a different username.`);
      }
    }

    const existingIdx = this.data.fantasySquads.findIndex(s => s.userEmail && s.userEmail.toLowerCase() === emailLower);
    const existing = existingIdx >= 0 ? this.data.fantasySquads[existingIdx] : null;

    const newPlayerIds = squadData.playerIds || existing?.playerIds || [];
    const hadFullSquad = existing && (
      (existing.savedBaselinePlayerIds && existing.savedBaselinePlayerIds.length >= 15) ||
      (existing.playerIds && existing.playerIds.length >= 15)
    );

    const baselineIds = hadFullSquad
      ? ((existing.savedBaselinePlayerIds && existing.savedBaselinePlayerIds.length >= 15) ? existing.savedBaselinePlayerIds : existing.playerIds)
      : newPlayerIds;

    // Calculate transfers made against saved baseline
    let transfersMade = 0;
    if (hadFullSquad) {
      newPlayerIds.forEach(pId => {
        if (!baselineIds.includes(pId)) {
          transfersMade += 1;
        }
      });
    }

    // Deduction math: 2 Free Transfers per Gameweek.
    // Penalty math: > 2 trades -> -4 pts per trade over 2.
    let pointHits = 0;
    let freeTransfers = 2;
    if (transfersMade > 2) {
      pointHits = (transfersMade - 2) * 4;
      freeTransfers = 0;
    } else {
      freeTransfers = 2 - transfersMade;
      pointHits = 0;
    }

    // Compute player fantasy points with Vice Captaincy & Auto-Sub Engine
    const players = this.getPlayers();
    const playerMap = new Map(players.map(p => [p.id, p]));
    const completedMatches = this.getMatches().filter(m => m.status === 'Full-Time');
    const matchesCount = completedMatches.length;

    const didPlayerPlay = (p: Player): boolean => {
      if (p.isSuspended) return false;
      if (matchesCount === 0) return false;
      const teamMatches = completedMatches.filter(m => m.homeTeamId === p.teamId || m.awayTeamId === p.teamId);
      if (teamMatches.length === 0) return false;
      const playedWithStats = (p.goals || 0) > 0 || (p.assists || 0) > 0 || (p.bonusPoints || 0) > 0 || (p.cleanSheets || 0) > 0;
      let playedInLineups = false;
      teamMatches.forEach(m => {
        const lineup = m.homeTeamId === p.teamId ? m.homeLineup : m.awayLineup;
        if (lineup) {
          if (lineup.startingXI?.some(lp => lp.playerId === p.id)) playedInLineups = true;
          if (lineup.substitutes?.some(lp => lp.playerId === p.id)) {
            if (m.events?.some(e => e.eventType === 'Sub' && e.subInPlayerId === p.id)) playedInLineups = true;
          }
        } else {
          playedInLineups = true;
        }
      });
      return playedWithStats || playedInLineups;
    };

    let starterIds = squadData.startingPlayerIds || existing?.startingPlayerIds || newPlayerIds.slice(0, 11);
    let benchIds = squadData.benchPlayerIds || existing?.benchPlayerIds || newPlayerIds.filter(id => !starterIds.includes(id));
    let captainId = squadData.captainPlayerId || existing?.captainPlayerId || starterIds[0];
    let viceCaptainId = squadData.viceCaptainPlayerId || existing?.viceCaptainPlayerId || starterIds[1] || starterIds[0];
    const activeChip = squadData.activeChip !== undefined ? squadData.activeChip : (existing?.activeChip || null);

    // AUTO-SUB ENGINE
    const startersList = starterIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];
    const benchList = benchIds.map(id => playerMap.get(id)).filter(Boolean) as Player[];

    // Goalkeeper sub
    let finalStarters = [...startersList];
    const startingGK = startersList.find(p => p.position === 'GK');
    const benchGK = benchList.find(p => p.position === 'GK');

    if (startingGK && !didPlayerPlay(startingGK) && benchGK && didPlayerPlay(benchGK)) {
      finalStarters = finalStarters.map(p => p.id === startingGK.id ? benchGK : p);
    }

    // Outfield subs
    const benchOutfieldAvailable = benchList.filter(p => p.position !== 'GK' && didPlayerPlay(p));
    const nonPlayingOutfieldStarters = finalStarters.filter(p => p.position !== 'GK' && !didPlayerPlay(p));

    nonPlayingOutfieldStarters.forEach(nonPlayer => {
      if (benchOutfieldAvailable.length === 0) return;

      const playingDefs = finalStarters.filter(p => p.position === 'DEF' && didPlayerPlay(p)).length;
      const playingFws = finalStarters.filter(p => p.position === 'FWD' && didPlayerPlay(p)).length;

      let subInIndex = -1;
      if (playingDefs < 3) {
        subInIndex = benchOutfieldAvailable.findIndex(p => p.position === 'DEF');
      } else if (playingFws < 1) {
        subInIndex = benchOutfieldAvailable.findIndex(p => p.position === 'FWD');
      }

      if (subInIndex === -1) {
        subInIndex = 0;
      }

      if (subInIndex >= 0 && subInIndex < benchOutfieldAvailable.length) {
        const subInPlayer = benchOutfieldAvailable.splice(subInIndex, 1)[0];
        finalStarters = finalStarters.map(p => p.id === nonPlayer.id ? subInPlayer : p);
      }
    });

    // Captain / Vice Captain multiplier shift
    const effectiveCaptain = finalStarters.find(p => p.id === captainId && didPlayerPlay(p));
    const effectiveVice = finalStarters.find(p => p.id === viceCaptainId && didPlayerPlay(p));

    let activeMultiplierId = captainId;
    if (!effectiveCaptain && effectiveVice) {
      activeMultiplierId = viceCaptainId;
    }

    const captainMultiplier = activeChip === 'TC' ? 3 : 2;

    let computedGameweekPoints = 0;
    if (activeChip === 'BB') {
      newPlayerIds.forEach(pId => {
        const p = playerMap.get(pId);
        if (p) {
          let pts = this.calculatePlayerSeasonPoints(p, bonusMap);
          if (pId === activeMultiplierId) pts *= captainMultiplier;
          computedGameweekPoints += pts;
        }
      });
    } else {
      finalStarters.forEach(p => {
        let pts = this.calculatePlayerSeasonPoints(p, bonusMap);
        if (p.id === activeMultiplierId) pts *= captainMultiplier;
        computedGameweekPoints += pts;
      });
    }

    const totalPoints = Math.max(0, computedGameweekPoints - pointHits);

    // Process purchase prices according to FPL dynamic pricing logic
    const incomingSquadPlayers = squadData.squadPlayers || [];
    const incomingPurchasePrices = squadData.playerPurchasePrices || {};
    const existingPricesMap: Record<string, number> = existing?.playerPurchasePrices || {};

    if (existing?.squadPlayers) {
      existing.squadPlayers.forEach(sp => {
        if (existingPricesMap[sp.playerId] === undefined) {
          existingPricesMap[sp.playerId] = sp.purchasePrice;
        }
      });
    }

    const finalPlayerPurchasePrices: Record<string, number> = {};
    const finalSquadPlayers = newPlayerIds.map(pId => {
      let purchasePrice: number | undefined = incomingPurchasePrices[pId];
      if (purchasePrice === undefined) {
        const foundInc = incomingSquadPlayers.find(sp => sp.playerId === pId);
        if (foundInc) purchasePrice = foundInc.purchasePrice;
      }
      if (purchasePrice === undefined) {
        purchasePrice = existingPricesMap[pId];
      }
      if (purchasePrice === undefined) {
        const p = playerMap.get(pId);
        purchasePrice = p ? (p.currentPrice || p.price || 6.0) : 6.0;
      }
      finalPlayerPurchasePrices[pId] = purchasePrice;
      return { playerId: pId, purchasePrice };
    });

    const fullSquad: FantasySquad = sanitizeForFirestore({
      id: existing?.id || `squad-${Date.now()}`,
      userId: squadData.userId || existing?.userId || emailLower,
      userEmail: emailLower,
      userName: squadData.userName || existing?.userName || emailLower.split('@')[0],
      squadName: squadData.squadName || existing?.squadName || `${emailLower.split('@')[0]}'s XI`,
      captainPlayerId: captainId || '',
      viceCaptainPlayerId: viceCaptainId || '',
      startingPlayerIds: starterIds,
      benchPlayerIds: benchIds,
      playerIds: newPlayerIds,
      squadPlayers: finalSquadPlayers,
      playerPurchasePrices: finalPlayerPurchasePrices,
      savedBaselinePlayerIds: baselineIds,
      transfersMade,
      freeTransfers,
      pointHits,
      totalPoints,
      gameweekPoints: computedGameweekPoints,
      activeChip,
      updatedAt: new Date().toISOString()
    });

    if (existingIdx >= 0) {
      this.data.fantasySquads[existingIdx] = fullSquad;
    } else {
      this.data.fantasySquads.push(fullSquad);
    }

    // Sync fantasyTeamName to UserAccount
    if (this.data.users) {
      const u = this.data.users.find(usr => usr.email.toLowerCase() === emailLower);
      if (u) {
        if (fullSquad.squadName) u.fantasyTeamName = fullSquad.squadName;
        if (fullSquad.userName && fullSquad.userName !== u.name) u.name = fullSquad.userName;
      }
    }

    this.saveData(this.data);
    return fullSquad;
  }

  public async resetFantasyTest() {
    this.assertWritable();
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }
    
    try {
      const { error: delErr } = await supabase.from('fantasySquads').delete().neq('id', '');
      if (delErr && !isMissingSchemaError(delErr)) throw delErr;
      console.log('Cleared fantasySquads from Supabase');
      
      const { error: updErr } = await supabase
        .from('users')
        .update({ fantasyTeamName: null })
        .neq('id', '');
      if (updErr && !isMissingSchemaError(updErr)) {
        console.error('Failed to update users in Supabase:', updErr);
      }
    } catch (err) {
      console.error('Failed to reset fantasy test in Supabase', err);
      throw err;
    }

    // Safely update memory without triggering global saveData which could wipe players
    this.data.fantasySquads = [];
    if (this.data.users) {
      this.data.users = this.data.users.map(u => {
        delete u.fantasyTeamName;
        return u;
      });
    }
  }

  public async deleteFantasySquad(squadId: string, userId: string) {
    this.assertWritable();
    // 1. Remove from local memory
    if (this.data.fantasySquads) {
      this.data.fantasySquads = this.data.fantasySquads.filter(s => s.id !== squadId);
    }
    
    // 2. Update user profile to remove fantasy fields
    if (this.data.users) {
      this.data.users = this.data.users.map(u => {
        if (u.id === userId) {
          delete u.fantasyTeamName;
          delete (u as any).fantasySquadId;
          delete (u as any).hasFantasyTeam;
          delete (u as any).onboardingCompleted;
        }
        return u;
      });
    }
    
    this.saveData(this.data);

    // 3. Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('fantasySquads').delete().eq('id', squadId);
        await supabase.from('users').update({ fantasyTeamName: null }).eq('id', userId);
      } catch (err) {
        console.error('Failed to delete squad in Supabase', err);
      }
    }
  }

  public async clearAllFantasySquads() {
    this.assertWritable();
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }
    
    try {
      const { error } = await supabase.from('fantasySquads').delete().neq('id', '');
      if (error && !isMissingSchemaError(error)) throw error;
      console.log('Cleared fantasySquads from Supabase');
    } catch (err) {
      console.error('Failed to clear fantasySquads from Supabase', err);
      throw err;
    }

    // Update memory safely
    this.data.fantasySquads = [];
    if (this.data.users) {
      this.data.users = this.data.users.map(u => {
        delete u.fantasyTeamName;
        return u;
      });
    }
  }

  public getMiniLeagues(): MiniLeague[] {
    if (!this.data.miniLeagues) this.data.miniLeagues = [];
    return this.data.miniLeagues;
  }

  public createMiniLeague(name: string, ownerId: string, ownerName: string, userEmail: string): MiniLeague {
    this.assertWritable();
    if (!this.data.miniLeagues) this.data.miniLeagues = [];
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newLeague: MiniLeague = sanitizeForFirestore({
      id: `ml-${Date.now()}`,
      name,
      code,
      ownerId,
      ownerName,
      memberEmails: [userEmail.trim().toLowerCase()],
      createdAt: new Date().toISOString()
    });
    this.data.miniLeagues.push(newLeague);
    this.saveData(this.data);
    return newLeague;
  }

  public joinMiniLeague(code: string, userEmail: string): MiniLeague {
    this.assertWritable();
    if (!this.data.miniLeagues) this.data.miniLeagues = [];
    const cleanCode = code.trim().toUpperCase();
    const league = this.data.miniLeagues.find(l => l.code === cleanCode);
    if (!league) throw new Error('Invalid Mini-League Code');

    const lowerEmail = userEmail.trim().toLowerCase();
    if (!league.memberEmails.map(e => e.toLowerCase()).includes(lowerEmail)) {
      league.memberEmails.push(lowerEmail);
      this.saveData(this.data);
    }
    return league;
  }

  public getManagerChips(userIdOrEmail: string): ManagerChips | null {
    if (!this.data.managerChips) return null;
    const key = (userIdOrEmail || '').trim().toLowerCase();
    return this.data.managerChips.find(c => 
      c.userId && (c.userId.toLowerCase() === key || c.userId.toLowerCase().includes(key) || key.includes(c.userId.toLowerCase()))
    ) || null;
  }

  public saveManagerChips(rawChips: ManagerChips) {
    this.assertWritable();
    const chips = sanitizeForFirestore(rawChips);
    if (!this.data.managerChips) this.data.managerChips = [];
    const index = this.data.managerChips.findIndex(c => c.userId === chips.userId);
    if (index >= 0) {
      this.data.managerChips[index] = chips;
    } else {
      this.data.managerChips.push(chips);
    }
    this.saveData(this.data);
    return chips;
  }

  public resetAllManagerChips(): void {
    this.assertWritable();
    if (!this.data.managerChips) this.data.managerChips = [];
    this.data.managerChips = this.data.managerChips.map(c => ({
      userId: c.userId,
      tripleCaptainAvailable: true,
      tripleCaptainUsedGw: null,
      benchBoostAvailable: true,
      benchBoostUsedGw: null,
      wildcardAvailable: true,
      wildcardUsedGw: null,
      activeChipPending: null
    }));
    this.saveData(this.data);
  }

  public getPlayerOfTheMonth(): PlayerOfTheMonth[] {
    return this.data.playerOfTheMonth || [];
  }

  public savePlayerOfTheMonth(potw: Partial<PlayerOfTheMonth>): PlayerOfTheMonth {
    this.assertWritable();
    if (!this.data.playerOfTheMonth) this.data.playerOfTheMonth = [];
    const potwId = potw.id || `potw-${Date.now()}`;
    const index = this.data.playerOfTheMonth.findIndex(p => p.id === potwId);
    
    const cleanPotw: PlayerOfTheMonth = sanitizeForFirestore({
      id: potwId,
      month: potw.month || 'Current Month',
      playerName: potw.playerName || 'Player',
      teamLogoUrl: potw.teamLogoUrl || '',
      position: potw.position || '',
      score: potw.score || '',
      headline: potw.headline || '',
      description: potw.description || '',
      graphicUrl: potw.graphicUrl || '',
      createdAt: potw.createdAt || new Date().toISOString()
    });

    if (index >= 0) {
      this.data.playerOfTheMonth[index] = cleanPotw;
    } else {
      this.data.playerOfTheMonth.push(cleanPotw);
    }
    this.saveData(this.data);
    return cleanPotw;
  }

  public deletePlayerOfTheMonth(id: string) {
    this.assertWritable();
    if (!this.data.playerOfTheMonth) this.data.playerOfTheMonth = [];
    this.data.playerOfTheMonth = this.data.playerOfTheMonth.filter(p => p.id !== id);
    this.saveData(this.data);
  }

  public getFixtureChats(matchId: string): FixtureChatMessage[] {
    return this.data.fixture_chats
      .filter(c => c.matchId === matchId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addFixtureMessage(msg: { matchId: string; userId: string; username: string; content: string; avatarUrl?: string }): FixtureChatMessage {
    this.assertWritable();
    const newChat: FixtureChatMessage = sanitizeForFirestore({
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      matchId: msg.matchId,
      userId: msg.userId || 'anon',
      username: msg.username || 'EPL Fan',
      avatarUrl: msg.avatarUrl || '',
      content: msg.content,
      timestamp: new Date().toISOString()
    });
    this.data.fixture_chats.push(newChat);
    this.saveData(this.data);
    return newChat;
  }

  public deleteFixtureMessage(chatId: string): boolean {
    this.assertWritable();
    if (!this.data.fixture_chats) return false;
    const initialLen = this.data.fixture_chats.length;
    this.data.fixture_chats = this.data.fixture_chats.filter(c => c.id !== chatId);
    const deleted = this.data.fixture_chats.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
    }
    return deleted;
  }

  public getMatchVideos(): MatchVideo[] {
    return this.data.match_videos || [];
  }

  public saveMatchVideo(video: Partial<MatchVideo>): MatchVideo {
    this.assertWritable();
    if (!this.data.match_videos) this.data.match_videos = [];
    const videoId = video.id || `vid-${Date.now()}`;
    const index = this.data.match_videos.findIndex(v => v.id === videoId);

    const cleanVideo: MatchVideo = sanitizeForFirestore({
      id: videoId,
      embed_url: video.embed_url || '',
      thumbnail_url: video.thumbnail_url || '',
      source_platform: video.source_platform || 'YouTube',
      title: video.title || 'Match Video',
      description: video.description || '',
      created_at: video.created_at || new Date().toISOString(),
      likesCount: video.likesCount ?? 0,
      author: video.author || '',
      authorRole: video.authorRole || '',
      authorEmail: video.authorEmail || ''
    });

    if (index >= 0) {
      this.data.match_videos[index] = cleanVideo;
    } else {
      this.data.match_videos.push(cleanVideo);
    }
    this.saveData(this.data);
    return cleanVideo;
  }

  public deleteMatchVideo(id: string): boolean {
    this.assertWritable();
    if (!this.data.match_videos) return false;
    const initialLen = this.data.match_videos.length;
    this.data.match_videos = this.data.match_videos.filter(v => v.id !== id);
    const deleted = this.data.match_videos.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
    }
    return deleted;
  }

  public getEplHighlights(): any[] {
    return this.data.epl_highlights || [];
  }

  public saveEplHighlight(highlight: any): any {
    this.assertWritable();
    if (!this.data.epl_highlights) this.data.epl_highlights = [];
    const hlId = highlight.id || `hl-${Date.now()}`;
    const index = this.data.epl_highlights.findIndex(h => h.id === hlId);

    const cleanHL = sanitizeForFirestore({
      ...highlight,
      id: hlId,
      title: highlight.title || 'EPL Highlight',
      videoUrl: highlight.videoUrl || '',
      thumbnailUrl: highlight.thumbnailUrl || '',
      posterImageUrl: highlight.posterImageUrl || '',
      writeup: highlight.writeup || '',
      likesCount: highlight.likesCount ?? 0,
      author: highlight.author || 'Official League FA',
      authorRole: highlight.authorRole || 'official_league',
      description: highlight.description || '',
      createdAt: highlight.createdAt || new Date().toISOString(),
      authorEmail: highlight.authorEmail || null
    });

    if (index >= 0) {
      this.data.epl_highlights[index] = cleanHL;
    } else {
      this.data.epl_highlights.push(cleanHL);
    }
    this.saveData(this.data);
    return cleanHL;
  }

  public deleteEplHighlight(id: string): boolean {
    this.assertWritable();
    if (!this.data.epl_highlights) return false;
    const initialLen = this.data.epl_highlights.length;
    this.data.epl_highlights = this.data.epl_highlights.filter(h => h.id !== id);
    const deleted = this.data.epl_highlights.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
    }
    return deleted;
  }

  public finalizeGameweek(gameweek: number): { success: boolean, processedSquads: number } {
    this.assertWritable();
    const squads = this.data.fantasySquads || [];
    const allGameweekMatches = this.data.matches.filter(m => m.matchday === gameweek);

    if (allGameweekMatches.length === 0) {
      throw new Error(`No matches found for Gameweek ${gameweek}.`);
    }

    const uncompletedMatches = allGameweekMatches.filter(m => m.status !== 'Full-Time');
    if (uncompletedMatches.length > 0) {
      throw new Error(`Cannot finalize Gameweek ${gameweek}. There are ${uncompletedMatches.length} match(es) not yet at 'Full-Time'.`);
    }

    const missingBonusMatches = allGameweekMatches.filter(m => {
       const p1 = m.fantasyBonus1stPlayerId || m.bonusPointsAllocations?.firstPlacePlayerId;
       const p2 = m.fantasyBonus2ndPlayerId || m.bonusPointsAllocations?.secondPlacePlayerId;
       const p3 = m.fantasyBonus3rdPlayerId || m.bonusPointsAllocations?.thirdPlacePlayerId;
       return !p1 || !p2 || !p3;
    });

    if (missingBonusMatches.length > 0) {
       throw new Error(`Cannot finalize Gameweek ${gameweek}. There are ${missingBonusMatches.length} match(es) missing Fantasy Bonus Points allocations.`);
    }
    
    // Build Bonus Points Map STRICTLY from MATCH AWARDS fields on the match documents.
    const bonusMap = new Map<string, number>();
    allGameweekMatches.forEach(m => {
      const p1 = m.fantasyBonus1stPlayerId || m.bonusPointsAllocations?.firstPlacePlayerId;
      const p2 = m.fantasyBonus2ndPlayerId || m.bonusPointsAllocations?.secondPlacePlayerId;
      const p3 = m.fantasyBonus3rdPlayerId || m.bonusPointsAllocations?.thirdPlacePlayerId;
      if (p1) bonusMap.set(p1, (bonusMap.get(p1) || 0) + 3);
      if (p2) bonusMap.set(p2, (bonusMap.get(p2) || 0) + 2);
      if (p3) bonusMap.set(p3, (bonusMap.get(p3) || 0) + 1);
    });

    let processedSquads = 0;
    
    squads.forEach(squad => {
      this.saveFantasySquad(squad, bonusMap);
      processedSquads++;
    });

    // ----------------------------------------------------
    // AGGREGATION: Top Owned and Most Captained Counts
    // ----------------------------------------------------
    const ownershipCount = new Map<string, number>();
    const captaincyCount = new Map<string, number>();

    this.data.fantasySquads.forEach(sq => {
      (sq.playerIds || []).forEach(pid => {
        ownershipCount.set(pid, (ownershipCount.get(pid) || 0) + 1);
      });
      if (sq.captainPlayerId) {
        captaincyCount.set(sq.captainPlayerId, (captaincyCount.get(sq.captainPlayerId) || 0) + 1);
      }
    });

    this.data.players.forEach(p => {
      p.ownedByCount = ownershipCount.get(p.id) || 0;
      p.captainedByCount = captaincyCount.get(p.id) || 0;
    });

    // Calculate the single-read metadata payload
    const topPerformers = [...(this.data.players || [])].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)).slice(0, 10);
    const mostOwnedPlayers = [...(this.data.players || [])].sort((a, b) => (b.ownedByCount || 0) - (a.ownedByCount || 0)).slice(0, 5);
    const mostCaptainedPlayers = [...(this.data.players || [])].sort((a, b) => (b.captainedByCount || 0) - (a.captainedByCount || 0)).slice(0, 5);
    
    if (isSupabaseConfigured && this.isFirestoreSynced) {
       const statsPayload = sanitizeForFirestore({
           id: 'fantasy_dashboard_stats',
           topPerformers,
           mostOwnedPlayers,
           mostCaptainedPlayers,
           lastUpdated: Date.now()
       });
       supabase.from('system_configs').upsert(statsPayload, { onConflict: 'id' }).then(() => {}, () => {});
       supabase.from('configs').upsert({ ...statsPayload, id: 'dashboard_meta_caching' }, { onConflict: 'id' }).then(() => {}, () => {});
       supabase.from('system_configs').upsert(sanitizeForFirestore({
           id: 'player_version',
           last_updated: Date.now()
       }), { onConflict: 'id' }).then(() => {}, () => {});
    }

    this.data.playerVersion = Date.now();
    this.saveData(this.data);
    return { success: true, processedSquads };
  }

  public likeEplHighlight(id: string): any | null {
    this.assertWritable();
    if (!this.data.epl_highlights) return null;
    const highlight = this.data.epl_highlights.find(h => h.id === id);
    if (highlight) {
      highlight.likesCount = (highlight.likesCount || 0) + 1;
      this.saveData(this.data);
      return highlight;
    }
    return null;
  }

  public getFantasyDashboardStats() {
    const topPerformers = [...(this.data.players || [])].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)).slice(0, 10);
    const mostOwnedPlayers = [...(this.data.players || [])].sort((a, b) => (b.ownedByCount || 0) - (a.ownedByCount || 0)).slice(0, 5);
    const mostCaptainedPlayers = [...(this.data.players || [])].sort((a, b) => (b.captainedByCount || 0) - (a.captainedByCount || 0)).slice(0, 5);
    
    return {
        topPerformers,
        mostOwnedPlayers,
        mostCaptainedPlayers,
        lastUpdated: Date.now()
    };
  }
  
  public getPlayerVersion() {
    return { last_updated: this.data.playerVersion || 0 };
  }

  public runSchemaMigrationV2() {
    this.assertWritable();
    // 1. Matches tracking fields
    if (this.data.matches) {
      this.data.matches.forEach(m => {
        if (m.homeVotes === undefined) m.homeVotes = 0;
        if (m.awayVotes === undefined) m.awayVotes = 0;
        if (m.drawVotes === undefined) m.drawVotes = 0;
      });
    }

    // 2. Players ownership and captaincy counts
    const ownershipCount = new Map<string, number>();
    const captaincyCount = new Map<string, number>();
    (this.data.fantasySquads || []).forEach(sq => {
      (sq.playerIds || []).forEach(pid => {
        ownershipCount.set(pid, (ownershipCount.get(pid) || 0) + 1);
      });
      if (sq.captainPlayerId) {
        captaincyCount.set(sq.captainPlayerId, (captaincyCount.get(sq.captainPlayerId) || 0) + 1);
      }
    });

    if (this.data.players) {
      this.data.players.forEach(p => {
        p.ownedByCount = ownershipCount.get(p.id) || 0;
        p.captainedByCount = captaincyCount.get(p.id) || 0;
      });
    }

    // 3. System Config Meta Documents
    const topPerformers = [...(this.data.players || [])].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)).slice(0, 10);
    const mostOwnedPlayers = [...(this.data.players || [])].sort((a, b) => (b.ownedByCount || 0) - (a.ownedByCount || 0)).slice(0, 5);
    const mostCaptainedPlayers = [...(this.data.players || [])].sort((a, b) => (b.captainedByCount || 0) - (a.captainedByCount || 0)).slice(0, 5);

    const metaPayload = sanitizeForFirestore({
      topPerformers,
      mostOwnedPlayers,
      mostCaptainedPlayers,
      lastUpdated: Date.now()
    });

    if (isSupabaseConfigured && this.isFirestoreSynced) {
      supabase.from('system_configs').upsert({ ...metaPayload, id: 'fantasy_dashboard_stats' }, { onConflict: 'id' }).then(() => {}, () => {});
      supabase.from('configs').upsert({ ...metaPayload, id: 'dashboard_meta_caching' }, { onConflict: 'id' }).then(() => {}, () => {});
      supabase.from('system_configs').upsert(sanitizeForFirestore({ id: 'player_version', last_updated: Date.now() }), { onConflict: 'id' }).then(() => {}, () => {});
    }

    this.data.playerVersion = Date.now();
    this.saveData(this.data);

    return {
      success: true,
      message: 'Schema migration v2 completed successfully.',
      migratedMatches: (this.data.matches || []).length,
      migratedPlayers: (this.data.players || []).length
    };
  }
}

export const db = new DBStore();
