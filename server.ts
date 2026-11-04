import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { DBStore } from './src/server/db';
import { createClient, type User as SupabaseAuthUser, type Session as SupabaseSession } from '@supabase/supabase-js';
import type { UserAccount } from './src/types';

// ---------------------------------------------------------------------------
// Supabase Auth helpers
// ---------------------------------------------------------------------------
// Supabase Auth is the source of truth for passwords. The server talks to it
// with the public (anon/publishable) key, so a fresh, stateless client is
// created per request to avoid sessions leaking between concurrent sign-ins.
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const isAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createAuthClient() {
  if (!isAuthConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit'
    }
  });
}

const MIN_PASSWORD_LENGTH = 6;
const AUTH_NOT_CONFIGURED = {
  status: 503,
  code: 'AUTH_NOT_CONFIGURED',
  error: 'Sign-in is not configured on this server (missing Supabase URL/key). Please contact the league administrator.'
};

type AuthFailure = { status: number; code: string; error: string };

function describeAuthError(error: any): AuthFailure {
  const code = String(error?.code || '');
  const message = String(error?.message || '').trim();
  const lower = message.toLowerCase();
  const status = Number(error?.status || 0);

  if (code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
    return { status: 401, code: 'INVALID_CREDENTIALS', error: 'Incorrect email or password.' };
  }
  if (code === 'email_not_confirmed' || lower.includes('email not confirmed')) {
    return {
      status: 403,
      code: 'EMAIL_NOT_CONFIRMED',
      error: 'Your email address has not been confirmed yet. Open the confirmation link we emailed you (check your spam folder too), then sign in.'
    };
  }
  if (code === 'user_already_exists' || code === 'email_exists' || lower.includes('already registered') || lower.includes('already been registered')) {
    return { status: 409, code: 'USER_EXISTS', error: 'An account with this email already exists. Please sign in instead.' };
  }
  if (code === 'weak_password') {
    return { status: 400, code: 'WEAK_PASSWORD', error: message || `Please choose a stronger password (at least ${MIN_PASSWORD_LENGTH} characters).` };
  }
  if (code === 'email_address_invalid' || lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return { status: 400, code: 'INVALID_EMAIL', error: 'Please enter a valid email address.' };
  }
  if (code === 'over_email_send_rate_limit' || lower.includes('email rate limit')) {
    return {
      status: 429,
      code: 'EMAIL_RATE_LIMIT',
      error: 'We could not send the email because the hourly email limit has been reached. Please try again later.'
    };
  }
  if (code === 'signup_disabled' || lower.includes('signups not allowed')) {
    return { status: 403, code: 'SIGNUP_DISABLED', error: 'New sign-ups are currently turned off. Please contact the league administrator.' };
  }
  if (code.startsWith('over_') || status === 429 || lower.includes('rate limit') || lower.includes('too many')) {
    return { status: 429, code: 'RATE_LIMITED', error: 'Too many attempts. Please wait a minute and try again.' };
  }
  if (status === 0 || error?.name === 'AuthRetryableFetchError' || lower.includes('fetch failed')) {
    return { status: 503, code: 'AUTH_UNREACHABLE', error: 'Could not reach the sign-in service. Please check your connection and try again.' };
  }
  return {
    status: status >= 400 && status < 600 ? status : 400,
    code: 'AUTH_ERROR',
    error: message || 'Authentication failed. Please try again.'
  };
}

