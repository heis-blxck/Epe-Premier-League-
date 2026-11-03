import { Match, MatchEvent, Player, FantasySquad, MatchLineup } from '../types';

export interface FantasyInputStats {
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  yellowCards?: number;
  redCards?: number;
  penaltyMisses?: number;
  goalsConceded?: number;
  penaltySaves?: number;
  bonusPoints?: number;
  ownGoals?: number;
}

export function calculateFantasyPoints(
  player: { position: string },
  stats: FantasyInputStats
): number {
  let points = 0;

  const minutesPlayed = stats.minutesPlayed || 0;
  const goals = stats.goals || 0;
  const assists = stats.assists || 0;
  const cleanSheets = stats.cleanSheets || 0;
  const yellowCards = stats.yellowCards || 0;
  const redCards = stats.redCards || 0;
  const penaltyMisses = stats.penaltyMisses || 0;
  const goalsConceded = stats.goalsConceded || 0;
  const penaltySaves = stats.penaltySaves || 0;
  const bonusPoints = stats.bonusPoints || 0;
  const ownGoals = stats.ownGoals || 0;

  // 1. General Points (Applies to ALL positions)
  // Appearance points: minutesPlayed > 0 and < 60 = +1pt; minutesPlayed >= 60 = +2pt
  if (minutesPlayed >= 60) {
    points += 2;
  } else if (minutesPlayed > 0) {
    points += 1;
  }

  points += assists * 3;
  points -= yellowCards * 1;
  points -= redCards * 3;
  points -= penaltyMisses * 2;
  points -= ownGoals * 2;
  points += bonusPoints;

  // 2. Positional Points
  const pos = (player?.position || '').toUpperCase();

  if (pos === 'FWD' || pos === 'ST' || pos === 'ATT') {
    points += goals * 4;
  } else if (pos === 'MID') {
    points += goals * 5;
    points += cleanSheets * 1;
  } else if (pos === 'DEF') {
    points += goals * 6;
    points += cleanSheets * 4;
    points += Math.floor(goalsConceded / 2) * -1;
  } else if (pos === 'GK') {
    points += goals * 6;
    points += cleanSheets * 4;
    points += Math.floor(goalsConceded / 2) * -1;
    points += penaltySaves * 3;
  } else {
    // Fallback if position unknown
    points += goals * 4;
  }

  return points;
}

export interface PlayerFantasyStats {
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  bonusPoints: number;
  totalPoints: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

export function calculatePlayerLivePoints(
  player: Player,
  match: Match,
  isCaptain: boolean = false,
  isViceCaptain: boolean = false,
  activeChip: 'TC' | 'BB' | 'WC' | null = null,
  isBench: boolean = false
): PlayerFantasyStats {
  const playerId = player.id;
  const playerPos = player.position;

  const stats: PlayerFantasyStats = {
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    cleanSheet: false,
    yellowCards: 0,
    redCards: 0,
    ownGoals: 0,
    bonusPoints: 0,
    totalPoints: 0,
    isCaptain,
    isViceCaptain
  };

  const isHomeTeam = match.homeTeamId === player.teamId;
  const lineup = isHomeTeam ? match.homeLineup : match.awayLineup;

  const events = match.events || [];
  let subInMinute = -1;
  let subOutMinute = -1;

  events.forEach(e => {
    if (e.eventType === 'Sub') {
      if (e.subInPlayerId === playerId) subInMinute = e.minute;
      if (e.playerId === playerId) subOutMinute = e.minute;
    }
    if (e.playerId === playerId) {
      const typeStr = e.eventType as string;
      if (typeStr === 'Goal' || typeStr === 'Penalty Goal' || typeStr === 'penalty' || typeStr === 'Own Goal' || typeStr === 'own_goal') {
        if (e.goalType === 'own_goal' || typeStr === 'Own Goal' || typeStr === 'own_goal') stats.ownGoals += 1;
        else stats.goals += 1;
      }
      if (typeStr === 'Yellow Card') stats.yellowCards += 1;
      if (typeStr === 'Red Card') stats.redCards += 1;
    }
    const isAssister = e.assisterId === playerId || (e as any).assistPlayerId === playerId;
    if (isAssister && (e.eventType === 'Goal' || (e.eventType as string) === 'Penalty Goal') && e.goalType !== 'own_goal') {
      stats.assists += 1;
    }
  });

  const currentMinute = (match.status === 'Full-Time' || match.status === 'Penalties') ? 90 : (match.matchMinute || 0);
  
  let isStarter = false;
  let playedAny = false;

  if (lineup && lineup.startingXI && lineup.startingXI.length > 0) {
    isStarter = lineup.startingXI.some(p => p.playerId === playerId);
    playedAny = isStarter || events.some(e => e.playerId === playerId || e.subInPlayerId === playerId);
  } else {
    // If no lineup provided but match is live/finished, assume they played (or if they had events)
    if (match.status === 'Live' || match.status === 'Half-Time' || match.status === 'Full-Time') {
       playedAny = true;
       isStarter = true; // Fallback
    } else {
       playedAny = events.some(e => e.playerId === playerId || e.subInPlayerId === playerId);
       isStarter = playedAny;
    }
  }

  if (!playedAny) return stats;

  if (isStarter) {
    if (subOutMinute > -1) {
      stats.minutesPlayed = subOutMinute;
    } else {
      stats.minutesPlayed = currentMinute;
    }
  } else if (subInMinute > -1) {
    if (subOutMinute > -1 && subOutMinute > subInMinute) {
      stats.minutesPlayed = subOutMinute - subInMinute;
    } else {
      stats.minutesPlayed = currentMinute - subInMinute;
    }
  } else if (playedAny && !lineup) {
    // Fallback if we assume they played but no sub events
    stats.minutesPlayed = currentMinute;
  }

  // Bonus points
  const p1 = match.fantasyBonus1stPlayerId || match.bonusPointsAllocations?.firstPlacePlayerId;
  const p2 = match.fantasyBonus2ndPlayerId || match.bonusPointsAllocations?.secondPlacePlayerId;
  const p3 = match.fantasyBonus3rdPlayerId || match.bonusPointsAllocations?.thirdPlacePlayerId;

  if (p1 === playerId) stats.bonusPoints += 3;
  if (p2 === playerId) stats.bonusPoints += 2;
  if (p3 === playerId) stats.bonusPoints += 1;

  // Clean sheet logic
  const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
  
  // Clean sheet awarded if player played at least 60 mins and opponent didn't score while they were on pitch.
  // Approximation: if opponentScore == 0 and they played 60 mins.
  if (opponentScore === 0 && stats.minutesPlayed >= 60) {
    stats.cleanSheet = true;
  }

  // Calculate points using central calculation utility
  let points = calculateFantasyPoints(player, {
    minutesPlayed: stats.minutesPlayed,
    goals: stats.goals,
    assists: stats.assists,
    cleanSheets: stats.cleanSheet ? 1 : 0,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards,
    goalsConceded: opponentScore,
    bonusPoints: stats.bonusPoints,
    ownGoals: stats.ownGoals
  });

  let multiplier = 1;
  if (isCaptain) {
    multiplier = activeChip === 'TC' ? 3 : 2;
  }

  stats.totalPoints = points * multiplier;

  // If bench boost is NOT active, and player is on bench, they get 0 points in the final tally (handled outside)
  
  return stats;
}
