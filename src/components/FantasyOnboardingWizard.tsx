import React, { useState, useMemo } from 'react';
import { Player, Team, UserAccount, FantasySquad } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Loader2, ArrowRight, Save, Trash2, Users, Search, Shield, Check, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  currentUser: UserAccount;
  players: Player[];
  teams?: Team[];
  onComplete: () => void;
  onClose?: () => void;
  onShowToast: (msg: string) => void;
  onUpdateProfile?: (data: Partial<UserAccount> & { email: string }) => Promise<void>;
}

export const FantasyOnboardingWizard: React.FC<Props> = ({
  currentUser,
  players,
  teams = [],
  onComplete,
  onClose,
  onShowToast,
  onUpdateProfile
}) => {
  const [step, setStep] = useState(1);

  const teamMap = useMemo(() => new Map((teams || []).map(t => [t.id, t])), [teams]);

  const getPlayerPrice = (p: Player): number => {
    const val = p.currentPrice ?? p.price ?? (p as any).fantasyPrice;
    return typeof val === 'number' && !isNaN(val) && val > 0 ? Number(val.toFixed(1)) : 6.0;
  };

  const getPlayerTeamName = (p: Player): string => {
    const t = teamMap.get(p.teamId);
    return t?.name || t?.shortName || (p as any).teamName || 'Free Agent';
  };

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else {
      onComplete();
    }
  };
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teamName, setTeamName] = useState(currentUser.fantasyTeamName || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectingPosition, setSelectingPosition] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [leagueMode, setLeagueMode] = useState<'skip' | 'create' | 'join'>('skip');
  const [leagueInput, setLeagueInput] = useState('');

  const STARTING_BUDGET = 100.0;
  
  const selectedPlayersList = useMemo(() => {
    return selectedPlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  }, [selectedPlayerIds, players]);

  const spent = selectedPlayersList.reduce((sum, p) => sum + getPlayerPrice(p), 0);
  const bank = parseFloat((STARTING_BUDGET - spent).toFixed(1));

  const handleAutoSelect = () => {
    let newSelected: string[] = [];
    const cheapPlayers = [...players].sort((a,b) => getPlayerPrice(a) - getPlayerPrice(b));
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of cheapPlayers) {
      if (newSelected.length >= 15) break;
      const pos = p.position || 'MID';
      const maxForPos = pos === 'GK' ? 2 : (pos === 'FWD' ? 3 : 5);
      if (counts[pos as keyof typeof counts] < maxForPos) {
          const price = getPlayerPrice(p);
          const currentSpent = newSelected.reduce((sum, id) => {
             const found = players.find(x => x.id === id);
             return sum + (found ? getPlayerPrice(found) : 6.0);
          }, 0);
          if (STARTING_BUDGET - currentSpent >= price) {
            newSelected.push(p.id);
            counts[pos as keyof typeof counts]++;
          }
      }
    }
    setSelectedPlayerIds(newSelected);
  };

  const handleAddPlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
       onShowToast('Player already in squad');
       return;
    }
    const p = players.find(x => x.id === playerId);
    if (!p) return;
    
    const pPrice = getPlayerPrice(p);
    // Validate budget
    if (bank - pPrice < 0) {
      onShowToast('Insufficient funds');
      return;
    }

    // Validate max per club (3)
    const sameClubCount = selectedPlayersList.filter(x => x.teamId === p.teamId).length;
    if (p.teamId && sameClubCount >= 3) {
       onShowToast('Maximum 3 players per club allowed');
       return;
    }

    setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    setSelectingPosition(null);
    setSearchQuery('');
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
  };

  const saveToFirebase = async () => {
    setIsSaving(true);
    try {
      const starters = selectedPlayerIds.slice(0, 11);
      const bench = selectedPlayerIds.slice(11);
      
      const squadPlayers = selectedPlayerIds.map(id => {
        const p = players.find(x => x.id === id);
        return { playerId: id, purchasePrice: p ? getPlayerPrice(p) : 6.0 };
      });
      const playerPurchasePrices = squadPlayers.reduce((acc, item) => {
        acc[item.playerId] = item.purchasePrice;
        return acc;
      }, {} as Record<string, number>);

      const newSquad: Partial<FantasySquad> = {
        squadName: teamName,
        userEmail: currentUser.email,
        userName: currentUser.name,
        playerIds: selectedPlayerIds,
        startingPlayerIds: starters,
        benchPlayerIds: bench,
        captainPlayerId: starters[0],
        viceCaptainPlayerId: starters[1],
        totalPoints: 0,
        gameweekPoints: 0,
        squadPlayers,
        playerPurchasePrices,
        pointHits: 0
      };

      await api.saveFantasySquad(newSquad);
      
      if (onUpdateProfile) {
         await onUpdateProfile({ email: currentUser.email, fantasyTeamName: teamName });
      }

      if (leagueMode === 'create' && leagueInput.trim()) {
        await api.createMiniLeague({ name: leagueInput.trim(), userEmail: currentUser.email });
        onShowToast(`League ${leagueInput} created successfully!`);
      } else if (leagueMode === 'join' && leagueInput.trim()) {
        await api.joinMiniLeague(leagueInput.trim(), currentUser.email);
        onShowToast(`Joined league successfully!`);
      }

      onShowToast('Fantasy Squad Saved!');
      onComplete();
    } catch (err: any) {
      onShowToast(err.message || 'Error saving squad');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPitchRow = (positions: string[], rowRole: string) => {
     // Find players for this row
     const rowPlayers = selectedPlayersList.filter(p => positions.includes(p.position || ''));
     const maxSlots = rowRole === 'GK' ? 2 : (rowRole === 'FWD' ? 3 : 5);
     const slots = [];
     for(let i=0; i<maxSlots; i++) {
        if (i < rowPlayers.length) {
           const p = rowPlayers[i];
           slots.push(
              <div key={p.id} className="flex flex-col items-center group relative cursor-pointer" onClick={() => handleRemovePlayer(p.id)}>
                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-emerald-500 shadow-md">
                   <img src={p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} alt={p.name} className="w-full h-full object-cover" />
                 </div>
                 <div className="bg-slate-900 px-1.5 py-0.5 rounded text-[9px] font-bold text-white mt-1 max-w-[60px] truncate border border-slate-700 text-center shadow-sm">
                   {p.name.split(' ')[0]}
                 </div>
                 <div className="text-[9px] font-black text-amber-300 drop-shadow">
                   ₦{getPlayerPrice(p).toFixed(1)}M
                 </div>
                 <div className="absolute -top-1 -right-1 bg-rose-600 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm border border-white">
                   <X className="w-3 h-3 text-white" />
                 </div>
              </div>
           );
        } else {
           slots.push(
              <div key={`empty-${rowRole}-${i}`} onClick={() => setSelectingPosition(rowRole)} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-dashed border-white/50 backdrop-blur-sm shadow-sm">
                    <Plus className="w-5 h-5 text-white/70" />
                 </div>
                 <div className="bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#800020] mt-1 shadow-sm uppercase tracking-wider">
                   {rowRole}
                 </div>
              </div>
           );
        }
     }
     return (
        <div className="flex justify-center gap-2 sm:gap-6 w-full">
           {slots}
        </div>
     );
  };

  return (
    <div className="fixed inset-0 h-screen w-screen bg-[#800020] flex flex-col font-sans overflow-hidden z-[9999]">
      {/* Top-Right Close Button */}
      <button
        onClick={handleDismiss}
        aria-label="Close Onboarding"
        className="absolute top-4 right-4 z-[100] p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all border border-white/20 shadow-xl cursor-pointer active:scale-90 flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      
      {/* Loading overlay for DB write */}
      <AnimatePresence>
        {isSaving && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-50 bg-[#800020]/90 backdrop-blur-sm flex flex-col items-center justify-center">
             <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
             <h3 className="text-white font-black text-xl tracking-tight">Saving to Database</h3>
             <p className="text-white/70 text-sm mt-2">Provisioning your fantasy squad...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <motion.div 
            key="step1" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col items-center justify-end pb-12 px-6 relative"
          >
            {/* Background Image with Heavy Burgundy Tint */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80" 
                alt="Pitch" 
                className="w-full h-full object-cover mix-blend-overlay opacity-60" 
              />
              <div className="absolute inset-0 bg-[#800020]/80 backdrop-blur-sm"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#800020] via-[#800020]/90 to-transparent"></div>
            </div>

            <div className="relative z-10 w-full max-w-sm text-center">
              <h1 className="text-white text-5xl font-black tracking-tighter mb-4 leading-none">Welcome to<br/>Fantasy</h1>
              <p className="text-white/80 text-base mb-10 leading-relaxed font-medium">Build your dream 15-man squad within the ₦100.0M budget and compete against friends.</p>
              
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-white text-[#800020] font-black py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <span>GET STARTED</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SQUAD BUILDING */}
        {step === 2 && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col h-full bg-[#800020]"
          >
            {/* Progress bar */}
            <div className="w-full h-1 bg-black/20">
               <div className="h-full bg-white w-2/4"></div>
            </div>

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-[#800020] px-4 py-3 flex justify-between items-center shadow-md">
               <div>
                  <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Players</div>
                  <div className="text-white font-black text-xl leading-none">{selectedPlayerIds.length}/15</div>
               </div>
               <div className="text-right">
                  <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Bank</div>
                  <div className="text-white font-black text-xl leading-none">₦{bank.toFixed(1)}M</div>
               </div>
            </div>

            {/* The Pitch */}
            <div className="flex-1 overflow-y-auto px-4 py-6 relative flex flex-col items-center justify-center min-h-[400px]">
               {/* Pitch Background Graphics */}
               <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none z-0 overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/20 border-t-0 rounded-b-3xl"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/20 border-b-0 rounded-t-3xl"></div>
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/20 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full"></div>
               </div>

               {/* Formations */}
               <div className="relative z-10 w-full flex flex-col gap-6 sm:gap-10 items-center justify-between h-full">
                  {renderPitchRow(['FWD'], 'FWD')}
                  {renderPitchRow(['MID'], 'MID')}
                  {renderPitchRow(['DEF'], 'DEF')}
                  {renderPitchRow(['GK'], 'GK')}
               </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-[#800020] px-4 py-4 border-t border-white/10 flex items-center justify-between gap-3">
               {selectedPlayerIds.length < 15 ? (
                 <button onClick={handleAutoSelect} className="flex-1 bg-white/10 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 active:bg-white/20">
                    <Users className="w-5 h-5" />
                    <span>AUTO-SELECT</span>
                 </button>
               ) : (
                 <>
                   <button onClick={() => setSelectedPlayerIds([])} className="px-4 py-4 text-white/70 font-bold text-sm tracking-wide active:text-white">
                      CLEAR
                   </button>
                   <button onClick={() => setStep(3)} className="flex-1 bg-white text-[#800020] font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                      <span>SAVE SQUAD</span>
                      <ArrowRight className="w-5 h-5" />
                   </button>
                 </>
               )}
            </div>

            {/* Sliding Player Selector Sheet */}
            <AnimatePresence>
               {selectingPosition && (
                  <motion.div 
                     initial={{ y: '100%' }}
                     animate={{ y: 0 }}
                     exit={{ y: '100%' }}
                     transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                     className="absolute inset-0 z-30 bg-white flex flex-col"
                  >
                     <div className="bg-[#800020] px-4 py-4 flex items-center gap-3">
                        <button onClick={() => setSelectingPosition(null)} className="p-1 rounded-full bg-white/10 text-white">
                           <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                           <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                           <input 
                              type="text" 
                              placeholder={`Search ${selectingPosition}...`}
                              className="w-full bg-black/20 text-white placeholder:text-white/50 pl-9 pr-3 py-2 rounded-xl outline-none text-sm font-bold"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto bg-slate-50">
                        {players
                           .filter(p => p.position === selectingPosition)
                           .filter(p => {
                              const q = searchQuery.toLowerCase().trim();
                              if (!q) return true;
                              const tName = getPlayerTeamName(p).toLowerCase();
                              return p.name.toLowerCase().includes(q) || tName.includes(q);
                           })
                           .sort((a,b) => getPlayerPrice(b) - getPlayerPrice(a))
                           .map(p => {
                              const isSelected = selectedPlayerIds.includes(p.id);
                              const pPrice = getPlayerPrice(p);
                              const tName = getPlayerTeamName(p);
                              return (
                                 <div key={p.id} className="flex items-center gap-3 p-4 border-b border-slate-200">
                                    <img src={p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-200" />
                                    <div className="flex-1">
                                       <div className="font-bold text-slate-900">{p.name}</div>
                                       <div className="text-xs text-slate-500 font-medium">{tName}</div>
                                    </div>
                                    <div className="text-right mr-3">
                                       <div className="font-black text-[#800020]">₦{pPrice.toFixed(1)}M</div>
                                    </div>
                                    {isSelected ? (
                                       <button onClick={() => handleRemovePlayer(p.id)} className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                          <X className="w-4 h-4" />
                                       </button>
                                    ) : (
                                       <button onClick={() => handleAddPlayer(p.id)} className="w-8 h-8 rounded-full bg-[#800020] flex items-center justify-center text-white shadow-md active:scale-95">
                                          <Plus className="w-4 h-4" />
                                       </button>
                                    )}
                                 </div>
                              )
                           })
                        }
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* STEP 3: TEAM NAMING */}
        {step === 3 && (
          <motion.div 
            key="step3" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col h-full bg-white px-6 py-10"
          >
             <div className="w-full h-1 bg-slate-100 absolute top-0 left-0">
               <div className="h-full bg-[#800020] w-3/4"></div>
             </div>

             <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <h2 className="text-3xl font-black text-[#800020] mb-2 leading-none tracking-tight">Choose your team's name</h2>
                <p className="text-slate-500 mb-8 font-medium">This is how you'll appear on the global leaderboard.</p>

                <input 
                   type="text"
                   placeholder="e.g. Dream FC"
                   value={teamName}
                   onChange={(e) => setTeamName(e.target.value.substring(0, 30))}
                   className="w-full text-2xl font-black text-slate-900 border-b-2 border-slate-200 focus:border-[#800020] outline-none pb-2 mb-8 bg-transparent transition-colors"
                />

                {/* Mockup */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-[#800020] rounded-full flex items-center justify-center text-white shadow-inner">
                      <Shield className="w-6 h-6" />
                   </div>
                   <div>
                      <div className="font-bold text-slate-900 text-lg">{teamName || 'Your Team Name'}</div>
                      <div className="text-sm text-slate-500 font-medium">Manager: {currentUser.name}</div>
                   </div>
                </div>
             </div>

             <button 
                disabled={!teamName.trim()}
                onClick={() => setStep(4)}
                className="w-full bg-[#800020] disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-auto max-w-sm mx-auto"
             >
                <span>CONFIRM</span>
                <Check className="w-5 h-5" />
             </button>
          </motion.div>
        )}

        {/* STEP 4: LEAGUE SELECTION */}
        {step === 4 && (
          <motion.div 
            key="step4" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col h-full bg-white px-6 py-10"
          >
             <div className="w-full h-1 bg-slate-100 absolute top-0 left-0">
               <div className="h-full bg-[#800020] w-full"></div>
             </div>

             <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                <h2 className="text-3xl font-black text-[#800020] mb-8 leading-none tracking-tight">Create or join a league</h2>
                
                <div className="space-y-4">
                   <div 
                      onClick={() => setLeagueMode(leagueMode === 'join' ? 'skip' : 'join')}
                      className={`p-5 rounded-2xl border-2 transition-colors cursor-pointer flex items-center justify-between ${leagueMode === 'join' ? 'border-[#800020] bg-rose-50' : 'border-slate-100 bg-white shadow-sm'}`}
                   >
                      <div className="font-bold text-slate-900">Join a private league</div>
                      <ChevronRight className={`w-5 h-5 ${leagueMode === 'join' ? 'text-[#800020]' : 'text-slate-400'}`} />
                   </div>
                   
                   <AnimatePresence>
                      {leagueMode === 'join' && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <input 
                               type="text" 
                               placeholder="Enter 6-character League Code"
                               className="w-full border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-900 mt-2 outline-none focus:border-[#800020]"
                               value={leagueInput}
                               onChange={(e) => setLeagueInput(e.target.value)}
                            />
                         </motion.div>
                      )}
                   </AnimatePresence>

                   <div 
                      onClick={() => setLeagueMode(leagueMode === 'create' ? 'skip' : 'create')}
                      className={`p-5 rounded-2xl border-2 transition-colors cursor-pointer flex items-center justify-between ${leagueMode === 'create' ? 'border-[#800020] bg-rose-50' : 'border-slate-100 bg-white shadow-sm'}`}
                   >
                      <div className="font-bold text-slate-900">Create a private league</div>
                      <ChevronRight className={`w-5 h-5 ${leagueMode === 'create' ? 'text-[#800020]' : 'text-slate-400'}`} />
                   </div>

                   <AnimatePresence>
                      {leagueMode === 'create' && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <input 
                               type="text" 
                               placeholder="Enter League Name"
                               className="w-full border-2 border-slate-200 rounded-xl p-4 font-bold text-slate-900 mt-2 outline-none focus:border-[#800020]"
                               value={leagueInput}
                               onChange={(e) => setLeagueInput(e.target.value)}
                            />
                         </motion.div>
                      )}
                   </AnimatePresence>

                   <div className="p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 cursor-not-allowed flex items-center justify-between opacity-60">
                      <div className="font-bold text-slate-900">Join a public league</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-1 rounded">Coming Soon</div>
                   </div>
                </div>
             </div>

             <div className="flex flex-col gap-4 mt-auto max-w-sm mx-auto w-full">
                {(leagueMode === 'create' || leagueMode === 'join') ? (
                  <button 
                     onClick={saveToFirebase}
                     className="w-full bg-[#800020] text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                     <span>FINISH SETUP</span>
                     <Check className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                     onClick={saveToFirebase}
                     className="w-full py-4 font-bold text-[#800020] uppercase tracking-wide text-sm active:opacity-50 transition-opacity"
                  >
                     Skip for now
                  </button>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
