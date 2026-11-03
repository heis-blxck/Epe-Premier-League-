import { Team, Player, Match, MatchEvent, NewsArticle, LeagueStats, AdminUser, UserAccount, AppNotification, AppSettings, MatchStats, FantasySquad, MiniLeague, MatchPredictionStats, PredictionType, MatchLineup, Advertisement, FixtureChatMessage, PredictorLeaderboardEntry, ScorePredictionRecord } from '../types';

async function throwApiError(res: Response, fallbackMsg: string): Promise<never> {
  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || fallbackMsg);
}

export const api = {
  // App Settings
  
  
  async getManagerChips(userId: string): Promise<any> {
    const res = await fetch(`/api/manager-chips/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch manager chips');
    return res.json();
  },

  async saveManagerChips(chips: any): Promise<any> {
    const res = await fetch('/api/manager-chips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chips),
    });
    if (!res.ok) await throwApiError(res, 'Failed to save manager chips');
    return res.json();
  },

  async getPlayerOfTheMonth(): Promise<any[]> {
    const res = await fetch('/api/player-of-the-week');
    if (!res.ok) throw new Error('Failed to fetch POTW');
    return res.json();
  },

  async savePlayerOfTheMonth(potm: any): Promise<any> {
    const res = await fetch('/api/player-of-the-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(potm),
    });
    if (!res.ok) await throwApiError(res, 'Failed to save POTW');
    return res.json();
  },

  async deletePlayerOfTheMonth(id: string): Promise<void> {
    const res = await fetch(`/api/player-of-the-week/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) await throwApiError(res, 'Failed to delete POTW');
    return res.json();
  },


  async getSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async getAdvertisements(): Promise<Advertisement[]> {
    const res = await fetch('/api/advertisements');
    if (!res.ok) throw new Error('Failed to fetch advertisements');
    return res.json();
  },

  async saveAdvertisement(ad: Advertisement): Promise<Advertisement> {
    const res = await fetch('/api/advertisements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ad)
    });
    if (!res.ok) await throwApiError(res, 'Failed to save advertisement');
    return res.json();
  },

  async deleteAdvertisement(id: string): Promise<void> {
    const res = await fetch(`/api/advertisements/${id}`, { method: 'DELETE' });
    if (!res.ok) await throwApiError(res, 'Failed to delete advertisement');
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) await throwApiError(res, 'Failed to save settings');
    return res.json();
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const res = await fetch('/api/teams');
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async saveTeam(team: Partial<Team>): Promise<Team> {
    const method = team.id ? 'PUT' : 'POST';
    const url = team.id ? `/api/teams/${team.id}` : '/api/teams';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    if (!res.ok) await throwApiError(res, 'Failed to save team');
    return res.json();
  },

  async deleteTeam(id: string): Promise<void> {
    const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    if (!res.ok) await throwApiError(res, 'Failed to delete team');
  },

  // Players
  async getPlayers(teamId?: string): Promise<Player[]> {
    const res = await fetch(teamId ? `/api/players?teamId=${teamId}` : '/api/players');
    if (!res.ok) throw new Error('Failed to fetch players');
    return res.json();
  },

  async getFantasyDashboardStats(): Promise<any> {
    const res = await fetch('/api/fantasy-dashboard-stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async savePlayer(player: Partial<Player>): Promise<Player> {
    localStorage.removeItem('cached_players');
    localStorage.removeItem('player_version');
    const method = player.id ? 'PUT' : 'POST';
    const url = player.id ? `/api/players/${player.id}` : '/api/players';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player)
    });
    if (!res.ok) await throwApiError(res, 'Failed to save player');
    return res.json();
  },

  async deletePlayer(id: string): Promise<void> {
    localStorage.removeItem('cached_players');
    localStorage.removeItem('player_version');
    const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
    if (!res.ok) await throwApiError(res, 'Failed to delete player');
  },

  async deletePlayersBulk(ids: string[]): Promise<void> {
    localStorage.removeItem('cached_players');
    localStorage.removeItem('player_version');
    const res = await fetch('/api/players/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) await throwApiError(res, 'Failed to bulk delete players');
  },

  async transferPlayer(id: string, newTeamId: string, newShirtNumber?: number): Promise<Player> {
    localStorage.removeItem('cached_players');
    localStorage.removeItem('player_version');
    const res = await fetch(`/api/players/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTeamId, newShirtNumber })
    });
    if (!res.ok) await throwApiError(res, 'Failed to transfer player');
    return res.json();
  },

  // Matches
  async getMatches(): Promise<Match[]> {
    const res = await fetch('/api/matches');
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  async getMatch(id: string): Promise<Match> {
    const res = await fetch(`/api/matches/${id}`);
    if (!res.ok) throw new Error('Failed to fetch match');
    return res.json();
  },

  async saveMatch(match: Partial<Match>): Promise<Match> {
    const method = match.id ? 'PUT' : 'POST';
    const url = match.id ? `/api/matches/${match.id}` : '/api/matches';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match)
    });
    if (!res.ok) await throwApiError(res, 'Failed to save match');
    return res.json();
  },

  async saveMatchesBulk(matches: Partial<Match>[]): Promise<Match[]> {
    const res = await fetch('/api/matches/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches })
    });
    if (!res.ok) await throwApiError(res, 'Failed to bulk upload matches');
    return res.json();
  },

  async deleteMatch(id: string): Promise<void> {
    const res = await fetch(`/api/matches/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) await throwApiError(res, 'Failed to delete match');
  },

  // Events
  async addEvent(matchId: string, eventData: Partial<MatchEvent>): Promise<MatchEvent> {
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    if (!res.ok) await throwApiError(res, 'Failed to add event');
    return res.json();
  },

  async deleteEvent(matchId: string, eventId: string): Promise<void> {
    const res = await fetch(`/api/matches/${matchId}/events/${eventId}`, {
      method: 'DELETE'
    });
    if (!res.ok) await throwApiError(res, 'Failed to delete event');
  },

  // Ratings
  async saveRatings(matchId: string, ratings: Record<string, number>): Promise<Record<string, number>> {
    const res = await fetch(`/api/matches/${matchId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratings })
    });
    if (!res.ok) await throwApiError(res, 'Failed to save ratings');
    return res.json();
  },

  // Lineup
  async saveLineup(matchId: string, isHome: boolean, lineup: any): Promise<Match> {
    const res = await fetch(`/api/matches/${matchId}/lineup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHome, lineup })
    });
    if (!res.ok) await throwApiError(res, 'Failed to save lineup');
    return res.json();
  },

  // Standings & Stats
  async getStandings(): Promise<Team[]> {
    const res = await fetch('/api/standings');
    if (!res.ok) throw new Error('Failed to fetch standings');
    return res.json();
  },

  async updateTeamStandingsOverride(teamId: string, overrideData: Partial<Team>): Promise<Team> {
    const res = await fetch(`/api/teams/${teamId}/standings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overrideData)
    });
    if (!res.ok) await throwApiError(res, 'Failed to update team standings override');
    return res.json();
  },

  async getStats(): Promise<LeagueStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // News
  async getNews(): Promise<NewsArticle[]> {
    const res = await fetch('/api/news');
    if (!res.ok) throw new Error('Failed to fetch news');
    return res.json();
  },

  async saveNews(article: Partial<NewsArticle> & { currentUserUid?: string; currentUserRole?: string; currentUserEmail?: string; isSuperAdminAction?: boolean }): Promise<NewsArticle> {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to publish news');
    }
    return res.json();
  },

  async likeNews(id: string): Promise<NewsArticle> {
    const res = await fetch(`/api/news/${id}/like`, { method: 'POST' });
    if (!res.ok) await throwApiError(res, 'Failed to like article');
    return res.json();
  },

  async addNewsComment(id: string, comment: { authorName: string; avatarUrl?: string; content: string }): Promise<NewsArticle> {
    const res = await fetch(`/api/news/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    });
    if (!res.ok) await throwApiError(res, 'Failed to post comment');
    return res.json();
  },

  async deleteNews(id: string, userContext?: { uid?: string; role?: string; email?: string }): Promise<void> {
    const query = userContext ? `?uid=${encodeURIComponent(userContext.uid || '')}&role=${encodeURIComponent(userContext.role || '')}&email=${encodeURIComponent(userContext.email || '')}` : '';
    const res = await fetch(`/api/news/${id}${query}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(userContext?.uid ? { 'x-user-uid': userContext.uid } : {}),
        ...(userContext?.role ? { 'x-user-role': userContext.role } : {}),
        ...(userContext?.email ? { 'x-user-email': userContext.email } : {})
      }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete news');
    }
  },

  // Admins & Role Management
  async getAdmins(): Promise<AdminUser[]> {
    const res = await fetch('/api/admins');
    if (!res.ok) throw new Error('Failed to fetch admin users');
    return res.json();
  },

  async appointAdmin(adminData: Partial<AdminUser>): Promise<AdminUser> {
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to appoint admin');
    }
    return res.json();
  },

  async dismissAdmin(email: string): Promise<void> {
    const res = await fetch(`/api/admins/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dismiss admin');
    }
  },

  // User Accounts & Login Deck
  async loginUser(email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string, fantasyTeamName?: string, password?: string): Promise<UserAccount> {
    let res: Response;
    try {
      res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, favoriteTeamId, avatarUrl, fantasyTeamName, password })
      });
    } catch {
      throw new Error('Unable to reach the server. Please check your internet connection and try again.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed. Please check your credentials.');
    }
    return res.json();
  },

  async checkAvailability(username?: string, teamName?: string, email?: string): Promise<{ usernameAvailable: boolean; teamNameAvailable: boolean; usernameError?: string; teamNameError?: string }> {
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (teamName) params.append('teamName', teamName);
    if (email) params.append('email', email);
    const res = await fetch(`/api/check-availability?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to check availability');
    return res.json();
  },

  async updateUserProfile(userData: Partial<UserAccount> & { email: string }): Promise<UserAccount> {
    const res = await fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async deleteAccount(email: string): Promise<void> {
    const res = await fetch(`/api/users/${encodeURIComponent(email.trim().toLowerCase())}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete account');
    }
  },

  async getUsers(): Promise<UserAccount[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async createNotification(notif: any): Promise<AppNotification> {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notif)
    });
    if (!res.ok) await throwApiError(res, 'Failed to create notification');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    const res = await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) await throwApiError(res, 'Failed to mark notification read');
  },

  async markAllNotificationsRead(): Promise<void> {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST'
    });
    if (!res.ok) await throwApiError(res, 'Failed to mark all notifications read');
  },

  async clearNotifications(): Promise<void> {
    const res = await fetch('/api/notifications', { method: 'DELETE' });
    if (!res.ok) await throwApiError(res, 'Failed to clear notifications');
  },

  // Reset
  async resetDemo(): Promise<void> {
    localStorage.removeItem('cached_players');
    localStorage.removeItem('player_version');
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    if (!res.ok) await throwApiError(res, 'Failed to reset demo');
  },

  async resetTableZero(): Promise<void> {
    localStorage.removeItem('cached_players');
    localStorage.removeItem('player_version');
    const res = await fetch('/api/reset-table-zero', { method: 'POST' });
    if (!res.ok) await throwApiError(res, 'Failed to reset table data');
  },

  async emergencyReseed(): Promise<any> {
    localStorage.removeItem('cached_players');
    localStorage.removeItem('player_version');
    const res = await fetch('/api/emergency-reseed', { method: 'POST' });
    if (!res.ok) await throwApiError(res, 'Failed to run emergency re-seed');
    return res.json();
  },

  // Fantasy League & Mini-Leagues
  async getFantasySquads(): Promise<FantasySquad[]> {
    const res = await fetch('/api/fantasy/squads');
    if (!res.ok) throw new Error('Failed to fetch fantasy squads');
    return res.json();
  },

  async saveFantasySquad(squad: Partial<FantasySquad>): Promise<FantasySquad> {
    const res = await fetch('/api/fantasy/squads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(squad)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save fantasy squad');
    }
    return res.json();
  },

  async resetMySquad(squadId: string, userId: string): Promise<void> {
    const res = await fetch('/api/fantasy/reset-my-squad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ squadId, userId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete fantasy squad');
    }
  },

  async getMiniLeagues(): Promise<MiniLeague[]> {
    const res = await fetch('/api/fantasy/mini-leagues');
    if (!res.ok) throw new Error('Failed to fetch mini leagues');
    return res.json();
  },

  async createMiniLeague(data: { name: string; ownerId?: string; ownerName?: string; userEmail: string } | string, userEmail?: string): Promise<MiniLeague> {
    const payload = typeof data === 'string' ? { name: data, userEmail } : data;
    const res = await fetch('/api/fantasy/mini-leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create mini league');
    }
    return res.json();
  },

  async joinMiniLeague(code: string, userEmail: string): Promise<MiniLeague> {
    const res = await fetch('/api/fantasy/mini-leagues/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userEmail })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to join mini league');
    }
    return res.json();
  },

  // Match Predictions
  async getMatchPrediction(matchId: string, userSessionId: string): Promise<MatchPredictionStats> {
    const fallbackStats: MatchPredictionStats = {
      matchId: matchId || '',
      totalVotes: 0,
      homeWinVotes: 0,
      drawVotes: 0,
      awayWinVotes: 0,
      homeWinPercent: 0,
      drawPercent: 0,
      awayWinPercent: 0,
      userVote: null
    };

    if (!matchId) return fallbackStats;

    try {
      const res = await fetch(`/api/matches/${encodeURIComponent(matchId)}/prediction?userSessionId=${encodeURIComponent(userSessionId || '')}`);
      if (!res.ok) return fallbackStats;
      return await res.json();
    } catch {
      return fallbackStats;
    }
  },

  async submitMatchPrediction(matchId: string, userSessionId: string, predictionType: PredictionType): Promise<MatchPredictionStats> {
    const res = await fetch(`/api/matches/${matchId}/prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSessionId, predictionType })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit prediction');
    }
    return res.json();
  },

  async getScorePredictions(userId: string): Promise<ScorePredictionRecord[]> {
    const res = await fetch(`/api/score-predictions?userId=${encodeURIComponent(userId || '')}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getPredictorLeaderboard(): Promise<PredictorLeaderboardEntry[]> {
    const res = await fetch('/api/predictions/leaderboard');
    if (!res.ok) return [];
    return res.json();
  },

  async saveScorePrediction(data: { userId: string; matchId: string; homeScore: number; awayScore: number; userEmail?: string; userName?: string }): Promise<ScorePredictionRecord> {
    const res = await fetch('/api/score-predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save score prediction');
    }
    return res.json();
  },

  // Player Valuation
  async updatePlayerValuation(playerId: string, price: number, isSuspended?: boolean, isInjured?: boolean, injuryStatus?: 'Fit' | 'Injured' | 'Doubtful', suspensionWeeks?: number): Promise<Player> {
    const res = await fetch(`/api/players/${playerId}/valuation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price, isSuspended, isInjured, injuryStatus, suspensionWeeks })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update player valuation');
    }
    return res.json();
  },

  // Super Admin Bulk Uploads
  async bulkUploadRoster(teamId: string, text: string): Promise<{ importedCount: number }> {
    const res = await fetch('/api/admin/bulk-roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, text })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload roster');
    }
    return res.json();
  },

  async bulkUploadSchedule(text: string): Promise<{ importedCount: number }> {
    const res = await fetch('/api/admin/bulk-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload schedule');
    }
    return res.json();
  },

  async bulkUploadTeams(text: string): Promise<{ importedCount: number }> {
    const res = await fetch('/api/admin/bulk-teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload teams');
    }
    return res.json();
  },

  async forceFirestoreSync(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/force-firestore-sync', {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to force Firestore sync');
    }
    return res.json();
  },

  async bulkUploadLineups(matchId: string, text: string): Promise<{ importedCount: number }> {
    const res = await fetch('/api/admin/bulk-lineups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, text })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload lineups');
    }
    return res.json();
  },

  async getFixtureChats(matchId: string): Promise<FixtureChatMessage[]> {
    if (!matchId) return [];
    try {
      const res = await fetch(`/api/matches/${encodeURIComponent(matchId)}/chats`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async addFixtureMessage(matchId: string, msg: { userId: string; username: string; content: string; avatarUrl?: string }): Promise<FixtureChatMessage> {
    const res = await fetch(`/api/matches/${matchId}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg)
    });
    if (!res.ok) await throwApiError(res, 'Failed to post chat message');
    return res.json();
  },

  async deleteFixtureMessage(matchId: string, chatId: string): Promise<boolean> {
    const res = await fetch(`/api/matches/${matchId}/chats/${chatId}`, {
      method: 'DELETE'
    });
    if (!res.ok) await throwApiError(res, 'Failed to delete chat message');
    const data = await res.json();
    return data.success;
  },

  async submitSupportTicket(data: { email: string; name: string; category: string; message: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit support ticket');
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/users/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to process password recovery');
    }
    return res.json();
  },

  async getMatchVideos(): Promise<any[]> {
    const res = await fetch('/api/match-videos');
    if (!res.ok) throw new Error('Failed to fetch match videos');
    return res.json();
  },

  async saveMatchVideo(video: any): Promise<any> {
    const res = await fetch('/api/match-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    });
    if (!res.ok) await throwApiError(res, 'Failed to save match video');
    return res.json();
  },

  async deleteMatchVideo(id: string): Promise<boolean> {
    const res = await fetch(`/api/match-videos/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) await throwApiError(res, 'Failed to delete match video');
    const data = await res.json();
    return data.success;
  },

  async getEplHighlights(): Promise<any[]> {
    const res = await fetch('/api/epl-highlights');
    if (!res.ok) throw new Error('Failed to fetch epl highlights');
    return res.json();
  },

  async saveEplHighlight(highlight: any): Promise<any> {
    const res = await fetch('/api/epl-highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(highlight)
    });
    if (!res.ok) await throwApiError(res, 'Failed to save epl highlight');
    return res.json();
  },

  async deleteEplHighlight(id: string): Promise<boolean> {
    const res = await fetch(`/api/epl-highlights/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) await throwApiError(res, 'Failed to delete epl highlight');
    const data = await res.json();
    return data.success;
  },

  async likeEplHighlight(id: string): Promise<any> {
    const res = await fetch(`/api/epl-highlights/${id}/like`, {
      method: 'POST'
    });
    if (!res.ok) await throwApiError(res, 'Failed to like epl highlight');
    return res.json();
  }
};
