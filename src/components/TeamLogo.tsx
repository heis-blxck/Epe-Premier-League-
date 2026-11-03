import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Team } from '../types';

interface TeamLogoProps {
  team?: Partial<Team> | null;
  logoUrl?: string;
  name?: string;
  className?: string; // default e.g. "w-8 h-8"
  alt?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  logoUrl,
  name,
  className = 'w-8 h-8',
  alt
}) => {
  const teamName = name || team?.name || 'TBD';
  const url = logoUrl || team?.logoUrl;
  const isTBD =
    !teamName ||
    teamName.trim().toUpperCase() === 'TBD' ||
    teamName.trim().toUpperCase() === 'TO BE DECIDED' ||
    teamName.trim().toUpperCase() === 'HOME TEAM' ||
    teamName.trim().toUpperCase() === 'AWAY TEAM';

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  if (isTBD || !url || hasError) {
    return (
      <div
        className={`rounded-full overflow-hidden bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-sm ${className}`}
        title={teamName}
      >
        {isTBD ? (
          <span className="font-mono font-black text-[10px] sm:text-xs text-amber-400/90 select-none">
            ?
          </span>
        ) : (
          <Shield className="w-1/2 h-1/2 text-slate-400/80" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-sm ${className}`}
    >
      <img
        src={url}
        alt={alt || teamName}
        className="w-full h-full object-cover rounded-full"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
