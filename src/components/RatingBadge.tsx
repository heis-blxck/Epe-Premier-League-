import React from 'react';

interface RatingBadgeProps {
  rating: number | undefined | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  size = 'md',
  showLabel = false
}) => {
  if (rating === undefined || rating === null || isNaN(rating)) {
    return (
      <span className="text-slate-500 text-[10px] font-mono italic">
        N/A
      </span>
    );
  }

  const val = Number(rating);

  // Strict Color Coding rules
  let bgColor = 'bg-slate-700 text-slate-200';
  let label = '';

  if (val < 5.0) {
    bgColor = 'bg-red-600 text-white border-red-500';
    label = 'Low';
  } else if (val >= 5.0 && val <= 6.9) {
    bgColor = 'bg-orange-500 text-white border-orange-400';
    label = 'Average';
  } else if (val >= 7.0 && val <= 8.4) {
    bgColor = 'bg-green-600 text-white border-green-500';
    label = 'Good';
  } else if (val >= 8.5) {
    bgColor = 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-2 ring-blue-300/40';
    label = 'MVP';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded font-black',
    md: 'text-xs px-2.5 py-1 rounded-md font-black',
    lg: 'text-sm px-3.5 py-1.5 rounded-lg font-black'
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center justify-center border ${sizeClasses[size]} ${bgColor} font-mono tracking-tight shadow-sm`}
      >
        {val.toFixed(1)}
      </span>
      {showLabel && label && (
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
          {label}
        </span>
      )}
    </div>
  );
};
