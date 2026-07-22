import fs from 'fs';
import path from 'path';
import { Team, Player, Match, MatchEvent, NewsArticle, AdminUser, UserAccount, AppNotification, AppSettings } from '../types';

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
  settings?: AppSettings;
}

const INITIAL_SETTINGS: AppSettings = {
  appName: 'Epe Premier League',
  appLogoUrl: '',
  primaryColor: '#800020',
  accentColor: '#facc15',
  defaultTheme: 'dark',
  leagueSeason: '2026 Season'
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'epe_league_db.json');

const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Epe United FC',
    shortName: 'EPE',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&q=80',
    points: 28,
    goalDifference: 14,
    matchesPlayed: 11,
    won: 9,
    drawn: 1,
    lost: 1,
    goalsFor: 26,
    goalsAgainst: 12,
    coach: 'Segun Babatunde',
    stadium: 'Epe Township Stadium'
  },
  {
    id: 'team-2',
    name: 'Alaro City FC',
    shortName: 'ALC',
    logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&q=80',
    points: 25,
    goalDifference: 11,
    matchesPlayed: 11,
    won: 8,
    drawn: 1,
    lost: 2,
    goalsFor: 22,
    goalsAgainst: 11,
    coach: 'Clement Okafor',
    stadium: 'Alaro City Sports Arena'
  },
  {
    id: 'team-3',
    name: 'Atlantic Tigers',
    shortName: 'ATG',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&q=80',
    points: 22,
    goalDifference: 7,
    matchesPlayed: 11,
    won: 7,
    drawn: 1,
    lost: 3,
    goalsFor: 19,
    goalsAgainst: 12,
    coach: 'Michael Adebayo',
    stadium: 'Atlantic Coastal Arena'
  },
  {
    id: 'team-4',
    name: 'Expressway Warriors',
    shortName: 'EXW',
    logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=120&q=80',
    points: 17,
    goalDifference: 2,
    matchesPlayed: 11,
    won: 5,
    drawn: 2,
    lost: 4,
    goalsFor: 16,
    goalsAgainst: 14,
    coach: 'David Sanusi',
    stadium: 'Lekki-Epe Express Field'
  },
  {
    id: 'team-5',
    name: 'Poka Lions FC',
    shortName: 'POK',
    logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=120&q=80',
    points: 14,
    goalDifference: -3,
    matchesPlayed: 11,
    won: 4,
    drawn: 2,
    lost: 5,
    goalsFor: 14,
    goalsAgainst: 17,
    coach: 'Ibrahim Lawal',
    stadium: 'Poka Community Pitch'
  },
  {
    id: 'team-6',
    name: 'Eyita FC',
    shortName: 'EYI',
    logoUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=120&q=80',
    points: 10,
    goalDifference: -8,
    matchesPlayed: 11,
    won: 3,
    drawn: 1,
    lost: 7,
    goalsFor: 11,
    goalsAgainst: 19,
    coach: 'Sunday Ogundele',
    stadium: 'Eyita Park'
  },
  {
    id: 'team-7',
    name: 'Odomola City FC',
    shortName: 'ODM',
    logoUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=120&q=80',
    points: 8,
    goalDifference: -11,
    matchesPlayed: 11,
    won: 2,
    drawn: 2,
    lost: 7,
    goalsFor: 9,
    goalsAgainst: 20,
    coach: 'Kunle Ajayi',
    stadium: 'Odomola Stadium'
  },
  {
    id: 'team-8',
    name: 'Papa Athletic',
    shortName: 'PAP',
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=120&q=80',
    points: 4,
    goalDifference: -12,
    matchesPlayed: 11,
    won: 1,
    drawn: 1,
    lost: 9,
    goalsFor: 7,
    goalsAgainst: 19,
    coach: 'Emeka Nwosu',
    stadium: 'Papa Recreation Ground'
  }
];

