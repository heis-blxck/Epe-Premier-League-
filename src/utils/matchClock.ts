import { useState, useEffect } from 'react';
import { Match, MatchPeriod } from '../types';

export interface MatchClockResult {
  displayString: string;       // e.g. "38:14" or "40:00 (+3')" or "HT (40')" or "80:00 (+4')"
  overflowText: string;        // e.g. "+1:12"
  stoppageBadge: string;       // e.g. "+3'"
  badgeColor: string;          // Tailwind color classes
  isLive: boolean;
  isExtraTime: boolean;
  stoppageText?: string;
  calculatedMinute: number;    // Calculated current minute (0-120)
}

export function parseTimestampMillis(val: any): number | null {
  if (!val) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof val === 'object') {
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
  }
  return null;
}

export function getMatchKickoffTimestamp(match: Match): number {
  if (match.kickoffTime) {
    const parsed = parseTimestampMillis(match.kickoffTime);
    if (parsed !== null && !isNaN(parsed)) return parsed;
  }
  if (match.date) {
    if (match.date.includes('T')) {
      const parsed = Date.parse(match.date);
      if (!isNaN(parsed)) return parsed;
    }
    const dateStr = match.date.split('T')[0];
    const timeStr = match.time ? match.time : '00:00';
    const parsed = Date.parse(`${dateStr}T${timeStr}:00`);
    if (!isNaN(parsed)) return parsed;
    const parsedJustDate = Date.parse(dateStr);
    if (!isNaN(parsedJustDate)) return parsedJustDate;
  }
  return 0;
}

export function calculateMatchClock(match: Match | null | undefined, nowMillis: number = Date.now()): MatchClockResult {
  if (!match) {
    return {
      displayString: 'Pre-Match',
      overflowText: '',
      stoppageBadge: '',
      badgeColor: 'bg-slate-800 text-slate-300',
      isLive: false,
      isExtraTime: false,
      calculatedMinute: 0
    };
  }

  const period = match.period || 'Pre-Match';
  const status = match.status;
  const stoppage1st = match.firstHalfStoppage ?? match.stoppageTime1stHalf ?? 0;
  const stoppage2nd = match.secondHalfStoppage ?? match.stoppageTime2ndHalf ?? 0;

  if (status === 'Full-Time' || period === 'Full-Time') {
    return {
      displayString: 'FT (80\')',
      overflowText: '',
      stoppageBadge: stoppage2nd > 0 ? `+${stoppage2nd}'` : '',
      badgeColor: 'bg-slate-800 text-amber-300 font-bold',
      isLive: false,
      isExtraTime: false,
      calculatedMinute: 80 + stoppage2nd
    };
  }

  if (status === 'Half-Time' || period === 'Half-Time') {
    return {
      displayString: 'HT (40\')',
      overflowText: '',
      stoppageBadge: stoppage1st > 0 ? `+${stoppage1st}'` : '',
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
      isLive: false,
      isExtraTime: false,
      calculatedMinute: 40
    };
  }

  if (status === 'Penalties' || (period as any) === 'Penalties') {
    return {
      displayString: 'PK (Penalties)',
      overflowText: '',
      stoppageBadge: '',
      badgeColor: 'bg-purple-600 text-white font-black',
      isLive: false,
      isExtraTime: false,
      calculatedMinute: 80
    };
  }

  const statusStr = (status || '') as string;

  if (period === '1st Half' || statusStr === 'FIRST_HALF' || (statusStr === 'Live' && period !== '2nd Half')) {
    const startTime = parseTimestampMillis(match.firstHalfStartTime);
    let elapsedSecs = 0;
    if (startTime) {
      elapsedSecs = Math.max(0, Math.floor((nowMillis - startTime) / 1000));
    } else {
      elapsedSecs = (match.matchMinute || 0) * 60;
    }

    // 40-Minute Threshold Logic (1st Half)
    if (elapsedSecs <= 2400) { // <= 40:00
      const mins = Math.floor(elapsedSecs / 60);
      const secs = elapsedSecs % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      return {
        displayString: formatted,
        overflowText: '',
        stoppageBadge: stoppage1st > 0 ? `+${stoppage1st}'` : '',
        badgeColor: 'bg-emerald-600 text-white font-black animate-pulse',
        isLive: true,
        isExtraTime: false,
        calculatedMinute: mins
      };
    } else { // > 40:00
      const overflowSecs = elapsedSecs - 2400;
      const overMins = Math.floor(overflowSecs / 60);
      const overSecs = overflowSecs % 60;
      const overflowFormatted = `+${overMins}:${overSecs.toString().padStart(2, '0')}`;
      const stoppageText = stoppage1st > 0 ? `+${stoppage1st}' Added Time` : 'Extra Time';

      return {
        displayString: stoppage1st > 0 ? `40:00 (+${stoppage1st}')` : `40:00`,
        overflowText: overflowFormatted,
        stoppageBadge: `+${stoppage1st || overMins}'`,
        badgeColor: 'bg-rose-600 text-white font-black animate-pulse',
        isLive: true,
        isExtraTime: true,
        stoppageText,
        calculatedMinute: 40 + overMins
      };
    }
  }

  if (period === '2nd Half' || statusStr === 'SECOND_HALF') {
    const startTime = parseTimestampMillis(match.secondHalfStartTime);
    let elapsedSecs = 0;
    if (startTime) {
      elapsedSecs = Math.max(0, Math.floor((nowMillis - startTime) / 1000));
    } else {
      elapsedSecs = Math.max(0, (match.matchMinute || 40) - 40) * 60;
    }

    // 40-Minute Threshold Logic (2nd Half)
    if (elapsedSecs <= 2400) { // <= 40:00 elapsed in 2nd half (40:00 - 80:00 total)
      const totalSecs = 2400 + elapsedSecs;
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      return {
        displayString: formatted,
        overflowText: '',
        stoppageBadge: stoppage2nd > 0 ? `+${stoppage2nd}'` : '',
        badgeColor: 'bg-emerald-600 text-white font-black animate-pulse',
        isLive: true,
        isExtraTime: false,
        calculatedMinute: mins
      };
    } else { // > 40:00 elapsed in 2nd half (> 80:00 total)
      const overflowSecs = elapsedSecs - 2400;
      const overMins = Math.floor(overflowSecs / 60);
      const overSecs = overflowSecs % 60;
      const overflowFormatted = `+${overMins}:${overSecs.toString().padStart(2, '0')}`;
      const stoppageText = stoppage2nd > 0 ? `+${stoppage2nd}' Added Time` : 'Extra Time';

      return {
        displayString: stoppage2nd > 0 ? `80:00 (+${stoppage2nd}')` : `80:00`,
        overflowText: overflowFormatted,
        stoppageBadge: `+${stoppage2nd || overMins}'`,
        badgeColor: 'bg-rose-600 text-white font-black animate-pulse',
        isLive: true,
        isExtraTime: true,
        stoppageText,
        calculatedMinute: 80 + overMins
      };
    }
  }

  return {
    displayString: match.time ? `${match.time} WAT` : 'Pre-Match',
    overflowText: '',
    stoppageBadge: '',
    badgeColor: 'bg-slate-800 text-slate-300',
    isLive: false,
    isExtraTime: false,
    calculatedMinute: 0
  };
}

