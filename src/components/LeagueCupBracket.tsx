import React from 'react';
import { Match, Team, AdminUser } from '../types';
import { Trophy, Shield, ChevronRight, Zap, Flame, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface LeagueCupBracketProps {
  standings: Team[];
  matches: Match[];
  onSelectMatch?: (match: Match) => void;
  currentAdmin?: AdminUser | null;
  onScheduleCupMatch?: (matchData: Partial<Match>) => void;
}

export const LeagueCupBracket: React.FC<LeagueCupBracketProps> = ({
  standings = [],
  matches = [],
  onSelectMatch,
  currentAdmin,
  onScheduleCupMatch
}) => {
  // Top 6 teams from Premier League Standings
  const top6Teams = (standings || []).slice(0, 6);

  const team1 = top6Teams[0]; // 1st Place (Bye to Semi 1)
  const team2 = top6Teams[1]; // 2nd Place (Bye to Semi 2)
  const team3 = top6Teams[2]; // 3rd Place (Match A)
  const team4 = top6Teams[3]; // 4th Place (Match B)
  const team5 = top6Teams[4]; // 5th Place (Match A)
  const team6 = top6Teams[5]; // 6th Place (Match B)

  // Filter League Cup matches from matches list
  const cupMatches = (matches || []).filter(m => m.competition_type === 'Cup');

  const matchA = cupMatches.find(m => m.cupMatchCode === 'Match A') || cupMatches.find(m => 
    (m.homeTeamId === team3?.id && m.awayTeamId === team5?.id) || (m.homeTeamId === team5?.id && m.awayTeamId === team3?.id)
  );

  const matchB = cupMatches.find(m => m.cupMatchCode === 'Match B') || cupMatches.find(m => 
    (m.homeTeamId === team4?.id && m.awayTeamId === team6?.id) || (m.homeTeamId === team6?.id && m.awayTeamId === team4?.id)
  );

  // Helper to determine winner of a match
  const getWinner = (match?: Match): Team | undefined => {
    if (!match || (match.status !== 'Full-Time' && match.status !== 'Penalties')) return undefined;
    if (match.homeScore > match.awayScore) return match.homeTeam;
    if (match.awayScore > match.homeScore) return match.awayTeam;
    if (typeof match.homePenalties === 'number' && typeof match.awayPenalties === 'number') {
      if (match.homePenalties > match.awayPenalties) return match.homeTeam;
      if (match.awayPenalties > match.homePenalties) return match.awayTeam;
    }
    return undefined;
  };

  const winnerA = getWinner(matchA);
  const winnerB = getWinner(matchB);

  const semi1 = cupMatches.find(m => m.cupMatchCode === 'Semi 1') || cupMatches.find(m => m.cupRound === 'Semi-Finals' && (m.homeTeamId === team1?.id || m.awayTeamId === team1?.id));
  const semi2 = cupMatches.find(m => m.cupMatchCode === 'Semi 2') || cupMatches.find(m => m.cupRound === 'Semi-Finals' && (m.homeTeamId === team2?.id || m.awayTeamId === team2?.id));

  const winnerSemi1 = getWinner(semi1);
  const winnerSemi2 = getWinner(semi2);

  const finalMatch = cupMatches.find(m => m.cupRound === 'Final') || cupMatches.find(m => m.cupMatchCode === 'Final');
  const championTeam = getWinner(finalMatch);

  // Helper match box renderer
  const renderBracketMatchBox = (
    title: string,
    matchCode: 'Match A' | 'Match B' | 'Semi 1' | 'Semi 2' | 'Final',
    defaultHome?: Team,
    defaultAway?: Team,
    homeSeed?: string,
    awaySeed?: string,
    existingMatch?: Match
  ) => {
    const home = existingMatch?.homeTeam || defaultHome;
    const away = existingMatch?.awayTeam || defaultAway;
    const isPlayed = existingMatch?.status === 'Full-Time' || existingMatch?.status === 'Penalties';

    return (
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 relative group hover:border-amber-400/50 transition-all shadow-xl">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
          <span className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-3 h-3" /> {title}
          </span>
          {existingMatch ? (
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
              existingMatch.status === 'Live' ? 'bg-red-600 text-white animate-pulse' :
              isPlayed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {existingMatch.status}
            </span>
          ) : (
            <span className="text-slate-500 font-mono">TBD</span>
          )}
        </div>

        {/* HOME TEAM */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {homeSeed && (
              <span className="text-[9px] font-black uppercase bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                {homeSeed}
              </span>
            )}
            <TeamLogo team={home} className="w-6 h-6" />
            <span className="font-extrabold text-xs text-white truncate">{home?.name || 'TBD'}</span>
          </div>

          <div className="text-right font-mono font-black text-sm">
            {existingMatch ? (
              <span className="text-amber-400">{existingMatch.homeScore}</span>
            ) : (
              <span className="text-slate-600">-</span>
            )}
            {existingMatch?.status === 'Penalties' && typeof existingMatch.homePenalties === 'number' && (
              <span className="text-[10px] text-amber-300 ml-1">({existingMatch.homePenalties} PK)</span>
            )}
          </div>
        </div>

        {/* AWAY TEAM */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {awaySeed && (
              <span className="text-[9px] font-black uppercase bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                {awaySeed}
              </span>
            )}
            <TeamLogo team={away} className="w-6 h-6" />
            <span className="font-extrabold text-xs text-white truncate">{away?.name || 'TBD'}</span>
          </div>

          <div className="text-right font-mono font-black text-sm">
            {existingMatch ? (
              <span className="text-amber-400">{existingMatch.awayScore}</span>
            ) : (
              <span className="text-slate-600">-</span>
            )}
            {existingMatch?.status === 'Penalties' && typeof existingMatch.awayPenalties === 'number' && (
              <span className="text-[10px] text-amber-300 ml-1">({existingMatch.awayPenalties} PK)</span>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          {existingMatch ? (
            <button
              onClick={() => onSelectMatch && onSelectMatch(existingMatch)}
              className="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Match Details</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : onScheduleCupMatch && home && away && currentAdmin?.role === 'super_admin' ? (
            <button
              onClick={() => onScheduleCupMatch({
                homeTeamId: home.id,
                awayTeamId: away.id,
                competition_type: 'Cup',
                cupMatchCode: matchCode,
                cupRound: matchCode.includes('Match') ? 'Knockout Round 1' : matchCode.includes('Semi') ? 'Semi-Finals' : 'Final',
                status: 'Scheduled',
                venue: home.stadium || 'Epe Arena',
                date: new Date().toISOString().split('T')[0],
                time: '18:00'
              })}
              className="text-[10px] font-black text-amber-400 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              + Auto-Schedule Cup Match
            </button>
          ) : (
            <span className="text-[10px] font-medium text-slate-500">Awaiting Winners</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* BANNER HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#800020] via-[#881337] to-slate-950 p-6 text-white shadow-2xl border border-[#881337]/40">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>League Cup Playoff Bracket (6-Team Format)</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Official Knockout Tournament Tree
            </h2>
            <p className="text-xs text-slate-300 max-w-xl font-medium">
              Seeds 1st & 2nd receive automatic Byes to Semi-Finals. Seeds 3rd–6th battle in Knockout Round 1. Single match straight to Penalty Shootout if tied.
            </p>
          </div>

          {championTeam && (
            <div className="bg-amber-400 text-slate-950 p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <Award className="w-8 h-8 text-slate-950" />
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-900">League Cup Champion</div>
                <div className="text-base font-black">{championTeam.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VISUAL BRACKET GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center relative">
        {/* COLUMN 1: KNOCKOUT ROUND 1 */}
        <div className="space-y-6">
          <div className="text-center font-black text-xs uppercase tracking-widest text-amber-400 bg-slate-950 py-2 rounded-xl border border-slate-800">
            Round 1 (Knockouts)
          </div>

          <div className="space-y-6">
            {renderBracketMatchBox('Match A', 'Match A', team3, team5, '#3 Seed', '#5 Seed', matchA)}
            {renderBracketMatchBox('Match B', 'Match B', team4, team6, '#4 Seed', '#6 Seed', matchB)}
          </div>
        </div>

        {/* COLUMN 2: SEMI-FINALS (1st & 2nd Place Byes) */}
        <div className="space-y-6">
          <div className="text-center font-black text-xs uppercase tracking-widest text-amber-400 bg-slate-950 py-2 rounded-xl border border-slate-800">
            Semi-Finals (1st & 2nd Byes)
          </div>

          <div className="space-y-6">
            {renderBracketMatchBox('Semi-Final 1', 'Semi 1', team1, winnerA, '#1 Seed (Bye)', winnerA ? 'Winner A' : 'Winner A', semi1)}
            {renderBracketMatchBox('Semi-Final 2', 'Semi 2', team2, winnerB, '#2 Seed (Bye)', winnerB ? 'Winner B' : 'Winner B', semi2)}
          </div>
        </div>

        {/* COLUMN 3: FINAL CHAMPIONSHIP */}
        <div className="space-y-6">
          <div className="text-center font-black text-xs uppercase tracking-widest text-amber-400 bg-slate-950 py-2 rounded-xl border border-slate-800 flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>The Grand Final</span>
          </div>

          {renderBracketMatchBox(
            'Cup Championship Final',
            'Final',
            winnerSemi1,
            winnerSemi2,
            winnerSemi1 ? 'Semi 1 Winner' : 'Semi 1',
            winnerSemi2 ? 'Semi 2 Winner' : 'Semi 2',
            finalMatch
          )}
        </div>
      </div>
    </div>
  );
};
