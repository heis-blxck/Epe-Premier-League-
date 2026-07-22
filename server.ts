import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // SETTINGS API
  app.get('/api/settings', (req, res) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', (req, res) => {
    try {
      const updated = db.saveSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // TEAMS
  app.get('/api/teams', (req, res) => {
    res.json(db.getTeams());
  });

  app.post('/api/teams', (req, res) => {
    try {
      const newTeam = {
        id: req.body.id || `team-${Date.now()}`,
        name: req.body.name || 'New Team',
        shortName: req.body.shortName || 'NT',
        logoUrl: req.body.logoUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80',
        points: Number(req.body.points || 0),
        goalDifference: Number(req.body.goalDifference || 0),
        matchesPlayed: Number(req.body.matchesPlayed || 0),
        won: Number(req.body.won || 0),
        drawn: Number(req.body.drawn || 0),
        lost: Number(req.body.lost || 0),
        goalsFor: Number(req.body.goalsFor || 0),
        goalsAgainst: Number(req.body.goalsAgainst || 0),
        coach: req.body.coach || 'Head Coach',
        stadium: req.body.stadium || 'Epe Arena'
      };
      const saved = db.saveTeam(newTeam);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/teams/:id', (req, res) => {
    try {
      const saved = db.saveTeam({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/teams/:id', (req, res) => {
    db.deleteTeam(req.params.id);
    res.json({ success: true });
  });

  // PLAYERS
  app.get('/api/players', (req, res) => {
    const teamId = req.query.teamId as string | undefined;
    res.json(db.getPlayers(teamId));
  });

  app.post('/api/players', (req, res) => {
    try {
      const newPlayer = {
        id: req.body.id || `p-${Date.now()}`,
        name: req.body.name || 'New Player',
        teamId: req.body.teamId,
        position: req.body.position || 'MID',
        goals: Number(req.body.goals || 0),
        assists: Number(req.body.assists || 0),
        cleanSheets: Number(req.body.cleanSheets || 0),
        shirtNumber: Number(req.body.shirtNumber || 10),
        photoUrl: req.body.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        age: req.body.age !== undefined ? Number(req.body.age) : 22,
        height: req.body.height || '180 cm',
        weight: req.body.weight || '75 kg',
        preferredFoot: req.body.preferredFoot || 'Right',
        nationality: req.body.nationality || 'Nigeria',
        bio: req.body.bio || ''
      };
      const saved = db.savePlayer(newPlayer);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/players/:id', (req, res) => {
    try {
      const saved = db.savePlayer({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/players/:id/transfer', (req, res) => {
    try {
      const { newTeamId, newShirtNumber } = req.body;
      const players = db.getPlayers();
      const player = players.find(p => p.id === req.params.id);
      if (!player) return res.status(404).json({ error: 'Player not found' });

      const oldTeam = db.getTeams().find(t => t.id === player.teamId);
      const newTeam = db.getTeams().find(t => t.id === newTeamId);

      player.teamId = newTeamId;
      if (newShirtNumber) player.shirtNumber = Number(newShirtNumber);

      const saved = db.savePlayer(player);

      db.addNotification({
        title: `🔄 INTER-TEAM TRANSFER`,
        message: `${player.name} has transferred from ${oldTeam?.name || 'Previous Team'} to ${newTeam?.name || 'New Team'}!`,
        type: 'system'
      });

      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/players/:id', (req, res) => {
    db.deletePlayer(req.params.id);
    res.json({ success: true });
  });

  // MATCHES
  app.get('/api/matches', (req, res) => {
    res.json(db.getMatches());
  });

  app.get('/api/matches/:id', (req, res) => {
    const match = db.getMatch(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  });

  app.post('/api/matches', (req, res) => {
    try {
      const matchData = {
        id: req.body.id || `m-${Date.now()}`,
        homeTeamId: req.body.homeTeamId,
        awayTeamId: req.body.awayTeamId,
        homeScore: Number(req.body.homeScore || 0),
        awayScore: Number(req.body.awayScore || 0),
        status: req.body.status || 'Scheduled',
        period: req.body.period || 'Pre-Match',
        matchMinute: Number(req.body.matchMinute || 0),
        stoppageTime1stHalf: Number(req.body.stoppageTime1stHalf || 2),
        stoppageTime2ndHalf: Number(req.body.stoppageTime2ndHalf || 4),
        date: req.body.date || new Date().toISOString().split('T')[0],
        time: req.body.time || '16:00',
        venue: req.body.venue || 'Epe Township Stadium',
        matchday: Number(req.body.matchday || 1)
      };
      const saved = db.saveMatch(matchData);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/matches/bulk', (req, res) => {
    try {
      const rawMatches = req.body.matches || [];
      if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
        return res.status(400).json({ error: 'No matches provided in bulk array' });
      }
      const saved = db.saveMatchesBulk(rawMatches);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/matches/:id', (req, res) => {
    try {
      const saved = db.saveMatch({ ...req.body, id: req.params.id });
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/matches/:id', (req, res) => {
    try {
      db.deleteMatch(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // EVENTS
  app.post('/api/matches/:id/events', (req, res) => {
    try {
      const event = {
        id: req.body.id || `evt-${Date.now()}`,
        matchId: req.params.id,
        teamId: req.body.teamId,
        playerId: req.body.playerId,
        playerName: req.body.playerName,
        eventType: req.body.eventType || 'Goal',
        minute: Number(req.body.minute || 1),
        detail: req.body.detail || '',
        assisterId: req.body.assisterId,
        assisterName: req.body.assisterName,
        subInPlayerId: req.body.subInPlayerId,
        subInPlayerName: req.body.subInPlayerName
      };
      const saved = db.addEvent(event);

      // Auto dispatch push notification for significant match events
      if (['Goal', 'Penalty Goal', 'Own Goal', 'Red Card'].includes(event.eventType)) {
        const teams = db.getTeams();
        const eventTeam = teams.find(t => t.id === event.teamId);
        const teamName = eventTeam ? eventTeam.shortName : 'Team';
        
        let notifTitle = `⚽ GOAL! (${teamName})`;
        if (event.eventType === 'Red Card') notifTitle = `🟥 RED CARD! (${teamName})`;
        if (event.eventType === 'Penalty Goal') notifTitle = `🎯 PENALTY GOAL! (${teamName})`;
        if (event.eventType === 'Own Goal') notifTitle = `⚠️ OWN GOAL! (${teamName})`;

        db.addNotification({
          title: `${notifTitle} ${event.minute}'`,
          message: `${event.playerName || 'Player'} - ${event.detail || event.eventType}`,
          type: 'match_goal',
          linkMatchId: req.params.id
        });
      }

      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/matches/:id/events/:eventId', (req, res) => {
    db.deleteEvent(req.params.eventId);
    res.json({ success: true });
  });

  // RATINGS
  app.post('/api/matches/:id/ratings', (req, res) => {
    try {
      const updated = db.saveRatings(req.params.id, req.body.ratings || {});
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // LINEUP & FORMATION
  app.put('/api/matches/:id/lineup', (req, res) => {
    try {
      const { isHome, lineup } = req.body;
      const match = db.getMatch(req.params.id);
      if (!match) return res.status(404).json({ error: 'Match not found' });

      if (isHome) {
        match.homeLineup = lineup;
      } else {
        match.awayLineup = lineup;
      }

      db.saveMatch(match);
      res.json(match);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // STANDINGS & STATS
  app.get('/api/standings', (req, res) => {
    res.json(db.getStandings());
  });

  app.put('/api/teams/:id/standings', (req, res) => {
    try {
      const updated = db.updateTeamStandingsOverride(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/stats', (req, res) => {
    res.json(db.getStats());
  });

  // NEWS
  app.get('/api/news', (req, res) => {
    res.json(db.getNews());
  });

  app.post('/api/news', (req, res) => {
    try {
      const newArticle = {
        id: req.body.id || `news-${Date.now()}`,
        title: req.body.title || 'Untitled Article',
        subtitle: req.body.subtitle || '',
        summary: req.body.summary || '',
        content: req.body.content || '',
        coverImage: req.body.coverImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
        publishedAt: req.body.publishedAt || new Date().toISOString(),
        author: req.body.author || 'EPL Media Team',
        authorAvatar: req.body.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        authorTitle: req.body.authorTitle || 'Official League Correspondent',
        category: req.body.category || 'League News',
        readTime: req.body.readTime || '3 min read',
        issueLabel: req.body.issueLabel || 'EPL Dispatch',
        isSubstackExclusive: Boolean(req.body.isSubstackExclusive),
        likesCount: Number(req.body.likesCount || 0),
        featured: Boolean(req.body.featured),
        comments: req.body.comments || []
      };
      const saved = db.saveNews(newArticle);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/news/:id/like', (req, res) => {
    try {
      const updated = db.likeNews(req.params.id);
      if (!updated) return res.status(404).json({ error: 'Article not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/news/:id/comments', (req, res) => {
    try {
      const updated = db.addNewsComment(req.params.id, {
        authorName: req.body.authorName || 'EPL Fan',
        avatarUrl: req.body.avatarUrl,
        content: req.body.content || ''
      });
      if (!updated) return res.status(404).json({ error: 'Article not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/news/:id', (req, res) => {
    db.deleteNews(req.params.id);
    res.json({ success: true });
  });

  // ADMINS ROUTING
  app.get('/api/admins', (req, res) => {
    res.json(db.getAdmins());
  });

  app.post('/api/admins', (req, res) => {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }
      const newAdmin = {
        id: req.body.id || `admin-${Date.now()}`,
        email: email,
        name: req.body.name || email.split('@')[0],
        role: (req.body.role === 'super_admin' ? 'super_admin' : 'sub_admin') as 'super_admin' | 'sub_admin',
        appointedAt: new Date().toISOString(),
        appointedBy: req.body.appointedBy || 'Super Admin (itzjeda10@gmail.com)'
      };
      const saved = db.saveAdmin(newAdmin);

      // Auto dispatch notification for admin appointment
      db.addNotification({
        title: `👑 New Admin Appointed`,
        message: `${newAdmin.name} (${newAdmin.email}) appointed as ${newAdmin.role === 'super_admin' ? 'Super Admin' : 'Sub-Admin'}.`,
        type: 'admin_alert'
      });

      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admins/:email', (req, res) => {
    try {
      db.deleteAdmin(req.params.email);

      db.addNotification({
        title: `🛡️ Admin Dismissed`,
        message: `Administrator privileges revoked for ${req.params.email}`,
        type: 'admin_alert'
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // USERS & LOGIN DECK ROUTING
  app.get('/api/users', (req, res) => {
    res.json(db.getUsers());
  });

  app.post('/api/users/login', (req, res) => {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }

      // Find or create user
      const existing = db.getUsers().find(u => u.email.toLowerCase() === email);
      if (existing) {
        // Refresh role if admin list updated
        const user = db.saveUser({ ...existing, name: req.body.name || existing.name });
        return res.json(user);
      } else {
        const newUser = db.saveUser({
          email: email,
          name: req.body.name || email.split('@')[0],
          favoriteTeamId: req.body.favoriteTeamId || 'team-1',
          notificationsEnabled: true,
          themePreference: req.body.themePreference || 'dark'
        });
        return res.json(newUser);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users/profile', (req, res) => {
    try {
      const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ error: 'User email is required' });
      }
      const updated = db.saveUser(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // APP NOTIFICATIONS ROUTING
  app.get('/api/notifications', (req, res) => {
    res.json(db.getNotifications());
  });

  app.post('/api/notifications', (req, res) => {
    try {
      const newNotif = db.addNotification({
        title: req.body.title || 'League Notification',
        message: req.body.message || '',
        type: req.body.type || 'system',
        linkMatchId: req.body.linkMatchId
      });
      res.json(newNotif);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/notifications/read', (req, res) => {
    db.markNotificationRead(req.body.id);
    res.json({ success: true });
  });

  app.post('/api/notifications/read-all', (req, res) => {
    db.markAllNotificationsRead();
    res.json({ success: true });
  });

  app.delete('/api/notifications', (req, res) => {
    db.clearNotifications();
    res.json({ success: true });
  });

  // RESET DATA ROUTES
  app.post('/api/reset-demo', (req, res) => {
    db.resetSeed();
    res.json({ message: 'Database reset to initial seed values' });
  });

  app.post('/api/reset-table-zero', (req, res) => {
    db.resetTableDataToZero();
    res.json({ message: 'All table standings, scores, and player metrics reset to zero.' });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Epe Premier League Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
