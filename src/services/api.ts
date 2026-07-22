import { Team, Player, Match, MatchEvent, NewsArticle, LeagueStats, AdminUser, UserAccount, AppNotification, AppSettings, MatchStats } from '../types';

export const api = {
  // App Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to save settings');
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
    if (!res.ok) throw new Error('Failed to save team');
    return res.json();
  },

  async deleteTeam(id: string): Promise<void> {
    const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete team');
  },

  // Players
  async getPlayers(teamId?: string): Promise<Player[]> {
    const url = teamId ? `/api/players?teamId=${teamId}` : '/api/players';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch players');
    return res.json();
  },

  async savePlayer(player: Partial<Player>): Promise<Player> {
    const method = player.id ? 'PUT' : 'POST';
    const url = player.id ? `/api/players/${player.id}` : '/api/players';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player)
    });
    if (!res.ok) throw new Error('Failed to save player');
    return res.json();
  },

  async deletePlayer(id: string): Promise<void> {
    const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete player');
  },

  async transferPlayer(id: string, newTeamId: string, newShirtNumber?: number): Promise<Player> {
    const res = await fetch(`/api/players/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newTeamId, newShirtNumber })
    });
    if (!res.ok) throw new Error('Failed to transfer player');
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
    if (!res.ok) throw new Error('Failed to save match');
    return res.json();
  },

  async saveMatchesBulk(matches: Partial<Match>[]): Promise<Match[]> {
    const res = await fetch('/api/matches/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches })
    });
    if (!res.ok) throw new Error('Failed to bulk upload matches');
    return res.json();
  },

  async deleteMatch(id: string): Promise<void> {
    const res = await fetch(`/api/matches/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete match');
  },

  // Events
  async addEvent(matchId: string, eventData: Partial<MatchEvent>): Promise<MatchEvent> {
    const res = await fetch(`/api/matches/${matchId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    if (!res.ok) throw new Error('Failed to add event');
    return res.json();
  },

  async deleteEvent(matchId: string, eventId: string): Promise<void> {
    const res = await fetch(`/api/matches/${matchId}/events/${eventId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete event');
  },

  // Ratings
  async saveRatings(matchId: string, ratings: Record<string, number>): Promise<Record<string, number>> {
    const res = await fetch(`/api/matches/${matchId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ratings })
    });
    if (!res.ok) throw new Error('Failed to save ratings');
    return res.json();
  },

  // Lineup
  async saveLineup(matchId: string, isHome: boolean, lineup: any): Promise<Match> {
    const res = await fetch(`/api/matches/${matchId}/lineup`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHome, lineup })
    });
    if (!res.ok) throw new Error('Failed to save lineup');
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
    if (!res.ok) throw new Error('Failed to update team standings override');
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

  async saveNews(article: Partial<NewsArticle>): Promise<NewsArticle> {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    if (!res.ok) throw new Error('Failed to publish news');
    return res.json();
  },

  async likeNews(id: string): Promise<NewsArticle> {
    const res = await fetch(`/api/news/${id}/like`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to like article');
    return res.json();
  },

  async addNewsComment(id: string, comment: { authorName: string; avatarUrl?: string; content: string }): Promise<NewsArticle> {
    const res = await fetch(`/api/news/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    });
    if (!res.ok) throw new Error('Failed to post comment');
    return res.json();
  },

  async deleteNews(id: string): Promise<void> {
    const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete news');
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
  async loginUser(email: string, name?: string, favoriteTeamId?: string, avatarUrl?: string): Promise<UserAccount> {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, favoriteTeamId, avatarUrl })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
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

  async markNotificationRead(id: string): Promise<void> {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', {
      method: 'POST'
    });
  },

  async clearNotifications(): Promise<void> {
    await fetch('/api/notifications', { method: 'DELETE' });
  },

  // Reset
  async resetDemo(): Promise<void> {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
  },

  async resetTableZero(): Promise<void> {
    const res = await fetch('/api/reset-table-zero', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset table data');
  }
};
