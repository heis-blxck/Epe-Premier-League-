import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Match, Team, Player, MatchLineup, LineupPlayer, TacticalPositionTag } from '../types';
import { api } from '../services/api';
import { Save, AlertTriangle, User, UserCheck, Shield, X, RotateCcw } from 'lucide-react';

const TACTICAL_POSITIONS: TacticalPositionTag[] = [
  'GK', 'LB', 'CB', 'RB', 'DM', 'CM', 'LM', 'RM', 'CAM', 'LW', 'RW', 'ST'
];

const getInitialTacticalPosition = (p: Player): TacticalPositionTag => {
  const pos = (p.position || '').toUpperCase();
  if (pos === 'GK') return 'GK';
  if (pos === 'DEF' || pos === 'DEFENDER') return 'CB';
  if (pos === 'MID' || pos === 'MIDFIELDER') return 'CM';
  if (pos === 'FWD' || pos === 'FORWARD' || pos === 'ATT') return 'ST';
  if (TACTICAL_POSITIONS.includes(pos as TacticalPositionTag)) {
    return pos as TacticalPositionTag;
  }
  return 'CM';
};

interface LineupBuilderProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  onSuccess: () => void;
  onShowToast: (msg: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const LineupBuilder: React.FC<LineupBuilderProps> = ({
  matches,
  teams,
  players,
  onSuccess,
  onShowToast,
  isOpen,
  onClose
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [selectedSide, setSelectedSide] = useState<'home' | 'away'>('home');
  const [formation, setFormation] = useState<string>('4-3-3');
  
  const [starterIds, setStarterIds] = useState<Set<string>>(new Set());
  const [subIds, setSubIds] = useState<Set<string>>(new Set());
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [starterPositions, setStarterPositions] = useState<Record<string, TacticalPositionTag>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track match+side initialization key to prevent unwanted resets on parent re-renders
  const lastInitializedKeyRef = useRef<string>('');

  const selectedMatch = useMemo(() => {
    return matches.find(m => m.id === selectedMatchId);
  }, [matches, selectedMatchId]);

  const targetTeamId = selectedMatch ? (selectedSide === 'home' ? selectedMatch.homeTeamId : selectedMatch.awayTeamId) : null;
  const targetTeam = useMemo(() => {
    return teams.find(t => t.id === targetTeamId);
  }, [teams, targetTeamId]);
  
  const roster = useMemo(() => {
    if (!targetTeamId) return [];
    return players.filter(p => p.teamId === targetTeamId).sort((a, b) => a.name.localeCompare(b.name));
  }, [players, targetTeamId]);

  // When match or side changes explicitly, initialize state from existing lineup
  useEffect(() => {
    if (!selectedMatchId || !selectedMatch) return;
    const currentKey = `${selectedMatchId}_${selectedSide}`;
    if (lastInitializedKeyRef.current === currentKey) {
      // Already initialized for this match + side. Do not reset active selection on parent re-renders.
      return;
    }

    lastInitializedKeyRef.current = currentKey;
    const lineup = selectedSide === 'home' ? selectedMatch.homeLineup : selectedMatch.awayLineup;
    if (lineup) {
      setFormation(lineup.formation || '4-3-3');
      setStarterIds(new Set((lineup.startingXI || []).map(p => p.playerId)));
      setSubIds(new Set((lineup.substitutes || []).map(p => p.playerId)));
      const captain = lineup.startingXI?.find(p => p.isCaptain);
      setCaptainId(captain ? captain.playerId : null);

      const initialPositions: Record<string, TacticalPositionTag> = {};
      (lineup.startingXI || []).forEach(p => {
        initialPositions[p.playerId] = (p.position as TacticalPositionTag) || 'CM';
      });
      setStarterPositions(initialPositions);
    } else {
      setFormation('4-3-3');
      setStarterIds(new Set());
      setSubIds(new Set());
      setCaptainId(null);
      setStarterPositions({});
    }
  }, [selectedMatchId, selectedSide, selectedMatch]);

  // Reset selections manually
  const handleResetSelections = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!selectedMatch) return;
    const lineup = selectedSide === 'home' ? selectedMatch.homeLineup : selectedMatch.awayLineup;
    if (lineup) {
      setFormation(lineup.formation || '4-3-3');
      setStarterIds(new Set((lineup.startingXI || []).map(p => p.playerId)));
      setSubIds(new Set((lineup.substitutes || []).map(p => p.playerId)));
      const captain = lineup.startingXI?.find(p => p.isCaptain);
      setCaptainId(captain ? captain.playerId : null);

      const initialPositions: Record<string, TacticalPositionTag> = {};
      (lineup.startingXI || []).forEach(p => {
        initialPositions[p.playerId] = (p.position as TacticalPositionTag) || 'CM';
      });
      setStarterPositions(initialPositions);
    } else {
      setStarterIds(new Set());
      setSubIds(new Set());
      setCaptainId(null);
      setStarterPositions({});
    }
    setError(null);
  };

  const toggleStarter = (playerId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setError(null);
    setStarterIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
        if (captainId === playerId) setCaptainId(null);
      } else {
        if (newSet.size >= 11) {
          onShowToast("Maximum 11 starters allowed.");
          return prev;
        }
        newSet.add(playerId);
        setSubIds(s => {
          const newSubs = new Set(s);
          newSubs.delete(playerId);
          return newSubs;
        });

        // Assign default tactical position if not already present
        const playerObj = roster.find(r => r.id === playerId);
        if (playerObj) {
          setStarterPositions(sp => ({
            ...sp,
            [playerId]: sp[playerId] || getInitialTacticalPosition(playerObj)
          }));
        }
      }
      return newSet;
    });
  };

  const toggleSub = (playerId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setError(null);
    setSubIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        if (newSet.size >= 9) {
          onShowToast("Maximum 9 substitutes allowed.");
          return prev;
        }
        newSet.add(playerId);
        setStarterIds(s => {
          const newStarters = new Set(s);
          newStarters.delete(playerId);
          if (captainId === playerId) setCaptainId(null);
          return newStarters;
        });
      }
      return newSet;
    });
  };

  const handleCaptainToggle = (playerId: string, isStarter: boolean, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!isStarter) return;
    setCaptainId(prev => (prev === playerId ? null : playerId));
  };

  const handleSave = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!selectedMatch || !targetTeamId) return;
    
    if (starterIds.size !== 11) {
      setError(`You must select exactly 11 starters. Currently selected: ${starterIds.size}.`);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const startingXI: LineupPlayer[] = Array.from(starterIds)
        .map(id => roster.find(r => r.id === id))
        .filter((p): p is Player => Boolean(p))
        .map(p => ({
          playerId: p.id,
          name: p.name,
          number: p.shirtNumber,
          position: starterPositions[p.id] || getInitialTacticalPosition(p),
          isCaptain: p.id === captainId
        }));

      const substitutes: LineupPlayer[] = Array.from(subIds)
        .map(id => roster.find(r => r.id === id))
        .filter((p): p is Player => Boolean(p))
        .map(p => ({
          playerId: p.id,
          name: p.name,
          number: p.shirtNumber,
          position: p.position,
          isCaptain: false
        }));

      const lineup: MatchLineup = {
        teamId: targetTeamId,
        formation,
        startingXI,
        substitutes
      };

      await api.saveLineup(selectedMatch.id, selectedSide === 'home', lineup);
      // Reset local selection states upon successful save
      setStarterIds(new Set());
      setSubIds(new Set());
      setCaptainId(null);
      lastInitializedKeyRef.current = '';

      onShowToast(`Lineup saved successfully for ${targetTeam?.name || 'team'}!`);
      onSuccess();
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving lineup:', err);
      setError(err.message || 'Failed to save lineup');
    } finally {
      setIsSaving(false);
    }
  };

  if (isOpen !== undefined && !isOpen) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100 backdrop-blur-sm">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#800020] text-amber-300 flex items-center justify-center font-black shadow-lg border border-rose-800">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-amber-300 tracking-tight">Match Lineup Builder</h3>
            <p className="text-xs text-slate-400 font-medium">Select a fixture and assign starters, subs, and formation.</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            title="Close Builder"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Match Selection */}
        <div className="md:col-span-1 space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">1. Select Fixture</label>
            <select
              value={selectedMatchId}
              onChange={(e) => {
                setSelectedMatchId(e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>-- Choose Match --</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  Matchday {m.matchday}: {m.homeTeam?.name || 'Home'} vs {m.awayTeam?.name || 'Away'}
                </option>
              ))}
            </select>
          </div>

          {selectedMatch && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">2. Select Side</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSide('home'); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedSide === 'home' ? 'bg-[#800020] text-white border-2 border-rose-700' : 'bg-slate-800 text-slate-400 border-2 border-transparent hover:bg-slate-700'
                  }`}
                >
                  Home: {selectedMatch.homeTeam?.shortName || 'Home'}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSide('away'); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedSide === 'away' ? 'bg-amber-600 text-white border-2 border-amber-500' : 'bg-slate-800 text-slate-400 border-2 border-transparent hover:bg-slate-700'
                  }`}
                >
                  Away: {selectedMatch.awayTeam?.shortName || 'Away'}
                </button>
              </div>
            </div>
          )}

          {selectedMatch && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">3. Formation</label>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                {['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}
          
          {selectedMatch && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Starters (11)</span>
                <span className={`font-bold ${starterIds.size === 11 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {starterIds.size} / 11
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Bench (Max 9)</span>
                <span className="font-bold text-cyan-400">
                  {subIds.size} / 9
                </span>
              </div>
              
              {error && (
                <div className="p-3 bg-red-950/50 border border-red-500 rounded-xl text-red-300 text-xs flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving Lineup...' : 'Save Lineup'}
                </button>

                <button
                  type="button"
                  onClick={handleResetSelections}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset / Reload Lineup
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
                    className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancel / Close
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Player Roster */}
        <div className="md:col-span-2">
          {!selectedMatch ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[300px] border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
              <User className="w-12 h-12 mb-3 opacity-20" />
              <p>Select a match to build lineup.</p>
            </div>
          ) : roster.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-amber-500 min-h-[300px] border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
              <AlertTriangle className="w-12 h-12 mb-3 opacity-50" />
              <p>No players found in roster for {targetTeam?.name}.</p>
            </div>
          ) : (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 flex flex-col h-[600px] overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                <div className="col-span-1 text-center">No.</div>
                <div className="col-span-3">Player</div>
                <div className="col-span-3 text-center">Tactical Pos</div>
                <div className="col-span-2 text-center">Starter</div>
                <div className="col-span-2 text-center">Bench</div>
                <div className="col-span-1 text-center">Capt</div>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {roster.map(p => {
                  const isStarter = starterIds.has(p.id);
                  const isSub = subIds.has(p.id);
                  const isCapt = captainId === p.id;
                  
                  return (
                    <div
                      key={p.id}
                      onClick={(e) => toggleStarter(p.id, e)}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all cursor-pointer ${
                        isStarter 
                          ? 'bg-[#800020]/20 border border-[#800020]/50' 
                          : isSub 
                            ? 'bg-cyan-900/20 border border-cyan-800/50' 
                            : 'bg-slate-900/50 border border-transparent hover:bg-slate-800'
                      }`}
                    >
                      <div className="col-span-1 text-center text-xs font-mono font-bold text-slate-400">
                        {p.shirtNumber}
                      </div>
                      <div className="col-span-3 font-bold text-sm truncate pr-2" title={p.name}>
                        {p.name}
                      </div>
                      <div className="col-span-3 flex justify-center" onClick={(e) => e.stopPropagation()}>
                        {isStarter ? (
                          <select
                            value={starterPositions[p.id] || getInitialTacticalPosition(p)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newPos = e.target.value as TacticalPositionTag;
                              setStarterPositions(prev => ({ ...prev, [p.id]: newPos }));
                            }}
                            className="bg-slate-900 text-amber-300 font-extrabold text-xs border border-amber-400/80 rounded-lg px-2 py-1 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer shadow-sm"
                          >
                            {TACTICAL_POSITIONS.map(pos => (
                              <option key={pos} value={pos}>{pos}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                            {p.position}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => toggleStarter(p.id, e)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                            isStarter ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          {isStarter && <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => toggleSub(p.id, e)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                            isSub ? 'bg-cyan-500 text-white shadow-md' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                        >
                          {isSub && <User className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          disabled={!isStarter}
                          onClick={(e) => handleCaptainToggle(p.id, isStarter, e)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                            !isStarter ? 'opacity-30 cursor-not-allowed' : isCapt ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                          title="Set Captain (Must be starter)"
                        >
                          <Shield className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
