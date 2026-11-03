import { useNavigate, useSearchParams } from 'react-router-dom';
import { useURLModal } from '../hooks/useURLModal';
import { FantasyOnboardingWizard } from './FantasyOnboardingWizard';
import React, { useState, useEffect } from 'react';


import { ManagerSquadModal } from './ManagerSquadModal';
import { MasterLeaderboardWidget } from './MasterLeaderboardWidget';
import { SponsorshipBanner } from './SponsorshipBanner';
import { Player, Team, Match, FantasySquad, MiniLeague, UserAccount, ManagerChips } from '../types';
import { calculatePlayerLivePoints } from '../utils/fantasyEngine';
import { api } from '../services/api';

import { 
  Trophy, Star, Shield, Users, Crown, Plus, Copy, Check, Sparkles, 
  UserCheck, Flame, ChevronRight, Award, AlertTriangle, Info, Shirt, 
  Lock, RefreshCw, Clock, ArrowRightLeft, Search, CheckCircle2, 
  Zap, ArrowDown, ArrowUp, AlertCircle, Eye, X
} from 'lucide-react';

interface FantasyLeagueViewProps {
  currentUser: UserAccount;
  players: Player[];
  teams: Team[];
  matches: Match[];
  onShowToast: (msg: string) => void;
  onUpdateProfile?: (data: Partial<UserAccount> & { email: string }) => Promise<UserAccount>;
  onExit?: () => void;
}

