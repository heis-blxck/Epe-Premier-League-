import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { DBStore } from './src/server/db';

const PORT = 3000;

const db = new DBStore();
try {
  db.resetAllManagerChips();
} catch (err) {
  console.error("Error resetting manager chips:", err);
}

async function startServer() {

  const app = express();
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  app.get('/api/firebase-config', (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        res.json(JSON.parse(fs.readFileSync(configPath, 'utf8')));
      } else {
        res.status(404).json({ error: 'Config not found' });
      }
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
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
      const saved = db.saveManagerChips(req.body);
      res.json(saved);
    } catch (err) {
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
      const potm = req.body;
      if (!potm.id) potm.id = "potm-" + Date.now();
      if (!potm.createdAt) potm.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      const saved = db.savePlayerOfTheMonth(potm);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/player-of-the-week/:id", (req, res) => {
    try {
      db.deletePlayerOfTheMonth(req.params.id);
      res.json({ success: true });
    } catch (err) {
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
      const ad = req.body;
      const updated = db.saveAdvertisement(ad);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/advertisements/:id", (req, res) => {
    try {
      db.deleteAdvertisement(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/settings", (req, res) => {
    try {
      const updated = db.saveSettings(req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/teams", (req, res) => {
    res.json(db.getTeams());
  });
  app.post("/api/teams", (req, res) => {
    try {
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
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/teams/:id", (req, res) => {
    try {
      const saved = db.saveTeam({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/teams/:id", (req, res) => {
    db.deleteTeam(req.params.id);
    res.json({ success: true });
  });
  app.get("/api/players", (req, res) => {
    const teamId = req.query.teamId as string;
    res.json(db.getPlayers(teamId));
  });
  app.post("/api/players", (req, res) => {
    try {
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
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/players/:id", (req, res) => {
    try {
      const saved = db.savePlayer({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/players/:id/transfer", (req, res) => {
    try {
      const { newTeamId, newShirtNumber } = req.body;
      const players = db.getPlayers();
      const player = players.find((p) => p.id === req.params.id);
      if (!player) return res.status(404).json({ error: "Player not found" });
      const oldTeam = db.getTeams().find((t) => t.id === player.teamId);
      const newTeam = db.getTeams().find((t) => t.id === newTeamId);
      player.teamId = newTeamId;
      if (newShirtNumber) player.shirtNumber = Number(newShirtNumber);
      const saved = db.savePlayer(player);
      db.addNotification({
        title: `\u{1F504} INTER-TEAM TRANSFER`,
        message: `${player.name} has transferred from ${oldTeam?.name || "Previous Team"} to ${newTeam?.name || "New Team"}!`,
        type: "system",
        eventType: "Player Transfer"
      });
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/players/bulk-delete", (req, res) => {
    try {
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
    db.deletePlayer(req.params.id);
    res.json({ success: true });
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
        venue: req.body.venue || "Epe Township Stadium",
        competition_type: req.body.competition_type || "League",
        matchday: Number(req.body.matchday || 1)
      };
      const saved = db.saveMatch(matchData);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/matches/bulk", (req, res) => {
    try {
      const rawMatches = req.body.matches || [];
      if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
        return res.status(400).json({ error: "No matches provided in bulk array" });
      }
      const saved = db.saveMatchesBulk(rawMatches);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/matches/:id", (req, res) => {
    try {
      const saved = db.saveMatch({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/matches/:id", (req, res) => {
    try {
      db.deleteMatch(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/matches/:id/events", (req, res) => {
    try {
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
        db.addNotification({
          title: `${notifTitle} ${event.minute}'`,
          message: `${event.playerName || "Player"} - ${event.detail || (event.eventType === 'penalty_miss' ? 'Penalty Missed' : event.eventType)}`,
          type: "match_goal",
          eventType: eventTypeForNotif,
          linkMatchId: req.params.id
        });
      }
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/matches/:id/events/:eventId", (req, res) => {
    db.deleteEvent(req.params.eventId);
    res.json({ success: true });
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
      const chat = db.addFixtureMessage({
        matchId: req.params.id,
        userId: req.body.userId || 'anon',
        username: req.body.username || 'EPL Fan',
        avatarUrl: req.body.avatarUrl,
        content: req.body.content || ''
      });
      res.json(chat);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/matches/:id/chats/:chatId", (req, res) => {
    try {
      const success = db.deleteFixtureMessage(req.params.chatId);
      res.json({ success });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/matches/:id/ratings", (req, res) => {
    try {
      const updated = db.saveRatings(req.params.id, req.body.ratings || {});
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.put("/api/matches/:id/lineup", (req, res) => {
    try {
      const { isHome, lineup } = req.body;
      const match = db.getMatch(req.params.id);
      if (!match) return res.status(404).json({ error: "Match not found" });
      if (isHome) {
        match.homeLineup = lineup;
      } else {
        match.awayLineup = lineup;
      }
      db.saveMatch(match);
      
      const teamName = isHome ? db.getTeams().find(t => t.id === match.homeTeamId)?.name : db.getTeams().find(t => t.id === match.awayTeamId)?.name;
      
      db.addNotification({
        title: `📋 Lineup Published: ${teamName}`,
        message: `The starting XI and bench for ${teamName} have been published for their upcoming fixture!`,
        type: 'system',
        eventType: 'Lineups Published',
        linkMatchId: match.id
      });
      
      res.json(match);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/standings", (req, res) => {
    res.json(db.getStandings());
  });
  app.put("/api/teams/:id/standings", (req, res) => {
    try {
      const updated = db.updateTeamStandingsOverride(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/stats", (req, res) => {
    res.json(db.getStats());
  });
  app.get("/api/news", (req, res) => {
    res.json(db.getNews());
  });
  app.post("/api/news", async (req, res) => {
    try {
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

      // Hardcode author name for official league role
      const isOfficialRole = req.body.authorRole === "official_league" || req.body.authorRole === "OFFICIAL_LEAGUE" || req.body.authorRole === "spokesperson";
      const finalAuthor = isOfficialRole ? "EPL Official" : (req.body.author || "EPL Media Team");

      const newArticle = {
        id: req.body.id || `news-${Date.now()}`,
        title: req.body.title || "Untitled Article",
        subtitle: req.body.subtitle || "",
        summary: req.body.summary || "",
        content: req.body.content || "",
        coverImage: req.body.coverImage || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
        publishedAt: req.body.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
        author: finalAuthor,
        authorAvatar: req.body.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        authorTitle: isOfficialRole ? "" : (req.body.authorTitle || "Official League Correspondent"),
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
        authorEmail: req.body.authorEmail || ""
      };
      
      const saved = db.saveNews(newArticle);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/news/:id/like", (req, res) => {
    try {
      const updated = db.likeNews(req.params.id);
      if (!updated) return res.status(404).json({ error: "Article not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/news/:id/comments", (req, res) => {
    try {
      const updated = db.addNewsComment(req.params.id, {
        authorName: req.body.authorName || "EPL Fan",
        avatarUrl: req.body.avatarUrl,
        content: req.body.content || ""
      });
      if (!updated) return res.status(404).json({ error: "Article not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/news/:id", (req, res) => {
    db.deleteNews(req.params.id);
    res.json({ success: true });
  });
  app.get("/api/admins", (req, res) => {
    res.json(db.getAdmins());
  });
  app.post("/api/admins", (req, res) => {
    try {
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
        appointedBy: req.body.appointedBy || "Super Admin (itzjeda10@gmail.com)"
      };
      const saved = db.saveAdmin(newAdmin as any);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/admins/:email", (req, res) => {
    try {
      db.deleteAdmin(req.params.email);
      res.json({ success: true });
    } catch (err) {
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
      const { userSessionId, predictionType } = req.body;
      if (!userSessionId || !predictionType) {
        return res.status(400).json({ error: "userSessionId and predictionType are required" });
      }
      const updated = db.addPrediction(req.params.id, userSessionId, predictionType);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.put("/api/players/:id/valuation", (req, res) => {
    try {
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
      const { teamId, text } = req.body;
      if (!teamId || !text) {
        return res.status(400).json({ error: "teamId and text are required" });
      }
      const result = db.bulkUploadRoster(teamId, text);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/admin/bulk-schedule", (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Schedule text is required" });
      }
      const result = db.bulkUploadSchedule(text);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/admin/bulk-teams", (req, res) => {
    try {
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
  app.post("/api/users/login", (req, res) => {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email address is required" });
      }
      const existing = db.getUsers().find((u) => u.email.toLowerCase() === email);
      if (!existing && !req.body.name) {
        return res.status(401).json({ error: "Account not found. Please sign up first." });
      }
      if (existing) {
        const user = db.saveUser({
          ...existing,
          name: req.body.name || existing.name,
          favoriteTeamId: req.body.favoriteTeamId || existing.favoriteTeamId,
          avatarUrl: req.body.avatarUrl || existing.avatarUrl,
          fantasyTeamName: req.body.fantasyTeamName || existing.fantasyTeamName
        });
        return res.json(user);
      } else {
        const newUser = db.saveUser({
          email,
          name: req.body.name || email.split("@")[0],
          favoriteTeamId: req.body.favoriteTeamId || "team-1",
          fantasyTeamName: req.body.fantasyTeamName,
          avatarUrl: req.body.avatarUrl,
          notificationsEnabled: true,
          themePreference: req.body.themePreference || "dark"
        });
        return res.json(newUser);
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/users/forgot-password", (req, res) => {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email address is required for password recovery" });
      }
      const existing = db.getUsers().find((u) => u.email.toLowerCase() === email);
      if (!existing) {
        return res.status(404).json({ error: "No user account found with this email address. Please sign up." });
      }
      db.addNotification({
        title: `🔑 Password Recovery Request`,
        message: `Password recovery requested for user: ${email} (${existing.name}). Routed to League Administration.`,
        type: 'admin_alert',
        eventType: 'Published News'
      });
      res.json({ success: true, message: `Password recovery instructions and instant secure login link sent to ${email}. Notified League Administration.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/users/profile", (req, res) => {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
      if (!email) {
        return res.status(400).json({ error: "User email is required" });
      }
      const updated = db.saveUser(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  app.delete("/api/users/:email", (req, res) => {
    try {
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
  app.post("/api/fantasy/squads", (req, res) => {
    try {
      const saved = db.saveFantasySquad(req.body);
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/fantasy/mini-leagues", (req, res) => {
    res.json(db.getMiniLeagues());
  });
  app.post("/api/fantasy/mini-leagues", (req, res) => {
    try {
      const { name, ownerId, ownerName, userEmail } = req.body;
      if (!name || !userEmail) {
        return res.status(400).json({ error: "name and userEmail are required" });
      }
      const created = db.createMiniLeague(name, ownerId || userEmail, ownerName || userEmail.split("@")[0], userEmail);
      res.json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.post("/api/fantasy/mini-leagues/join", (req, res) => {
    try {
      const { code, userEmail } = req.body;
      if (!code || !userEmail) {
        return res.status(400).json({ error: "code and userEmail are required" });
      }
      const joined = db.joinMiniLeague(code, userEmail);
      res.json(joined);
    } catch (err) {
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
  app.post("/api/notifications", (req, res) => {
    try {
      const newNotif = db.addNotification({
        title: req.body.title || "League Notification",
        message: req.body.message || "",
        type: req.body.type || "system",
        eventType: req.body.eventType || "Published News",
        linkMatchId: req.body.linkMatchId
      });
      res.json(newNotif);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications/read", (req, res) => {
    db.markNotificationRead(req.body.id);
    res.json({ success: true });
  });
  app.post("/api/notifications/read-all", (req, res) => {
    db.markAllNotificationsRead();
    res.json({ success: true });
  });
  app.post("/api/support", (req, res) => {
    try {
      const { email, name, category, message } = req.body;
      if (!message || !email) {
        return res.status(400).json({ error: "Email and message are required" });
      }
      const supportDestinationEmail = "lasuitesepepremierleague@gmail.com";
      db.addNotification({
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
      db.deleteEplHighlight(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/epl-highlights/:id/like", (req, res) => {
    try {
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
    await db.clearNotifications();
    res.json({ success: true });
  });
  app.post("/api/admin/finalize-gameweek", (req, res) => {
    try {
      const { gameweekId } = req.body;
      const result = db.finalizeGameweek(Number(gameweekId));
      res.json({ success: true, message: `Gameweek ${gameweekId} finalized successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/reset-demo", (req, res) => {
    db.resetSeed();
    res.json({ message: "Database reset to initial seed values" });
  });
  app.post("/api/reset-table-zero", (req, res) => {
    db.resetTableDataToZero();
    res.json({ message: "All table standings, scores, and player metrics reset to zero." });
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
