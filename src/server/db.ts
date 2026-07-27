import fs from 'fs';
import { EventEmitter } from 'events';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, setLogLevel, collection, getDocs, deleteDoc } from 'firebase/firestore';
setLogLevel('silent');

let firestore: Firestore | null = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    if (firebaseConfig.projectId) {
      const app = initializeApp({
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
      });
      firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    }
  }
} catch (e) {
  console.error('Failed to initialize Firebase', e);
}

import { Team, Player, Match, MatchEvent, NewsArticle, AdminUser, UserAccount, AppNotification, AppSettings, MatchPrediction, MatchPredictionStats, PredictionType, FantasySquad, MiniLeague, MatchLineup, LineupPlayer, Advertisement, PlayerOfTheMonth, ManagerChips, FixtureChatMessage, MatchVideo } from '../types';

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
  advertisements?: Advertisement[];
  playerOfTheMonth?: PlayerOfTheMonth[];
  managerChips?: ManagerChips[];
  fixture_chats?: FixtureChatMessage[];
  match_videos?: MatchVideo[];
  epl_highlights?: any[];
}

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Epe Premier League',
  appLogoUrl: '/logo.png',
  primaryColor: '#800020',
  accentColor: '#facc15',
  defaultTheme: 'dark',
  leagueSeason: '2026 Season',
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

const INITIAL_TEAMS: Team[] = [];

const INITIAL_PLAYERS: Player[] = [];

const INITIAL_MATCHES: Match[] = [];

const INITIAL_EVENTS: MatchEvent[] = [];

const INITIAL_RATINGS: Record<string, Record<string, number>> = {};

