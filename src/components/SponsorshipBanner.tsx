import React, { useState, useEffect } from 'react';
import { Award, Sparkles, ShieldCheck } from 'lucide-react';

interface SponsorshipBannerProps {
  sponsorName?: string;
  logoUrl?: string;
  tagline?: string;
  className?: string;
}

export const SponsorshipBanner: React.FC<SponsorshipBannerProps> = ({
  sponsorName = "EPEX GLOBAL PARTNERS",
  logoUrl: propLogoUrl,
  tagline = "Official Premier League Sponsor",
  className = ""
}) => {
  const [dbLogoUrl, setDbLogoUrl] = useState<string>('');
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    // If logoUrl is passed directly via props, use it
    if (propLogoUrl !== undefined) {
      setDbLogoUrl(propLogoUrl);
      setImgError(false);
      return;
    }

    // Otherwise, fetch sponsor_logo_url from database settings
    let isMounted = true;
    fetch('/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data) {
          const url = data.sponsor_logo_url || data.sponsorLogoUrl || '';
          setDbLogoUrl(url);
          setImgError(false);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, [propLogoUrl]);

  const activeLogoUrl = propLogoUrl !== undefined ? propLogoUrl : dbLogoUrl;
  const showImage = activeLogoUrl && !imgError;

  return (
    <div className={`sticky top-[56px] sm:top-[64px] z-30 w-full mb-4 transition-all ${className}`}>
      <div className="bg-white border-[3px] border-black p-3 sm:p-4 shadow-[6px_6px_0px_0px_#000] flex items-center justify-between gap-3 text-black">
        {/* Left: Powered By & Sponsor Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5500] fill-[#FF5500] inline shrink-0" />
              POWERED BY
            </span>
            <div className="flex items-center gap-2 mt-1">
              {showImage ? (
                <div className="flex items-center bg-[#F4F4F0] border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000] max-w-[200px]">
                  <img
                    src={activeLogoUrl}
                    alt={sponsorName}
                    onError={() => setImgError(true)}
                    className="h-6 sm:h-7 w-auto object-contain max-w-[160px]"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#F4F4F0] border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
                  <ShieldCheck className="w-4 h-4 text-[#FF5500] shrink-0" />
                  <span className="font-black text-xs sm:text-sm text-black tracking-wide uppercase truncate">
                    {sponsorName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center / Right: Tagline & Premium Badge */}
        <div className="hidden sm:flex items-center gap-3 text-right">
          <span className="text-xs font-bold text-neutral-700 tracking-tight uppercase">
            {tagline}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-[#FF5500] text-black px-3 py-1 border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_#000]">
            <Award className="w-3.5 h-3.5 text-black stroke-[3]" /> OFFICIAL SPONSOR
          </span>
        </div>

        {/* Mobile Badge */}
        <div className="sm:hidden shrink-0">
          <span className="inline-flex items-center gap-1 bg-[#FF5500] text-black px-2.5 py-1 border-2 border-black text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
            OFFICIAL SPONSOR
          </span>
        </div>
      </div>
    </div>
  );
};
