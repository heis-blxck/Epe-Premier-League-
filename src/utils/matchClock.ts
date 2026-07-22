import { MatchPeriod } from '../types';

export function formatMatchDisplayTime(
  minute: number = 0,
  period: MatchPeriod = 'Pre-Match',
  stoppage1st: number = 0,
  stoppage2nd: number = 0
): {
  displayString: string;
  badgeColor: string;
  isExtraTime: boolean;
  stoppageText?: string;
} {
  if (period === 'Pre-Match') {
    return {
      displayString: 'Pre-Match',
      badgeColor: 'bg-slate-800 text-slate-300',
      isExtraTime: false
    };
  }

  if (period === 'Half-Time') {
    return {
      displayString: 'HT (45\')',
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
      isExtraTime: false
    };
  }

  if (period === 'Full-Time') {
    return {
      displayString: 'FT (90\')',
      badgeColor: 'bg-slate-800 text-amber-300 font-bold',
      isExtraTime: false
    };
  }

  if (period === '1st Half') {
    if (minute <= 45) {
      return {
        displayString: `${minute}'`,
        badgeColor: 'bg-emerald-600 text-white font-black animate-pulse',
        isExtraTime: false
      };
    } else {
      const extraMins = minute - 45;
      return {
        displayString: `45+${extraMins}'`,
        badgeColor: 'bg-rose-600 text-white font-black animate-pulse',
        isExtraTime: true,
        stoppageText: `+${stoppage1st || extraMins}m Added Time`
      };
    }
  }

  if (period === '2nd Half') {
    if (minute <= 90) {
      return {
        displayString: `${minute}'`,
        badgeColor: 'bg-emerald-600 text-white font-black animate-pulse',
        isExtraTime: false
      };
    } else {
      const extraMins = minute - 90;
      return {
        displayString: `90+${extraMins}'`,
        badgeColor: 'bg-rose-600 text-white font-black animate-pulse',
        isExtraTime: true,
        stoppageText: `+${stoppage2nd || extraMins}m Added Time`
      };
    }
  }

  return {
    displayString: `${minute}'`,
    badgeColor: 'bg-emerald-600 text-white',
    isExtraTime: false
  };
}
