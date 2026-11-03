import { Team, Match } from '../types';

export interface ProjectedTeam extends Team {
  officialRank: number;
  liveRank: number;
  rankMovement: number; // positive = moved up (+N), negative = moved down (-N), 0 = no change
  isLivePlaying?: boolean;
  liveOpponentName?: string;
  liveScoreText?: string;
  liveOutcome?: 'W' | 'D' | 'L';
  isGhostProjected?: boolean;
}

export interface LiveStandingsResult {
  projectedStandings: ProjectedTeam[];
  hasActiveLiveMatches: boolean;
  activeLiveMatchesCount: number;
}

/**
 * Client-Side Projection Model ("Live Table")
 * Merges official database standings with active live matches in memory.
 * Bypasses backend database reads & writes while calculating real-time table shifts.
 */
export function computeLiveGhostStandings(
  officialStandings: Team[],
  matches: Match[] = []
): LiveStandingsResult {
  if (!officialStandings || officialStandings.length === 0) {
    return {
      projectedStandings: [],
      hasActiveLiveMatches: false,
      activeLiveMatchesCount: 0
    };
  }

  // 1. Assign official baseline rank to each team based on fetched official standings
  const officialRankMap = new Map<string, number>();
  officialStandings.forEach((team, index) => {
    officialRankMap.set(team.id, index + 1);
  });

  // 2. Identify active live league matches
  const activeLiveMatches = matches.filter(m => {
    const isLeague = m.competition_type !== 'Cup';
    const statusStr = (m.status || '') as string;
    const isLiveOrRecentlyFinished = statusStr === 'Live' || 
                   statusStr === 'FIRST_HALF' || 
                   statusStr === 'SECOND_HALF' || 
                   statusStr === 'Half-Time' ||
                   statusStr === 'Full-Time' ||
                   statusStr === 'Penalties' ||
                   m.period === '1st Half' || 
                   m.period === '2nd Half' || 
                   m.period === 'Half-Time' ||
                   m.period === 'Full-Time';
    const isNotCommitted = !m.isStatsCommitted;
    return isLeague && isLiveOrRecentlyFinished && isNotCommitted;
  });

  const hasActiveLiveMatches = activeLiveMatches.length > 0;

  // 3. Create initial map of team projections
  const teamMap = new Map<string, ProjectedTeam>();

  officialStandings.forEach(team => {
    const officialRank = officialRankMap.get(team.id) || 1;
    teamMap.set(team.id, {
      ...team,
      officialRank,
      liveRank: officialRank,
      rankMovement: 0,
      isLivePlaying: false,
      isGhostProjected: false
    });
  });

  // 4. Ghost Merge: apply live scores for teams currently playing in active matches
  activeLiveMatches.forEach(match => {
    const homeTeam = teamMap.get(match.homeTeamId);
    const awayTeam = teamMap.get(match.awayTeamId);

    const homeScore = Number(match.homeScore || 0);
    const awayScore = Number(match.awayScore || 0);

    if (homeTeam) {
      homeTeam.isLivePlaying = true;
      homeTeam.isGhostProjected = true;
      homeTeam.matchesPlayed += 1;
      homeTeam.goalsFor += homeScore;
      homeTeam.goalsAgainst += awayScore;
      homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
      homeTeam.liveOpponentName = awayTeam ? awayTeam.name : 'Opponent';
      homeTeam.liveScoreText = `${homeScore}-${awayScore}`;

      if (homeScore > awayScore) {
        homeTeam.won += 1;
        homeTeam.points += 3;
        homeTeam.liveOutcome = 'W';
      } else if (homeScore < awayScore) {
        homeTeam.lost += 1;
        homeTeam.liveOutcome = 'L';
      } else {
        homeTeam.drawn += 1;
        homeTeam.points += 1;
        homeTeam.liveOutcome = 'D';
      }
    }

    if (awayTeam) {
      awayTeam.isLivePlaying = true;
      awayTeam.isGhostProjected = true;
      awayTeam.matchesPlayed += 1;
      awayTeam.goalsFor += awayScore;
      awayTeam.goalsAgainst += homeScore;
      awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
      awayTeam.liveOpponentName = homeTeam ? homeTeam.name : 'Opponent';
      awayTeam.liveScoreText = `${homeScore}-${awayScore}`;

      if (awayScore > homeScore) {
        awayTeam.won += 1;
        awayTeam.points += 3;
        awayTeam.liveOutcome = 'W';
      } else if (awayScore < homeScore) {
        awayTeam.lost += 1;
        awayTeam.liveOutcome = 'L';
      } else {
        awayTeam.drawn += 1;
        awayTeam.points += 1;
        awayTeam.liveOutcome = 'D';
      }
    }
  });

  // 5. Convert map to array and sort by live points -> GD -> GF -> Name
  const projectedArray = Array.from(teamMap.values());

  projectedArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  // 6. Calculate live rank and rank movement
  projectedArray.forEach((team, index) => {
    team.liveRank = index + 1;
    team.rankMovement = team.officialRank - team.liveRank; // positive = climbed (+N), negative = dropped (-N)
  });

  return {
    projectedStandings: projectedArray,
    hasActiveLiveMatches,
    activeLiveMatchesCount: activeLiveMatches.length
  };
}
