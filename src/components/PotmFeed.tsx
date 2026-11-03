import React, { useState, useEffect } from 'react';
import { PlayerOfTheMonth } from '../types';
import { api } from '../services/api';
import { Trophy } from 'lucide-react';

export function PotmFeed() {
  const [potmList, setPotmList] = useState<PlayerOfTheMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlayerOfTheMonth().then(data => {
      setPotmList(data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (potmList.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20 px-4 text-center">
        <Trophy className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-slate-300 mb-2">No Player of the Month Yet</h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">Awards will appear here once the admins publish the POTM trading cards.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {potmList.map((potm, index) => (
        <div key={potm.id || index} className="max-w-[480px] mx-auto flex flex-col">
          <div className="relative bg-gradient-to-br from-[#800020] via-[#881337] to-[#7c2d12] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(128,0,32,0.4)] border-2 border-[#FBB931] aspect-[3/4] flex flex-col w-full mb-6">
            <div className="p-6 md:p-8 flex justify-between items-start z-20 relative bg-black/20 backdrop-blur-sm border-b border-white/10">
              <div className="max-w-[75%]">
                <h2 className="text-3xl md:text-4xl font-black text-white leading-none tracking-tighter drop-shadow-md">
                  {potm.playerName}
                </h2>
              </div>
              {potm.teamLogoUrl && (
                <img src={potm.teamLogoUrl} alt="Team" className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-md z-20 bg-white/10 rounded-full p-2" />
              )}
            </div>

            <div className="flex-1 relative w-full h-full flex">
              <div className="absolute left-6 top-8 z-30 flex flex-col items-start w-32">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Average Rating</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-sky-400"></div>
                  <span className="text-4xl md:text-5xl font-black text-white leading-none drop-shadow-lg">{potm.score}</span>
                </div>
              </div>

              <img 
                src={potm.graphicUrl} 
                className="absolute bottom-0 inset-x-0 h-[105%] w-full object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] z-20" 
                alt={potm.playerName} 
              />
              
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/0 via-black/10 to-black/40 z-0"></div>
              <div className="absolute right-4 top-12 bottom-12 w-8 border-r border-white/10 z-10 flex flex-col items-center justify-center">
                <div className="rotate-90 text-[10px] font-black text-white/20 tracking-[0.3em] uppercase whitespace-nowrap">Player of the Month • {potm.month}</div>
              </div>
            </div>
          </div>
          
          {(potm.headline || potm.description) && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl">
              {potm.headline && (
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-3">{potm.headline}</h3>
              )}
              {potm.description && (
                <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">{potm.description}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
