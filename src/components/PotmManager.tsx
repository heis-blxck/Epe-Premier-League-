import React, { useState, useEffect, useRef } from 'react';
import { PlayerOfTheMonth, Player, Team } from '../types';
import { api } from '../services/api';
import { MediaUploader } from './MediaUploader';
import { Trophy, CheckCircle, Save, Trash2, Search, X } from 'lucide-react';

interface PotmManagerProps {
  players?: Player[];
  teams?: Team[];
}

export function PotmManager({ players = [], teams = [] }: PotmManagerProps) {
  const [month, setMonth] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [teamLogoUrl, setTeamLogoUrl] = useState('');
  const [score, setScore] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [graphicUrl, setGraphicUrl] = useState('');
  
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [potmList, setPotmList] = useState<PlayerOfTheMonth[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadPotm();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowPlayerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlayer = (p: Player) => {
    setPlayerName(p.name);
    setScore(p.ratingAverage ? p.ratingAverage.toFixed(2) : '6.00');
    const team = teams.find(t => t.id === p.teamId);
    if (team) {
      setTeamLogoUrl(team.logoUrl || '');
    }
    setPlayerSearchText('');
    setShowPlayerDropdown(false);
  };

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(playerSearchText.toLowerCase())).slice(0, 10);

  const loadPotm = async () => {
    try {
      const data = await api.getPlayerOfTheMonth();
      setPotmList(data);
    } catch (e) {
      console.error('Failed to load POTM', e);
    }
  };

  const handleSave = async () => {
    if (!graphicUrl || !month || !playerName) return;
    setLoading(true);
    try {
      await api.savePlayerOfTheMonth({
        id: 'potm-' + Date.now(),
        month,
        playerName,
        teamLogoUrl,
        position: '', // Unused in new design
        score,
        headline,
        description,
        graphicUrl,
        createdAt: new Date().toISOString()
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setPlayerName('');
      setTeamLogoUrl('');
      setScore('');
      setHeadline('');
      setDescription('');
      setGraphicUrl('');
      setMonth('');
      loadPotm();
    } catch (e) {
      console.error(e);
      alert('Failed to save POTM');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Note: window.confirm is blocked in the preview iframe, proceeding directly
    try {
      await api.deletePlayerOfTheMonth(id);
      loadPotm();
    } catch (e) {
      console.error(e);
      // Removed alert as well
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-amber-400" />
          Player of the Month Upload
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Month / Award Period</label>
              <input
                type="text"
                placeholder="e.g. October 2026"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Search Player</label>
              <div className="relative" ref={searchRef}>
                {playerName ? (
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-3">
                      {teamLogoUrl && <img src={teamLogoUrl} alt="Team" className="w-6 h-6 object-contain bg-white rounded-full" />}
                      <span className="text-white font-bold">{playerName} <span className="text-amber-400 text-xs ml-2">Rating: {score}</span></span>
                    </div>
                    <button onClick={() => { setPlayerName(''); setTeamLogoUrl(''); setScore(''); }} className="text-slate-400 hover:text-rose-400 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search player name..."
                        value={playerSearchText}
                        onChange={(e) => { setPlayerSearchText(e.target.value); setShowPlayerDropdown(true); }}
                        onFocus={() => setShowPlayerDropdown(true)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    {showPlayerDropdown && playerSearchText && (
                      <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                        {filteredPlayers.length > 0 ? (
                          filteredPlayers.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleSelectPlayer(p)}
                              className="w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                {teams.find(t => t.id === p.teamId)?.logoUrl && (
                                  <img src={teams.find(t => t.id === p.teamId)?.logoUrl} alt="Team" className="w-6 h-6 object-contain bg-white rounded-full" />
                                )}
                                <span className="text-white font-medium">{p.name}</span>
                              </div>
                              <span className="text-xs font-bold text-sky-400">{p.ratingAverage?.toFixed(2) || '6.00'}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-400">No players found</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Headline</label>
              <input
                type="text"
                placeholder="e.g. A Month to Remember"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
              <textarea
                placeholder="Write a short paragraph about why they won the award..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading || !playerName || !graphicUrl || !month}
              className="w-full bg-[#800020] hover:bg-[#5a0016] text-white font-black py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Publishing...' : 'Publish Player of the Month'}
            </button>
            
            {showSuccess && (
              <div className="p-3 bg-emerald-900/50 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm font-bold flex items-center gap-2 mt-2">
                <CheckCircle className="w-5 h-5" />
                Player of the Month Award Published!
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Transparent PNG Cutout Image</label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[300px] flex flex-col justify-center items-center">
              <MediaUploader
                onSelectUrl={(url) => setGraphicUrl(url)}
                currentUrl={graphicUrl}
                label="Upload Player Cutout Graphic"
                presetCategory="player_photo"
              />
              <p className="text-[10px] text-slate-500 mt-4 text-center max-w-[200px]">
                For best results, upload a high-resolution transparent PNG cutout of the player.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {potmList.length > 0 && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-400" />
            Previous Awards
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {potmList.map(potm => (
              <div key={potm.id} className="relative aspect-[3/4] bg-[#800020] rounded-xl overflow-hidden shadow-lg group">
                <img src={potm.graphicUrl} alt={`POTM ${potm.month}`} className="absolute bottom-0 w-full h-[85%] object-cover object-bottom" />
                <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(potm.id)}
                    className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-full shadow-lg transition-colors cursor-pointer pointer-events-auto"
                    title="Delete POTM Card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center pointer-events-none z-10">
                  <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">{potm.month}</div>
                  <div className="text-white font-black text-sm leading-tight">{potm.playerName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