/** Base URL that confirmation / password-reset emails should send people back to. */
function getAppOrigin(req: express.Request): string {
  const origin = req.get('origin');
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/+$/, '');
  const appUrl = (process.env.APP_URL || '').trim();
  if (/^https?:\/\//i.test(appUrl)) return appUrl.replace(/\/+$/, '');
  const proto = String(req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  return `${proto}://${req.get('host')}`;
}

function getBearerToken(req: express.Request): string {
  const header = req.get('authorization') || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

function isDatabaseUnavailableError(err: any): boolean {
  return String(err?.message || '').toLowerCase().includes('database temporarily unavailable');
}

const PORT = 3000;

const db = new DBStore();

// ---------------------------------------------------------------------------
// Profile helpers (local/Supabase `users` table rows linked to Auth accounts)
// ---------------------------------------------------------------------------
function findProfileByEmail(email: string): UserAccount | undefined {
  const target = email.trim().toLowerCase();
  return db.getUsers().find((u) => (u.email || '').toLowerCase() === target);
}

/** Roles always come from the admin roster, never from what a client sends. */
function roleForEmail(email: string): UserAccount['role'] {
  const admin = db.getAdmins().find((a) => (a.email || '').toLowerCase() === email.toLowerCase());
  return (admin?.role as UserAccount['role']) || 'fan';
}

function makeUniqueUsername(base: string, email: string): string {
  const clean = (base || email.split('@')[0]).trim() || 'fan';
  if (db.checkUsernameAvailable(clean, email)) return clean;
  for (let i = 0; i < 20; i++) {
    const candidate = `${clean}${Math.floor(100 + Math.random() * 900)}`;
    if (db.checkUsernameAvailable(candidate, email)) return candidate;
  }
  return `${clean}${Date.now().toString().slice(-5)}`;
}

/**
 * Saves a profile, but never lets a temporary database sync problem block
 * someone who has already proven their password with Supabase Auth.
 */
function persistProfile(profile: Partial<UserAccount> & { email: string }): UserAccount {
  try {
    return db.saveUser(profile);
  } catch (err: any) {
    if (!isDatabaseUnavailableError(err)) throw err;
    console.warn(`[auth] Profile for ${profile.email} not persisted (database sync unavailable); continuing with sign-in.`);
    const email = profile.email.trim().toLowerCase();
    return {
      id: profile.id || `user-${Date.now()}`,
      name: profile.name || email.split('@')[0],
      notificationsEnabled: profile.notificationsEnabled ?? true,
      themePreference: profile.themePreference || 'dark',
      createdAt: profile.createdAt || new Date().toISOString(),
      ...profile,
      email,
      role: roleForEmail(email)
    } as UserAccount;
  }
}

type ProfileDetails = {
  name?: string;
  favoriteTeamId?: string;
  avatarUrl?: string;
  fantasyTeamName?: string;
};

/** Links a verified Supabase Auth user to their app profile (creating it if needed). */
function upsertProfileForAuthUser(authUser: SupabaseAuthUser, details: ProfileDetails = {}): UserAccount {
  const email = String(authUser.email || '').trim().toLowerCase();
  const existing = findProfileByEmail(email);
  const meta = (authUser.user_metadata || {}) as Record<string, any>;

  if (existing) {
    return persistProfile({
      ...existing,
      email,
      role: roleForEmail(email),
      ...(details.name ? { name: details.name } : {}),
      ...(details.favoriteTeamId ? { favoriteTeamId: details.favoriteTeamId } : {}),
      ...(details.avatarUrl ? { avatarUrl: details.avatarUrl } : {}),
      ...(details.fantasyTeamName ? { fantasyTeamName: details.fantasyTeamName } : {})
    });
  }

  const favoriteTeamId = details.favoriteTeamId || (meta.favoriteTeamId ? String(meta.favoriteTeamId) : undefined);
  return persistProfile({
    id: authUser.id,
    email,
    name: makeUniqueUsername(details.name || String(meta.name || ''), email),
    role: roleForEmail(email),
    createdAt: authUser.created_at || new Date().toISOString(),
    notificationsEnabled: true,
    themePreference: 'dark',
    ...(favoriteTeamId ? { favoriteTeamId } : {}),
    ...(details.avatarUrl ? { avatarUrl: details.avatarUrl } : {}),
    ...(details.fantasyTeamName ? { fantasyTeamName: details.fantasyTeamName } : {})
  });
}

function sessionPayload(session: SupabaseSession | null | undefined) {
  if (!session) return null;
  return { access_token: session.access_token, refresh_token: session.refresh_token };
}

/** Express guard: the caller must send a valid Supabase access token for a Super Admin. */
async function requireSuperAdmin(req: express.Request, res: express.Response): Promise<string | null> {
  if (!isAuthConfigured) return 'local-dev'; // No auth backend configured (local development only)
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ code: 'SESSION_REQUIRED', error: 'Please sign out and sign in again to confirm it is you, then retry.' });
    return null;
  }
  const client = createAuthClient()!;
  const { data, error } = await client.auth.getUser(token);
  const email = String(data?.user?.email || '').toLowerCase();
  if (error || !email) {
    res.status(401).json({ code: 'SESSION_EXPIRED', error: 'Your session has expired. Please sign out and sign in again, then retry.' });
    return null;
  }
  if (roleForEmail(email) !== 'super_admin') {
    res.status(403).json({ code: 'FORBIDDEN', error: 'Only Super Admins can appoint or dismiss administrators.' });
    return null;
  }
  return email;
}