const INITIAL_PLAYERS: Player[] = [
  // Epe United FC
  { id: 'p-101', name: 'Tosin Balogun', teamId: 'team-1', position: 'FWD', goals: 11, assists: 4, cleanSheets: 0, shirtNumber: 9, photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-102', name: 'Femi Alabi', teamId: 'team-1', position: 'MID', goals: 5, assists: 9, cleanSheets: 0, shirtNumber: 10, photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-103', name: 'Chidi Okonkwo', teamId: 'team-1', position: 'GK', goals: 0, assists: 0, cleanSheets: 6, shirtNumber: 1, photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-104', name: 'Bamidele Ojo', teamId: 'team-1', position: 'DEF', goals: 2, assists: 3, cleanSheets: 6, shirtNumber: 4, photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-105', name: 'Gbolahan Kuti', teamId: 'team-1', position: 'DEF', goals: 1, assists: 1, cleanSheets: 6, shirtNumber: 5, photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-106', name: 'Victor Eze', teamId: 'team-1', position: 'MID', goals: 4, assists: 2, cleanSheets: 0, shirtNumber: 8, photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-107', name: 'Kayode Adegoke', teamId: 'team-1', position: 'FWD', goals: 3, assists: 2, cleanSheets: 0, shirtNumber: 11, photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },

  // Alaro City FC
  { id: 'p-201', name: 'Rashid Sanusi', teamId: 'team-2', position: 'FWD', goals: 9, assists: 3, cleanSheets: 0, shirtNumber: 9, photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-202', name: 'Emmanuel Chukwu', teamId: 'team-2', position: 'MID', goals: 3, assists: 7, cleanSheets: 0, shirtNumber: 7, photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-203', name: 'Kazeem Olayinka', teamId: 'team-2', position: 'GK', goals: 0, assists: 0, cleanSheets: 5, shirtNumber: 1, photoUrl: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-204', name: 'Olumide Daniel', teamId: 'team-2', position: 'DEF', goals: 1, assists: 2, cleanSheets: 5, shirtNumber: 3, photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-205', name: 'Ayodele Bello', teamId: 'team-2', position: 'DEF', goals: 2, assists: 1, cleanSheets: 5, shirtNumber: 2, photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-206', name: 'Habib Usman', teamId: 'team-2', position: 'FWD', goals: 5, assists: 1, cleanSheets: 0, shirtNumber: 11, photoUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80' },

  // Atlantic Tigers
  { id: 'p-301', name: 'Godwin Bassey', teamId: 'team-3', position: 'FWD', goals: 8, assists: 2, cleanSheets: 0, shirtNumber: 9, photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-302', name: 'Afeez Salami', teamId: 'team-3', position: 'MID', goals: 2, assists: 6, cleanSheets: 0, shirtNumber: 10, photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-303', name: 'Sunday Peters', teamId: 'team-3', position: 'GK', goals: 0, assists: 0, cleanSheets: 4, shirtNumber: 1, photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-304', name: 'Kelechi Amadi', teamId: 'team-3', position: 'DEF', goals: 1, assists: 0, cleanSheets: 4, shirtNumber: 5, photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80' },

  // Expressway Warriors
  { id: 'p-401', name: 'Junior Adeniyi', teamId: 'team-4', position: 'FWD', goals: 6, assists: 2, cleanSheets: 0, shirtNumber: 11, photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-402', name: 'David Folorunsho', teamId: 'team-4', position: 'MID', goals: 4, assists: 4, cleanSheets: 0, shirtNumber: 8, photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-403', name: 'Taiwo Ogundare', teamId: 'team-4', position: 'GK', goals: 0, assists: 0, cleanSheets: 3, shirtNumber: 1, photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },

  // Poka Lions
  { id: 'p-501', name: 'Yakubu Danjuma', teamId: 'team-5', position: 'FWD', goals: 5, assists: 1, cleanSheets: 0, shirtNumber: 9, photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=200&q=80' },
  { id: 'p-502', name: 'Sulaimon Idris', teamId: 'team-5', position: 'MID', goals: 3, assists: 3, cleanSheets: 0, shirtNumber: 6, photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },

  // Eyita FC
  { id: 'p-601', name: 'Musa Abdullahi', teamId: 'team-6', position: 'FWD', goals: 4, assists: 1, cleanSheets: 0, shirtNumber: 10, photoUrl: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=200&q=80' },

  // Odomola City
  { id: 'p-701', name: 'Leke Solanke', teamId: 'team-7', position: 'MID', goals: 3, assists: 2, cleanSheets: 0, shirtNumber: 8, photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80' },

  // Papa Athletic
  { id: 'p-801', name: 'Austin Nnamdi', teamId: 'team-8', position: 'FWD', goals: 3, assists: 0, cleanSheets: 0, shirtNumber: 9, photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' }
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-101',
    homeTeamId: 'team-1',
    awayTeamId: 'team-2',
    homeScore: 2,
    awayScore: 1,
    status: 'Live',
    period: '2nd Half',
    matchMinute: 68,
    date: '2026-07-22',
    time: '16:00',
    venue: 'Epe Township Stadium',
    matchday: 12,
    stats: {
      homePossession: 56,
      awayPossession: 44,
      homeShots: 11,
      awayShots: 7,
      homeShotsOnTarget: 5,
      awayShotsOnTarget: 3,
      homeCorners: 6,
      awayCorners: 4,
      homeFouls: 9,
      awayFouls: 12
    },
    homeLineup: {
      teamId: 'team-1',
      formation: '4-3-3',
      startingXI: [
        { playerId: 'p-103', name: 'Chidi Okonkwo', number: 1, position: 'GK', isCaptain: false },
        { playerId: 'p-104', name: 'Bamidele Ojo', number: 4, position: 'DEF' },
        { playerId: 'p-105', name: 'Gbolahan Kuti', number: 5, position: 'DEF', isCaptain: true },
        { playerId: 'p-108', name: 'Sola Shonibare', number: 2, position: 'DEF' },
        { playerId: 'p-109', name: 'Kazeem Biobaku', number: 3, position: 'DEF' },
        { playerId: 'p-102', name: 'Femi Alabi', number: 10, position: 'MID' },
        { playerId: 'p-106', name: 'Victor Eze', number: 8, position: 'MID' },
        { playerId: 'p-110', name: 'Adebayo Tiamiyu', number: 6, position: 'MID' },
        { playerId: 'p-101', name: 'Tosin Balogun', number: 9, position: 'FWD' },
        { playerId: 'p-107', name: 'Kayode Adegoke', number: 11, position: 'FWD' },
        { playerId: 'p-111', name: 'Afeez Olowu', number: 7, position: 'FWD' }
      ],
      substitutes: [
        { playerId: 'p-112', name: 'Kehinde Agbaje', number: 12, position: 'FWD' },
        { playerId: 'p-113', name: 'Rotimi Sowemimo', number: 16, position: 'MID' }
      ]
    },
    awayLineup: {
      teamId: 'team-2',
      formation: '4-2-3-1',
      startingXI: [
        { playerId: 'p-203', name: 'Kazeem Olayinka', number: 1, position: 'GK' },
        { playerId: 'p-204', name: 'Olumide Daniel', number: 3, position: 'DEF' },
        { playerId: 'p-205', name: 'Ayodele Bello', number: 2, position: 'DEF', isCaptain: true },
        { playerId: 'p-207', name: 'Samson Akpan', number: 4, position: 'DEF' },
        { playerId: 'p-208', name: 'Dapo Towobola', number: 5, position: 'DEF' },
        { playerId: 'p-202', name: 'Emmanuel Chukwu', number: 7, position: 'MID' },
        { playerId: 'p-209', name: 'Festus Onigbinde', number: 6, position: 'MID' },
        { playerId: 'p-210', name: 'Babatunde Yusuf', number: 10, position: 'MID' },
        { playerId: 'p-201', name: 'Rashid Sanusi', number: 9, position: 'FWD' },
        { playerId: 'p-206', name: 'Habib Usman', number: 11, position: 'FWD' },
        { playerId: 'p-211', name: 'Suleiman Jimoh', number: 8, position: 'MID' }
      ],
      substitutes: [
        { playerId: 'p-212', name: 'Segun Ogunsanya', number: 14, position: 'DEF' }
      ]
    }
  },
  {
    id: 'm-102',
    homeTeamId: 'team-3',
    awayTeamId: 'team-4',
    homeScore: 3,
    awayScore: 1,
    status: 'Full-Time',
    period: 'Full-Time',
    matchMinute: 90,
    date: '2026-07-22',
    time: '14:00',
    venue: 'Atlantic Coastal Arena',
    matchday: 12,
    stats: {
      homePossession: 52,
      awayPossession: 48,
      homeShots: 14,
      awayShots: 9,
      homeShotsOnTarget: 7,
      awayShotsOnTarget: 3,
      homeCorners: 5,
      awayCorners: 3,
      homeFouls: 11,
      awayFouls: 10
    }
  },
  {
    id: 'm-103',
    homeTeamId: 'team-5',
    awayTeamId: 'team-6',
    homeScore: 0,
    awayScore: 0,
    status: 'Scheduled',
    period: 'Pre-Match',
    matchMinute: 0,
    date: '2026-07-22',
    time: '18:00',
    venue: 'Poka Community Pitch',
    matchday: 12
  },
  {
    id: 'm-104',
    homeTeamId: 'team-7',
    awayTeamId: 'team-8',
    homeScore: 0,
    awayScore: 0,
    status: 'Scheduled',
    period: 'Pre-Match',
    matchMinute: 0,
    date: '2026-07-23',
    time: '16:00',
    venue: 'Odomola Stadium',
    matchday: 12
  }
];

const INITIAL_EVENTS: MatchEvent[] = [
  {
    id: 'evt-1',
    matchId: 'm-101',
    teamId: 'team-1',
    playerId: 'p-101',
    playerName: 'Tosin Balogun',
    eventType: 'Goal',
    minute: 23,
    assisterId: 'p-102',
    assisterName: 'Femi Alabi',
    detail: 'Right-footed shot into top corner'
  },
  {
    id: 'evt-2',
    matchId: 'm-101',
    teamId: 'team-2',
    playerId: 'p-201',
    playerName: 'Rashid Sanusi',
    eventType: 'Goal',
    minute: 38,
    assisterId: 'p-202',
    assisterName: 'Emmanuel Chukwu',
    detail: 'Header from close range'
  },
  {
    id: 'evt-3',
    matchId: 'm-101',
    teamId: 'team-1',
    playerId: 'p-104',
    playerName: 'Bamidele Ojo',
    eventType: 'Yellow Card',
    minute: 44,
    detail: 'Tactical foul on counter-attack'
  },
  {
    id: 'evt-4',
    matchId: 'm-101',
    teamId: 'team-1',
    playerId: 'p-106',
    playerName: 'Victor Eze',
    eventType: 'Goal',
    minute: 54,
    detail: 'Long-range strike from 25 yards'
  },
  {
    id: 'evt-5',
    matchId: 'm-101',
    teamId: 'team-2',
    playerId: 'p-205',
    playerName: 'Ayodele Bello',
    eventType: 'Yellow Card',
    minute: 61,
    detail: 'Late challenge'
  },

  // Match 102 events
  {
    id: 'evt-10',
    matchId: 'm-102',
    teamId: 'team-3',
    playerId: 'p-301',
    playerName: 'Godwin Bassey',
    eventType: 'Goal',
    minute: 12,
    assisterId: 'p-302',
    assisterName: 'Afeez Salami'
  },
  {
    id: 'evt-11',
    matchId: 'm-102',
    teamId: 'team-4',
    playerId: 'p-401',
    playerName: 'Junior Adeniyi',
    eventType: 'Goal',
    minute: 33
  },
  {
    id: 'evt-12',
    matchId: 'm-102',
    teamId: 'team-3',
    playerId: 'p-301',
    playerName: 'Godwin Bassey',
    eventType: 'Goal',
    minute: 71
  },
  {
    id: 'evt-13',
    matchId: 'm-102',
    teamId: 'team-3',
    playerId: 'p-302',
    playerName: 'Afeez Salami',
    eventType: 'Goal',
    minute: 88
  }
];

const INITIAL_RATINGS: Record<string, Record<string, number>> = {
  'm-101': {
    'p-101': 8.7,
    'p-102': 8.4,
    'p-103': 7.1,
    'p-104': 6.8,
    'p-105': 7.5,
    'p-106': 8.2,
    'p-107': 7.0,
    'p-201': 8.0,
    'p-202': 7.6,
    'p-203': 6.5,
    'p-204': 6.2,
    'p-205': 6.0,
    'p-206': 6.9
  },
  'm-102': {
    'p-301': 9.2, // MOTM
    'p-302': 8.8,
    'p-303': 7.4,
    'p-304': 7.2,
    'p-401': 7.8,
    'p-402': 6.9,
    'p-403': 6.0
  }
};

const INITIAL_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Epe United FC Hold Off Alaro City in High-Stakes Title Clash',
    subtitle: 'A tactical masterclass at Epe Township Stadium keeps Epe United at the summit of the standings.',
    summary: 'A thunderous strike from Victor Eze in the 54th minute kept Epe United at the summit of the Epe Premier League table.',
    content: `Epe Township Stadium erupted into wild celebrations on Wednesday afternoon as league leaders Epe United secured a tense 2-1 advantage over fierce rivals Alaro City FC.

Star forward Tosin Balogun opened the scoring early in the 23rd minute after converting a silky pass from playmaker Femi Alabi. Alaro City responded valiantly before half-time through a bullet header from Rashid Sanusi.

However, midfielder Victor Eze provided the moment of the match with a sensational 25-yard curling effort that proved to be the winner.

"The boys showed immense mental strength today," remarked Segun Babatunde, head coach of Epe United. "Alaro pushed us hard, but our tactical discipline made the difference."`,
    coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    publishedAt: '2026-07-22T17:30:00Z',
    author: 'Segun Samson',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    authorTitle: 'Chief Football Writer, Epe Dispatch',
    category: 'Match Analysis',
    readTime: '3 min read',
    issueLabel: 'EPL Dispatch #14',
    isSubstackExclusive: true,
    likesCount: 24,
    featured: true,
    comments: [
      {
        id: 'c-1',
        authorName: 'Tunde Epe Supporter',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        content: 'Victor Eze is undoubtedly player of the month! What a strike!',
        timestamp: '2026-07-22T18:00:00Z'
      }
    ]
  },
  {
    id: 'news-2',
    title: 'Godwin Bassey Bags Brace as Atlantic Tigers Tame Expressway Warriors 3-1',
    subtitle: 'Bassey brings his season tally to 8 goals in a dominant home display.',
    summary: 'Godwin Bassey inspired Atlantic Tigers with a clinical double as they moved up to 3rd place in the standing.',
    content: `Atlantic Tigers continued their resurgence in the Epe Premier League with an emphatic 3-1 victory over Expressway Warriors at the Atlantic Coastal Arena.

Godwin Bassey put on a Masterclass performance, scoring in the 12th and 71st minutes to bring his tally for the season to 8 goals. Playmaker Afeez Salami sealed the victory late in the 88th minute.

Expressway Warriors, who scored via Junior Adeniyi in the first half, were unable to match the high intensity and fluid movement of the Tigers in the closing stages.`,
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    publishedAt: '2026-07-22T15:15:00Z',
    author: 'Olamide Coker',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    authorTitle: 'Tactical Analyst',
    category: 'Match Report',
    readTime: '4 min read',
    issueLabel: 'EPL Dispatch #13',
    likesCount: 18,
    featured: false,
    comments: []
  },
  {
    id: 'news-3',
    title: 'Epe Premier League Committee Announces Mid-Season Grassroots Youth Clinic',
    subtitle: 'UEFA & CAF licensed scouts arriving next month for scouting sessions.',
    summary: 'In partnership with local academies, EPL officials will host a 3-day coaching session for under-17 talents across Epe Division.',
    content: `The Executive Board of the Epe Premier League has announced a new grassroots development initiative aimed at nurturing young talent in the division.

Speaking at a press conference in Epe, League Chairman Chief Adeyemi Ogunlana confirmed that top UEFA and CAF licensed coaches will conduct masterclasses for local youth teams at Epe Township Stadium next month.

"Our goal is to build a sustainable pipeline of world-class talent right here from Epe," Ogunlana stated.`,
    coverImage: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
    publishedAt: '2026-07-21T10:00:00Z',
    author: 'EPL Official Press',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    authorTitle: 'League Media Directorate',
    category: 'League News',
    readTime: '2 min read',
    issueLabel: 'EPL Gazette Special',
    likesCount: 31,
    featured: false,
    comments: []
  }
];

const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin-super-1',
    email: 'itzjeda10@gmail.com',
    name: 'Jeda (Super Admin)',
    role: 'super_admin',
    appointedAt: '2026-01-01T00:00:00Z',
    appointedBy: 'System Registry'
  }
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-super-1',
    email: 'itzjeda10@gmail.com',
    name: 'Jeda',
    role: 'super_admin',
    favoriteTeamId: 'team-1',
    notificationsEnabled: true,
    themePreference: 'dark',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-fan-1',
    email: 'fan@epeleague.com',
    name: 'Tunde Epe Supporter',
    role: 'fan',
    favoriteTeamId: 'team-1',
    notificationsEnabled: true,
    themePreference: 'dark',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    createdAt: '2026-02-15T12:00:00Z'
  }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: '⚽ GOAL ALERT: Epe United FC 2-1 Alaro City FC',
    message: 'Segun Samson scores in the 67th minute with a thunderous strike!',
    type: 'match_goal',
    timestamp: '2026-07-22T00:15:00Z',
    read: false,
    linkMatchId: 'm-1'
  },
  {
    id: 'notif-2',
    title: '👑 Admin Command Center Initialized',
    message: 'Super Admin privileges active for itzjeda10@gmail.com. Sub-admin roster online.',
    type: 'admin_alert',
    timestamp: '2026-07-22T00:00:00Z',
    read: false
  },
  {
    id: 'notif-3',
    title: '📰 European Youth Academies Partner with EPL',
    message: 'UEFA & CAF coaches arriving next month for grassroot masterclasses at Epe Township Stadium.',
    type: 'news',
    timestamp: '2026-07-21T10:00:00Z',
    read: true
  }
];