const INITIAL_NEWS: NewsArticle[] = [];

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
  private data: DatabaseSchema;
  private lastFirestoreSyncState: Record<string, string> = {};
  private isFirestoreSynced: boolean = false;

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
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
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
      matches: INITIAL_MATCHES,
      events: INITIAL_EVENTS,
      ratings: INITIAL_RATINGS,
      news: INITIAL_NEWS,
      admins: INITIAL_ADMINS,
      users: INITIAL_USERS,
      notifications: INITIAL_NOTIFICATIONS,
      settings: INITIAL_SETTINGS
    };
    if (!loaded) {
        this.saveData(initial);
    }

    if (firestore) {
        this.syncFromFirestore();
    }
    return initial;
  }

  private async syncFromFirestore() {
      try {
          if (!firestore) return;
          const collections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'fantasySquads', 'miniLeagues', 'advertisements', 'playerOfTheMonth', 'managerChips', 'match_videos', 'fixture_chats', 'epl_highlights'];
          
          let hasData = false;
          const updates: any = {};
          for (const col of collections) {
              const querySnapshot = await getDocs(collection(firestore, col));
              if (!querySnapshot.empty) {
                  hasData = true;
              }
              const items: any[] = [];
              querySnapshot.forEach(docSnap => {
                  const data = docSnap.data();
                  this.lastFirestoreSyncState[`${col}_${docSnap.id}`] = JSON.stringify(data);
                  items.push(data);
              });
              
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
          if (hasData) {
              Object.assign(this.data, updates);
              this.recalculateLeagueStatsAndStandings();
              fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
              console.log('Successfully synced data from Firestore');
          } else {
              console.log('Firestore is empty, will seed with initial data on next save');
          }
          this.isFirestoreSynced = true;
          if (!hasData) {
              this.saveData(this.data);
          }
      } catch(e) {
          console.error('Error syncing from Firestore:', e);
      }
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      
      if (firestore && this.isFirestoreSynced) {
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
                 const id = item.id;
                 if (!id) continue;
                 const stringified = JSON.stringify(item);
                 const cacheKey = `${colMap.col}_${id}`;
                 if (this.lastFirestoreSyncState[cacheKey] !== stringified) {
                     this.lastFirestoreSyncState[cacheKey] = stringified;
                     promises.push(setDoc(doc(firestore, colMap.col, id), JSON.parse(stringified)));
                 }
             }
         }
         
         if (promises.length > 0) {
             Promise.all(promises).catch(err => {
                 console.error('Firestore sync error:', err.message || err);
                 if (err.message && err.message.toLowerCase().includes('quota')) {
                     console.warn('Firebase quota exceeded. Disabling sync to prevent further errors.');
                     this.isFirestoreSynced = false;
                 }
             });
         }
      }
    } catch (e) {
      console.error('Failed to save database file', e);
    }
  }

  public resetSeed(): DatabaseSchema {
    this.data = {
      teams: INITIAL_TEAMS,
      players: INITIAL_PLAYERS,
      matches: INITIAL_MATCHES,
      events: INITIAL_EVENTS,
      ratings: INITIAL_RATINGS,
      news: INITIAL_NEWS,
      admins: INITIAL_ADMINS,
      users: INITIAL_USERS,
      notifications: INITIAL_NOTIFICATIONS
    };
    this.saveData(this.data);
    return this.data;
  }

  public resetTableDataToZero(): DatabaseSchema {
    // Reset all team standings and statistics to zero
    this.data.teams = (this.data.teams || INITIAL_TEAMS).map(t => ({
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

    // Reset all player goals, assists, and clean sheets to zero
    this.data.players = (this.data.players || INITIAL_PLAYERS).map(p => ({
      ...p,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      ratingAverage: undefined
    }));

    // Reset all match scores to 0-0 and status to Scheduled
    this.data.matches = (this.data.matches || INITIAL_MATCHES).map(m => ({
      ...m,
      homeScore: 0,
      awayScore: 0,
      status: 'Scheduled',
      period: 'Pre-Match',
      matchMinute: 0,
      stoppageTime1stHalf: 0,
      stoppageTime2ndHalf: 0,
      ratings: {}
    }));

    // Clear all recorded match events and player ratings
    this.data.events = [];
    this.data.ratings = {};

    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
    return this.data;
  }

  // ADMIN MANAGEMENT
  public getAdmins(): AdminUser[] {
    if (!this.data.admins || this.data.admins.length === 0) {
      this.data.admins = INITIAL_ADMINS;
      this.saveData(this.data);
    }
    return this.data.admins;
  }

  public saveAdmin(admin: AdminUser): AdminUser {
    if (!this.data.admins) this.data.admins = INITIAL_ADMINS;
    const idx = this.data.admins.findIndex(a => a.email.toLowerCase() === admin.email.toLowerCase());
    if (idx >= 0) {
      this.data.admins[idx] = { ...this.data.admins[idx], ...admin };
    } else {
      this.data.admins.push(admin);
    }
    if (this.data.users) {
      const uIdx = this.data.users.findIndex(u => u.email.toLowerCase() === admin.email.toLowerCase());
      if (uIdx >= 0) {
        this.data.users[uIdx].role = admin.role as any;
      }
    }
    this.saveData(this.data);
    return admin;
  }

  public deleteAdmin(email: string) {
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
      this.data.users = INITIAL_USERS;
      this.saveData(this.data);
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

      updatedUser = {
        ...existingUser,
        ...user,
        fantasyTeamName: lockedFantasyTeamName,
        role: assignedRole
      };
      this.data.users[idx] = updatedUser;
    } else {
      updatedUser = {
        id: user.id || `user-${Date.now()}`,
        email: emailLower,
        name: user.name || emailLower.split('@')[0],
        role: assignedRole,
        favoriteTeamId: user.favoriteTeamId || 'team-1',
        fantasyTeamName: user.fantasyTeamName && user.fantasyTeamName.trim() ? user.fantasyTeamName.trim() : undefined,
        notificationsEnabled: user.notificationsEnabled ?? true,
        themePreference: user.themePreference || 'dark',
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        createdAt: new Date().toISOString()
      };
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
      this.data.notifications = INITIAL_NOTIFICATIONS;
      this.saveData(this.data);
    }
    return this.data.notifications;
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string; idempotencyKey?: string }): AppNotification {
    if (!this.data.notifications) this.data.notifications = INITIAL_NOTIFICATIONS;
    if (!this.data.dispatchedNotificationKeys) this.data.dispatchedNotificationKeys = [];

    const key = notification.idempotencyKey || notification.id;
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

    const newNotif: any = {
      id: key || `notif-${Date.now()}`,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      eventType: notification.eventType,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      idempotencyKey: key
    };
    if (notification.linkMatchId !== undefined) {
      newNotif.linkMatchId = notification.linkMatchId;
    }
    
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
    if (!this.data.notifications) return;
    this.data.notifications = this.data.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.saveData(this.data);
  }

  public markAllNotificationsRead() {
    if (!this.data.notifications) return;
    this.data.notifications = this.data.notifications.map(n => ({ ...n, read: true }));
    this.saveData(this.data);
  }

  public async clearNotifications() {
    this.data.notifications = [];
    this.saveData(this.data);
    if (firestore) {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'notifications'));
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(firestore, 'notifications', document.id)));
        await Promise.all(deletePromises);
        console.log('Firebase notifications collection completely wiped.');
      } catch (err) {
        console.error('Failed to wipe Firebase notifications collection:', err);
      }
    }
  }

  // TEAMS
  public getTeams(): Team[] {
    return this.data.teams;
  }

  public saveTeam(team: Partial<Team>): Team {
    if (!this.data.teams) this.data.teams = INITIAL_TEAMS;
    const teamId = team.id || `team-${Date.now()}`;
    const idx = this.data.teams.findIndex(t => t.id === teamId);
    if (idx >= 0) {
      const updated: Team = {
        ...this.data.teams[idx],
        ...team,
        id: teamId
      };
      this.data.teams[idx] = updated;
      this.saveData(this.data);
      return updated;
    } else {
      const fullTeam: Team = {
        id: teamId,
        name: team.name || 'New Team',
        shortName: team.shortName || team.name?.slice(0, 3).toUpperCase() || 'NT',
        logoUrl: team.logoUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80',
        points: team.points ?? 0,
        goalDifference: team.goalDifference ?? 0,
        matchesPlayed: team.matchesPlayed ?? 0,
        won: team.won ?? 0,
        drawn: team.drawn ?? 0,
        lost: team.lost ?? 0,
        goalsFor: team.goalsFor ?? 0,
        goalsAgainst: team.goalsAgainst ?? 0,
        coach: team.coach || 'Head Coach',
        stadium: team.stadium || 'Epe Arena'
      };
      this.data.teams.push(fullTeam);
      this.saveData(this.data);
      return fullTeam;
    }
  }

  public deleteTeam(id: string) {
    this.data.teams = this.data.teams.filter(t => t.id !== id);
    this.saveData(this.data);
  }

  // PLAYERS
  public getPlayers(teamId?: string): Player[] {
    if (!this.data.players) this.data.players = INITIAL_PLAYERS;

    const allRatingsForPlayers: Record<string, number[]> = {};
    if (this.data.ratings) {
      Object.values(this.data.ratings).forEach(matchRatings => {
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

    const processed = this.data.players.map(p => {
      const arr = allRatingsForPlayers[p.id];
      let ratingAverage: number = 0;
      if (arr && arr.length > 0) {
        const sum = arr.reduce((acc, curr) => acc + curr, 0);
        ratingAverage = Number((sum / arr.length).toFixed(2));
      }
      return {
        ...p,
        ratingAverage
      };
    });

    if (teamId) {
      return processed.filter(p => p.teamId === teamId);
    }
    return processed;
  }

  public savePlayer(player: Partial<Player>): Player {
    if (!this.data.players) this.data.players = INITIAL_PLAYERS;
    const playerId = player.id || `p-${Date.now()}`;
    const idx = this.data.players.findIndex(p => p.id === playerId);
    if (idx >= 0) {
      const updated: Player = {
        ...this.data.players[idx],
        ...player,
        id: playerId
      };
      this.data.players[idx] = updated;
      this.saveData(this.data);
      return updated;
    } else {
      const defaultTeamId = this.data.teams && this.data.teams.length > 0 ? this.data.teams[0].id : 'team-1';
      const newPlayer: Player = {
        id: playerId,
        name: player.name || 'New Player',
        teamId: player.teamId || defaultTeamId,
        position: player.position || 'MID',
        goals: player.goals ?? 0,
        assists: player.assists ?? 0,
        cleanSheets: player.cleanSheets ?? 0,
        shirtNumber: player.shirtNumber ?? 10,
        photoUrl: player.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        age: player.age ?? 22,
        height: player.height || '180 cm',
        weight: player.weight || '75 kg',
        preferredFoot: player.preferredFoot || 'Right',
        nationality: player.nationality || 'Nigeria',
        bio: player.bio || ''
      };
      this.data.players.push(newPlayer);
      this.saveData(this.data);
      return newPlayer;
    }
  }

  public deletePlayer(id: string) {
    this.data.players = this.data.players.filter(p => p.id !== id);
    this.saveData(this.data);
  }

  public deletePlayersBulk(ids: string[]) {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    this.data.players = this.data.players.filter(p => !idSet.has(p.id));
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

  public saveMatch(match: Match): Match {
    const idx = this.data.matches.findIndex(m => m.id === match.id);
    if (idx >= 0) {
      this.data.matches[idx] = { ...this.data.matches[idx], ...match };
    } else {
      this.data.matches.push(match);
    }
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
    return this.getMatch(match.id) || match;
  }

  public saveMatchesBulk(newMatches: Partial<Match>[]): Match[] {
    const savedList: Match[] = [];
    const teams = this.getTeams();
    
    for (let i = 0; i < newMatches.length; i++) {
      const mData = newMatches[i];
      const homeTeam = teams.find(t => t.id === mData.homeTeamId);
      const matchId = mData.id || `m-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
      
      const fullMatch: Match = {
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
        venue: mData.venue || homeTeam?.stadium || 'Epe Township Stadium',
        matchday: Number(mData.matchday || 1)
      };

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
    this.data.matches = this.data.matches.filter(m => m.id !== id);
    this.data.events = this.data.events.filter(e => e.matchId !== id);
    if (this.data.ratings[id]) {
      delete this.data.ratings[id];
    }
    this.recalculateLeagueStatsAndStandings();
    this.saveData(this.data);
  }

  // EVENTS
  public addEvent(event: MatchEvent): MatchEvent {
    this.data.events.push(event);

    // If event is a Goal, auto update score in match & player goal tally!
    const match = this.data.matches.find(m => m.id === event.matchId);
    if (match) {
      if (event.eventType === 'Goal' && !event.skipScoreIncrement) {
        if (event.goalType === 'own_goal') {
          if (event.teamId === match.homeTeamId) {
            match.awayScore += 1;
          } else if (event.teamId === match.awayTeamId) {
            match.homeScore += 1;
          }
        } else {
          if (event.teamId === match.homeTeamId) {
            match.homeScore += 1;
          } else if (event.teamId === match.awayTeamId) {
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
    if (!this.data.ratings[matchId]) {
      this.data.ratings[matchId] = {};
    }
    this.data.ratings[matchId] = {
      ...this.data.ratings[matchId],
      ...newRatings
    };

    // Recalculate player average ratings
    const allRatingsForPlayers: Record<string, number[]> = {};
    Object.values(this.data.ratings).forEach(matchRatings => {
      Object.entries(matchRatings).forEach(([pId, rVal]) => {
        if (!allRatingsForPlayers[pId]) allRatingsForPlayers[pId] = [];
        allRatingsForPlayers[pId].push(rVal);
      });
    });

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

  public saveNews(article: NewsArticle): NewsArticle {
    const idx = this.data.news.findIndex(n => n.id === article.id);
    const isPublished = article.status === 'published' || article.isPublished !== false;
    if (idx >= 0) {
      this.data.news[idx] = { ...this.data.news[idx], ...article };
    } else {
      this.data.news.unshift(article);
    }

    if (isPublished) {
      this.addNotification({
        idempotencyKey: `notif-news-published-${article.id}`,
        title: `📰 New Article: ${article.title}`,
        message: article.summary || (article.content.substring(0, 100) + '...'),
        type: 'news',
        eventType: 'Published News'
      });
    }

    this.saveData(this.data);
    return article;
  }

  public likeNews(id: string): NewsArticle | null {
    const article = this.data.news.find(n => n.id === id);
    if (article) {
      article.likesCount = (article.likesCount || 0) + 1;
      this.saveData(this.data);
      return article;
    }
    return null;
  }

  public addNewsComment(articleId: string, comment: { authorName: string; avatarUrl?: string; content: string }): NewsArticle | null {
    const article = this.data.news.find(n => n.id === articleId);
    if (article) {
      if (!article.comments) article.comments = [];
      article.comments.push({
        id: `c-${Date.now()}`,
        authorName: comment.authorName,
        avatarUrl: comment.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        content: comment.content,
        timestamp: new Date().toISOString()
      });
      this.saveData(this.data);
      return article;
    }
    return null;
  }

  public deleteNews(id: string) {
    this.data.news = this.data.news.filter(n => n.id !== id);
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      deleteDoc(doc(firestore, 'news', id)).catch(e => console.error(e));
    }
  }

  // APP SETTINGS
  public getSettings(): AppSettings {
    if (!this.data.settings) {
      this.data.settings = INITIAL_SETTINGS;
      this.saveData(this.data);
    }
    return this.data.settings;
  }

  public getAdvertisements(): Advertisement[] {
    return this.data.advertisements || [];
  }

  public saveAdvertisement(ad: Advertisement): Advertisement {
    if (!this.data.advertisements) this.data.advertisements = [];
    const index = this.data.advertisements.findIndex(a => a.id === ad.id);
    if (index >= 0) {
      this.data.advertisements[index] = ad;
    } else {
      this.data.advertisements.push(ad);
    }
    this.saveData(this.data);
    return ad;
  }

  public deleteAdvertisement(id: string): void {
    if (!this.data.advertisements) return;
    this.data.advertisements = this.data.advertisements.filter(a => a.id !== id);
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      deleteDoc(doc(firestore, 'advertisements', id)).catch(e => console.error(e));
    }
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    if (!this.data.settings) this.data.settings = INITIAL_SETTINGS;
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData(this.data);
    return this.data.settings;
  }

  // FAN PREDICTION ENGINE
  public getPredictionStats(matchId: string, userSessionId?: string): MatchPredictionStats {
    if (!this.data.predictions) this.data.predictions = [];
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
    if (!this.data.predictions) this.data.predictions = [];
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

    this.saveData(this.data);
    return this.getPredictionStats(matchId, userSessionId);
  }

  // PLAYER VALUATION CONTROL (ADMIN)
  public savePlayerValuation(playerId: string, price: number, isSuspended?: boolean, isInjured?: boolean, injuryStatus?: 'Fit' | 'Injured' | 'Doubtful', suspensionWeeks?: number): Player {
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
    this.saveData(this.data);
    return player;
  }

  // SUPER ADMIN BULK DATA INGESTION
  public bulkUploadRoster(teamId: string, text: string): { importedCount: number } {
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
      if ((m.status === 'Full-Time' || m.status === 'Penalties') && m.competition_type !== 'Cup') {
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
        if (computed.matchesPlayed > 0) {
          t.matchesPlayed = computed.matchesPlayed;
          t.won = computed.won;
          t.drawn = computed.drawn;
          t.lost = computed.lost;
          t.goalsFor = computed.goalsFor;
          t.goalsAgainst = computed.goalsAgainst;
          t.goalDifference = computed.goalsFor - computed.goalsAgainst;
          t.points = Math.max(0, computed.points - (t.pointsDeduction || 0));
        } else {
          // No full-time matches yet: keep seed points minus deduction
          if (typeof t.pointsDeduction === 'number' && t.pointsDeduction > 0) {
            t.points = Math.max(0, t.points - t.pointsDeduction);
          }
        }
      }
    });

    // Recalculate Player Goals, Assists, Clean Sheets
    const playerGoalsMap = new Map<string, number>();
    const playerAssistsMap = new Map<string, number>();
    const playerCleanSheetsMap = new Map<string, number>();
    const playerCupGoalsMap = new Map<string, number>();
    const playerCupAssistsMap = new Map<string, number>();
    const playerCupCleanSheetsMap = new Map<string, number>();
    const playerBonusMap = new Map<string, number>();

    this.data.players.forEach(p => {
      playerGoalsMap.set(p.id, 0);
      playerAssistsMap.set(p.id, 0);
      playerCleanSheetsMap.set(p.id, 0);
      playerCupGoalsMap.set(p.id, 0);
      playerCupAssistsMap.set(p.id, 0);
      playerCupCleanSheetsMap.set(p.id, 0);
      playerBonusMap.set(p.id, 0);
    });

    // Count goals & assists from events
    this.data.events.forEach(e => {
      if (e.eventType === "Goal" && e.goalType !== "own_goal") {
        const match = this.data.matches.find(m => m.id === e.matchId);
        const isCup = match?.competition_type === "Cup";

        if (e.playerId) {
          if (isCup) playerCupGoalsMap.set(e.playerId, (playerCupGoalsMap.get(e.playerId) || 0) + 1);
          else playerGoalsMap.set(e.playerId, (playerGoalsMap.get(e.playerId) || 0) + 1);
        }
        if (e.assisterId) {
          if (isCup) playerCupAssistsMap.set(e.assisterId, (playerCupAssistsMap.get(e.assisterId) || 0) + 1);
          else playerAssistsMap.set(e.assisterId, (playerAssistsMap.get(e.assisterId) || 0) + 1);
        }
      }
    });

    // Count clean sheets from Full-Time matches
    this.data.matches.forEach(m => {
      if (m.status === "Full-Time") {
        const isCup = m.competition_type === "Cup";
        if (m.awayScore === 0) {
          this.data.players
            .filter(p => p.teamId === m.homeTeamId && (p.position === "GK" || p.position === "DEF"))
            .forEach(p => {
              if (isCup) playerCupCleanSheetsMap.set(p.id, (playerCupCleanSheetsMap.get(p.id) || 0) + 1);
              else playerCleanSheetsMap.set(p.id, (playerCleanSheetsMap.get(p.id) || 0) + 1);
            });
        }
        if (m.homeScore === 0) {
          this.data.players
            .filter(p => p.teamId === m.awayTeamId && (p.position === "GK" || p.position === "DEF"))
            .forEach(p => {
              if (isCup) playerCupCleanSheetsMap.set(p.id, (playerCupCleanSheetsMap.get(p.id) || 0) + 1);
              else playerCleanSheetsMap.set(p.id, (playerCleanSheetsMap.get(p.id) || 0) + 1);
            });
        }
      }
    });

    // Count bonus points from matches
    this.data.matches.forEach(m => {
      if (m.status === "Full-Time" && m.bonusPointsAllocations) {
        if (m.bonusPointsAllocations.firstPlacePlayerId) {
          playerBonusMap.set(m.bonusPointsAllocations.firstPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.firstPlacePlayerId) || 0) + 3);
        }
        if (m.bonusPointsAllocations.secondPlacePlayerId) {
          playerBonusMap.set(m.bonusPointsAllocations.secondPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.secondPlacePlayerId) || 0) + 2);
        }
        if (m.bonusPointsAllocations.thirdPlacePlayerId) {
          playerBonusMap.set(m.bonusPointsAllocations.thirdPlacePlayerId, (playerBonusMap.get(m.bonusPointsAllocations.thirdPlacePlayerId) || 0) + 1);
        }
      }
    });

    this.data.players.forEach(p => {
      p.goals = playerGoalsMap.get(p.id) || 0;
      p.assists = playerAssistsMap.get(p.id) || 0;
      p.cleanSheets = playerCleanSheetsMap.get(p.id) || 0;
      p.cupGoals = playerCupGoalsMap.get(p.id) || 0;
      p.cupAssists = playerCupAssistsMap.get(p.id) || 0;
      p.cupCleanSheets = playerCupCleanSheetsMap.get(p.id) || 0;
      p.bonusPoints = playerBonusMap.get(p.id) || 0;
      
      // Calculate total historical fantasy points for display across the app
      p.fantasyPoints = this.calculatePlayerSeasonPoints(p);
    });

    this.saveData(this.data);
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
    const completedMatches = this.getMatches().filter(m => m.status === 'Full-Time');

    if (completedMatches.length === 0) {
      return {
        topScorers: [],
        topAssists: [],
        cleanSheets: [],
        topPerformers: [],
        cupTopScorers: [],
        cupTopAssists: [],
        cupCleanSheets: [],
        cupTopPerformers: []
      };
    }

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
      .filter(p => p.goals > 0)
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 10);
    const topAssists = [...this.data.players]
      .filter(p => p.assists > 0)
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
      .slice(0, 10);
    const cleanSheets = [...this.data.players]
      .filter(p => (p.position === "GK" || p.position === "DEF") && p.cleanSheets > 0)
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
      .filter(p => (p.cupGoals || 0) > 0)
      .sort((a, b) => (b.cupGoals || 0) - (a.cupGoals || 0) || (b.cupAssists || 0) - (a.cupAssists || 0))
      .slice(0, 10);
    const cupTopAssists = [...this.data.players]
      .filter(p => (p.cupAssists || 0) > 0)
      .sort((a, b) => (b.cupAssists || 0) - (a.cupAssists || 0) || (b.cupGoals || 0) - (a.cupGoals || 0))
      .slice(0, 10);
    const cupCleanSheets = [...this.data.players]
      .filter(p => (p.position === "GK" || p.position === "DEF") && (p.cupCleanSheets || 0) > 0)
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
    const playerEvents = this.data.events.filter(e => e.playerId === p.id);
    let ownGoalsCount = 0;
    let penaltyMissesCount = 0;
    let yellowCards = 0;
    let redCards = 0;

    playerEvents.forEach(e => {
      if (e.goalType === 'own_goal') {
        ownGoalsCount++;
      } else if (e.eventType === 'penalty_miss') {
        penaltyMissesCount++;
      } else if (e.eventType === 'Yellow Card') {
        yellowCards++;
      } else if (e.eventType === 'Red Card') {
        redCards++;
      }
    });

    if (p.position === 'GK' || p.position === 'DEF') {
      pPts += (p.goals || 0) * 6 + (p.cleanSheets || 0) * 4;
    } else if (p.position === 'MID') {
      pPts += (p.goals || 0) * 5 + (p.cleanSheets || 0) * 1;
    } else {
      pPts += (p.goals || 0) * 4;
    }
    
    const bps = bonusMap ? (bonusMap.get(p.id) || 0) : (p.bonusPoints || 0);
    
    const didPlayerPlay = this.data.matches.some(m => {
      const matchEvents = this.data.events.filter(e => e.matchId === m.id);
      const lineup = m.homeTeamId === p.teamId ? m.homeLineup : m.awayLineup;
      if (lineup?.startingXI.some(s => s.playerId === p.id)) return true;
      if (lineup?.substitutes.some(s => s.playerId === p.id)) {
        // Only count if there's an event or sub-in
        if (matchEvents.some(e => e.playerId === p.id || e.subInPlayerId === p.id)) return true;
      }
      
      if (matchEvents.some(e => e.playerId === p.id || e.subInPlayerId === p.id)) return true;
      // Default to true if no lineup but match is finished and player has events
      if (!lineup && (m.status === 'Full-Time' || m.status === 'Half-Time' || m.status === 'Penalties' || m.status === 'Live')) {
        return matchEvents.some(e => e.playerId === p.id || e.subInPlayerId === p.id);
      }
      return false;
    });

    pPts += (p.assists || 0) * 3 + (didPlayerPlay ? 2 : 0) + bps;
    pPts -= (ownGoalsCount * 2);
    pPts -= (yellowCards * 1);
    pPts -= (redCards * 3);
    return pPts;
  }

  public saveFantasySquad(squadData: Partial<FantasySquad>, bonusMap?: Map<string, number>): FantasySquad {
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
      (existing.savedBaselinePlayerIds && existing.savedBaselinePlayerIds.length >= 18) ||
      (existing.playerIds && existing.playerIds.length >= 18)
    );

    const baselineIds = hadFullSquad
      ? ((existing.savedBaselinePlayerIds && existing.savedBaselinePlayerIds.length >= 18) ? existing.savedBaselinePlayerIds : existing.playerIds)
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

    const fullSquad: FantasySquad = {
      id: existing?.id || `squad-${Date.now()}`,
      userId: squadData.userId || existing?.userId || emailLower,
      userEmail: emailLower,
      userName: squadData.userName || existing?.userName || emailLower.split('@')[0],
      squadName: squadData.squadName || existing?.squadName || `${emailLower.split('@')[0]}'s XI`,
      captainPlayerId: captainId || '',
      viceCaptainPlayerId: viceCaptainId,
      startingPlayerIds: starterIds,
      benchPlayerIds: benchIds,
      playerIds: newPlayerIds,
      savedBaselinePlayerIds: baselineIds,
      transfersMade,
      freeTransfers,
      pointHits,
      totalPoints,
      gameweekPoints: computedGameweekPoints,
      activeChip,
      updatedAt: new Date().toISOString()
    };

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

  public getMiniLeagues(): MiniLeague[] {
    if (!this.data.miniLeagues) this.data.miniLeagues = [];
    return this.data.miniLeagues;
  }

  public createMiniLeague(name: string, ownerId: string, ownerName: string, userEmail: string): MiniLeague {
    if (!this.data.miniLeagues) this.data.miniLeagues = [];
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newLeague: MiniLeague = {
      id: `ml-${Date.now()}`,
      name,
      code,
      ownerId,
      ownerName,
      memberEmails: [userEmail.trim().toLowerCase()],
      createdAt: new Date().toISOString()
    };
    this.data.miniLeagues.push(newLeague);
    this.saveData(this.data);
    return newLeague;
  }

  public joinMiniLeague(code: string, userEmail: string): MiniLeague {
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

  public saveManagerChips(chips: ManagerChips) {
    if (!this.data.managerChips) this.data.managerChips = [];
    const index = this.data.managerChips.findIndex(c => c.userId === chips.userId);
    if (index >= 0) {
      this.data.managerChips[index] = chips;
    } else {
      this.data.managerChips.push(chips);
    }
    this.saveData(this.data);
    if (firestore) {
      setDoc(doc(firestore, 'data', 'main'), { managerChips: this.data.managerChips }, { merge: true }).catch(e => console.error(e));
    }
    return chips;
  }

  public resetAllManagerChips(): void {
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
    if (firestore) {
      setDoc(doc(firestore, 'data', 'main'), JSON.parse(JSON.stringify({ managerChips: this.data.managerChips })), { merge: true }).catch(e => console.error(e));
    }
  }

  public getPlayerOfTheMonth(): PlayerOfTheMonth[] {
    return this.data.playerOfTheMonth || [];
  }

  public savePlayerOfTheMonth(potw: PlayerOfTheMonth) {
    if (!this.data.playerOfTheMonth) this.data.playerOfTheMonth = [];
    const index = this.data.playerOfTheMonth.findIndex(p => p.id === potw.id);
    if (index >= 0) {
      this.data.playerOfTheMonth[index] = potw;
    } else {
      this.data.playerOfTheMonth.push(potw);
    }
    this.saveData(this.data);
    return potw;
  }

  public deletePlayerOfTheMonth(id: string) {
    if (!this.data.playerOfTheMonth) this.data.playerOfTheMonth = [];
    this.data.playerOfTheMonth = this.data.playerOfTheMonth.filter(p => p.id !== id);
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      deleteDoc(doc(firestore, 'playerOfTheMonth', id)).catch(e => console.error(e));
    }
  }

  public getFixtureChats(matchId: string): FixtureChatMessage[] {
    if (!this.data.fixture_chats) this.data.fixture_chats = [];
    return this.data.fixture_chats
      .filter(c => c.matchId === matchId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addFixtureMessage(msg: { matchId: string; userId: string; username: string; content: string; avatarUrl?: string }): FixtureChatMessage {
    if (!this.data.fixture_chats) this.data.fixture_chats = [];
    const newChat: FixtureChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      matchId: msg.matchId,
      userId: msg.userId || 'anon',
      username: msg.username || 'EPL Fan',
      avatarUrl: msg.avatarUrl,
      content: msg.content,
      timestamp: new Date().toISOString()
    };
    this.data.fixture_chats.push(newChat);
    this.saveData(this.data);
    return newChat;
  }

  public deleteFixtureMessage(chatId: string): boolean {
    if (!this.data.fixture_chats) return false;
    const initialLen = this.data.fixture_chats.length;
    this.data.fixture_chats = this.data.fixture_chats.filter(c => c.id !== chatId);
    const deleted = this.data.fixture_chats.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
      if (firestore && this.isFirestoreSynced) {
        deleteDoc(doc(firestore, 'fixture_chats', chatId)).catch(e => console.error(e));
      }
    }
    return deleted;
  }

  public getMatchVideos(): MatchVideo[] {
    return this.data.match_videos || [];
  }

  public saveMatchVideo(video: MatchVideo): MatchVideo {
    if (!this.data.match_videos) this.data.match_videos = [];
    const index = this.data.match_videos.findIndex(v => v.id === video.id);
    if (index >= 0) {
      this.data.match_videos[index] = video;
    } else {
      this.data.match_videos.push(video);
    }
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      setDoc(doc(firestore, 'match_videos', video.id), video).catch(e => console.error(e));
    }
    return video;
  }

  public deleteMatchVideo(id: string): boolean {
    if (!this.data.match_videos) return false;
    const initialLen = this.data.match_videos.length;
    this.data.match_videos = this.data.match_videos.filter(v => v.id !== id);
    const deleted = this.data.match_videos.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
      if (firestore && this.isFirestoreSynced) {
        deleteDoc(doc(firestore, 'match_videos', id)).catch(e => console.error(e));
      }
    }
    return deleted;
  }

  public getEplHighlights(): any[] {
    return this.data.epl_highlights || [];
  }

  public saveEplHighlight(highlight: any): any {
    if (!this.data.epl_highlights) this.data.epl_highlights = [];
    const index = this.data.epl_highlights.findIndex(h => h.id === highlight.id);
    if (index >= 0) {
      this.data.epl_highlights[index] = highlight;
    } else {
      this.data.epl_highlights.push(highlight);
    }
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      setDoc(doc(firestore, 'epl_highlights', highlight.id), highlight).catch(e => console.error(e));
    }
    return highlight;
  }

  public deleteEplHighlight(id: string): boolean {
    if (!this.data.epl_highlights) return false;
    const initialLen = this.data.epl_highlights.length;
    this.data.epl_highlights = this.data.epl_highlights.filter(h => h.id !== id);
    const deleted = this.data.epl_highlights.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
      if (firestore && this.isFirestoreSynced) {
        deleteDoc(doc(firestore, 'epl_highlights', id)).catch(e => console.error(e));
      }
    }
    return deleted;
  }

  public finalizeGameweek(gameweek: number): { success: boolean, processedSquads: number } {
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
    
    // We update each squad by saving it through our standard logic, 
    // but we might need to enforce auto-sub rules natively first.
    squads.forEach(squad => {
      this.saveFantasySquad(squad, bonusMap); // The saveFantasySquad already does the auto-sub loop and calculates points.
      processedSquads++;
    });

    this.saveData(this.data);
    return { success: true, processedSquads };
  }

  public likeEplHighlight(id: string): any | null {
    if (!this.data.epl_highlights) return null;
    const highlight = this.data.epl_highlights.find(h => h.id === id);
    if (highlight) {
      highlight.likesCount = (highlight.likesCount || 0) + 1;
      this.saveData(this.data);
      if (firestore && this.isFirestoreSynced) {
        setDoc(doc(firestore, 'epl_highlights', id), highlight, { merge: true }).catch(e => console.error(e));
      }
      return highlight;
    }
    return null;
  }
}

export const db = new DBStore();
