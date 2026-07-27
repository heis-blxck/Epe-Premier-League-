import { useBackHandler } from '../utils/backManager';
import React, { useState, useMemo } from 'react';
import { Match } from '../types';
import { MatchCard } from './MatchCard';
import { 
  Flame, Calendar, Activity, Search, X, LayoutGrid, LayoutList, 
  Filter, SlidersHorizontal, RefreshCw, Trophy, ChevronLeft, ChevronRight, 
  Check, RotateCcw 
} from 'lucide-react';
import { formatMatchDisplayTime, calculateMatchClock } from '../utils/matchClock';

interface TodayMatchesStripProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string;
}

export const TodayMatchesStrip: React.FC<TodayMatchesStripProps> = ({
  matches = [],
  onSelectMatch,
  selectedMatchId
}) => {
  const [filter, setFilter] = useState<'all' | 'live' | 'finished' | 'scheduled'>('all');
  const [competitionFilter, setCompetitionFilter] = useState<'all' | 'League' | 'Cup'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [matchdayFilter, setMatchdayFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  useBackHandler(() => {
    if (showFilterModal) {
      setShowFilterModal(false);
      return true;
    }
    return false;
  }, [showFilterModal]);


  // Date Navigation State
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(false);

  // Unique Teams List for Filter Modal
  const allTeams = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (matches || []).forEach(m => {
      if (m.homeTeam) map.set(m.homeTeam.id || m.homeTeam.name, { id: m.homeTeam.id || m.homeTeam.name, name: m.homeTeam.name });
      if (m.awayTeam) map.set(m.awayTeam.id || m.awayTeam.name, { id: m.awayTeam.id || m.awayTeam.name, name: m.awayTeam.name });
    });
    return Array.from(map.values());
  }, [matches]);

  // Unique Matchdays
  const allMatchdays = useMemo(() => {
    const days = new Set<number>();
    (matches || []).forEach(m => {
      if (m.matchday) days.add(m.matchday);
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [matches]);

  // Target Date calculations
  const targetDateObj = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + selectedDateOffset);
    return d;
  }, [selectedDateOffset]);

  const targetDateISO = targetDateObj.toISOString().split('T')[0];

  const displayDateText = useMemo(() => {
    if (selectedDateOffset === 0) return 'Today';
    if (selectedDateOffset === 1) return 'Tomorrow';
    if (selectedDateOffset === -1) return 'Yesterday';
    
    return targetDateObj.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }, [selectedDateOffset, targetDateObj]);

  const handlePrevDate = () => {
    setSelectedDateOffset(prev => prev - 1);
    setIsDateFilterActive(true);
  };

  const handleNextDate = () => {
    setSelectedDateOffset(prev => prev + 1);
    setIsDateFilterActive(true);
  };

  // Extract unique team names/shortNames for quick-search chips
  const teamChips = Array.from(
    new Set(
      matches.flatMap(m => [
        m.homeTeam?.name,
        m.homeTeam?.shortName,
        m.awayTeam?.name,
        m.awayTeam?.shortName
      ]).filter((t): t is string => Boolean(t))
    )
  ).slice(0, 8);

  // Active match predicate
  const isMatchActive = (m: Match) => {
    if (!m) return false;
    const statusStr = String(m.status || '').toUpperCase();
    const periodStr = String(m.period || '').toUpperCase();
    return (
      statusStr === 'LIVE' ||
      statusStr === 'HALF-TIME' ||
      statusStr === 'FIRST_HALF' ||
      statusStr === 'SECOND_HALF' ||
      statusStr === 'HALF_TIME' ||
      periodStr === '1ST HALF' ||
      periodStr === '2ND HALF' ||
      periodStr === 'HALF-TIME'
    );
  };

  const liveMatches = (matches || []).filter(isMatchActive);

  const filteredMatches = (matches || []).filter(m => {
    // Competition filter
    if (competitionFilter !== 'all' && m.competition_type !== competitionFilter) return false;
    
    // Feed Deduplication: Exclude active matches from the standard list when 'all' is selected
    // so active matches only appear in the Featured Banner
    if (filter === 'all' && isMatchActive(m)) return false;

    // Status filter
    if (filter === 'live' && !isMatchActive(m)) return false;
    if (filter === 'finished' && m.status !== 'Full-Time' && m.status !== 'Penalties' && m.period !== 'Full-Time') return false;
    if (filter === 'scheduled' && (m.status !== 'Scheduled' || isMatchActive(m))) return false;

    // Team filter
    if (teamFilter !== 'all') {
      const hId = m.homeTeamId || m.homeTeam?.id || m.homeTeam?.name;
      const aId = m.awayTeamId || m.awayTeam?.id || m.awayTeam?.name;
      if (hId !== teamFilter && aId !== teamFilter && m.homeTeam?.name !== teamFilter && m.awayTeam?.name !== teamFilter) {
        return false;
      }
    }

    // Matchday filter
    if (matchdayFilter !== 'all') {
      if (String(m.matchday) !== matchdayFilter) return false;
    }

    // Date filter (when explicitly navigated)
    if (isDateFilterActive) {
      if (m.date) {
        const mDateISO = m.date.includes('T') ? m.date.split('T')[0] : m.date;
        if (mDateISO !== targetDateISO) {
          return false;
        }
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const homeName = (m.homeTeam?.name || '').toLowerCase();
      const homeShort = (m.homeTeam?.shortName || '').toLowerCase();
      const awayName = (m.awayTeam?.name || '').toLowerCase();
      const awayShort = (m.awayTeam?.shortName || '').toLowerCase();
      const venue = (m.venue || '').toLowerCase();
      const referee = (m.referee || '').toLowerCase();
      const matchday = `matchday ${m.matchday}`.toLowerCase();
      const gw = `gw${m.matchday}`.toLowerCase();
      const comp = (m.competition_type || '').toLowerCase();
      const status = (m.status || '').toLowerCase();

      const matchesSearch = 
        homeName.includes(q) ||
        homeShort.includes(q) ||
        awayName.includes(q) ||
        awayShort.includes(q) ||
        venue.includes(q) ||
        referee.includes(q) ||
        matchday.includes(q) ||
        gw.includes(q) ||
        comp.includes(q) ||
        status.includes(q) ||
        String(m.matchday) === q;

      if (!matchesSearch) return false;
    }

    return true;
  });

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetAllFilters = () => {
    setFilter('all');
    setCompetitionFilter('all');
    setTeamFilter('all');
    setMatchdayFilter('all');
    setSearchQuery('');
    setIsDateFilterActive(false);
    setSelectedDateOffset(0);
  };

  return (
    <div className="space-y-4">
      
      {/* 1. HORIZONTAL DATE & FILTER NAVIGATION BAR (PRIMARY MATCH CENTER TOOLBAR) */}
      <div 
        className="my-1 shadow-md rounded-2xl bg-slate-900/90 border border-slate-800 w-full flex flex-row items-center justify-between gap-1.5 sm:gap-2.5 p-2 sm:p-2.5 box-border max-w-full"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Element A: Filter Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className="shrink flex-shrink-1 flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-xs cursor-pointer shadow-sm transition-all hover:bg-gray-100 active:scale-95 min-w-0"
          style={{
            borderRadius: '20px',
            backgroundColor: '#FFFFFF',
            color: '#111827',
            padding: '6px 12px',
            flexShrink: 1,
            border: (teamFilter !== 'all' || competitionFilter !== 'all' || matchdayFilter !== 'all') 
              ? '2px solid #3B82F6' 
              : '1px solid #E5E7EB'
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-900 stroke-[2.2] shrink-0" />
          <span className="truncate">Filter</span>
          {(teamFilter !== 'all' || competitionFilter !== 'all' || matchdayFilter !== 'all') && (
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
          )}
        </button>

        {/* Element B: 'Live' Toggle Pill */}
        <button
          onClick={() => {
            setFilter(prev => prev === 'live' ? 'all' : 'live');
          }}
          className="shrink flex-shrink-1 flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-xs cursor-pointer shadow-sm transition-all active:scale-95 min-w-0"
          style={
            filter === 'live' || (liveMatches.length > 0 && filter !== 'all')
              ? {
                  borderRadius: '20px',
                  backgroundColor: 'rgba(192, 57, 43, 0.12)',
                  color: '#C0392B',
                  border: '1.5px solid #C0392B',
                  padding: '6px 12px',
                  flexShrink: 1
                }
              : {
                  borderRadius: '20px',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  padding: '6px 12px',
                  flexShrink: 1
                }
          }
        >
          <span className="truncate">Live</span>
          <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 items-center justify-center shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C0392B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#C0392B]"></span>
          </span>
          {liveMatches.length > 0 && (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#C0392B] text-white shrink-0">
              {liveMatches.length}
            </span>
          )}
        </button>

        {/* Element C: The Date Selector (Main Navigation) */}
        <div
          className="shadow-sm flex-1 min-w-0 flex-shrink-1"
          style={{
            flex: '1 1 auto',
            minWidth: '0px',
            backgroundColor: '#FFFFFF',
            color: '#111827',
            borderRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 8px',
            border: '1px solid #E5E7EB'
          }}
        >
          <button
            onClick={handlePrevDate}
            className="p-0.5 sm:p-1 rounded-full hover:bg-gray-100 text-gray-800 transition-colors cursor-pointer shrink-0"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={() => {
              if (selectedDateOffset !== 0 || !isDateFilterActive) {
                setSelectedDateOffset(0);
                setIsDateFilterActive(true);
              } else {
                setIsDateFilterActive(false);
              }
            }}
            className="text-center font-bold text-[11px] sm:text-xs md:text-sm text-gray-900 truncate px-1 flex-1 min-w-0 select-none cursor-pointer hover:text-rose-700 transition-colors flex items-center justify-center gap-1"
            title="Click to toggle Today / All Dates"
          >
            <span className="truncate">{displayDateText}</span>
            {isDateFilterActive && (
              <span className="hidden xs:inline-block text-[9px] font-mono text-blue-600 bg-blue-50 px-1 py-0.2 rounded shrink-0">
                Filtered
              </span>
            )}
          </button>

          <button
            onClick={handleNextDate}
            className="p-0.5 sm:p-1 rounded-full hover:bg-gray-100 text-gray-800 transition-colors cursor-pointer shrink-0"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Sticky Matches Header & Extra Controls */}
      <div className="sticky top-[60px] sm:top-[76px] z-30 bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 sm:p-4 rounded-2xl transition-all space-y-3">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#800020] text-amber-300 flex items-center justify-center font-black border border-rose-800 shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight uppercase">
                  MATCH CENTER
                </h2>
                {liveMatches.length > 0 && (
                  <span className="flex items-center gap-1 bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    {liveMatches.length} Live
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Epe Premier League Fixtures & Live Scores
              </p>
            </div>
          </div>

          {/* Navigation Controls: Search Toggle & Layout View Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-sm ${
                isSearchOpen || searchQuery
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
              title="Search Matches & Fixtures"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Search Matches</span>
              {searchQuery && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 font-mono text-[10px]">
                  {filteredMatches.length}
                </span>
              )}
            </button>

            {/* View Mode Toggle Button */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('scroll')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'scroll'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Horizontal Strip Carousel View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Full Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Expandable Search Bar */}
        {(isSearchOpen || searchQuery) && (
          <div className="pt-2 border-t border-slate-800/80 animate-fadeIn space-y-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team, venue, matchday (e.g. Arsenal, GW2, Epe Arena)..."
                className="w-full pl-10 pr-10 py-2.5 text-xs font-bold rounded-xl bg-slate-900 border border-amber-400/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/80 shadow-inner"
              />
              {searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 p-1 rounded-full text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title="Close Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Team Chips */}
            {teamChips.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                <span className="text-slate-500 font-bold shrink-0 text-[10px] uppercase tracking-wider">Quick Team Search:</span>
                {teamChips.map((teamName, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(teamName)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer border ${
                      searchQuery.toLowerCase() === teamName.toLowerCase()
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {teamName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/60">
          
          {/* Competition Category Filters */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCompetitionFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                competitionFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Comps
            </button>
            <button
              onClick={() => setCompetitionFilter('League')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                competitionFilter === 'League'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              League
            </button>
            <button
              onClick={() => setCompetitionFilter('Cup')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                competitionFilter === 'Cup'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cup
            </button>
          </div>
        </div>

      </div>

      {/* Date Active Banner Feedback */}
      {isDateFilterActive && (
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Showing fixtures for <strong className="text-amber-300">{displayDateText}</strong> ({filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'})
            </span>
          </div>
          <button
            onClick={() => setIsDateFilterActive(false)}
            className="text-[11px] font-black underline text-amber-400 hover:text-amber-300 cursor-pointer"
          >
            Show All Dates
          </button>
        </div>
      )}

      {/* Search Query Feedback Active Banner */}
      {searchQuery && (
        <div className="bg-amber-400/10 border border-amber-400/30 p-3 rounded-xl flex items-center justify-between text-xs text-amber-300 font-bold">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Search query: <strong className="text-white">"{searchQuery}"</strong> ({filteredMatches.length} match{filteredMatches.length === 1 ? '' : 'es'} found)
            </span>
          </div>
          <button
            onClick={handleClearSearch}
            className="text-[11px] font-black underline text-amber-400 hover:text-amber-300 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Featured Live Banner (If Live Match exists & no conflicting search) */}
      {liveMatches.length > 0 && filter === 'all' && !searchQuery && !isDateFilterActive && (
        <div className="bg-gradient-to-r from-[#800020] via-rose-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden border border-rose-800/40">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Flame className="w-48 h-48 text-rose-300" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-md">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                FEATURED LIVE MATCH &bull; {calculateMatchClock(liveMatches[0]).displayString} {calculateMatchClock(liveMatches[0]).overflowText ? calculateMatchClock(liveMatches[0]).overflowText : ''}
              </span>
              <span className="text-xs text-rose-200/80 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {liveMatches[0].venue}
              </span>
            </div>

            <div className="grid grid-cols-3 items-center text-center max-w-2xl mx-auto py-2">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={liveMatches[0].homeTeam?.logoUrl}
                  alt={liveMatches[0].homeTeam?.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg bg-white/10"
                />
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-center break-words max-w-[120px] sm:max-w-[160px] leading-tight">
                  {liveMatches[0].homeTeam?.name}
                </span>
              </div>

              {/* Score Display */}
              <div className="flex flex-col items-center">
                <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 text-3xl sm:text-5xl font-black tracking-wider text-amber-300 font-mono bg-black/30 px-4 py-2 rounded-2xl border border-white/10 shadow-inner whitespace-nowrap">
                  <span>{liveMatches[0].homeScore}</span>
                  <span>-</span>
                  <span>{liveMatches[0].awayScore}</span>
                </div>
                <span className="text-xs font-bold text-rose-200 mt-2 uppercase tracking-widest">
                  {liveMatches[0].period}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={liveMatches[0].awayTeam?.logoUrl}
                  alt={liveMatches[0].awayTeam?.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/20 shadow-lg bg-white/10"
                />
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-center break-words max-w-[120px] sm:max-w-[160px] leading-tight">
                  {liveMatches[0].awayTeam?.name}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => onSelectMatch(liveMatches[0])}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                OPEN LIVE MATCH CENTER &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Matches List in selected View Mode (Scroll or Grid) */}
      {filteredMatches.length === 0 ? (
        <div className="w-full text-center py-10 px-4 bg-slate-900/90 rounded-2xl border border-dashed border-slate-800 text-slate-300 font-medium text-sm">
          <p className="font-bold text-slate-300">No matches available</p>
        </div>
      ) : viewMode === 'scroll' ? (
        /* Horizontal Cards Scrollable Strip */
        <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
          {filteredMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onClick={onSelectMatch}
              selectedMatchId={selectedMatchId}
            />
          ))}
        </div>
      ) : (
        /* Full Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {filteredMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              onClick={onSelectMatch}
              selectedMatchId={selectedMatchId}
            />
          ))}
        </div>
      )}

      {/* FILTER SELECTION MODAL (Triggered by Element A "Filter" Button) */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white uppercase tracking-tight">Filter Matches</h3>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Competition Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Competition</label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'League', 'Cup'].map((comp) => (
                    <button
                      key={comp}
                      onClick={() => setCompetitionFilter(comp as any)}
                      className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border ${
                        competitionFilter === comp
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {comp === 'all' ? 'All Comps' : comp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Filter */}
              {allTeams.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Specific Team</label>
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="all">All Teams</option>
                    {allTeams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Matchday / Gameweek Filter */}
              {allMatchdays.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Matchday / Gameweek</label>
                  <select
                    value={matchdayFilter}
                    onChange={(e) => setMatchdayFilter(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="all">All Gameweeks</option>
                    {allMatchdays.map(gw => (
                      <option key={gw} value={String(gw)}>Gameweek {gw}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Match Status Filter */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Match Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Statuses' },
                    { id: 'live', label: 'Live Now' },
                    { id: 'scheduled', label: 'Upcoming' },
                    { id: 'finished', label: 'Finished' },
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => setFilter(st.id as any)}
                      className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer border ${
                        filter === st.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setCompetitionFilter('all');
                  setTeamFilter('all');
                  setMatchdayFilter('all');
                  setFilter('all');
                }}
                className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-2/3 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