async function startServer() {

  const app = express();
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  
  app.get("/api/ratings", (req, res) => {
    try {
      res.json(db.data.ratings || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/potm/current", (req, res) => {
    try {
      const potmList = db.getPlayerOfTheMonth();
      res.json(potmList.length > 0 ? potmList[potmList.length - 1] : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/gameweek-info", (req, res) => {
    try {
      const matches = db.getMatches();
      const matchdays = Array.from(new Set(matches.map(m => Number(m.matchday)).filter(m => !isNaN(m) && m > 0))).sort((a, b) => a - b);
      const activeMatch = matches.find(m => m.status === 'Live' || m.status === 'Half-Time' || m.status === 'Penalties');
      const completedMatchdays = Array.from(new Set(matches.filter(m => m.status === 'Full-Time').map(m => Number(m.matchday)).filter(m => !isNaN(m) && m > 0)));
      const currentGameweek = activeMatch?.matchday || (completedMatchdays.length > 0 ? Math.max(...completedMatchdays) : (matchdays[0] || 1));
      res.json({
        currentGameweek,
        totalGameweeks: matchdays.length || 12,
        activeMatch: activeMatch || null,
        availableGameweeks: matchdays
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/fpl-finalizer/status", (req, res) => {
    try {
      const matches = db.getMatches();
      const squads = db.getFantasySquads();
      const matchdays = Array.from(new Set(matches.map(m => Number(m.matchday)).filter(m => !isNaN(m) && m > 0))).sort((a, b) => a - b);
      res.json({
        status: "ready",
        totalSquads: squads.length,
        gameweeksAvailable: matchdays,
        lastFinalized: db.data.playerVersion || null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/manager-chips/:userId", (req, res) => {
    try {
      res.json(db.getManagerChips(req.params.userId));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/manager-chips", (req, res) => {
    try {
      db.assertWritable();
      const saved = db.saveManagerChips(req.body);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/player-of-the-week", (req, res) => {
    try {
      res.json(db.getPlayerOfTheMonth());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/player-of-the-week", (req, res) => {
    try {
      db.assertWritable();
      const potm = req.body;
      if (!potm.id) potm.id = "potm-" + Date.now();
      if (!potm.createdAt) potm.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      const saved = db.savePlayerOfTheMonth(potm);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/player-of-the-week/:id", (req, res) => {
    try {
      db.assertWritable();
      db.deletePlayerOfTheMonth(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/settings", (req, res) => {
    res.json(db.getSettings());
  });
  app.get("/api/advertisements", (req, res) => {
    res.json(db.getAdvertisements());
  });
  app.post("/api/advertisements", (req, res) => {
    try {
      db.assertWritable();
      const ad = req.body;
      const updated = db.saveAdvertisement(ad);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/advertisements/:id", (req, res) => {
    try {
      db.assertWritable();
      db.deleteAdvertisement(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/settings", (req, res) => {
    try {
      db.assertWritable();
      const updated = db.saveSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/teams", (req, res) => {
    res.json(db.getTeams());
  });
  app.post("/api/teams", (req, res) => {
    try {
      db.assertWritable();
      const newTeam = {
        id: req.body.id || `team-${Date.now()}`,
        name: req.body.name || "New Team",
        shortName: req.body.shortName || "NT",
        logoUrl: req.body.logoUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80",
        points: Number(req.body.points || 0),
        goalDifference: Number(req.body.goalDifference || 0),
        matchesPlayed: Number(req.body.matchesPlayed || 0),
        won: Number(req.body.won || 0),
        drawn: Number(req.body.drawn || 0),
        lost: Number(req.body.lost || 0),
        goalsFor: Number(req.body.goalsFor || 0),
        goalsAgainst: Number(req.body.goalsAgainst || 0),
        coach: req.body.coach || "Head Coach",
        stadium: req.body.stadium || "Epe Arena"
      };
      const saved = db.saveTeam(newTeam);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/teams/:id", (req, res) => {
    try {
      db.assertWritable();
      const saved = db.saveTeam({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/teams/:id", (req, res) => {
    try {
      db.assertWritable();
      db.deleteTeam(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.get("/api/fantasy-dashboard-stats", (req, res) => {
    res.json(db.getFantasyDashboardStats());
  });
  
  app.get("/api/player-version", (req, res) => {
    res.json(db.getPlayerVersion());
  });

  app.get("/api/players", (req, res) => {
    const teamId = req.query.teamId as string;
    res.json(db.getPlayers(teamId));
  });
  app.post("/api/players", (req, res) => {
    try {
      db.assertWritable();
      const newPlayer = {
        id: req.body.id || `p-${Date.now()}`,
        name: req.body.name || "New Player",
        teamId: req.body.teamId,
        position: req.body.position || "MID",
        goals: Number(req.body.goals || 0),
        assists: Number(req.body.assists || 0),
        cleanSheets: Number(req.body.cleanSheets || 0),
        shirtNumber: Number(req.body.shirtNumber || 10),
        photoUrl: req.body.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        age: req.body.age !== void 0 ? Number(req.body.age) : 22,
        height: req.body.height || "180 cm",
        weight: req.body.weight || "75 kg",
        preferredFoot: req.body.preferredFoot || "Right",
        nationality: req.body.nationality || "Nigeria",
        bio: req.body.bio || ""
      };
      const saved = db.savePlayer(newPlayer);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/players/:id", (req, res) => {
    try {
      db.assertWritable();
      const saved = db.savePlayer({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/players/:id/transfer", async (req, res) => {
    try {
      db.assertWritable();
      const { newTeamId, newShirtNumber } = req.body;
      const players = db.getPlayers();
      const player = players.find((p) => p.id === req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });
      const oldTeam = db.getTeams().find((t) => t.id === player.teamId);
      const newTeam = db.getTeams().find((t) => t.id === newTeamId);
      const updatedPlayer = {
        ...player,
        teamId: newTeamId,
        ...(newShirtNumber ? { shirtNumber: Number(newShirtNumber) } : {})
      };
      const saved = db.savePlayer(updatedPlayer);
      await db.addNotification({
        idempotencyKey: `notif_transfer_${player.id}_${newTeamId}`,
        title: `\u{1F504} INTER-TEAM TRANSFER`,
        message: `${player.name} has transferred from ${oldTeam?.name || "Previous Team"} to ${newTeam?.name || "New Team"}!`,
        type: "system",
        eventType: "Player Transfer"
      });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/players/bulk-delete", (req, res) => {
    try {
      db.assertWritable();
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "No player IDs provided for deletion" });
      }
      db.deletePlayersBulk(ids);
      res.json({ success: true, count: ids.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/players/:id", (req, res) => {
    try {
      db.assertWritable();
      db.deletePlayer(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/matches", (req, res) => {
    res.json(db.getMatches());
  });
  app.get("/api/matches/:id", (req, res) => {
    const match = db.getMatch(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });
    res.json(match);
  });
  app.post("/api/matches", (req, res) => {
    try {
      db.assertWritable();
      const matchData = {
        id: req.body.id || `m-${Date.now()}`,
        homeTeamId: req.body.homeTeamId,
        awayTeamId: req.body.awayTeamId,
        homeScore: Number(req.body.homeScore || 0),
        awayScore: Number(req.body.awayScore || 0),
        status: req.body.status || "Scheduled",
        period: req.body.period || "Pre-Match",
        matchMinute: Number(req.body.matchMinute || 0),
        stoppageTime1stHalf: Number(req.body.stoppageTime1stHalf || 2),
        stoppageTime2ndHalf: Number(req.body.stoppageTime2ndHalf || 4),
        date: req.body.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        time: req.body.time || "16:00",
        kickoffTime: req.body.kickoffTime || null,
        isDelayed: req.body.isDelayed ?? false,
        venue: req.body.venue || "Epe Township Stadium",
        competition_type: req.body.competition_type || "League",
        matchday: Number(req.body.matchday || 1)
      };
      const saved = db.saveMatch(matchData);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/matches/bulk", (req, res) => {
    try {
      db.assertWritable();
      const rawMatches = req.body.matches || [];
      if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
        return res.status(400).json({ error: "No matches provided in bulk array" });
      }
      const saved = db.saveMatchesBulk(rawMatches);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/matches/:id", (req, res) => {
    try {
      db.assertWritable();
      const saved = db.saveMatch({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/matches/:id", (req, res) => {
    try {
      db.assertWritable();
      db.deleteMatch(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/matches/:id/events", async (req, res) => {
    try {
      db.assertWritable();
      const event = {
        id: req.body.id || `evt-${Date.now()}`,
        matchId: req.params.id,
        teamId: req.body.teamId,
        playerId: req.body.playerId,
        playerName: req.body.playerName,
        eventType: req.body.eventType || "Goal",
        minute: Number(req.body.minute || 1),
        detail: req.body.detail || "",
        assisterId: req.body.assisterId,
        assisterName: req.body.assisterName,
        subInPlayerId: req.body.subInPlayerId,
        subInPlayerName: req.body.subInPlayerName,
        goalType: req.body.goalType,
        skipScoreIncrement: Boolean(req.body.skipScoreIncrement)
      };
      const saved = db.addEvent(event);
      if (["Goal", "Red Card", "penalty_miss"].includes(event.eventType)) {
        const teams = db.getTeams();
        const eventTeam = teams.find((t) => t.id === event.teamId);
        const teamName = eventTeam ? eventTeam.shortName : "Team";
        let notifTitle = `\u26BD GOAL! (${teamName})`;
        let eventTypeForNotif: any = "Goal";
        if (event.eventType === "Red Card") {
          notifTitle = `\u{1F7E5} RED CARD! (${teamName})`;
          eventTypeForNotif = "Red Card";
        } else if (event.eventType === "penalty_miss") {
          notifTitle = `\u274C PENALTY MISSED! (${teamName})`;
          eventTypeForNotif = "Penalty awarded";
        } else if (event.eventType === "Goal") {
          if (event.goalType === "penalty") notifTitle = `\u{1F3AF} PENALTY GOAL! (${teamName})`;
          if (event.goalType === "own_goal") notifTitle = `\u26A0\uFE0F OWN GOAL! (${teamName})`;
        }
        await db.addNotification({
          idempotencyKey: `notif_event_${event.id}`,
          title: `${notifTitle} ${event.minute}'`,
          message: `${event.playerName || "Player"} - ${event.detail || (event.eventType === 'penalty_miss' ? 'Penalty Missed' : event.eventType)}`,
          type: "match_goal",
          eventType: eventTypeForNotif,
          linkMatchId: req.params.id
        });
      }
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/matches/:id/events/:eventId", (req, res) => {
    try {
      db.assertWritable();
      db.deleteEvent(req.params.eventId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/matches/:id/chats", (req, res) => {
    try {
      const chats = db.getFixtureChats(req.params.id);
      res.json(chats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/matches/:id/chats", (req, res) => {
    try {
      db.assertWritable();
      const chat = db.addFixtureMessage({
        matchId: req.params.id,
        userId: req.body.userId || 'anon',
        username: req.body.username || 'EPL Fan',
        avatarUrl: req.body.avatarUrl,
        content: req.body.content || ''
      });
      res.json(chat);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/matches/:id/chats/:chatId", (req, res) => {
    try {
      db.assertWritable();
      const success = db.deleteFixtureMessage(req.params.chatId);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/matches/:id/ratings", (req, res) => {
    try {
      db.assertWritable();
      const updated = db.saveRatings(req.params.id, req.body.ratings || {});
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/matches/:id/lineup", async (req, res) => {
    try {
      db.assertWritable();
      const { isHome, lineup } = req.body;
      const match = db.getMatch(req.params.id);
      if (!match) return res.status(404).json({ error: "Match not found" });
      const updatedMatch = {
        ...match,
        ...(isHome ? { homeLineup: lineup } : { awayLineup: lineup })
      };
      const savedMatch = db.saveMatch(updatedMatch);
      
      const teamName = isHome ? db.getTeams().find(t => t.id === match.homeTeamId)?.name : db.getTeams().find(t => t.id === match.awayTeamId)?.name;
      
      await db.addNotification({
        idempotencyKey: `notif_lineup_${match.id}_${isHome ? 'home' : 'away'}`,
        title: `📋 Lineup Published: ${teamName}`,
        message: `The starting XI and bench for ${teamName} have been published for their upcoming fixture!`,
        type: 'system',
        eventType: 'Lineups Published',
        linkMatchId: match.id
      });
      
      res.json(savedMatch);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/standings", (req, res) => {
    res.json(db.getStandings());
  });
  app.put("/api/teams/:id/standings", (req, res) => {
    try {
      db.assertWritable();
      const updated = db.updateTeamStandingsOverride(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/test-env", (req, res) => {
    res.json({
      project: process.env.VITE_FIREBASE_PROJECT_ID,
      api: process.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Unset',
      domain: process.env.VITE_FIREBASE_AUTH_DOMAIN
    });
  });

  app.get("/api/stats", (req, res) => {
    res.json(db.getStats());
  });
  app.get("/api/news", (req, res) => {
    res.json(db.getNews());
  });
  app.post("/api/news", async (req, res) => {
    try {
      db.assertWritable();
      let isApproved = true;
      const textToScan = `${req.body.title || ""} ${req.body.subtitle || ""} ${req.body.summary || ""} ${req.body.content || ""}`.toLowerCase();
      
      const badWords = ["fuck", "shit", "bitch", "cunt", "nigger", "slut", "whore", "dick", "pussy", "cock", "porn", "nudity", "naked", "sex", "rape"];
      const containsBadWords = badWords.some(word => textToScan.includes(word));
      
      if (containsBadWords) {
          isApproved = false;
      }
      
      if (process.env.GEMINI_API_KEY && !containsBadWords) {
          try {
             const { GoogleGenAI } = await import("@google/genai");
             const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
             const response = await ai.models.generateContent({
                 model: 'gemini-2.5-flash',
                 contents: `You are a content moderator for a football league website.
                 Does the following article contain nudity, sexually explicit content, or extremely derogatory language?
                 Answer with only YES or NO.
                 
                 Article:
                 ${textToScan.substring(0, 5000)}`
             });
             if (response.text.toUpperCase().includes('YES')) {
                 isApproved = false;
             }
          } catch (e) {
             console.error('Gemini API Error:', e);
          }
      }

      let finalStatus = req.body.status || "published";
      let finalIsPublished = req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true;

      // Strict Document-Level Ownership Check for Updates
      const articleId = req.body.id;
      const requestUserRole = req.body.currentUserRole || req.body.authorRole || '';
      const requestUserUid = req.body.currentUserUid || req.body.authorId || req.body.authorEmail || '';
      const requestUserEmail = req.body.currentUserEmail || req.body.authorEmail || '';
      const isSuperAdminAction = Boolean(req.body.isSuperAdminAction) || requestUserRole === 'SUPER_ADMIN' || requestUserRole === 'super_admin';

      const existingArticle = articleId ? db.getNews().find(n => n.id === articleId) : null;
      if (existingArticle && !isSuperAdminAction) {
        const isAuthor = Boolean(
          (existingArticle.authorId && (existingArticle.authorId === requestUserUid || existingArticle.authorId === requestUserEmail)) ||
          (existingArticle.authorEmail && (existingArticle.authorEmail === requestUserEmail || existingArticle.authorEmail === requestUserUid))
        );
        if (!isAuthor) {
          return res.status(403).json({ error: "Unauthorized: You can only edit your own articles." });
        }
      }

      // Hardcode author name for official league role
      const isOfficialRole = req.body.authorRole === "official_league" || req.body.authorRole === "OFFICIAL_LEAGUE" || req.body.authorRole === "spokesperson";
      const finalAuthor = isOfficialRole ? "EPL Official" : (req.body.author || "EPL Media Team");
      const finalAuthorId = req.body.authorId || req.body.currentUserUid || existingArticle?.authorId || requestUserEmail || `author-${Date.now()}`;

      const newArticle = {
        id: articleId || `news-${Date.now()}`,
        title: req.body.title || "Untitled Article",
        subtitle: req.body.subtitle || "",
        summary: req.body.summary || "",
        content: req.body.content || "",
        coverImage: req.body.coverImage || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
        publishedAt: req.body.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
        author: finalAuthor,
        authorId: finalAuthorId,
        authorAvatar: req.body.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        authorTitle: isOfficialRole ? "" : (req.body.authorTitle || "Official League Correspondent"),
        customReporterRole: isOfficialRole ? "Football Association" : (req.body.customReporterRole || "Reporter"),
        category: req.body.category || "League News",
        readTime: req.body.readTime || "3 min read",
        issueLabel: req.body.issueLabel || "EPL Dispatch",
        isSubstackExclusive: Boolean(req.body.isSubstackExclusive),
        likesCount: Number(req.body.likesCount || 0),
        featured: Boolean(req.body.featured),
        comments: req.body.comments || [],
        status: finalStatus,
        isPublished: finalIsPublished,
        authorRole: req.body.authorRole || (isOfficialRole ? "official_league" : "news_reporter"),
        authorEmail: req.body.authorEmail || requestUserEmail
      };
      
      const saved = db.saveNews(newArticle);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/news/:id/like", (req, res) => {
    try {
      db.assertWritable();
      const updated = db.likeNews(req.params.id);
      if (!updated) return res.status(404).json({ error: "Article not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/news/:id/comments", (req, res) => {
    try {
      db.assertWritable();
      const updated = db.addNewsComment(req.params.id, {
        authorName: req.body.authorName || "EPL Fan",
        avatarUrl: req.body.avatarUrl,
        content: req.body.content || ""
      });
      if (!updated) return res.status(404).json({ error: "Article not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/news/:id", (req, res) => {
    try {
      db.assertWritable();
      const articleId = req.params.id;
      const existingArticle = db.getNews().find(n => n.id === articleId);

      if (existingArticle) {
        const activeUid = (req.query.uid as string) || (req.headers['x-user-uid'] as string) || req.body?.uid || "";
        const activeEmail = (req.query.email as string) || (req.headers['x-user-email'] as string) || req.body?.email || "";
        const activeRole = (req.query.role as string) || (req.headers['x-user-role'] as string) || req.body?.role || "";
        const isSuperAdmin = activeRole === 'super_admin' || activeRole === 'SUPER_ADMIN';

        if (!isSuperAdmin) {
          const isAuthor = Boolean(
            (existingArticle.authorId && (existingArticle.authorId === activeUid || existingArticle.authorId === activeEmail)) ||
            (existingArticle.authorEmail && (existingArticle.authorEmail === activeEmail || existingArticle.authorEmail === activeUid))
          );
          if (!isAuthor) {
            return res.status(403).json({ error: "Unauthorized: You can only delete your own articles." });
          }
        }
      }

      db.deleteNews(articleId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/admins", (req, res) => {
    res.json(db.getAdmins());
  });
  app.post("/api/admins", async (req, res) => {
    try {
      const actingEmail = await requireSuperAdmin(req, res);
      if (!actingEmail) return;
      db.assertWritable();
      const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email address is required" });
      }
      const newAdmin = {
        id: req.body.id || `admin-${Date.now()}`,
        email,
        name: req.body.name || email.split("@")[0],
        role: req.body.role === "super_admin" 
          ? "super_admin" 
          : (req.body.role === "news_reporter" 
          ? "news_reporter" 
          : (req.body.role === "official_league" || req.body.role === "OFFICIAL_LEAGUE" || req.body.role === "spokesperson"
          ? "official_league" 
          : "sub_admin")),
        appointedAt: (/* @__PURE__ */ new Date()).toISOString(),
        appointedBy: actingEmail === 'local-dev' ? (req.body.appointedBy || "Super Admin") : actingEmail
      };
      const saved = db.saveAdmin(newAdmin as any);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/admins/:email", async (req, res) => {
    try {
      const actingEmail = await requireSuperAdmin(req, res);
      if (!actingEmail) return;
      if (actingEmail !== 'local-dev' && actingEmail === String(req.params.email || '').trim().toLowerCase()) {
        return res.status(400).json({ error: "You can't dismiss yourself. Ask another Super Admin." });
      }
      db.assertWritable();
      db.deleteAdmin(req.params.email);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/matches/:id/prediction", (req, res) => {
    try {
      const userSessionId = req.query.userSessionId as string || "";
      const stats = db.getPredictionStats(req.params.id, userSessionId);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/matches/:id/prediction", (req, res) => {
    try {
      db.assertWritable();
      const { userSessionId, predictionType } = req.body;
      if (!userSessionId || !predictionType) {
        return res.status(400).json({ error: "userSessionId and predictionType are required" });
      }
      const updated = db.addPrediction(req.params.id, userSessionId, predictionType);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Matchday Score Predictor Endpoints
  app.get("/api/score-predictions", (req, res) => {
    try {
      const userId = (req.query.userId as string) || "";
      const predictions = db.getScorePredictions(userId);
      res.json(predictions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/predictions/leaderboard", (req, res) => {
    try {
      const leaderboard = db.getPredictorLeaderboard();
      res.json(leaderboard);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/score-predictions/leaderboard", (req, res) => {
    try {
      const leaderboard = db.getPredictorLeaderboard();
      res.json(leaderboard);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/score-predictions", (req, res) => {
    try {
      db.assertWritable();
      const { userId, matchId, homeScore, awayScore, userEmail, userName } = req.body;
      if (!userId || !matchId || homeScore === undefined || awayScore === undefined) {
        return res.status(400).json({ error: "userId, matchId, homeScore, and awayScore are required" });
      }
      const saved = db.saveScorePrediction({
        userId,
        matchId,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        userEmail,
        userName
      });
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.put("/api/players/:id/valuation", (req, res) => {
    try {
      db.assertWritable();
      const price = Number(req.body.price);
      const { isSuspended, isInjured, injuryStatus, suspensionWeeks } = req.body;
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: "Valid positive fantasy price is required" });
      }
      const updated = db.savePlayerValuation(req.params.id, price, isSuspended, isInjured, injuryStatus, suspensionWeeks);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/bulk-roster", (req, res) => {
    try {
      db.assertWritable();
      const { teamId, text } = req.body;
      if (!teamId || !text) {
        return res.status(400).json({ error: "teamId and text are required" });
      }
      const result = db.bulkUploadRoster(teamId, text);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/admin/bulk-schedule", (req, res) => {
    try {
      db.assertWritable();
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Schedule text is required" });
      }
      const result = db.bulkUploadSchedule(text);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/admin/bulk-teams", (req, res) => {
    try {
      db.assertWritable();
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Team text is required" });
      }
      const result = db.bulkUploadTeams(text);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/users", (req, res) => {
    res.json(db.getUsers());
  });
  app.get("/api/check-availability", (req, res) => {
    try {
      const username = (req.query.username as string) || "";
      const teamName = (req.query.teamName as string) || "";
      const email = (req.query.email as string) || "";

      const usernameAvailable = db.checkUsernameAvailable(username, email);
      const teamNameAvailable = db.checkFantasyTeamNameAvailable(teamName, email);

      res.json({
        usernameAvailable,
        teamNameAvailable,
        usernameError: usernameAvailable ? null : `Username '${username}' is already taken.`,
        teamNameError: teamNameAvailable ? null : `Fantasy Team Name '${teamName}' is already taken.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  // ------------------------------------------------------------------
  // AUTH: sign in / sign up (one endpoint, `mode` decides)
  // ------------------------------------------------------------------
  app.post("/api/users/login", async (req, res) => {
    try {
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : "";
      const password = req.body.password !== undefined && req.body.password !== null ? String(req.body.password) : "";
      const suppliedName = req.body.name ? String(req.body.name).trim() : "";
      const mode: 'signin' | 'signup' = req.body.mode === 'signup' || req.body.mode === 'signin'
        ? req.body.mode
        : (suppliedName ? 'signup' : 'signin');
      const details: ProfileDetails = {
        name: suppliedName || undefined,
        favoriteTeamId: req.body.favoriteTeamId ? String(req.body.favoriteTeamId).trim() : undefined,
        avatarUrl: req.body.avatarUrl ? String(req.body.avatarUrl).trim() : undefined,
        fantasyTeamName: req.body.fantasyTeamName ? String(req.body.fantasyTeamName).trim() : undefined
      };

      if (!email || !email.includes("@")) {
        return res.status(400).json({ code: 'INVALID_EMAIL', error: "Please enter a valid email address." });
      }
      if (!password) {
        return res.status(400).json({ code: 'PASSWORD_REQUIRED', error: "Please enter your password." });
      }

      const client = createAuthClient();
      if (!client) return res.status(AUTH_NOT_CONFIGURED.status).json(AUTH_NOT_CONFIGURED);

      // --- SIGN IN ---------------------------------------------------
      if (mode === 'signin') {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error || !data?.user) {
          const failure = describeAuthError(error);
          if (failure.code === 'INVALID_CREDENTIALS') {
            failure.error = findProfileByEmail(email)
              ? "Incorrect password. If you haven't set a password since the app's new login system, tap \"Sign Up\" and register with this same email — your profile and role will be kept. Otherwise use \"Forgot Password\"."
              : "Incorrect email or password. New here? Tap \"Sign Up\" to create an account.";
          }
          return res.status(failure.status).json(failure);
        }
        const user = upsertProfileForAuthUser(data.user);
        return res.json({ user, session: sessionPayload(data.session) });
      }

      // --- SIGN UP ---------------------------------------------------
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ code: 'WEAK_PASSWORD', error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
      }
      if (!suppliedName) {
        return res.status(400).json({ code: 'USERNAME_REQUIRED', error: "Please choose a username." });
      }
      if (!db.checkUsernameAvailable(suppliedName, email)) {
        return res.status(409).json({ code: 'USERNAME_TAKEN', error: `Username '${suppliedName}' is already taken. Please choose a different one.` });
      }
      if (details.fantasyTeamName && !db.checkFantasyTeamNameAvailable(details.fantasyTeamName, email)) {
        return res.status(409).json({ code: 'TEAM_NAME_TAKEN', error: `Fantasy team name '${details.fantasyTeamName}' is already taken.` });
      }

      // If the email already has a working account and the password matches,
      // treat "Sign Up" as a sign-in so returning fans are never stuck.
      const trySignInInstead = async () => {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (data?.user && !error) {
          const user = upsertProfileForAuthUser(data.user, details);
          return res.json({ user, session: sessionPayload(data.session) });
        }
        const failure = describeAuthError(error);
        if (failure.code === 'INVALID_CREDENTIALS' || failure.code === 'AUTH_ERROR') {
          return res.status(409).json({
            code: 'USER_EXISTS',
            error: 'An account with this email already exists. Please sign in, or use "Forgot Password" if you can\'t remember your password.'
          });
        }
        return res.status(failure.status).json(failure);
      };

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAppOrigin(req),
          data: {
            name: suppliedName,
            ...(details.favoriteTeamId ? { favoriteTeamId: details.favoriteTeamId } : {})
          }
        }
      });

      if (error) {
        const failure = describeAuthError(error);
        if (failure.code === 'USER_EXISTS') return trySignInInstead();
        return res.status(failure.status).json(failure);
      }

      // Email confirmation OFF: Supabase signs the new user straight in.
      if (data.session && data.user) {
        const user = upsertProfileForAuthUser(data.user, details);
        return res.json({ user, session: sessionPayload(data.session) });
      }

      // Email confirmation ON + this email is already a confirmed account:
      // Supabase hides that by returning a user with no identities.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return trySignInInstead();
      }

      // Email confirmation ON: account created, waiting for the link to be clicked.
      // Pre-create a profile for brand-new emails so the chosen username, club and
      // photo are ready; existing profiles are only touched after confirmation.
      if (data.user && !findProfileByEmail(email)) {
        try {
          persistProfile({
            id: data.user.id,
            email,
            name: suppliedName,
            role: roleForEmail(email),
            createdAt: data.user.created_at || new Date().toISOString(),
            notificationsEnabled: true,
            themePreference: 'dark',
            ...(details.favoriteTeamId ? { favoriteTeamId: details.favoriteTeamId } : {}),
            ...(details.avatarUrl ? { avatarUrl: details.avatarUrl } : {}),
            ...(details.fantasyTeamName ? { fantasyTeamName: details.fantasyTeamName } : {})
          });
        } catch (profileErr: any) {
          console.warn('[auth] Could not pre-create profile for pending signup:', profileErr?.message);
        }
      }

      return res.status(202).json({
        pendingConfirmation: true,
        email,
        message: `Almost done! We've sent a confirmation link to ${email}. Open it on this device to activate your account and you'll be signed in automatically. Check your spam folder if you don't see it.`
      });
    } catch (err: any) {
      console.error('[auth] /api/users/login failed:', err);
      res.status(400).json({ code: 'AUTH_ERROR', error: err?.message || 'Authentication failed. Please try again.' });
    }
  });

  // Exchange a Supabase access token (from an email confirmation or password
  // reset link) for the matching app profile.
  app.post("/api/users/session", async (req, res) => {
    try {
      const client = createAuthClient();
      if (!client) return res.status(AUTH_NOT_CONFIGURED.status).json(AUTH_NOT_CONFIGURED);
      const token = getBearerToken(req) || String(req.body?.accessToken || '');
      if (!token) return res.status(401).json({ code: 'SESSION_REQUIRED', error: 'Missing session token.' });
      const { data, error } = await client.auth.getUser(token);
      if (error || !data?.user?.email) {
        return res.status(401).json({ code: 'SESSION_EXPIRED', error: 'That link has expired. Please sign in with your email and password.' });
      }
      res.json({ user: upsertProfileForAuthUser(data.user) });
    } catch (err: any) {
      res.status(400).json({ code: 'AUTH_ERROR', error: err?.message || 'Could not restore your session.' });
    }
  });

  app.post("/api/users/resend-confirmation", async (req, res) => {
    try {
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : "";
      if (!email || !email.includes("@")) {
        return res.status(400).json({ code: 'INVALID_EMAIL', error: "Please enter a valid email address." });
      }
      const client = createAuthClient();
      if (!client) return res.status(AUTH_NOT_CONFIGURED.status).json(AUTH_NOT_CONFIGURED);
      const { error } = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: getAppOrigin(req) } });
      if (error) {
        const failure = describeAuthError(error);
        return res.status(failure.status).json(failure);
      }
      res.json({ success: true, message: `A new confirmation link has been sent to ${email}.` });
    } catch (err: any) {
      res.status(500).json({ code: 'AUTH_ERROR', error: err?.message || 'Could not resend the confirmation email.' });
    }
  });

  app.post("/api/users/forgot-password", async (req, res) => {
    try {
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : "";
      if (!email || !email.includes("@")) {
        return res.status(400).json({ code: 'INVALID_EMAIL', error: "Please enter a valid email address." });
      }
      const client = createAuthClient();
      if (!client) return res.status(AUTH_NOT_CONFIGURED.status).json(AUTH_NOT_CONFIGURED);
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: getAppOrigin(req) });
      if (error) {
        const failure = describeAuthError(error);
        if (failure.code === 'EMAIL_RATE_LIMIT' || failure.code === 'RATE_LIMITED' || failure.code === 'AUTH_UNREACHABLE') {
          return res.status(failure.status).json(failure);
        }
        console.warn('[auth] resetPasswordForEmail notice:', error.message);
      }
      // Same answer whether or not the email exists, so accounts can't be probed.
      res.json({
        success: true,
        message: `If an account exists for ${email}, a password reset link is on its way. Open it on this device to choose a new password. If you never set a password after the login upgrade, use Sign Up instead.`
      });
    } catch (err: any) {
      res.status(500).json({ code: 'AUTH_ERROR', error: err?.message || 'Could not start password recovery.' });
    }
  });

  app.post("/api/users/profile", (req, res) => {
    try {
      db.assertWritable();
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : "";
      if (!email) {
        return res.status(400).json({ error: "User email is required" });
      }
      // Never accept role or id changes from the client — roles come from the admin roster.
      const { role: _ignoredRole, id: _ignoredId, ...profileUpdate } = req.body || {};
      const updated = db.saveUser({ ...profileUpdate, email, role: roleForEmail(email) });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.delete("/api/users/:email", (req, res) => {
    try {
      db.assertWritable();
      const email = req.params.email ? req.params.email.trim().toLowerCase() : "";
      if (!email) {
        return res.status(400).json({ error: "User email is required" });
      }
      db.deleteUser(email);
      res.json({ success: true, message: "Account deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/fantasy/squads", (req, res) => {
    res.json(db.getFantasySquads());
  });
  app.get("/api/fantasy-squads", (req, res) => {
    res.json(db.getFantasySquads());
  });
  app.get("/api/fantasy/leaderboard", (req, res) => {
    try {
      const squads = db.getFantasySquads();
      const validSquads = squads
        .filter(s => s.id !== 'placeholder_init' && s.userEmail)
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      res.json(validSquads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/fantasy/squads", (req, res) => {
    try {
      db.assertWritable();
      const saved = db.saveFantasySquad(req.body);
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/fantasy/mini-leagues", (req, res) => {
    res.json(db.getMiniLeagues());
  });
  app.post("/api/fantasy/mini-leagues", (req, res) => {
    try {
      db.assertWritable();
      const { name, ownerId, ownerName, userEmail } = req.body;
      if (!name || !userEmail) {
        return res.status(400).json({ error: "name and userEmail are required" });
      }
      const created = db.createMiniLeague(name, ownerId || userEmail, ownerName || userEmail.split("@")[0], userEmail);
      res.json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/fantasy/mini-leagues/join", (req, res) => {
    try {
      db.assertWritable();
      const { code, userEmail } = req.body;
      if (!code || !userEmail) {
        return res.status(400).json({ error: "code and userEmail are required" });
      }
      const joined = db.joinMiniLeague(code, userEmail);
      res.json(joined);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  
  app.get("/api/notifications/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const onNewNotif = (notif) => {
      res.write(`data: ${JSON.stringify(notif)}

`);
    };
    db.on("new_notification", onNewNotif);
    req.on("close", () => {
      db.removeListener("new_notification", onNewNotif);
    });
  });
  app.get("/api/notifications", (req, res) => {
    res.json(db.getNotifications());
  });
  app.post("/api/notifications", async (req, res) => {
    try {
      db.assertWritable();
      const newNotif = await db.addNotification({
        idempotencyKey: req.body.idempotencyKey,
        title: req.body.title || "League Notification",
        message: req.body.message || "",
        type: req.body.type || "system",
        eventType: req.body.eventType || "Published News",
        linkMatchId: req.body.linkMatchId
      });
      res.json(newNotif);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications/read", (req, res) => {
    try {
      db.assertWritable();
      db.markNotificationRead(req.body.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/notifications/read-all", (req, res) => {
    try {
      db.assertWritable();
      db.markAllNotificationsRead();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/support", async (req, res) => {
    try {
      db.assertWritable();
      const { email, name, category, message } = req.body;
      if (!message || !email) {
        return res.status(400).json({ error: "Email and message are required" });
      }
      await db.addNotification({
        title: `Support Ticket [${category || 'Feedback'}]: ${name || email}`,
        message: `From: ${email} (${name || 'User'})\nCategory: ${category || 'General Complaint/Suggestion'}\nMessage: ${message}\nRouted securely to League Administration.`,
        type: 'admin_alert',
        eventType: 'Published News'
      });
      res.json({ success: true, message: "Support ticket successfully submitted and routed to the league administration team." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/match-videos", (req, res) => {
    try {
      res.json(db.getMatchVideos());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/match-videos", (req, res) => {
    try {
      db.assertWritable();
      const video = req.body;
      if (!video.id) video.id = "vid-" + Date.now();
      if (!video.created_at) video.created_at = new Date().toISOString();
      const saved = db.saveMatchVideo(video);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/match-videos/:id", (req, res) => {
    try {
      db.assertWritable();
      db.deleteMatchVideo(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/epl-highlights", (req, res) => {
    try {
      res.json(db.getEplHighlights());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/epl-highlights", (req, res) => {
    try {
      db.assertWritable();
      const highlight = req.body;
      if (!highlight.id) highlight.id = "highlight-" + Date.now();
      const saved = db.saveEplHighlight(highlight);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/epl-highlights/:id", (req, res) => {
    try {
      db.assertWritable();
      db.deleteEplHighlight(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/epl-highlights/:id/like", (req, res) => {
    try {
      db.assertWritable();
      const updated = db.likeEplHighlight(req.params.id);
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ error: "Highlight not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    try {
      db.assertWritable();
      await db.clearNotifications();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/admin/finalize-gameweek", (req, res) => {
    try {
      db.assertWritable();
      const { gameweekId } = req.body;
      db.finalizeGameweek(Number(gameweekId));
      res.json({ success: true, message: `Gameweek ${gameweekId} finalized successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/reset-fantasy-test", async (req, res) => {
    try {
      db.assertWritable();
      await db.resetFantasyTest();
      res.json({ success: true, message: 'Successfully wiped all fantasy squads and reset user profiles for testing.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/fantasy/reset-my-squad", async (req, res) => {
    try {
      db.assertWritable();
      const { squadId, userId } = req.body;
      if (!squadId || !userId) {
        return res.status(400).json({ error: 'Missing squadId or userId' });
      }
      await db.deleteFantasySquad(squadId, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/clear-fantasy", async (req, res) => {
    try {
      db.assertWritable();
      await db.clearAllFantasySquads();
      res.json({ success: true, message: 'Successfully cleared all fantasy squads.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/force-firestore-sync", async (req, res) => {
    try {
      db.assertWritable();
      const result = await db.forceFirestoreSync();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/migrate-v2", (req, res) => {
    try {
      db.assertWritable();
      const result = db.runSchemaMigrationV2();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/reset-demo", (req, res) => {
    try {
      db.assertWritable();
      db.resetSeed();
      res.json({ message: "Database reset to initial seed values", teamsCount: db.getTeams().length, playersCount: db.getPlayers().length, matchesCount: db.getMatches().length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/reset-table-zero", (req, res) => {
    try {
      db.assertWritable();
      db.resetTableDataToZero();
      res.json({ message: "All table standings, scores, and player metrics reset to zero.", teamsCount: db.getTeams().length, playersCount: db.getPlayers().length, matchesCount: db.getMatches().length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/emergency-reseed", (req, res) => {
    try {
      db.assertWritable();
      db.resetSeed();
      res.json({ success: true, message: "Emergency re-seed completed", teamsCount: db.getTeams().length, playersCount: db.getPlayers().length, matchesCount: db.getMatches().length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get('/manifest.json', (req, res, next) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    next();
  });

  app.get('/sw.js', (req, res, next) => {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    next();
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Epe Premier League Server running on http://0.0.0.0:${PORT}`);
  });

}

startServer();