export const FantasyLeagueView: React.FC<FantasyLeagueViewProps> = ({
  currentUser,
  players = [],
  teams = [],
  matches = [],
  onShowToast,
  onUpdateProfile,
  onExit
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('fTab') as 'my_team' | 'transfers' | 'leaderboard' | 'mini_leagues' | 'insights' | 'hero_cards') || 'my_team';
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('fTab', tab);
    navigate(`?${params.toString()}`, { replace: true });
  };
  const [heroFilter, setHeroFilter] = useState<'overall' | 'FWD' | 'MID' | 'DEF' | 'GK'>('overall');
  
  const { openModal: openManagerSquadModal } = useURLModal<{ squadId: string }>('managerSquad');

  


  // Fantasy Registration Gate State for users without a squad
  const [hasConfirmedParticipation, setHasConfirmedParticipation] = useState<boolean>(
    Boolean(currentUser.fantasyTeamName && currentUser.fantasyTeamName.trim())
  );
  const [regManagerUsername, setRegManagerUsername] = useState<string>(currentUser.name || '');
  const [regFantasyTeamName, setRegFantasyTeamName] = useState<string>(currentUser.fantasyTeamName || `${currentUser.name || 'Manager'}'s XI`);
  const [regFavoriteTeam, setRegFavoriteTeam] = useState<string>(currentUser.favoriteTeamId || teams[0]?.id || 'team-1');
  const [regError, setRegError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [teamNameError, setTeamNameError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [showResetSquadModal, setShowResetSquadModal] = useState(false);
  const [isResettingSquad, setIsResettingSquad] = useState(false);

  // Fantasy Squad State
  const [squadName, setSquadName] = useState(`${currentUser.name}'s XI`);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [startingPlayerIds, setStartingPlayerIds] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [viceCaptainId, setViceCaptainId] = useState<string>('');
  const [mySquad, setMySquad] = useState<FantasySquad | null>(null);
  const [allSquads, setAllSquads] = useState<FantasySquad[]>([]);
  const [purchasePricesMap, setPurchasePricesMap] = useState<Record<string, number>>({});

  // Interactive Swap State for Pitch
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);

  // Transfer Market Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [priceFilter, setPriceFilter] = useState<string>('ALL');
  const [sortByPoints, setSortByPoints] = useState<boolean>(false);
  const [replacingPlayerId, setReplacingPlayerId] = useState<string | null>(null);

  // Mini League State
  const [miniLeagues, setMiniLeagues] = useState<MiniLeague[]>([]);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fantasyStatsCategory, setFantasyStatsCategory] = useState<'totalPoints' | 'averagePoints' | 'mostOwned'>('totalPoints');

  
  // Chips State
  const [chips, setChips] = useState<ManagerChips>({
    userId: currentUser.id,
    tripleCaptainAvailable: true,
    benchBoostAvailable: true,
    wildcardAvailable: true
  });
  const [activeChipThisGW, setActiveChipThisGW] = useState<'TC' | 'BB' | 'WC' | null>(null);

  // Map for team lookups
  const teamMap = new Map<string, Team>((teams || []).map(t => [t.id, t]));

  // Helper to parse dates strictly as West Africa Time (WAT / Nigeria Time = UTC+1)
  const parseWATDate = (dateStr?: string, timeStr?: string): Date => {
    if (!dateStr) return new Date(NaN);
    const cleanTime = timeStr ? (timeStr.length === 5 ? `${timeStr}:00` : timeStr) : '00:00:00';
    if (cleanTime.includes('+') || cleanTime.includes('Z')) {
      return new Date(`${dateStr}T${cleanTime}`);
    }
    return new Date(`${dateStr}T${cleanTime}+01:00`);
  };

  // 1. Global Gameweek Deadline & Live Lock Calculation
  const activeMatch = (matches || []).find(m => 
    m.status === 'Live' || m.status === 'Half-Time' || m.status === 'Penalties'
  );

  const pastKickoffMatch = (matches || []).find(m => {
    if (m.status === 'Scheduled' && m.date && m.time) {
      const kickoff = parseWATDate(m.date, m.time);
      if (isNaN(kickoff.getTime())) return false;
      const deadline = new Date(kickoff.getTime() - 4 * 60 * 60 * 1000); // 4 hours before kickoff in WAT
      return new Date() >= deadline;
    }
    return false;
  });

  const isGameweekLocked = Boolean(activeMatch || pastKickoffMatch);
  const lockReason = activeMatch 
    ? `Gameweek In Progress - Match Live (${teamMap.get(activeMatch.homeTeamId)?.shortName || 'Home'} vs ${teamMap.get(activeMatch.awayTeamId)?.shortName || 'Away'})`
    : pastKickoffMatch 
      ? `Gameweek Deadline Passed (Locked 4 hours before kickoff WAT for Matchday ${pastKickoffMatch.matchday})` 
      : '';


  // 1b. Calculate Next Deadline
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);
  const countdownStr = timeLeft 
    ? `${timeLeft.d > 0 ? `${timeLeft.d}d ` : ''}${timeLeft.h.toString().padStart(2, '0')}h ${timeLeft.m.toString().padStart(2, '0')}m ${timeLeft.s.toString().padStart(2, '0')}s`
    : '00h 00m 00s';
  
  useEffect(() => {
    const nextScheduledMatches = (matches || [])
      .filter(m => m.status === 'Scheduled' && m.date && m.time)
      .map(m => {
        const kickoff = parseWATDate(m.date, m.time);
        return { ...m, deadline: new Date(kickoff.getTime() - 4 * 60 * 60 * 1000) };
      })
      .filter(m => !isNaN(m.deadline.getTime()) && m.deadline > new Date())
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
      
    const nextMatch = nextScheduledMatches[0];
    
    if (!nextMatch) {
      setTimeLeft(null);
      return;
    }
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = nextMatch.deadline.getTime() - now;
      
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [matches]);

  // 2. Load Fantasy Data from API
  const loadFantasyData = async () => {
    try {
      const [squadsRes, miniRes, chipsRes] = await Promise.all([
        api.getFantasySquads(),
        api.getMiniLeagues(),
        api.getManagerChips(currentUser.id)
      ]);

      setAllSquads(squadsRes);
      setMiniLeagues(miniRes);
      if (chipsRes) {
        setChips(chipsRes);
      }

      const foundMySquad = squadsRes.find(s => (s.userEmail || '').toLowerCase() === (currentUser?.email || '').toLowerCase());
      if (foundMySquad) {
        setMySquad(foundMySquad);
        setHasConfirmedParticipation(true);
        setSquadName(foundMySquad.squadName);
        const pIds = foundMySquad.playerIds || [];
        setSelectedPlayerIds(pIds);

        const initialPricesMap: Record<string, number> = {};
        if (foundMySquad.squadPlayers && Array.isArray(foundMySquad.squadPlayers)) {
          foundMySquad.squadPlayers.forEach(sp => {
            initialPricesMap[sp.playerId] = sp.purchasePrice;
          });
        } else if (foundMySquad.playerPurchasePrices) {
          Object.assign(initialPricesMap, foundMySquad.playerPurchasePrices);
        }
        pIds.forEach(id => {
          if (initialPricesMap[id] === undefined) {
            const p = players.find(x => x.id === id);
            initialPricesMap[id] = p ? (p.currentPrice || p.price || 6.0) : 6.0;
          }
        });
        setPurchasePricesMap(initialPricesMap);

        const starters = foundMySquad.startingPlayerIds && foundMySquad.startingPlayerIds.length === 11
          ? foundMySquad.startingPlayerIds
          : pIds.slice(0, 11);

        setStartingPlayerIds(starters);
        setCaptainId(foundMySquad.captainPlayerId || starters[0] || '');
        setViceCaptainId(foundMySquad.viceCaptainPlayerId || starters[1] || '');
      } else if (currentUser.fantasyTeamName || (currentUser as any).hasFantasyTeam || (currentUser as any).fantasySquadId) {
        // Fallback: The squad was deleted from the database, reset local UI state only (no background write on load)
        setMySquad(null);
        setHasConfirmedParticipation(false);
        setSquadName('');
      }
    } catch (err) {
      console.warn('Error loading fantasy data:', err);
    }
  };

  const checkTeamNameAvailability = async (nameToCheck: string) => {
    if (!nameToCheck.trim()) {
      setTeamNameError(null);
      return;
    }
    try {
      const res = await api.checkAvailability(undefined, nameToCheck.trim(), currentUser.email);
      if (!res.teamNameAvailable) {
        setTeamNameError(res.teamNameError || `The team name '${nameToCheck.trim()}' is already taken. Choose a unique name to prevent mixups.`);
      } else {
        setTeamNameError(null);
      }
    } catch (e) {
      // ignore transient network errors during live validation
    }
  };

  const checkUsernameAvailability = async (nameToCheck: string) => {
    if (!nameToCheck.trim()) {
      setUsernameError(null);
      return;
    }
    try {
      const res = await api.checkAvailability(nameToCheck.trim(), undefined, currentUser.email);
      if (!res.usernameAvailable) {
        setUsernameError(res.usernameError || `Username '${nameToCheck.trim()}' is already in use.`);
      } else {
        setUsernameError(null);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleConfirmRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const teamNameClean = regFantasyTeamName.trim();
    if (!teamNameClean) {
      setRegError('Please enter a Fantasy Team Name.');
      return;
    }

    setIsRegistering(true);
    setRegError(null);
    setTeamNameError(null);

    try {
      // 1. Check Fantasy Team Name availability
      const availability = await api.checkAvailability(
        undefined,
        teamNameClean,
        currentUser.email
      );

      if (!availability.teamNameAvailable) {
        setTeamNameError(availability.teamNameError || 'This Fantasy Team Name is already taken. Please choose a unique name.');
        setRegError('This Fantasy Team Name is already taken by another manager.');
        setIsRegistering(false);
        return;
      }

      // 2. Update user profile to permanently lock fantasyTeamName in DB
      if (onUpdateProfile) {
        await onUpdateProfile({
          email: currentUser.email,
          fantasyTeamName: teamNameClean,
          favoriteTeamId: regFavoriteTeam || undefined
        });
      }

      // 3. Immediately create and persist Fantasy Squad in DB
      const managerName = currentUser.name || currentUser.email.split('@')[0];
      const purchaseData = getSquadPurchaseData();
      const savedSquad = await api.saveFantasySquad({
        userId: currentUser.id || currentUser.email,
        userEmail: currentUser.email,
        userName: managerName,
        squadName: teamNameClean,
        playerIds: selectedPlayerIds.length > 0 ? selectedPlayerIds : [],
        startingPlayerIds: startingPlayerIds.length > 0 ? startingPlayerIds : [],
        benchPlayerIds: [],
        captainPlayerId: captainId || '',
        viceCaptainPlayerId: viceCaptainId || '',
        ...purchaseData
      });

      setMySquad(savedSquad);
      setSquadName(teamNameClean);
      setHasConfirmedParticipation(true);
      setActiveTab('my_team');
      onShowToast(`🎉 Welcome to Fantasy Manager, ${managerName}! Squad '${teamNameClean}' created and locked.`);
    } catch (err: any) {
      setRegError(err.message || 'Failed to complete registration');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetSquad = async () => {
    if (!mySquad) {
      onShowToast('Error: No squad found to delete.');
      return;
    }
    setIsResettingSquad(true);
    try {
      await api.resetMySquad(mySquad.id || 'unknown', currentUser.id);
      
      if (onUpdateProfile) {
        await onUpdateProfile({
          email: currentUser.email,
          fantasyTeamName: ''
        });
      }

      // Update local state instantly for immediate feedback
      setMySquad(null);
      setHasConfirmedParticipation(false);
      setSquadName(`${currentUser.name}'s XI`);
      setShowResetSquadModal(false);
      onShowToast('Fantasy Team permanently deleted.');
      
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      onShowToast(err.message || 'Error deleting squad');
      setIsResettingSquad(false);
    }
  };

  useEffect(() => {
    loadFantasyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.email]);

  // Derived squad statistics & position lists
  const selectedPlayers = selectedPlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  
  const hadFullSquad = mySquad && ((mySquad.savedBaselinePlayerIds && mySquad.savedBaselinePlayerIds.length >= 18) || (mySquad.playerIds && mySquad.playerIds.length >= 18));
  const baselinePlayerIds = hadFullSquad
    ? ((mySquad.savedBaselinePlayerIds && mySquad.savedBaselinePlayerIds.length >= 18) ? mySquad.savedBaselinePlayerIds : mySquad.playerIds)
    : selectedPlayerIds; // free selection phase

  // Transfer count & Point penalty math
  const transfersCount = selectedPlayerIds.filter(id => !baselinePlayerIds.includes(id)).length;
  const isWildcardActive = activeChipThisGW === 'WC';
  const freeTransfersRemaining = isWildcardActive ? 'Unlimited' : Math.max(0, 2 - transfersCount);
  const extraTransfers = isWildcardActive ? 0 : Math.max(0, transfersCount - 2);
  const costOfChanges = extraTransfers * 4; // -4 points deduction per trade exceeding 2

  const getSquadPurchaseData = () => {
    const squadPlayers = selectedPlayerIds.map(id => {
      const p = players.find(x => x.id === id);
      const curPrice = p ? (p.currentPrice || p.price || 6.0) : 6.0;
      const buyPrice = purchasePricesMap[id] ?? curPrice;
      return { playerId: id, purchasePrice: buyPrice };
    });
    const playerPurchasePrices = selectedPlayerIds.reduce((acc, id) => {
      const p = players.find(x => x.id === id);
      const curPrice = p ? (p.currentPrice || p.price || 6.0) : 6.0;
      acc[id] = purchasePricesMap[id] ?? curPrice;
      return acc;
    }, {} as Record<string, number>);
    return { squadPlayers, playerPurchasePrices };
  };

  const totalCost = selectedPlayerIds.reduce((sum, id) => {
    const p = players.find(x => x.id === id);
    const curPrice = p ? (p.currentPrice || p.price || 6.0) : 6.0;
    const buyPrice = purchasePricesMap[id] ?? curPrice;
    return sum + buyPrice;
  }, 0);
  const remainingBudget = Number((100.0 - totalCost).toFixed(1));

  // Starting XI and Bench decomposition
  const startingPlayers = startingPlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
  const benchPlayerIds = selectedPlayerIds.filter(id => !startingPlayerIds.includes(id));
  const benchPlayers = benchPlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];

  // Positional breakdown of Starting XI
  const starterGK = startingPlayers.filter(p => p.position === 'GK');
  const starterDEF = startingPlayers.filter(p => p.position === 'DEF');
  const starterMID = startingPlayers.filter(p => p.position === 'MID');
  const starterFWD = startingPlayers.filter(p => p.position === 'FWD');

  // Recognized formation (e.g. 4-4-2, 3-5-2)
  const currentFormationStr = `${starterDEF.length}-${starterMID.length}-${starterFWD.length}`;

  // Squad Validation Checks
  const isBudgetExceeded = totalCost > 100.0;
  const isSquadSizeInvalid = selectedPlayerIds.length !== 18;
  const is18PositionalInvalid = 
    selectedPlayers.filter(p => p.position === 'GK').length !== 2 ||
    selectedPlayers.filter(p => p.position === 'DEF').length !== 6 ||
    selectedPlayers.filter(p => p.position === 'MID').length !== 6 ||
    selectedPlayers.filter(p => p.position === 'FWD').length !== 4;

  const isStarterCountInvalid = startingPlayerIds.length !== 11;
  const isCaptainOnBench = !startingPlayerIds.includes(captainId);
  const isCaptainMissing = !captainId || isCaptainOnBench;

  // Formation limits check for Starting XI
  const isFormationValid = 
    starterGK.length === 1 &&
    starterDEF.length >= 3 && starterDEF.length <= 5 &&
    starterMID.length >= 2 && starterMID.length <= 5 &&
    starterFWD.length >= 1 && starterFWD.length <= 3 &&
    startingPlayers.length === 11;

  // 3. Interactive Player Swap Engine for Pitch / Bench
  const handlePlayerTap = (tappedPlayerId: string) => {
    if (isGameweekLocked) {
      onShowToast('🔒 Gameweek In Progress - Team Changes Locked.');
      return;
    }

    if (!swapSourceId) {
      // First tap: select source player
      setSwapSourceId(tappedPlayerId);
      const tapped = players.find(p => p.id === tappedPlayerId);
      if (tapped) {
        onShowToast(`Selected ${tapped.name}. Tap another player to swap positions.`);
      }
      return;
    }

    if (swapSourceId === tappedPlayerId) {
      // Deselect
      setSwapSourceId(null);
      return;
    }

    // Second tap: attempt swap
    const isSourceStarter = startingPlayerIds.includes(swapSourceId);
    const isTappedStarter = startingPlayerIds.includes(tappedPlayerId);

    // If both are starters or both are bench, change selection to tapped player
    if ((isSourceStarter && isTappedStarter) || (!isSourceStarter && !isTappedStarter)) {
      setSwapSourceId(tappedPlayerId);
      const tapped = players.find(p => p.id === tappedPlayerId);
      if (tapped) {
        onShowToast(`Selected ${tapped.name} instead.`);
      }
      return;
    }

    // One is starter, one is bench -> Perform Swap with Strict Positional Validation
    const starterToSub = isSourceStarter ? swapSourceId : tappedPlayerId;
    const benchToSubIn = isSourceStarter ? tappedPlayerId : swapSourceId;

    const proposedStarters = startingPlayerIds.filter(id => id !== starterToSub).concat(benchToSubIn);
    const proposedPlayers = proposedStarters.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];

    const newGK = proposedPlayers.filter(p => p.position === 'GK').length;
    const newDEF = proposedPlayers.filter(p => p.position === 'DEF').length;
    const newMID = proposedPlayers.filter(p => p.position === 'MID').length;
    const newFWD = proposedPlayers.filter(p => p.position === 'FWD').length;

    // STRICT POSITIONAL FORMATION VALIDATION
    if (newGK !== 1) {
      onShowToast('Invalid Formation: Exactly 1 Goalkeeper required.');
      setSwapSourceId(null);
      return;
    }
    if (newDEF < 3) {
      onShowToast('Invalid Formation: Minimum 3 Defenders required.');
      setSwapSourceId(null);
      return;
    }
    if (newDEF > 5) {
      onShowToast('Invalid Formation: Maximum 5 Defenders allowed.');
      setSwapSourceId(null);
      return;
    }
    if (newMID < 2) {
      onShowToast('Invalid Formation: Minimum 2 Midfielders required.');
      setSwapSourceId(null);
      return;
    }
    if (newMID > 5) {
      onShowToast('Invalid Formation: Maximum 5 Midfielders allowed.');
      setSwapSourceId(null);
      return;
    }
    if (newFWD < 1) {
      onShowToast('Invalid Formation: Minimum 1 Forward required.');
      setSwapSourceId(null);
      return;
    }
    if (newFWD > 3) {
      onShowToast('Invalid Formation: Maximum 3 Forwards allowed.');
      setSwapSourceId(null);
      return;
    }

    // All validation passed! Execute swap
    setStartingPlayerIds(proposedStarters);
    if (captainId === starterToSub) {
      setCaptainId(benchToSubIn);
    }
    if (viceCaptainId === starterToSub) {
      setViceCaptainId(benchToSubIn);
    }

    const playerOut = players.find(p => p.id === starterToSub);
    const playerIn = players.find(p => p.id === benchToSubIn);
    onShowToast(`Substituted ${playerOut?.name || 'Player'} for ${playerIn?.name || 'Player'}! Formation: ${newDEF}-${newMID}-${newFWD}`);
    setSwapSourceId(null);
  };

  // 4. Save Team Handler (Squad Selection / Pitch View)
  
  const handleToggleChip = (chipType: 'TC' | 'BB' | 'WC') => {
    if (isGameweekLocked) {
      onShowToast('🔒 Gameweek is locked. Chips cannot be changed now.');
      return;
    }

    if (activeChipThisGW === chipType) {
      setActiveChipThisGW(null);
      onShowToast(`Deactivated ${chipType} Chip.`);
      return;
    }

    if (chipType === 'TC' && !chips.tripleCaptainAvailable) {
      onShowToast('Triple Captain chip has already been used this season.');
      return;
    }
    if (chipType === 'BB' && !chips.benchBoostAvailable) {
      onShowToast('Bench Boost chip has already been used this season.');
      return;
    }
    if (chipType === 'WC' && !chips.wildcardAvailable) {
      onShowToast('Wildcard chip has already been used this season.');
      return;
    }

    setActiveChipThisGW(chipType);
    onShowToast(`${chipType} Chip Selected (Pending)! Click "Save Team" to apply.`);
  };

  const handleSaveTeam = async () => {
    if (isGameweekLocked) {
      onShowToast('🔒 Gameweek In Progress - Team Changes Locked.');
      return;
    }
    if (isStarterCountInvalid) {
      onShowToast(`Starting XI must contain exactly 11 players (${startingPlayerIds.length}/11).`);
      return;
    }
    if (!isFormationValid) {
      onShowToast('Invalid Formation! Starting XI must satisfy: 1 GK, 3-5 DEF, 1-3 FWD.');
      return;
    }
    if (isCaptainMissing) {
      onShowToast('Please designate a Captain (2x points) from your Starting XI.');
      return;
    }

    setIsSaving(true);
    try {
      let updatedChips = { ...chips };
      if (activeChipThisGW && activeChipThisGW !== mySquad?.activeChip) {
        const currentGw = matches[0]?.matchday || 1;
        if (activeChipThisGW === 'TC') {
          updatedChips.tripleCaptainAvailable = false;
          updatedChips.tripleCaptainUsedGw = currentGw;
        } else if (activeChipThisGW === 'BB') {
          updatedChips.benchBoostAvailable = false;
          updatedChips.benchBoostUsedGw = currentGw;
        } else if (activeChipThisGW === 'WC') {
          updatedChips.wildcardAvailable = false;
          updatedChips.wildcardUsedGw = currentGw;
        }
        await api.saveManagerChips(updatedChips);
        setChips(updatedChips);
      } else if (!activeChipThisGW && mySquad?.activeChip) {
        const oldChip = mySquad.activeChip;
        if (oldChip === 'TC') updatedChips.tripleCaptainAvailable = true;
        if (oldChip === 'BB') updatedChips.benchBoostAvailable = true;
        if (oldChip === 'WC') updatedChips.wildcardAvailable = true;
        await api.saveManagerChips(updatedChips);
        setChips(updatedChips);
      }

      const purchaseData = getSquadPurchaseData();
      const saved = await api.saveFantasySquad({
        userId: currentUser.id || currentUser.email,
        userEmail: currentUser.email,
        userName: currentUser.name,
        squadName: squadName.trim() || `${currentUser.name}'s XI`,
        captainPlayerId: captainId,
        viceCaptainPlayerId: viceCaptainId || undefined,
        startingPlayerIds: startingPlayerIds,
        benchPlayerIds: benchPlayerIds,
        playerIds: selectedPlayerIds,
        activeChip: activeChipThisGW,
        ...purchaseData
      });
      setMySquad(saved);
      onShowToast('Starting XI, Formation & Chips Saved Successfully! 🌟');
      await loadFantasyData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save squad');
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Transfer Market Buy / Sell Actions & Max 3 Per Club Validation
  const isValidClubLimit = (currentSquadPlayers: Player[], candidatePlayer: Player, replacingId?: string | null): boolean => {
    const activeSquad = replacingId
      ? currentSquadPlayers.filter(p => p.id !== replacingId)
      : currentSquadPlayers;
    const count = activeSquad.filter(p => p.teamId === candidatePlayer.teamId).length;
    return count < 3;
  };

  const handleBuyPlayer = (player: Player) => {
    if (isGameweekLocked) {
      onShowToast('🔒 Gameweek In Progress - Team Changes Locked.');
      return;
    }
    if (selectedPlayerIds.includes(player.id)) {
      onShowToast(`${player.name} is already in your squad.`);
      return;
    }
    if (selectedPlayerIds.length >= 18 && !replacingPlayerId) {
      onShowToast('Squad is full (18 players max). Transfer out a player first.');
      return;
    }

    const playerCurrentPrice = player.currentPrice || player.price || 6.0;
    const buyPrice = purchasePricesMap[player.id] ?? playerCurrentPrice;
    const newTotalCost = totalCost + buyPrice;
    if (newTotalCost > 100.0) {
      onShowToast(`Budget Exceeded! Buying ${player.name} (₦${buyPrice.toFixed(1)}M) exceeds remaining budget.`);
      return;
    }

    const squadAfterReplace = replacingPlayerId
      ? selectedPlayers.filter(p => p.id !== replacingPlayerId)
      : selectedPlayers;

    // MAX 3 PER CLUB RULE ENFORCEMENT
    if (!isValidClubLimit(selectedPlayers, player, replacingPlayerId)) {
      const teamObj = teams.find(t => t.id === player.teamId) || teamMap.get(player.teamId);
      const teamNameStr = teamObj?.name || 'this club';
      onShowToast(`Transfer Failed: You cannot have more than 3 players from ${teamNameStr}.`);
      return;
    }

    // Positional quota check for 18-man squad
    const currentPosCount = squadAfterReplace.filter(p => p.position === player.position).length;
    if (player.position === 'GK' && currentPosCount >= 2) {
      onShowToast('Max 2 Goalkeepers allowed in your 18-man squad.');
      return;
    }
    if (player.position === 'DEF' && currentPosCount >= 6) {
      onShowToast('Max 6 Defenders allowed in your 18-man squad.');
      return;
    }
    if (player.position === 'MID' && currentPosCount >= 6) {
      onShowToast('Max 6 Midfielders allowed in your 18-man squad.');
      return;
    }
    if (player.position === 'FWD' && currentPosCount >= 4) {
      onShowToast('Max 4 Forwards allowed in your 18-man squad.');
      return;
    }

    let nextSelected = [...selectedPlayerIds];
    let nextStarters = [...startingPlayerIds];

    if (replacingPlayerId) {
      // Replace target player directly
      nextSelected = nextSelected.filter(id => id !== replacingPlayerId);
      nextStarters = nextStarters.filter(id => id !== replacingPlayerId);
      setReplacingPlayerId(null);
    }

    nextSelected.push(player.id);
    if (nextStarters.length < 11) {
      nextStarters.push(player.id);
      if (!captainId) setCaptainId(player.id);
    }

    setPurchasePricesMap(prev => ({
      ...prev,
      [player.id]: buyPrice
    }));

    setSelectedPlayerIds(nextSelected);
    setStartingPlayerIds(nextStarters);
    onShowToast(`Transferred In ${player.name} (₦${buyPrice.toFixed(1)}M)!`);
  };

  const handleSellPlayer = (playerId: string) => {
    if (isGameweekLocked) {
      onShowToast('🔒 Gameweek In Progress - Team Changes Locked.');
      return;
    }
    const player = players.find(p => p.id === playerId);
    const nextSelected = selectedPlayerIds.filter(id => id !== playerId);
    const nextStarters = startingPlayerIds.filter(id => id !== playerId);

    setSelectedPlayerIds(nextSelected);
    setStartingPlayerIds(nextStarters);
    if (captainId === playerId) {
      setCaptainId(nextStarters[0] || '');
    }

    if (player) {
      onShowToast(`Transferred Out ${player.name}. Select a replacement player.`);
      setPositionFilter(player.position);
      setReplacingPlayerId(playerId);
    }
  };

  const handleConfirmTransfers = async () => {
    if (isGameweekLocked) {
      onShowToast('🔒 Gameweek In Progress - Team Changes Locked.');
      return;
    }
    if (isBudgetExceeded) {
      onShowToast(`Budget Exceeded! Total cost ₦${totalCost.toFixed(1)}M. Maximum budget is ₦100.0M.`);
      return;
    }
    if (isSquadSizeInvalid) {
      onShowToast(`Squad must contain exactly 18 players (${selectedPlayerIds.length}/18).`);
      return;
    }
    if (is18PositionalInvalid) {
      onShowToast('Positional constraint violated! Must have 2 GK, 6 DEF, 6 MID, 4 FWD.');
      return;
    }

    // Max 3 Per Club Validation across entire squad
    const clubCounts: Record<string, number> = {};
    for (const p of selectedPlayers) {
      clubCounts[p.teamId] = (clubCounts[p.teamId] || 0) + 1;
      if (clubCounts[p.teamId] > 3) {
        const teamObj = teams.find(t => t.id === p.teamId) || teamMap.get(p.teamId);
        const teamNameStr = teamObj?.name || 'this club';
        onShowToast(`Transfer Failed: You cannot have more than 3 players from ${teamNameStr}.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const purchaseData = getSquadPurchaseData();
      const saved = await api.saveFantasySquad({
        userId: currentUser.id || currentUser.email,
        userEmail: currentUser.email,
        userName: currentUser.name,
        squadName: squadName.trim() || `${currentUser.name}'s XI`,
        captainPlayerId: captainId,
        viceCaptainPlayerId: viceCaptainId || undefined,
        startingPlayerIds: startingPlayerIds,
        benchPlayerIds: benchPlayerIds,
        playerIds: selectedPlayerIds,
        ...purchaseData
      });
      setMySquad(saved);
      let msg = 'Initial Squad Saved!';
      if (hadFullSquad) {
         msg = costOfChanges > 0 
          ? `Transfers Confirmed! ${transfersCount} trade(s) made (-${costOfChanges} pts penalty applied).`
          : `Transfers Confirmed! ${transfersCount} trade(s) made (0 penalty).`;
      }
      onShowToast(msg);
      await loadFantasyData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to confirm transfers');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Mini Leagues Handlers
  const handleCreateMiniLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    try {
      const created = await api.createMiniLeague({
        name: newLeagueName.trim(),
        ownerId: currentUser.id || currentUser.email,
        ownerName: currentUser.name,
        userEmail: currentUser.email
      });
      setNewLeagueName('');
      onShowToast(`Created Mini-League "${created.name}"! Code: ${created.code}`);
      await loadFantasyData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create mini-league');
    }
  };

  const handleJoinMiniLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const joined = await api.joinMiniLeague(joinCode.trim(), currentUser.email);
      setJoinCode('');
      onShowToast(`Successfully joined "${joined.name}"! 🎉`);
      await loadFantasyData();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to join mini-league');
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onShowToast(`Copied invite code: ${code}`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Filtered Marketplace Pool
  const [marketSortOption, setMarketSortOption] = useState<'default' | 'tsb_desc' | 'points_desc' | 'price_desc' | 'price_asc'>('default');
  const registeredSquads = (allSquads || []).filter(s => s && s.id !== 'placeholder_init' && s.userEmail && s.squadName && s.userName);
  const totalSquadsCount = Math.max(1, registeredSquads.length);
  
  const filteredMarketplace = (players || []).filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          (teamMap.get(p.teamId)?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesPos = positionFilter === 'ALL' || p.position === positionFilter;
    const matchesTeam = teamFilter === 'ALL' || p.teamId === teamFilter;
    
    let matchesPrice = true;
    const pPrice = p.price || 6.0;
    if (priceFilter === 'UNDER_6') matchesPrice = pPrice < 6.0;
    else if (priceFilter === '6_TO_8') matchesPrice = pPrice >= 6.0 && pPrice <= 8.0;
    else if (priceFilter === 'OVER_8') matchesPrice = pPrice > 8.0;

    return matchesSearch && matchesPos && matchesTeam && matchesPrice;
  }).sort((a, b) => {
    const aOwners = registeredSquads.filter(s => s.playerIds?.includes(a.id)).length;
    const bOwners = registeredSquads.filter(s => s.playerIds?.includes(b.id)).length;
    const aTSB = (aOwners / totalSquadsCount) * 100;
    const bTSB = (bOwners / totalSquadsCount) * 100;

    if (marketSortOption === 'tsb_desc') {
      return bTSB - aTSB || (b.fantasyPoints || 0) - (a.fantasyPoints || 0);
    }
    if (marketSortOption === 'points_desc' || sortByPoints) {
      return (b.fantasyPoints || 0) - (a.fantasyPoints || 0);
    }
    if (marketSortOption === 'price_desc') {
      return (b.price || 6.0) - (a.price || 6.0);
    }
    if (marketSortOption === 'price_asc') {
      return (a.price || 6.0) - (b.price || 6.0);
    }
    const priceDiff = (b.price || 6.0) - (a.price || 6.0);
    if (priceDiff !== 0) return priceDiff;
    return (b.fantasyPoints || 0) - (a.fantasyPoints || 0);
  });



  const [statsData, setStatsData] = useState<any>(null);
  
  useEffect(() => {
    if (activeTab === 'insights' && !statsData) {
       api.getFantasyDashboardStats().then(setStatsData).catch(console.error);
    }
  }, [activeTab]);

  // --- INSIGHTS COMPUTATIONS ---
  const topPerformers = statsData?.topPerformers || [];
  const mostOwnedPlayers = statsData?.mostOwnedPlayers || [];
  const mostCaptainedPlayers = statsData?.mostCaptainedPlayers || [];
  const captaincyFavorite = mostCaptainedPlayers.length > 0 ? mostCaptainedPlayers[0] : null;

  const clientSideTotalPoints = React.useMemo(() => {
    if (!mySquad || !players) return 0;
    const starters = mySquad.startingPlayerIds || [];
    const bench = mySquad.benchPlayerIds || [];
    const activeChip = activeChipThisGW || mySquad.activeChip || null;
    const captainId = mySquad.captainPlayerId;
    const viceCaptainId = mySquad.viceCaptainPlayerId;
    
    // Quick fallback check for captain
    let activeMultiplierId = captainId;
    // In a real app we'd check if they played. We'll stick to captainId for simplicity unless we know they didn't play.

    const scoringIds = activeChip === 'BB' ? [...starters, ...bench] : starters;
    
    let total = 0;
    scoringIds.forEach(pId => {
      const p = players.find(x => x.id === pId);
      if (p) {
        let pts = p.fantasyPoints || 0;
        if (pId === activeMultiplierId) pts *= (activeChip === 'TC' ? 3 : 2);
        total += pts;
      }
    });
    
    return Math.max(0, total - (mySquad.pointHits || 0));
  }, [mySquad, players, activeChipThisGW]);

  const { totalLivePts: liveProjectedGameweekPoints, playerLivePtsMap } = React.useMemo(() => {
    if (!mySquad || !matches || !players) return { totalLivePts: 0, playerLivePtsMap: new Map<string, number>() };
    
    const currentGw = (matches.find(m => m.status === 'Live' || m.status === 'Half-Time' || m.status === 'Penalties')?.matchday) || 
                      (matches.length > 0 ? Math.max(...matches.filter(m => m.status === 'Full-Time').map(m => m.matchday)) : 1);
    
    const gwMatches = matches.filter(m => m.matchday === currentGw);
    if (gwMatches.length === 0) return { totalLivePts: 0, playerLivePtsMap: new Map<string, number>() };

    let totalLivePts = 0;
    const playerLivePtsMap = new Map<string, number>();
    
    const starters = mySquad.startingPlayerIds || [];
    const bench = mySquad.benchPlayerIds || [];
    const activeChip = activeChipThisGW || mySquad.activeChip || null;
    const captainId = mySquad.captainPlayerId;
    const viceCaptainId = mySquad.viceCaptainPlayerId;
    
    // Quick check if captain played (to transfer to vice if 0 mins)
    const checkPlayed = (pId: string) => {
      const p = players.find(x => x.id === pId);
      if (!p) return false;
      const m = gwMatches.find(m => m.homeTeamId === p.teamId || m.awayTeamId === p.teamId);
      if (!m) return false;
      const lineup = m.homeTeamId === p.teamId ? m.homeLineup : m.awayLineup;
      if (lineup && lineup.startingXI.some(s => s.playerId === pId)) return true;
      if (m.events?.some(e => e.eventType === 'Sub' && e.subInPlayerId === pId)) return true;
      return false; 
    };

    const captainPlayed = captainId ? checkPlayed(captainId) : false;
    const activeMultiplierId = (!captainPlayed && viceCaptainId) ? viceCaptainId : captainId;

    const scoringIds = activeChip === 'BB' ? [...starters, ...bench] : starters;

    [...starters, ...bench].forEach(pId => {
      const p = players.find(x => x.id === pId);
      if (!p) return;
      
      const m = gwMatches.find(m => m.homeTeamId === p.teamId || m.awayTeamId === p.teamId);
      if (!m) return; 
      
      const isCaptain = pId === activeMultiplierId;
      const stats = calculatePlayerLivePoints(p, m, isCaptain, false, activeChip, false);
      
      playerLivePtsMap.set(pId, stats.totalPoints);
      if (scoringIds.includes(pId)) {
        totalLivePts += stats.totalPoints;
      }
    });

    return { totalLivePts, playerLivePtsMap };
  }, [mySquad, matches, players, activeChipThisGW]);

  if (!mySquad && !hasConfirmedParticipation) {
    return (
      <FantasyOnboardingWizard 
        currentUser={currentUser}
        players={players}
        teams={teams}
        onComplete={() => {
          setHasConfirmedParticipation(true);
          loadFantasyData();
        }}
        onClose={() => {
          if (onExit) {
            onExit();
          }
        }}
        onShowToast={onShowToast}
        onUpdateProfile={async (data) => {
          if (onUpdateProfile) {
            await onUpdateProfile(data);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Sticky Premium Sponsorship Banner */}
      <SponsorshipBanner tagline="Official Fantasy League Partner" />

      {/* ISOLATED FANTASY HEADER */}
      {onExit && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all font-bold text-xs"
          >
            <X className="w-4 h-4" />
            <span>Exit Fantasy</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-black text-xs uppercase tracking-wide text-amber-400">Fantasy World</span>
          </div>
        </div>
      )}

      

      {/* GLOBAL GAMEWEEK STATUS BANNER */}
      {isGameweekLocked ? (
        <div className="bg-rose-950/90 border border-rose-600/80 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 text-rose-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                <span>Gameweek In Progress - Team Changes Locked</span>
                <span className="px-2 py-0.5 bg-rose-900 border border-rose-500 rounded text-[10px] font-bold text-amber-300">GLOBAL LOCK</span>
              </h3>
              <p className="text-xs text-rose-200/90 mt-0.5">
                {lockReason || 'Squad substitutions, captain changes, and transfers are locked until the active matchday concludes.'}
              </p>
            </div>
          </div>
        </div>
      ) : timeLeft ? (
        <div className="bg-emerald-950/90 border border-emerald-600/80 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 text-emerald-100 flex-wrap">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
             </div>
             <div>
                <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                   <span>Gameweek Transfers Open</span>
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                   Make your squad changes and transfers before the deadline.
                </p>
             </div>
          </div>
          <div className="flex flex-col items-end sm:items-center bg-emerald-900/50 px-3 py-1.5 rounded-xl border border-emerald-500/30">
             <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300 mb-0.5">Time to Deadline</span>
             <div className="flex items-baseline gap-1 font-black text-white">
                {timeLeft.d > 0 && <><span className="text-xl leading-none">{timeLeft.d}</span><span className="text-[10px] text-emerald-400 mr-1">d</span></>}
                <span className="text-xl leading-none">{timeLeft.h}</span><span className="text-[10px] text-emerald-400 mr-1">h</span>
                <span className="text-xl leading-none">{timeLeft.m}</span><span className="text-[10px] text-emerald-400 mr-1">m</span>
                <span className="text-xl leading-none">{timeLeft.s}</span><span className="text-[10px] text-emerald-400">s</span>
             </div>
          </div>
        </div>
      ) : null}


      {/* Quick Points Summary */}
      {mySquad && activeTab === 'my_team' && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-slate-800 pb-4">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Total Points</span>
              <span className="text-sm font-black text-amber-400">
                {Math.max(mySquad.totalPoints || 0, clientSideTotalPoints)} pts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STAR HERO CARDS SUB-DASHBOARD (SOFASCORE STYLE) */}
      {activeTab === 'hero_cards' && (() => {
        const topExpensiveOverall = [...players].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0) || (b.price || 0) - (a.price || 0)).slice(0, 5);
        const topGK = [...players].filter(p => p.position === 'GK').sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0) || (b.price || 0) - (a.price || 0)).slice(0, 5);
        const topDEF = [...players].filter(p => p.position === 'DEF').sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0) || (b.price || 0) - (a.price || 0)).slice(0, 5);
        const topMID = [...players].filter(p => p.position === 'MID').sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0) || (b.price || 0) - (a.price || 0)).slice(0, 5);
        const topFWD = [...players].filter(p => p.position === 'FWD').sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0) || (b.price || 0) - (a.price || 0)).slice(0, 5);

        const displayedHeroes = heroFilter === 'overall' 
          ? topExpensiveOverall 
          : heroFilter === 'FWD' 
            ? topFWD 
            : heroFilter === 'MID' 
              ? topMID 
              : heroFilter === 'DEF' 
                ? topDEF 
                : topGK;

        const categoryTitle = heroFilter === 'overall' 
          ? 'Top 5 Most Expensive Players in Fantasy' 
          : heroFilter === 'FWD' 
            ? 'Elite Forwards (FWD) Leaders' 
            : heroFilter === 'MID' 
              ? 'Elite Midfielders (MID) Leaders' 
              : heroFilter === 'DEF' 
                ? 'Elite Defenders (DEF) Leaders' 
                : 'Elite Goalkeepers (GK) Leaders';

        const topPlayer = displayedHeroes[0];
        const restPlayers = displayedHeroes.slice(1, 5);

        return (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Hero Leaders</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'overall', label: 'Top 5 Overall' },
                  { id: 'FWD', label: 'FWD' },
                  { id: 'MID', label: 'MID' },
                  { id: 'DEF', label: 'DEF' },
                  { id: 'GK', label: 'GK' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setHeroFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                      heroFilter === cat.id
                        ? 'bg-[#800020] text-white shadow-md shadow-rose-950/50 border border-rose-800'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sofascore Style Leader Card */}
            {topPlayer ? (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                {/* Header Title */}
                <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-800/80">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-200">
                    {categoryTitle}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Fantasy Leaders
                  </span>
                </div>

                {/* Top Banner with #1 Player */}
                <div className="relative bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 px-6 pt-6 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    {/* Player Photo */}
                    <div className="relative">
                      <img
                        src={topPlayer.photoUrl}
                        alt={topPlayer.name}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/80 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => navigate(`?modal=playerProfile&playerId=${topPlayer.id}`)}
                      />
                      <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded uppercase shadow">
                        {topPlayer.position}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                        #1 Ranked SuperStar
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {topPlayer.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {teamMap.get(topPlayer.teamId)?.name || 'EPL Club'} · ₦{topPlayer.price || 6.0}M
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Total Points
                    </span>
                    <span className="text-2xl font-black text-amber-400">
                      {topPlayer.fantasyPoints || 0} pts
                    </span>
                  </div>
                </div>

                {/* Solid Accent Banner for #1 */}
                <div className="bg-emerald-800 px-6 py-3 flex items-center justify-between text-white font-bold text-xs shadow-inner">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-lg bg-emerald-950 text-white font-black flex items-center justify-center text-xs shadow">
                      1
                    </span>
                    <span className="font-extrabold tracking-wide">{topPlayer.name}</span>
                    <span className="text-emerald-200 text-[11px]">
                      {topPlayer.position} · ₦{topPlayer.price || 6.0}M
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-black text-amber-300">{topPlayer.fantasyPoints || 0} pts</span>
                    <button
                      onClick={() => handleBuyPlayer(topPlayer)}
                      disabled={selectedPlayerIds.includes(topPlayer.id) || isGameweekLocked || remainingBudget < (topPlayer.price || 6.0)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase transition-all cursor-pointer ${
                        selectedPlayerIds.includes(topPlayer.id)
                          ? 'bg-emerald-950 text-emerald-300 cursor-not-allowed'
                          : 'bg-white text-emerald-950 hover:bg-emerald-50 shadow'
                      }`}
                    >
                      {selectedPlayerIds.includes(topPlayer.id) ? 'Owned' : 'Buy'}
                    </button>
                  </div>
                </div>

                {/* Rows for Ranks 2 to 5 */}
                <div className="divide-y divide-slate-800/80 bg-slate-950">
                  {restPlayers.map((player, idx) => {
                    const rank = idx + 2;
                    const isOwned = selectedPlayerIds.includes(player.id);
                    const canAfford = remainingBudget >= (player.price || 6.0);

                    return (
                      <div 
                        key={player.id}
                        className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-slate-400 font-bold flex items-center justify-center text-xs border border-slate-800">
                            {rank}
                          </span>
                          
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => navigate(`?modal=playerProfile&playerId=${player.id}`)}
                          />

                          <div>
                            <h5 className="font-bold text-white text-xs hover:text-amber-400 transition-colors cursor-pointer" onClick={() => navigate(`?modal=playerProfile&playerId=${player.id}`)}>
                              {player.name}
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              {player.position} · ₦{player.price || 6.0}M
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <span className="font-black text-amber-400 text-sm">
                            {player.fantasyPoints || 0} pts
                          </span>

                          <button
                            onClick={() => handleBuyPlayer(player)}
                            disabled={isOwned || isGameweekLocked || !canAfford}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                              isOwned
                                ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                                : 'bg-slate-900 hover:bg-amber-400 hover:text-slate-950 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isOwned ? 'Owned' : 'Buy'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">No players found in this category.</div>
            )}
          </div>
        );
      })()}

      {/* SUB-DASHBOARD 1: MY TEAM (SQUAD SELECTION & DYNAMIC FORMATION) */}
      {activeTab === 'my_team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PITCH COLUMN */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden">
              
              {/* Squad Name & Save Control */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                    Fantasy Team Name (Locked)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg sm:text-xl text-amber-400 tracking-tight">
                      {mySquad?.squadName || currentUser.fantasyTeamName || squadName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-[10px] font-bold text-slate-300 flex items-center gap-1 shadow-xs" title="Team Name is permanently locked upon fantasy signup to prevent database mixups">
                      <Lock className="w-3 h-3 text-amber-400" /> Locked
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Formation</span>
                      <span className="text-xs font-black text-amber-300">{currentFormationStr}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveTeam}
                    disabled={isSaving || isGameweekLocked || !isFormationValid}
                    className={`font-black px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isGameweekLocked || !isFormationValid
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 border border-emerald-500 active:scale-95'
                    }`}
                  >
                    {isGameweekLocked ? (
                      <>
                        <Lock className="w-4 h-4 text-rose-400" />
                        <span>Locked</span>
                      </>
                    ) : isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Save Team</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              
              {/* CHIPS ACTIVATION TRAY */}
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Gameweek Chips
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Select a chip and click "Save Team" to apply it before the 4hr deadline.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleChip('TC')}
                    disabled={isGameweekLocked || (!chips.tripleCaptainAvailable && activeChipThisGW !== 'TC')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                      activeChipThisGW === 'TC'
                        ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/50 ring-offset-1 ring-offset-slate-900 animate-pulse'
                        : chips.tripleCaptainAvailable && !isGameweekLocked
                        ? 'bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-400'
                        : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {activeChipThisGW === 'TC' ? 'TRIPLE CAPTAIN (PENDING - TAP TO CANCEL)' : 'TRIPLE CAPTAIN'}
                  </button>
                  <button
                    onClick={() => handleToggleChip('BB')}
                    disabled={isGameweekLocked || (!chips.benchBoostAvailable && activeChipThisGW !== 'BB')}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                      activeChipThisGW === 'BB'
                        ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-500/50 ring-offset-1 ring-offset-slate-900 animate-pulse'
                        : chips.benchBoostAvailable && !isGameweekLocked
                        ? 'bg-slate-800 text-blue-400 border border-slate-700 hover:border-blue-400'
                        : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {activeChipThisGW === 'BB' ? 'BENCH BOOST (PENDING - TAP TO CANCEL)' : 'BENCH BOOST'}
                  </button>

                </div>
              </div>

              {/* GAMEWEEK DEADLINE COUNTDOWN TICKER - ONLY SHOWN WHEN A SCHEDULED FIXTURE EXISTS */}
              {timeLeft && (
                <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border border-rose-800/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#800020] border border-rose-500/50 flex items-center justify-center text-amber-300 font-bold shadow animate-pulse shrink-0">
                      ⏱️
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider block">Gameweek Deadline Countdown</span>
                      <p className="text-xs font-bold text-white">Lock-in transfers and active chips 4 hours before first kickoff!</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/90 border border-rose-900/60 px-4 py-2 rounded-xl text-amber-300 font-mono font-black text-sm sm:text-base tracking-widest shadow-inner text-center">
                    {countdownStr}
                  </div>
                </div>
              )}

              {/* 2D FOOTBALL PITCH STAGE */}

              <div className="relative rounded-2xl bg-gradient-to-b from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border-2 border-emerald-500/30 p-4 sm:p-8 min-h-[580px] flex flex-col justify-between shadow-inner">
                {/* Pitch Line Graphics */}
                <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-20">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-b-2 border-x-2 border-white rounded-b-2xl" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white rounded-t-2xl" />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full" />
                </div>

                {/* Pitch Header Badge: Formation */}
                <div className="relative z-10 text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950/80 border border-amber-500/40 text-amber-300 text-xs font-black tracking-widest shadow-lg">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>FORMATION: {currentFormationStr}</span>
                  </span>
                </div>

                {/* FORWARDS ROW */}
                <div className="relative z-10 flex justify-center items-center gap-4 sm:gap-8 my-2">
                  {starterFWD.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      team={teamMap.get(player.teamId)}
                      isCaptain={captainId === player.id}
                      isViceCaptain={viceCaptainId === player.id}
                      livePoints={playerLivePtsMap.has(player.id) ? playerLivePtsMap.get(player.id) : undefined}
                      isSelected={swapSourceId === player.id}
                      isDisabled={isGameweekLocked}
                      onTap={() => handlePlayerTap(player.id)}
                      onSetCaptain={() => setCaptainId(player.id)}
                      onSetVice={() => setViceCaptainId(player.id)}
                    />
                  ))}
                </div>

                {/* MIDFIELDERS ROW */}
                <div className="relative z-10 flex justify-center items-center gap-3 sm:gap-6 my-2">
                  {starterMID.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      team={teamMap.get(player.teamId)}
                      isCaptain={captainId === player.id}
                      isViceCaptain={viceCaptainId === player.id}
                      livePoints={playerLivePtsMap.has(player.id) ? playerLivePtsMap.get(player.id) : undefined}
                      isSelected={swapSourceId === player.id}
                      isDisabled={isGameweekLocked}
                      onTap={() => handlePlayerTap(player.id)}
                      onSetCaptain={() => setCaptainId(player.id)}
                      onSetVice={() => setViceCaptainId(player.id)}
                    />
                  ))}
                </div>

                {/* DEFENDERS ROW */}
                <div className="relative z-10 flex justify-center items-center gap-3 sm:gap-6 my-2">
                  {starterDEF.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      team={teamMap.get(player.teamId)}
                      isCaptain={captainId === player.id}
                      isViceCaptain={viceCaptainId === player.id}
                      livePoints={playerLivePtsMap.has(player.id) ? playerLivePtsMap.get(player.id) : undefined}
                      isSelected={swapSourceId === player.id}
                      isDisabled={isGameweekLocked}
                      onTap={() => handlePlayerTap(player.id)}
                      onSetCaptain={() => setCaptainId(player.id)}
                      onSetVice={() => setViceCaptainId(player.id)}
                    />
                  ))}
                </div>

                {/* GOALKEEPER ROW */}
                <div className="relative z-10 flex justify-center items-center my-2">
                  {starterGK.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      team={teamMap.get(player.teamId)}
                      isCaptain={captainId === player.id}
                      isViceCaptain={viceCaptainId === player.id}
                      livePoints={playerLivePtsMap.has(player.id) ? playerLivePtsMap.get(player.id) : undefined}
                      isSelected={swapSourceId === player.id}
                      isDisabled={isGameweekLocked}
                      onTap={() => handlePlayerTap(player.id)}
                      onSetCaptain={() => setCaptainId(player.id)}
                      onSetVice={() => setViceCaptainId(player.id)}
                    />
                  ))}
                </div>
              </div>

              {/* BENCH ROSTER SECTION */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Substitute Bench (7 Players)</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Tap bench player then pitch player to swap
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                  {benchPlayers.map((player, idx) => {
                    const isGKSub = player.position === 'GK';
                    const outfieldIdx = benchPlayers.filter(p => p.position !== 'GK').indexOf(player);
                    const subLabel = isGKSub ? 'GK Sub' : `Sub ${outfieldIdx + 1}`;

                    return (
                      <div
                        key={player.id}
                        onClick={() => handlePlayerTap(player.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                          swapSourceId === player.id
                            ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-105'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                        }`}
                      >
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-800 text-amber-300 block w-max mx-auto mb-1 border border-slate-700">
                          {subLabel} ({player.position})
                        </span>
                        <p className="font-extrabold text-xs text-white truncate">{player.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{teamMap.get(player.teamId)?.shortName || 'Team'}</p>
                        {playerLivePtsMap.has(player.id) ? (
                          <div className="mt-1 bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] font-black">
                            {playerLivePtsMap.get(player.id)} pts
                          </div>
                        ) : (
                          <div className="mt-1 text-[9px] font-bold text-amber-400 leading-tight">
                            <span>Bought: ₦{(purchasePricesMap[player.id] ?? (player.price || 6.0)).toFixed(1)}m</span>
                            <span className="block text-[8px] text-slate-400">Curr: ₦{(player.price || 6.0).toFixed(1)}m</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT SIDEBAR: SQUAD INSTRUCTIONS & RULES */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Squad Formation Rules</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-400">Goalkeeper (GK)</span>
                  <span className={`font-black px-2.5 py-1 rounded text-xs ${starterGK.length === 1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                    {starterGK.length} / 1 (Squad: 2)
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-400">Defenders (DEF)</span>
                  <span className={`font-black px-2.5 py-1 rounded text-xs ${starterDEF.length >= 3 && starterDEF.length <= 5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                    {starterDEF.length} (3-5) | Squad: 5
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-400">Midfielders (MID)</span>
                  <span className={`font-black px-2.5 py-1 rounded text-xs ${starterMID.length >= 2 && starterMID.length <= 5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                    {starterMID.length} (2-5) | Squad: 5
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-400">Forwards (FWD)</span>
                  <span className={`font-black px-2.5 py-1 rounded text-xs ${starterFWD.length >= 1 && starterFWD.length <= 3 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                    {starterFWD.length} (1-3) | Squad: 3
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-amber-400">Club Quota</span>
                  <span className="font-black px-2.5 py-1 rounded text-xs bg-amber-950 text-amber-300 border border-amber-800">
                    Max 3 Per Club
                  </span>
                </div>
              </div>

              {/* Captain & Vice Captain Summary */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                  Designated Leadership
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">C</span>
                    Captain (2x Pts):
                  </span>
                  <span className="font-extrabold text-amber-300">
                    {players.find(p => p.id === captainId)?.name || 'Not Set'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-950 font-black text-[10px] flex items-center justify-center">V</span>
                    Vice-Captain:
                  </span>
                  <span className="font-extrabold text-slate-200">
                    {players.find(p => p.id === viceCaptainId)?.name || 'Not Set'}
                  </span>
                </div>
              </div>

              {/* How To Instructions */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-400">
                <p className="font-black text-slate-200 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>How to make substitutions</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                  <li>Tap any player card on the pitch or bench to select.</li>
                  <li>Tap another player on the bench/pitch to swap.</li>
                  <li>System automatically validates formation limits.</li>
                  <li>Click "Save Team" to submit changes before kickoff.</li>
                </ol>
              </div>
              <div className="mt-4 p-4 bg-rose-950/40 rounded-2xl border border-rose-900/50 space-y-3">
                <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider">Danger Zone</h4>
                <p className="text-[11px] text-slate-400">Permanently delete your fantasy team and wipe your points.</p>
                <button
                  onClick={() => setShowResetSquadModal(true)}
                  className="w-full py-2 rounded-xl text-xs font-bold text-rose-500 border border-rose-900/50 hover:bg-rose-950/80 transition-all uppercase tracking-wider"
                >
                  Delete Fantasy Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-DASHBOARD 2: TRANSFERS & MARKETPLACE (POINT DEDUCTION ENGINE) */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          {/* REAL-TIME TRANSFER SUMMARY BANNER */}
          <div className="bg-[#800020] border-2 border-red-800 p-5 rounded-3xl shadow-2xl text-white space-y-4 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-900/80 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  <span>Transfer Market & Point Deduction Engine</span>
                </h2>
                
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Manage your 18-man roster within ₦100.0M budget. Each user gets 2 Free Transfers per Gameweek (Max 3 players per Club).
                </p>
                {timeLeft && !isGameweekLocked && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300">Locks in:</span>
                    <div className="flex items-baseline gap-1 font-black text-white ml-1">
                      {timeLeft.d > 0 && <><span className="text-sm">{timeLeft.d}</span><span className="text-[9px] text-emerald-400 mr-1">d</span></>}
                      <span className="text-sm">{timeLeft.h}</span><span className="text-[9px] text-emerald-400 mr-1">h</span>
                      <span className="text-sm">{timeLeft.m}</span><span className="text-[9px] text-emerald-400 mr-1">m</span>
                      <span className="text-sm">{timeLeft.s}</span><span className="text-[9px] text-emerald-400">s</span>
                    </div>
                  </div>
                )}

              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleToggleChip('WC')}
                  disabled={isGameweekLocked || (!chips.wildcardAvailable && activeChipThisGW !== 'WC')}
                  className={`font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeChipThisGW === 'WC'
                      ? 'bg-[#1cd861] text-slate-950 shadow-md ring-2 ring-[#1cd861]/50 animate-pulse'
                      : chips.wildcardAvailable && !isGameweekLocked
                      ? 'bg-slate-900 text-[#1cd861] border border-[#1cd861]/50 hover:border-[#1cd861]'
                      : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {activeChipThisGW === 'WC' ? 'CANCEL WILDCARD' : 'PLAY WILDCARD'}
                </button>

                <button
                  onClick={handleConfirmTransfers}
                  disabled={isSaving || isGameweekLocked || isBudgetExceeded || isSquadSizeInvalid || is18PositionalInvalid}
                className={`font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isGameweekLocked || isBudgetExceeded || isSquadSizeInvalid || is18PositionalInvalid
                    ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-amber-950/50 border border-amber-300 active:scale-95'
                }`}
              >
                {isGameweekLocked ? (
                  <>
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Transfers Locked</span>
                  </>
                ) : isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Confirm & Save Transfers</span>
                  </>
                )}
              </button>
              </div>
            </div>

            {/* REAL-TIME SUMMARY STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Free Transfers */}
              <div className="bg-slate-950/70 border border-red-900/60 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300/80 block">
                    {hadFullSquad ? 'Free Transfers Remaining' : 'Initial Selection'}
                  </span>
                  <span className="text-xl font-black text-amber-300">
                    {hadFullSquad ? (isWildcardActive ? 'Unlimited (WC)' : `${freeTransfersRemaining} / 2`) : 'Unlimited'}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Cost of Current Changes */}
              <div className={`border p-4 rounded-2xl flex items-center justify-between ${
                costOfChanges > 0 
                  ? 'bg-rose-950/90 border-rose-500 shadow-lg ring-2 ring-rose-500/30' 
                  : 'bg-slate-950/70 border-red-900/60'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300/80 block">
                    Cost of Current Changes
                  </span>
                  <span className={`text-xl font-black ${costOfChanges > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {costOfChanges === 0 ? '0 pts' : `-${costOfChanges} pts`}
                  </span>
                </div>
                {costOfChanges > 0 ? (
                  <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md animate-bounce">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Card 3: Remaining Budget */}
              <div className={`border p-4 rounded-2xl flex items-center justify-between ${
                remainingBudget < 0
                  ? 'bg-rose-950/90 border-rose-500'
                  : 'bg-slate-950/70 border-red-900/60'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300/80 block">
                    Remaining Budget
                  </span>
                  <span className={`text-xl font-black ${remainingBudget < 0 ? 'text-rose-400' : 'text-amber-300'}`}>
                    ₦{remainingBudget.toFixed(1)}M
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-rose-200/70 font-bold block">Total Budget</span>
                  <span className="text-xs font-black text-white">₦100.0M</span>
                </div>
              </div>
            </div>
          </div>

          {/* TRANSFER WORKSPACE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: YOUR 18-MAN ROSTER */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-amber-400" />
                    <span>Your 18-Man Roster</span>
                  </h3>
                  <span className="text-xs font-black text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    {selectedPlayerIds.length} / 18 Players
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {selectedPlayers.map((player) => {
                    const isNewInSquad = !baselinePlayerIds.includes(player.id);
                    return (
                      <div
                        key={player.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isNewInSquad
                            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-xs text-amber-400">
                            {player.position}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-xs text-white">{player.name}</p>
                              {isNewInSquad && (
                                <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-black rounded uppercase">
                                  NEW IN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {teamMap.get(player.teamId)?.name || 'Team'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Price</span>
                            <span className="text-xs font-black text-amber-400">
                              Bought: ₦{(purchasePricesMap[player.id] ?? (player.price || 6.0)).toFixed(1)}m | Current: ₦{(player.price || 6.0).toFixed(1)}m
                            </span>
                          </div>
                          <button
                            onClick={() => handleSellPlayer(player.id)}
                            disabled={isGameweekLocked}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-black uppercase transition-all cursor-pointer disabled:opacity-50"
                          >
                            Transfer Out
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: MARKETPLACE PLAYER SELECTION POOL */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    <span>EPL Player Marketplace</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    Filter & Buy Replacements
                  </span>
                </div>

                
                {/* SEARCH & FILTERS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search player or team..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <select
                      value={positionFilter}
                      onChange={(e) => setPositionFilter(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">All Pos</option>
                      <option value="GK">Goalkeepers</option>
                      <option value="DEF">Defenders</option>
                      <option value="MID">Midfielders</option>
                      <option value="FWD">Forwards</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">All Teams</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.shortName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">All Prices</option>
                      <option value="UNDER_6">Under ₦6.0M</option>
                      <option value="6_TO_8">₦6.0M - ₦8.0M</option>
                      <option value="OVER_8">Over ₦8.0M</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 mb-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                  <span className="text-xs text-slate-400 font-bold">Sort Market:</span>
                  <select
                    value={marketSortOption}
                    onChange={(e) => setMarketSortOption(e.target.value as any)}
                    className="bg-slate-950 text-amber-300 font-bold border border-slate-800 rounded-lg px-3 py-1 text-xs focus:outline-none"
                  >
                    <option value="default">Default (Price & Pts)</option>
                    <option value="tsb_desc">Highest Ownership % (TSB%)</option>
                    <option value="points_desc">Highest Total Points</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="price_asc">Price: Low to High</option>
                  </select>
                </div>

                {/* MARKETPLACE PLAYERS LIST */}
                <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {filteredMarketplace.map((player) => {
                    const isAlreadySelected = selectedPlayerIds.includes(player.id);
                    const canAfford = remainingBudget >= (player.price || 6.0);
                    const owners = (allSquads || []).filter(s => s.playerIds?.includes(player.id)).length;
                    const tsbPercent = ((owners / totalSquadsCount) * 100).toFixed(1);

                    return (
                      <div
                        key={player.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isAlreadySelected
                            ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                            : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`?modal=playerProfile&playerId=${player.id}`)}>
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-xs text-white">{player.name}</p>
                              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-amber-400 text-[9px] font-black rounded uppercase">
                                {player.position}
                              </span>
                              {player.isSuspended && (
                                <span className="px-1.5 py-0.5 bg-red-950 border border-red-600 text-red-300 text-[9px] font-black rounded uppercase animate-pulse">
                                  Suspended ({player.suspensionWeeks || 1} GW)
                                </span>
                              )}
                              {player.injuryStatus && player.injuryStatus !== 'Fit' && (
                                <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[9px] font-black rounded uppercase">
                                  {player.injuryStatus}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {teamMap.get(player.teamId)?.name || 'Team'} • {player.goals} Goals • {player.assists} Assists
                            </span>
                          </div>
                        </div>

                        
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block border-r border-slate-700 pr-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">TSB %</span>
                            <span className="text-xs font-black text-amber-300">{tsbPercent}%</span>
                          </div>
                          <div className="text-right hidden sm:block border-r border-slate-700 pr-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pts</span>
                            <span className="text-xs font-black text-white">{player.fantasyPoints || 0}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Price</span>
                            <span className="text-xs font-black text-amber-400">
                              {isAlreadySelected ? (
                                `Bought: ₦${(purchasePricesMap[player.id] ?? (player.price || 6.0)).toFixed(1)}m | Current: ₦${(player.price || 6.0).toFixed(1)}m`
                              ) : (
                                `₦${(player.price || 6.0).toFixed(1)}m`
                              )}
                            </span>
                          </div>


                          <button
                            onClick={() => handleBuyPlayer(player)}
                            disabled={isAlreadySelected || isGameweekLocked || !canAfford || (selectedPlayerIds.length >= 18 && !replacingPlayerId)}
                            className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                              isAlreadySelected
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : !canAfford
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
                            }`}
                          >
                            {isAlreadySelected ? (
                              <span>Owned</span>
                            ) : !canAfford ? (
                              <span>No Budget</span>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Buy Player</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-DASHBOARD 3: GLOBAL LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Global Manager Leaderboard</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official standings for all fantasy managers. Click any manager to view their squad & gameweek history.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {(() => {
              const leaderboardSquads = [...registeredSquads].sort((a, b) => {
                const ptsDiff = (b.totalPoints || 0) - (a.totalPoints || 0);
                if (ptsDiff !== 0) return ptsDiff;
                return (a.squadName || '').localeCompare(b.squadName || '');
              });
              return leaderboardSquads.map((squad, idx) => {
                const rank = idx + 1;
                const isLeader = rank === 1;
                const isMe = (squad.userEmail || '').toLowerCase() === (currentUser?.email || '').toLowerCase();
                
                return (
                  <div
                    key={squad.id}
                    onClick={() => openManagerSquadModal({ squadId: squad.id })}
                    className={`bg-slate-900 border ${isMe ? 'border-amber-400/50' : 'border-slate-800'} p-3 sm:px-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:bg-slate-800/60 transition-all cursor-pointer shadow-sm hover:shadow-md`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-80 group-hover:opacity-100 transition-opacity ${isLeader ? 'bg-emerald-400' : isMe ? 'bg-amber-400' : 'bg-amber-500/50'}`}></div>
                    
                    <div className="font-black text-slate-600 text-base sm:text-lg w-6 text-center shrink-0">
                      #{rank}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors truncate flex items-center gap-2">
                          {squad.squadName}
                          {isMe && <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">YOU</span>}
                        </h5>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                          {squad.userName}
                        </p>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mr-4">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-500 mb-1">Trades</span>
                          <span className="text-white">{squad.transfersMade || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-500 mb-1">Point Hits</span>
                          {squad.pointHits && squad.pointHits > 0 ? (
                            <span className="text-rose-400 font-black">-{squad.pointHits} pts</span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-slate-500 mb-1">GW Pts</span>
                          <span className="text-slate-200">{squad.gameweekPoints || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0 bg-slate-950/60 backdrop-blur-sm px-4 sm:px-5 py-2 sm:py-3 rounded-xl border border-slate-800/80">
                      <span className="block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-0.5">
                        TOTAL PTS
                      </span>
                      <span className="text-lg sm:text-2xl font-black text-amber-400 tracking-tight">
                        {squad.totalPoints || 0}
                      </span>
                    </div>

                    <div className="hidden lg:block shrink-0 pl-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openManagerSquadModal({ squadId: squad.id }); }}
                        className="p-2 bg-slate-950 group-hover:bg-amber-400 group-hover:text-slate-950 border border-slate-800 text-slate-300 rounded-xl transition-all shadow-sm"
                        title="View Squad"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* SUB-DASHBOARD 4: PRIVATE MINI-LEAGUES */}
      {activeTab === 'mini_leagues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CREATE MINI LEAGUE */}
            <form onSubmit={handleCreateMiniLeague} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Create Private Mini-League</span>
              </h3>
              <p className="text-xs text-slate-400">
                Compete against friends and colleagues in your own private league.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="e.g. Epe High School Alumni League"
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#800020] hover:bg-red-900 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Create League & Get Code
              </button>
            </form>

            {/* JOIN MINI LEAGUE */}
            <form onSubmit={handleJoinMiniLeague} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Join Mini-League via Code</span>
              </h3>
              <p className="text-xs text-slate-400">
                Enter the unique 6-character code provided by your league owner.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="e.g. X8K9L2"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-amber-400 placeholder-slate-500 uppercase focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Join Mini-League
              </button>
            </form>
          </div>

          {/* LIST OF YOUR MINI LEAGUES */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Your Active Mini-Leagues & Standings</span>
            </h3>

            <div className="space-y-6">
              {miniLeagues.map((league) => {
                // Find member squads and sort by total points then alphabetical team name
                const memberEmails = (league.memberEmails || []).map(e => (e || '').toLowerCase());
                const leagueSquads = registeredSquads
                  .filter(s => memberEmails.includes((s.userEmail || '').toLowerCase()))
                  .sort((a, b) => {
                    const ptsDiff = (b.totalPoints || 0) - (a.totalPoints || 0);
                    if (ptsDiff !== 0) return ptsDiff;
                    return (a.squadName || '').localeCompare(b.squadName || '');
                  });

                return (
                  <div key={league.id} className="p-5 bg-slate-900 rounded-3xl border border-slate-800 space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="font-black text-base text-white flex items-center gap-2">
                          <span>{league.name}</span>
                          <span className="text-[10px] font-extrabold bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                            {leagueSquads.length} Manager{leagueSquads.length !== 1 ? 's' : ''}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">League Admin: <strong className="text-slate-200">{league.ownerName}</strong></p>
                      </div>

                      <button
                        onClick={() => copyCodeToClipboard(league.code)}
                        className="px-3.5 py-1.5 bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-xs font-black rounded-xl flex items-center gap-2 hover:bg-slate-800 cursor-pointer self-start sm:self-auto"
                      >
                        <span>Code: {league.code}</span>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>

                    {/* MINI-LEAGUE STANDINGS TABLE */}
                    <div className="space-y-2">
                      {leagueSquads.map((squad, idx) => {
                        const rank = idx + 1;
                        const isLeader = rank === 1;
                        const isMe = (squad.userEmail || '').toLowerCase() === (currentUser?.email || '').toLowerCase();
                        
                        return (
                          <div
                            key={squad.id}
                            onClick={() => openManagerSquadModal({ squadId: squad.id })}
                            className={`bg-slate-900 border ${isMe ? 'border-amber-400/50' : 'border-slate-800'} p-3 rounded-2xl flex items-center gap-3 sm:gap-4 relative overflow-hidden group hover:bg-slate-800/60 transition-all cursor-pointer shadow-sm`}
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl opacity-80 group-hover:opacity-100 transition-opacity ${isLeader ? 'bg-emerald-400' : isMe ? 'bg-amber-400' : 'bg-amber-500/50'}`}></div>
                            
                            <div className="font-black text-slate-600 text-sm sm:text-base w-5 sm:w-6 text-center shrink-0">
                              #{rank}
                            </div>
                            
                            <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors truncate flex items-center gap-2">
                                  {squad.squadName}
                                  {isMe && <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">YOU</span>}
                                </h5>
                                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                                  {squad.userName}
                                </p>
                              </div>

                              <div className="hidden sm:flex items-center gap-4 text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">
                                <div className="flex flex-col items-center">
                                  <span className="text-slate-500 mb-1">Trades</span>
                                  <span className="text-white">{squad.transfersMade || 0}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-slate-500 mb-1">GW Pts</span>
                                  <span className="text-slate-200">{squad.gameweekPoints || 0}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0 bg-slate-950/60 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-800/80">
                              <span className="block text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-0.5">
                                TOTAL
                              </span>
                              <span className="text-base sm:text-lg font-black text-amber-400 tracking-tight">
                                {squad.totalPoints || 0}
                              </span>
                            </div>

                            <div className="hidden lg:block shrink-0 pl-1 sm:pl-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); openManagerSquadModal({ squadId: squad.id }); }}
                                className="p-1.5 bg-slate-950 group-hover:bg-amber-400 group-hover:text-slate-950 border border-slate-800 text-slate-300 rounded-xl transition-all shadow-sm"
                                title="Inspect"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* INSIGHTS & STATS TAB */}
      {(activeTab as string) === 'insights' && (!statsData ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 mt-4 font-bold animate-pulse">Loading fantasy stats...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Captaincy Favorite Hero */}
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-4 pl-1">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Global Captaincy Favorite</span>
            </h2>
            {captaincyFavorite ? (
              <div className="bg-gradient-to-r from-[#800020] via-rose-900 to-amber-700 p-6 sm:p-8 rounded-3xl shadow-2xl border border-amber-400/30 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
                <img 
                  src={captaincyFavorite.photoUrl} 
                  alt={captaincyFavorite.name} 
                  className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-full border-4 border-amber-300 shadow-xl relative z-10 bg-slate-950"
                />
                <div className="text-center sm:text-left relative z-10 space-y-2">
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 uppercase tracking-widest rounded-full">
                    Most Captained 
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">{captaincyFavorite.name}</h3>
                  <p className="text-amber-200 text-sm font-bold uppercase tracking-widest">
                    {teamMap.get(captaincyFavorite.teamId)?.name} • {captaincyFavorite.position}
                  </p>
                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs font-bold text-rose-100">
                    <span className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                      Owned by {( (captaincyFavorite.ownedByCount || 0) / (allSquads.length || 1) * 100 ).toFixed(1)}%
                    </span>
                    <span className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                      Total Points: {captaincyFavorite.fantasyPoints || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-sm font-bold">
                No captaincy data available yet.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Performers (Gameweek Kings) */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 pl-1">
                <Flame className="w-5 h-5 text-rose-400" />
                <span>Gameweek Kings</span>
              </h2>
              <div className="flex gap-4 overflow-x-auto pt-4 pb-4 snap-x custom-scrollbar">
                {topPerformers && topPerformers.map((p, idx) => (
                  <div key={p.id} className="min-w-[200px] flex-shrink-0 bg-slate-900 border border-slate-800 rounded-3xl p-4 snap-start relative group">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center text-xs font-black text-slate-400 shadow-lg">
                      #{idx + 1}
                    </div>
                    <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-400 mb-3 bg-slate-800" />
                    <div className="text-center">
                      <p className="font-extrabold text-sm text-white truncate px-2">{p.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">{p.position}</p>
                      <div className="bg-amber-400/10 text-amber-400 border border-amber-400/20 py-2 rounded-xl text-lg font-black">
                        {p.fantasyPoints || 0} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Trends (Most Bought) */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2 pl-1">
                <ArrowUp className="w-5 h-5 text-emerald-400" />
                <span>Market Trends (Most Bought)</span>
              </h2>
              <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
                {mostOwnedPlayers && mostOwnedPlayers.map((p, idx) => {
                  const ownedCount = p.ownedByCount || 0;
                  const percent = allSquads.length > 0 ? ((ownedCount / allSquads.length) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl"></div>
                      <div className="font-black text-slate-600 text-lg w-4 text-right">{idx + 1}</div>
                      <img src={p.photoUrl} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700" />
                      <div className="flex-1">
                        <p className="font-black text-white text-sm">{p.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{teamMap.get(p.teamId)?.shortName} • {p.position}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase">Selected By</div>
                        <div className="text-sm font-black text-white">{percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* FANTASY ISOLATED BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-800 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)] pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-2 relative">
          <button
            onClick={() => setActiveTab('my_team')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'my_team' ? 'text-amber-300 bg-amber-900/40 border border-amber-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Shirt className={`transition-all ${activeTab === 'my_team' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'my_team' ? 'text-[10px]' : 'text-[9px]'}`}>Squad</span>
          </button>
          
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'transfers' ? 'text-amber-300 bg-amber-900/40 border border-amber-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ArrowRightLeft className={`transition-all ${activeTab === 'transfers' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'transfers' ? 'text-[10px]' : 'text-[9px]'}`}>Transfer</span>
          </button>
          
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'leaderboard' ? 'text-amber-300 bg-amber-900/40 border border-amber-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Trophy className={`transition-all ${activeTab === 'leaderboard' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'leaderboard' ? 'text-[10px]' : 'text-[9px]'}`}>Global</span>
          </button>

          <button
            onClick={() => setActiveTab('mini_leagues')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'mini_leagues' ? 'text-amber-300 bg-amber-900/40 border border-amber-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Users className={`transition-all ${activeTab === 'mini_leagues' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'mini_leagues' ? 'text-[10px]' : 'text-[9px]'}`}>League</span>
          </button>

          <button
            onClick={() => setActiveTab('hero_cards')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'hero_cards' ? 'text-amber-300 bg-amber-900/40 border border-amber-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Crown className={`transition-all ${activeTab === 'hero_cards' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'hero_cards' ? 'text-[10px]' : 'text-[9px]'}`}>Stars</span>
          </button>
          
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeTab === 'insights' ? 'text-amber-300 bg-amber-900/40 border border-amber-500/30 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Sparkles className={`transition-all ${activeTab === 'insights' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <span className={`font-bold tracking-wide transition-all ${activeTab === 'insights' ? 'text-[10px]' : 'text-[9px]'}`}>Stats</span>
          </button>
        </div>
      </div>

      {showResetSquadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
              Delete Fantasy Team
            </h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Are you sure? This will permanently delete your squad and reset your fantasy points. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetSquadModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSquad}
                disabled={isResettingSquad}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isResettingSquad ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER SQUAD INSPECTION MODAL */}
      <ManagerSquadModal
    allSquads={allSquads}
    players={players}
    teams={teams}
    matches={matches}
    currentUserEmail={currentUser.email}
  />
    </div>
  );
};

// COMPONENT: PITCH PLAYER CARD (2D Football Pitch Jersey Widget)
interface PitchPlayerCardProps {
  player: Player;
  team?: Team;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  livePoints?: number;
  purchasePrice?: number;
  onTap: () => void;
  onSetCaptain: () => void;
  onSetVice: () => void;
}

const PitchPlayerCard: React.FC<PitchPlayerCardProps> = ({
  player,
  team,
  isCaptain,
  isViceCaptain,
  isSelected,
  isDisabled,
  livePoints,
  purchasePrice,
  onTap,
  onSetCaptain,
  onSetVice
}) => {
  return (
    <div className="flex flex-col items-center group relative">
      {/* Player Card Container */}
      <div
        onClick={onTap}
        className={`relative p-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center w-20 sm:w-24 ${
          isSelected
            ? 'bg-amber-400/30 border-2 border-amber-400 ring-4 ring-amber-400/50 scale-110 shadow-2xl z-20'
            : 'bg-slate-950/80 hover:bg-slate-900/90 border border-slate-700/80 hover:scale-105 shadow-xl z-10'
        }`}
      >
        {/* Leadership Badges Overlay */}
        {isCaptain && (
          <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-slate-950 z-30">
            C
          </span>
        )}
        {isViceCaptain && !isCaptain && (
          <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-slate-950 z-30">
            V
          </span>
        )}

        {/* Player Avatar */}
        <img
          src={player.photoUrl}
          alt={player.name}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-600 mb-1"
        />

        {/* Player Name */}
        <p className="font-extrabold text-[11px] text-white truncate max-w-[80px] text-center leading-tight">
          {player.name}
        </p>

        {/* Team Short Name */}
        <p className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">
          {team?.shortName || 'EPL'}
        </p>

        {/* Price / Points Tag */}
        <span className="mt-1 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-black text-amber-300 max-w-[110px] text-center truncate">
          {livePoints !== undefined ? (
            `${livePoints} pts`
          ) : (
            `Bought: ₦${(purchasePrice ?? (player.price || 6.0)).toFixed(1)}m | Curr: ₦${(player.price || 6.0).toFixed(1)}m`
          )}
        </span>
      </div>

      {/* Leadership Quick Action Dropdown on Hover/Group */}
      {!isDisabled && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-7 flex items-center gap-1 z-30 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={(e) => { e.stopPropagation(); onSetCaptain(); }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
              isCaptain ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-300 hover:bg-amber-400 hover:text-slate-950'
            }`}
          >
            Captain
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSetVice(); }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer ${
              isViceCaptain ? 'bg-slate-300 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-200 hover:text-slate-950'
            }`}
          >
            Vice
          </button>
        </div>
      )}
    </div>
  );
};