export class DBStore {
  private data: DatabaseSchema;

  constructor() {
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
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.admins) parsed.admins = INITIAL_ADMINS;
        if (!parsed.users) parsed.users = INITIAL_USERS;
        if (!parsed.notifications) parsed.notifications = INITIAL_NOTIFICATIONS;
        if (!parsed.settings) parsed.settings = INITIAL_SETTINGS;
        return parsed;
      } catch (e) {
        console.error('Error reading database file, using seeds', e);
      }
    }
    const initial: DatabaseSchema = {
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
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
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
    this.saveData(this.data);
    return admin;
  }

  public deleteAdmin(email: string) {
    if (!this.data.admins) this.data.admins = INITIAL_ADMINS;
    if (email.toLowerCase() === 'itzjeda10@gmail.com') {
      throw new Error('Super Admin (itzjeda10@gmail.com) cannot be dismissed.');
    }
    this.data.admins = this.data.admins.filter(a => a.email.toLowerCase() !== email.toLowerCase());
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

  public saveUser(user: Partial<UserAccount> & { email: string }): UserAccount {
    if (!this.data.users) this.data.users = INITIAL_USERS;
    const emailLower = user.email.trim().toLowerCase();
    const idx = this.data.users.findIndex(u => u.email.toLowerCase() === emailLower);

    // Check if email belongs to admin list
    const adminMatch = this.getAdmins().find(a => a.email.toLowerCase() === emailLower);
    const assignedRole = adminMatch ? adminMatch.role : (user.role || 'fan');

    let updatedUser: UserAccount;
    if (idx >= 0) {
      updatedUser = {
        ...this.data.users[idx],
        ...user,
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
        notificationsEnabled: user.notificationsEnabled ?? true,
        themePreference: user.themePreference || 'dark',
        avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        createdAt: new Date().toISOString()
      };
      this.data.users.push(updatedUser);
    }
    this.saveData(this.data);
    return updatedUser;
  }

  // APP NOTIFICATIONS MANAGEMENT
  public getNotifications(): AppNotification[] {
    if (!this.data.notifications) {
      this.data.notifications = INITIAL_NOTIFICATIONS;
      this.saveData(this.data);
    }
    return this.data.notifications;
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string }): AppNotification {
    if (!this.data.notifications) this.data.notifications = INITIAL_NOTIFICATIONS;
    const newNotif: AppNotification = {
      id: notification.id || `notif-${Date.now()}`,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      linkMatchId: notification.linkMatchId
    };
    this.data.notifications.unshift(newNotif);
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

  public clearNotifications() {
    this.data.notifications = [];
    this.saveData(this.data);
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
    if (teamId) {
      return this.data.players.filter(p => p.teamId === teamId);
    }
    return this.data.players;
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
      if (event.eventType === 'Goal' || event.eventType === 'Penalty Goal') {
        if (event.teamId === match.homeTeamId) {
          match.homeScore += 1;
        } else if (event.teamId === match.awayTeamId) {
          match.awayScore += 1;
        }
      } else if (event.eventType === 'Own Goal') {
        if (event.teamId === match.homeTeamId) {
          match.awayScore += 1;
        } else if (event.teamId === match.awayTeamId) {
          match.homeScore += 1;
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
        if (event.eventType === 'Goal' || event.eventType === 'Penalty Goal') {
          if (event.teamId === match.homeTeamId && match.homeScore > 0) {
            match.homeScore -= 1;
          } else if (event.teamId === match.awayTeamId && match.awayScore > 0) {
            match.awayScore -= 1;
          }
        } else if (event.eventType === 'Own Goal') {
          if (event.teamId === match.homeTeamId && match.awayScore > 0) {
            match.awayScore -= 1;
          } else if (event.teamId === match.awayTeamId && match.homeScore > 0) {
            match.homeScore -= 1;
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
        p.ratingAverage = Number((sum / arr.length).toFixed(1));
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
    if (idx >= 0) {
      this.data.news[idx] = { ...this.data.news[idx], ...article };
    } else {
      this.data.news.unshift(article);
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
  }

  // APP SETTINGS
  public getSettings(): AppSettings {
    if (!this.data.settings) {
      this.data.settings = INITIAL_SETTINGS;
      this.saveData(this.data);
    }
    return this.data.settings;
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    if (!this.data.settings) this.data.settings = INITIAL_SETTINGS;
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData(this.data);
    return this.data.settings;
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

    // Calculate from Full-Time matches
    this.data.matches.forEach(m => {
      if (m.status === 'Full-Time') {
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

    this.data.players.forEach(p => {
      playerGoalsMap.set(p.id, 0);
      playerAssistsMap.set(p.id, 0);
      playerCleanSheetsMap.set(p.id, 0);
    });

    // Count goals & assists from events
    this.data.events.forEach(e => {
      if (e.eventType === 'Goal' || e.eventType === 'Penalty Goal') {
        if (e.playerId) {
          playerGoalsMap.set(e.playerId, (playerGoalsMap.get(e.playerId) || 0) + 1);
        }
        if (e.assisterId) {
          playerAssistsMap.set(e.assisterId, (playerAssistsMap.get(e.assisterId) || 0) + 1);
        }
      }
    });

    // Count clean sheets from Full-Time matches
    this.data.matches.forEach(m => {
      if (m.status === 'Full-Time') {
        if (m.awayScore === 0) {
          this.data.players
            .filter(p => p.teamId === m.homeTeamId && (p.position === 'GK' || p.position === 'DEF'))
            .forEach(p => {
              playerCleanSheetsMap.set(p.id, (playerCleanSheetsMap.get(p.id) || 0) + 1);
            });
        }
        if (m.homeScore === 0) {
          this.data.players
            .filter(p => p.teamId === m.awayTeamId && (p.position === 'GK' || p.position === 'DEF'))
            .forEach(p => {
              playerCleanSheetsMap.set(p.id, (playerCleanSheetsMap.get(p.id) || 0) + 1);
            });
        }
      }
    });

    this.data.players.forEach(p => {
      p.goals = playerGoalsMap.get(p.id) || 0;
      p.assists = playerAssistsMap.get(p.id) || 0;
      p.cleanSheets = playerCleanSheetsMap.get(p.id) || 0;
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
    const topScorers = [...this.data.players]
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 10);

    const topAssists = [...this.data.players]
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
      .slice(0, 10);

    const cleanSheets = [...this.data.players]
      .filter(p => p.position === 'GK' || p.position === 'DEF')
      .sort((a, b) => b.cleanSheets - a.cleanSheets)
      .slice(0, 10);

    return {
      topScorers,
      topAssists,
      cleanSheets
    };
  }
}

export const db = new DBStore();
