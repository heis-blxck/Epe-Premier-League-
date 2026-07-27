import React from 'react';
import { Advertisement } from '../types';

interface Props {
  advertisements: Advertisement[];
  position: 'top' | 'sidebar' | 'footer';
  className?: string;
}

export function AdDisplay({ advertisements, position, className = '' }: Props) {
  const activeAds = advertisements.filter(ad => ad.isActive && ad.position === position);
  
  if (activeAds.length === 0) return null;

  // Render a random ad from the active ones for this position to rotate them
  const currentAd = activeAds[Math.floor(Math.random() * activeAds.length)];

  if (position === 'sidebar') {
    return (
      <div className={`rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg relative group ${className}`}>
        <a href={currentAd.linkUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900/80 text-[9px] font-bold text-slate-400 uppercase tracking-widest rounded shadow-sm z-10 backdrop-blur-md">
            Advertisement
          </div>
          <img 
            src={currentAd.imageUrl} 
            alt={currentAd.companyName} 
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </a>
      </div>
    );
  }

  // Top or Footer banners
  return (
    <div className={`w-full overflow-hidden border border-slate-700/50 shadow-md relative group my-4 rounded-xl ${className}`}>
      <a href={currentAd.linkUrl} target="_blank" rel="noreferrer" className="block w-full">
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900/80 text-[9px] font-bold text-slate-400 uppercase tracking-widest rounded shadow-sm z-10 backdrop-blur-md">
          Advertisement
        </div>
        <div className="h-24 md:h-32 w-full bg-slate-800">
          <img 
            src={currentAd.imageUrl} 
            alt={currentAd.companyName} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        </div>
      </a>
    </div>
  );
}
