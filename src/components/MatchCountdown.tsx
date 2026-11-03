import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { Clock, AlertTriangle } from 'lucide-react';

export function getMatchKickoffTimestamp(match: Match): number {
  if (match.kickoffTime) {
    if (typeof match.kickoffTime === 'number') return match.kickoffTime;
    if (typeof match.kickoffTime === 'string') {
      const parsed = Date.parse(match.kickoffTime);
      if (!isNaN(parsed)) return parsed;
    }
    if (typeof (match.kickoffTime as any)?.toMillis === 'function') {
      return (match.kickoffTime as any).toMillis();
    }
    if (typeof (match.kickoffTime as any)?.seconds === 'number') {
      return (match.kickoffTime as any).seconds * 1000;
    }
  }

  if (match.date) {
    const timeStr = match.time || '16:00';
    const cleanTime = timeStr.replace(/[^0-9:]/g, '').trim() || '16:00';
    const parts = cleanTime.split(':');
    const hh = parts[0] ? parts[0].padStart(2, '0') : '16';
    const mm = parts[1] ? parts[1].padStart(2, '0') : '00';
    const isoString = `${match.date}T${hh}:${mm}:00`;
    const parsed = Date.parse(isoString);
    if (!isNaN(parsed)) return parsed;
  }

  return 0;
}

function formatStaticDateTime(match: Match, kickoffMs: number): string {
  if (kickoffMs > 0) {
    const d = new Date(kickoffMs);
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${monthStr} ${day} • ${hours}:${minutes} ${ampm}`;
  }
  return `${match.date || ''} ${match.time ? `• ${match.time}` : ''}`.trim();
}

function formatCountdownTime(diffMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hh}h ${mm}m ${ss}s`;
  }
  return `${mm}m ${ss}s`;
}

interface MatchCountdownProps {
  match: Match;
  className?: string;
}

export const MatchCountdown: React.FC<MatchCountdownProps> = ({ match, className = '' }) => {
  const kickoffMs = getMatchKickoffTimestamp(match);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    // Zero-cost local client-side interval (runs every 1s, cleanup on unmount)
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // State B: Manual Delay override flag
  if (match.isDelayed) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-black bg-[#FF5500] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] uppercase tracking-wider animate-neo-live ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-black stroke-[3]" />
        <span>DELAYED • STAY TUNED</span>
      </span>
    );
  }

  const kickoffDate = new Date(kickoffMs);
  const nowDate = new Date(now);

  const isSameDay =
    kickoffMs > 0 &&
    kickoffDate.getFullYear() === nowDate.getFullYear() &&
    kickoffDate.getMonth() === nowDate.getMonth() &&
    kickoffDate.getDate() === nowDate.getDate();

  const diffMs = kickoffMs - now;

  const isUpcomingStatus =
    !match.status ||
    match.status === 'Scheduled' ||
    (match.status as string) === 'UPCOMING' ||
    match.period === 'Pre-Match';

  // State A: Future Match (Not Today)
  if (!isSameDay || kickoffMs === 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 bg-white text-black font-bold text-[11px] border border-black shadow-[2px_2px_0px_0px_#000] font-mono uppercase ${className}`}>
        <Clock className="w-3 h-3 text-black stroke-[2.5]" />
        <span>{formatStaticDateTime(match, kickoffMs)}</span>
      </span>
    );
  }

  // State C: Match Day Countdown (Kickoff is today and time remaining > 0)
  if (diffMs > 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-black bg-[#FF5500] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] font-mono tracking-tight uppercase ${className}`}>
        <Clock className="w-3 h-3 text-black stroke-[3] animate-spin" />
        <span>STARTS: {formatCountdownTime(diffMs)}</span>
      </span>
    );
  }

  // State D: The Grace Period (0 <= time past kickoff <= 60s)
  if (diffMs <= 0 && diffMs >= -60000) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-black bg-[#FF5500] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] uppercase tracking-wider animate-neo-live ${className}`}>
        <Clock className="w-3.5 h-3.5 text-black stroke-[3]" />
        <span>KICKOFF IMMINENT</span>
      </span>
    );
  }

  // State E: Auto-Delay Trigger (> 60s past kickoff and match status is still UPCOMING/Scheduled)
  if (diffMs < -60000 && isUpcomingStatus) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-black bg-[#FF5500] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] uppercase tracking-wider animate-neo-live ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-black stroke-[3]" />
        <span>KICKOFF DELAYED</span>
      </span>
    );
  }

  // Fallback for live or finished match
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-white text-black font-bold text-[11px] border border-black shadow-[1px_1px_0px_0px_#000] font-mono ${className}`}>
      <Clock className="w-3 h-3 text-black stroke-[2]" />
      <span>{match.time ? `${match.time} WAT` : 'SCHEDULED'}</span>
    </span>
  );
};
