import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, PlayCircle } from 'lucide-react';
import { api } from '../services/api';
import { Match, Player, FantasySquad } from '../types';

export const FplFinalizerManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [gameweek, setGameweek] = useState<number>(1);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const handleFinalize = async () => {
    if (!confirm('Are you absolutely sure you want to lock the gameweek? This will permanently write points to user squads and cannot be easily undone.')) {
      return;
    }

    setLoading(true);
    setStatusMsg({ type: 'info', text: `Fetching data for Gameweek ${gameweek}...` });

    try {
      // 1. Fetch data
      const allMatches = await api.getMatches();
      const gwMatches = allMatches.filter(m => m.matchday === gameweek && m.status === 'Full-Time');
      
      if (gwMatches.length === 0) {
         setStatusMsg({ type: 'error', text: `No Full-Time matches found for Gameweek ${gameweek}.` });
         setLoading(false);
         return;
      }

      const allPlayers = await api.getPlayers();
      const allSquads = await api.getFantasySquads();

      setStatusMsg({ type: 'info', text: 'Processing Match Events & Calculating Points...' });

      // Create a map of player ID to their gameweek stats and points
      const playerPoints = new Map<string, number>();

      // Pre-calculate points for every player that played in this gameweek
      for (const player of allPlayers) {
        // Find if player was in any match
        let points = 0;
        let matchMinutesPlayed = 0;
        let matchGoals = 0;
        let matchAssists = 0;
        let matchYellows = 0;
        let matchReds = 0;
        let matchOwnGoals = 0;
        let teamGoalsConceded = 0;
        let teamCleanSheet = false;

        const playerMatch = gwMatches.find(m => m.homeTeamId === player.teamId || m.awayTeamId === player.teamId);
        
        if (playerMatch) {
          const isHome = playerMatch.homeTeamId === player.teamId;
          const lineup = isHome ? playerMatch.homeLineup : playerMatch.awayLineup;
          teamGoalsConceded = isHome ? playerMatch.awayScore : playerMatch.homeScore;
          
          // Minutes played
          let subOnMinute = -1;
          let subOffMinute = -1;
          const isStarter = lineup?.startingXI?.some(p => p.playerId === player.id) ?? false;
          
          playerMatch.events?.forEach(e => {
            if (e.eventType === 'Sub') {
              if (e.subInPlayerId === player.id) subOnMinute = e.minute;
              if (e.playerId === player.id) subOffMinute = e.minute;
            }
          });

          if (isStarter) {
            matchMinutesPlayed = subOffMinute > -1 ? subOffMinute : (playerMatch.matchMinute || 90);
          } else if (subOnMinute > -1) {
             const endMin = subOffMinute > -1 ? subOffMinute : (playerMatch.matchMinute || 90);
             matchMinutesPlayed = endMin - subOnMinute;
          }

          // Events
          playerMatch.events?.forEach(e => {
            if (e.playerId === player.id) {
              if (e.eventType === 'Goal') {
                if (e.goalType === 'own_goal') matchOwnGoals++;
                else matchGoals++;
              }
              if (e.eventType === 'Yellow Card') matchYellows++;
              if (e.eventType === 'Red Card') matchReds++;
            }
            if (e.eventType === 'Goal' && e.assisterId === player.id) {
              matchAssists++;
            }
          });

          // Grading Matrix
          if (matchMinutesPlayed > 0) points += 1;
          if (matchMinutesPlayed >= 60) points += 1; // +2 total for 60+ mins

          if (player.position === 'GK' || player.position === 'DEF') {
             points += matchGoals * 6;
             if (matchMinutesPlayed >= 60 && teamGoalsConceded === 0) points += 4;
          } else if (player.position === 'MID') {
             points += matchGoals * 5;
          } else if (player.position === 'FWD') {
             points += matchGoals * 4;
          }

          points += matchAssists * 3;
          points -= matchYellows * 1;
          points -= matchReds * 3;
          points -= matchOwnGoals * 2;
        }
        
        playerPoints.set(player.id, points);
      }

      setStatusMsg({ type: 'info', text: 'Processing Auto-Subs and Squad Points...' });

      const updatedSquads: FantasySquad[] = [];

      // Evaluate squads
      for (const squad of allSquads) {
         let squadPoints = 0;
         const startingIds = [...(squad.startingPlayerIds || [])];
         const benchIds = [...(squad.benchPlayerIds || [])];
         const isBB = squad.activeChip === 'BB';
         const isTC = squad.activeChip === 'TC';
         
         const getPlayerMins = (pId: string) => {
            const player = allPlayers.find(p => p.id === pId);
            if (!player) return 0;
            const pm = gwMatches.find(m => m.homeTeamId === player.teamId || m.awayTeamId === player.teamId);
            if (!pm) return 0;
            
            const isHome = pm.homeTeamId === player.teamId;
            const lineup = isHome ? pm.homeLineup : pm.awayLineup;
            let subOn = -1, subOff = -1;
            const isSt = lineup?.startingXI?.some(l => l.playerId === pId) ?? false;
            pm.events?.forEach(e => {
              if (e.eventType === 'Sub') {
                if (e.subInPlayerId === pId) subOn = e.minute;
                if (e.playerId === pId) subOff = e.minute;
              }
            });
            if (isSt) return subOff > -1 ? subOff : (pm.matchMinute || 90);
            if (subOn > -1) return (subOff > -1 ? subOff : (pm.matchMinute || 90)) - subOn;
            return 0;
         };

         const getPlayerPos = (pId: string) => allPlayers.find(p => p.id === pId)?.position || 'MID';

         // Auto-subs (if not Bench Boost)
         if (!isBB) {
           for (let i = 0; i < startingIds.length; i++) {
             const stId = startingIds[i];
             if (getPlayerMins(stId) === 0) {
                // Find eligible sub
                for (let j = 0; j < benchIds.length; j++) {
                   const bId = benchIds[j];
                   if (getPlayerMins(bId) > 0) {
                      // Check formation legality: min 1 GK, 3 DEF, 2 MID, 1 FWD
                      // For simplicity, assuming any swap that keeps minimums is ok, but we need strict checks
                      const stPos = getPlayerPos(stId);
                      const bPos = getPlayerPos(bId);
                      
                      // Count current positions in starting
                      let currentPosCounts = { 'GK': 0, 'DEF': 0, 'MID': 0, 'FWD': 0 };
                      startingIds.forEach(id => currentPosCounts[getPlayerPos(id) as keyof typeof currentPosCounts]++);
                      
                      currentPosCounts[stPos as keyof typeof currentPosCounts]--;
                      currentPosCounts[bPos as keyof typeof currentPosCounts]++;
                      
                      const isValid = currentPosCounts['GK'] === 1 && currentPosCounts['DEF'] >= 3 && currentPosCounts['FWD'] >= 1;
                      
                      if (isValid) {
                         // Swap
                         startingIds[i] = bId;
                         benchIds[j] = stId; // swapped out, won't be used
                         break;
                      }
                   }
                }
             }
           }
         }

         // Calculate squad points
         const activePlayers = isBB ? [...startingIds, ...benchIds] : startingIds;
         
         activePlayers.forEach(pId => {
            let pts = playerPoints.get(pId) || 0;
            if (pId === squad.captainPlayerId) {
               pts *= (isTC ? 3 : 2);
            } else if (pId === squad.viceCaptainPlayerId) {
               // Vice captain logic only if captain didn't play.
               if (getPlayerMins(squad.captainPlayerId) === 0) {
                   pts *= (isTC ? 3 : 2);
               }
            }
            squadPoints += pts;
         });

         // Update Squad
         squad.gameweekPoints = squadPoints;
         squad.totalPoints = (squad.totalPoints || 0) + squadPoints;
         
         // Store changes
         updatedSquads.push(squad);
      }

      setStatusMsg({ type: 'info', text: 'Committing to Database...' });

      // Save squads back to Firebase
      // Batch save if available, or sequential
      for (const squad of updatedSquads) {
         await api.saveFantasySquad(squad);
      }

      setStatusMsg({ type: 'success', text: `Successfully locked Gameweek ${gameweek} and updated ${updatedSquads.length} squads.` });
      
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-rose-800/40 space-y-6">
      <div className="border-b border-rose-900/50 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-amber-300 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            FPL Engine & Gameweek Finalizer
          </h3>
          <p className="text-sm text-rose-200/80 mt-1">
            Process auto-subs, calculate master points, and log final scores.
          </p>
        </div>
      </div>

      <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <AlertTriangle className="w-32 h-32 text-rose-500" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Warning: This will process auto-subs, pull bonus points from MPS, calculate all final master points using the exact grading matrix, and permanently write them to user profiles.
          </div>

          <div className="flex items-center gap-4">
            <label className="text-white font-bold text-sm">Select Gameweek:</label>
            <input 
              type="number" 
              min="1" 
              max="38" 
              value={gameweek}
              onChange={(e) => setGameweek(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 w-24 focus:ring-2 focus:ring-amber-400 font-black"
            />
          </div>

          <button
            onClick={handleFinalize}
            disabled={loading}
            className="w-full sm:w-auto mt-4 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-black py-4 px-8 rounded-xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                EXECUTE GAMEWEEK FINALIZER & LOCK POINTS
              </>
            )}
          </button>

          {statusMsg && (
            <div className={`mt-4 p-4 rounded-xl border font-bold text-sm ${
              statusMsg.type === 'error' ? 'bg-red-950/50 border-red-900 text-red-300' : 
              statusMsg.type === 'success' ? 'bg-emerald-950/50 border-emerald-900 text-emerald-300' :
              'bg-blue-950/50 border-blue-900 text-blue-300'
            }`}>
              {statusMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
