import React, { useEffect, useRef, useState } from 'react';
import { Advertisement } from '../types';
import { Play, VolumeX } from 'lucide-react';

interface Props {
  advertisements: Advertisement[];
  position: 'top' | 'sidebar' | 'footer';
  className?: string;
}

interface AdMediaRenderProps {
  ad: Advertisement;
  containerHeightClass?: string;
}

function AdMediaRender({ ad, containerHeightClass = '' }: AdMediaRenderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const mediaType = ad.mediaType || (
    (ad.mediaUrl || ad.imageUrl || '').match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? 'video' : 'image'
  );
  const mediaSrc = ad.mediaUrl || ad.imageUrl;

  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current) return;

    const videoEl = videoRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch((err) => {
              // Browser autoplay policy might reject play; handled gracefully
              console.debug('Ad video play notice:', err?.message || err);
            });
          } else {
            if (!videoEl.paused) {
              videoEl.pause();
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(videoEl);

    return () => {
      observer.disconnect();
    };
  }, [mediaType, mediaSrc]);

  if (mediaType === 'video') {
    return (
      <div className={`relative w-full bg-slate-950 overflow-hidden ${containerHeightClass || 'h-full'}`}>
        <video
          ref={videoRef}
          src={mediaSrc}
          muted
          playsInline
          loop
          controls={false}
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 bg-slate-950 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
            <Play className="w-6 h-6 text-slate-700 animate-pulse" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/80 text-[9px] font-black text-amber-300 uppercase tracking-widest rounded-md backdrop-blur-md border border-amber-400/20 z-10">
          <VolumeX className="w-3 h-3 text-amber-400" />
          <span>{ad.duration ? `${ad.duration}s Video` : 'Video Ad'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-slate-900 ${containerHeightClass || 'h-full'}`}>
      <img
        src={mediaSrc}
        alt={ad.companyName}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100 bg-slate-900"
      />
    </div>
  );
}

export function AdDisplay({ advertisements, position, className = '' }: Props) {
  const activeAds = advertisements.filter(ad => ad.isActive && ad.position === position);
  
  if (activeAds.length === 0) return null;

  // Render a random ad from the active ones for this position to rotate them
  const currentAd = activeAds[Math.floor(Math.random() * activeAds.length)];
  const targetLink = currentAd.targetLink || currentAd.linkUrl;

  if (position === 'sidebar') {
    return (
      <div className={`rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg relative group bg-slate-900 ${className}`}>
        <a href={targetLink} target="_blank" rel="noreferrer" className="block w-full h-full">
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900/90 text-[9px] font-bold text-slate-300 uppercase tracking-widest rounded-md shadow-sm z-20 backdrop-blur-md border border-slate-700">
            Ad &bull; {currentAd.companyName}
          </div>
          <AdMediaRender ad={currentAd} containerHeightClass="min-h-[160px] max-h-[320px]" />
        </a>
      </div>
    );
  }

  // Top or Footer banners
  return (
    <div className={`w-full overflow-hidden border border-slate-700/50 shadow-md relative group my-4 rounded-xl bg-slate-900 ${className}`}>
      <a href={targetLink} target="_blank" rel="noreferrer" className="block w-full">
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900/90 text-[9px] font-bold text-slate-300 uppercase tracking-widest rounded-md shadow-sm z-20 backdrop-blur-md border border-slate-700">
          Ad &bull; {currentAd.companyName}
        </div>
        <AdMediaRender ad={currentAd} containerHeightClass="h-28 md:h-36" />
      </a>
    </div>
  );
}

