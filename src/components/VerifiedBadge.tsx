import React from 'react';

interface VerifiedBadgeProps {
  role?: string;
  className?: string;
  showTooltip?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  role,
  className = "w-4 h-4 inline-block ml-1 align-middle shrink-0",
  showTooltip = true
}) => {
  if (!role) return null;
  const normalizedRole = role.toLowerCase();

  // OFFICIAL_LEAGUE / FA Spokesperson -> Gold Verified Tick
  if (normalizedRole === 'official_league' || normalizedRole === 'spokesperson') {
    return (
      <span 
        title={showTooltip ? "Official Football Association Account" : undefined} 
        className="inline-flex items-center align-middle"
      >
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="url(#goldGradientTick)" />
          <path d="M7.5 12L10.5 15L16.5 9" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="goldGradientTick" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbbf24" />
              <stop offset="0.5" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  // NEWS_REPORTER -> Blue Verified Tick
  if (normalizedRole === 'news_reporter') {
    return (
      <span 
        title={showTooltip ? "Verified Independent News Reporter" : undefined} 
        className="inline-flex items-center align-middle"
      >
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#2563eb" />
          <path d="M7.5 12L10.5 15L16.5 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  // SUPER_ADMIN or SUB_ADMIN optional fallback checkmark
  if (normalizedRole === 'super_admin' || normalizedRole === 'sub_admin') {
    return (
      <span 
        title={showTooltip ? "Verified League Administrator" : undefined} 
        className="inline-flex items-center align-middle"
      >
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#7e22ce" />
          <path d="M7.5 12L10.5 15L16.5 9" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  return null;
};