export function useMatchClock(match: Match | null | undefined): MatchClockResult {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const statusStr = (match?.status || '') as string;
    const isLive = match && (
      statusStr === 'Live' ||
      statusStr === 'FIRST_HALF' ||
      statusStr === 'SECOND_HALF' ||
      match.period === '1st Half' ||
      match.period === '2nd Half'
    );
    if (!isLive) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [
    match?.id,
    match?.status,
    match?.period,
    match?.firstHalfStartTime,
    match?.secondHalfStartTime
  ]);

  return calculateMatchClock(match, now);
}

// Backwards-compatible export for existing callers
export function formatMatchDisplayTime(
  minute: number = 0,
  period: MatchPeriod = 'Pre-Match',
  stoppage1st: number = 0,
  stoppage2nd: number = 0,
  firstHalfStartTime?: string | number | null,
  secondHalfStartTime?: string | number | null
) {
  const dummyMatch: Match = {
    id: 'dummy',
    homeTeamId: '',
    awayTeamId: '',
    homeScore: 0,
    awayScore: 0,
    status: (period === '1st Half' || period === '2nd Half') ? 'Live' : (period as any),
    period,
    matchMinute: minute,
    stoppageTime1stHalf: stoppage1st,
    stoppageTime2ndHalf: stoppage2nd,
    firstHalfStoppage: stoppage1st,
    secondHalfStoppage: stoppage2nd,
    firstHalfStartTime,
    secondHalfStartTime,
    date: '',
    time: '',
    venue: '',
    matchday: 1
  };

  return calculateMatchClock(dummyMatch, Date.now());
}
