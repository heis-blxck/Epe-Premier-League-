import React from 'react';

interface EpeLogoProps {
  className?: string;
  size?: number | string;
  showCrownOnly?: boolean;
  logoUrl?: string;
}

export const EpeLogo: React.FC<EpeLogoProps> = ({ 
  className = "w-10 h-10", 
  size,
  showCrownOnly = false,
  logoUrl
}) => {
  const style = size ? { width: size, height: size } : undefined;

  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="App Logo"
        className={`inline-block shrink-0 object-contain rounded-xl ${className}`}
        style={style}
      />
    );
  }

  return (
    <svg 
      viewBox="0 0 500 500" 
      className={`inline-block shrink-0 ${className}`} 
      style={style}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Crown Gold Gradient */}
        <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2A1" />
          <stop offset="30%" stopColor="#F5B800" />
          <stop offset="70%" stopColor="#D98A00" />
          <stop offset="100%" stopColor="#9E5D00" />
        </linearGradient>

        <linearGradient id="crownHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFE066" stopOpacity="0.2" />
        </linearGradient>

        {/* Burgundy/Maroon Mane Gradient */}
        <linearGradient id="burgundyMane" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#A81238" />
          <stop offset="50%" stopColor="#800020" />
          <stop offset="100%" stopColor="#4A0012" />
        </linearGradient>

        {/* Navy Blue Accent Gradient */}
        <linearGradient id="navyAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="60%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Gold Mane Highlight */}
        <linearGradient id="goldMane" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>

        {/* Emerald Green Accent Streak */}
        <linearGradient id="emeraldMane" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Shadow Filter */}
        <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#logoShadow)">
        {/* LION HEAD profile facing right */}
        {!showCrownOnly && (
          <g id="lion-head">
            {/* Base Burgundy Outer Mane Waves */}
            <path 
              d="M 120 210 C 100 260 110 330 150 380 C 160 395 170 420 172 440 C 150 390 135 340 138 290 C 130 330 135 370 150 410 C 130 370 125 310 140 260 C 120 290 120 330 130 360 C 110 310 110 260 140 210 Z" 
              fill="url(#burgundyMane)" 
            />
            
            {/* Primary Burgundy Mane Silhouette */}
            <path 
              d="M 130 170 C 160 140 230 120 310 125 C 360 130 400 160 420 210 C 440 250 435 280 410 300 C 390 315 375 305 370 290 C 385 270 380 240 365 220 C 350 200 320 190 290 195 C 270 198 250 210 240 230 C 220 200 180 180 130 170 Z" 
              fill="url(#burgundyMane)" 
            />

            {/* Back Mane Flame Locks - Burgundy & Maroon */}
            <path 
              d="M 130 170 C 100 200 80 250 90 320 C 100 370 120 420 160 480 C 170 495 180 500 185 480 C 180 450 170 420 165 390 C 175 420 190 450 210 490 C 220 510 230 500 230 480 C 225 430 210 380 195 340 C 210 370 230 410 255 450 C 265 465 275 450 270 430 C 255 380 235 330 210 280 C 225 300 240 330 260 360 C 270 375 280 360 275 340 C 255 290 230 240 190 200 C 170 180 150 172 130 170 Z" 
              fill="url(#burgundyMane)" 
            />

            {/* Deep Navy Blue Inner Locks */}
            <path 
              d="M 160 200 C 190 230 220 280 240 340 C 250 370 260 420 280 480 C 285 495 292 485 290 460 C 280 420 265 370 250 320 C 270 360 290 410 310 460 C 315 470 322 460 320 440 C 305 390 285 330 260 280 C 280 310 300 350 315 390 C 322 405 330 395 325 380 C 305 320 280 260 240 210 C 210 185 185 185 160 200 Z" 
              fill="url(#navyAccent)" 
            />

            {/* Gold Mane Highlights */}
            <path 
              d="M 175 180 C 210 210 245 260 270 320 C 285 360 300 420 325 490 C 330 505 338 495 335 470 C 320 420 300 360 280 300 C 300 340 325 400 345 450 C 350 460 358 450 355 430 C 335 370 310 300 280 240 C 260 200 220 180 175 180 Z" 
              fill="url(#goldMane)" 
            />

            {/* Emerald Green Accent Streak */}
            <path 
              d="M 230 210 C 255 250 280 300 295 360 C 305 400 315 440 330 490 C 333 500 338 490 336 475 C 325 435 312 390 298 340 C 310 375 325 420 338 460 C 342 470 348 460 345 445 C 330 395 310 335 285 275 C 270 240 250 220 230 210 Z" 
              fill="url(#emeraldMane)" 
              opacity="0.8"
            />

            {/* LION FACE (Snout, Jaw, Eye, Brow) - Golden Profile */}
            <g id="lion-face">
              {/* Lion Golden Face Base */}
              <path 
                d="M 280 190 C 310 185 340 200 360 225 C 380 250 390 275 420 285 C 435 290 440 300 435 310 C 425 320 410 325 395 320 C 385 318 375 325 370 335 C 360 355 345 365 325 360 C 310 355 300 340 295 320 C 285 280 275 230 280 190 Z" 
                fill="url(#goldMane)" 
              />

              {/* Lion Muzzle & Nose Tip */}
              <path 
                d="M 420 285 C 432 288 440 295 438 305 C 430 315 418 318 405 315 C 395 312 388 318 385 325 C 378 340 368 348 350 345 C 365 330 375 320 380 305 C 385 292 400 285 420 285 Z" 
                fill="#4A0012" 
              />

              {/* Lion Brow & Fierce Eye Contour */}
              <path 
                d="M 335 215 C 355 220 370 235 380 255 C 370 250 358 242 345 240 C 335 238 330 228 335 215 Z" 
                fill="#0F172A" 
              />
              
              {/* Lion Eye Highlight */}
              <polygon points="352,238 368,245 355,248" fill="#FDE047" />

              {/* Ear */}
              <path 
                d="M 295 180 C 290 160 305 155 320 165 C 328 172 322 185 310 188 C 302 190 298 185 295 180 Z" 
                fill="url(#burgundyMane)" 
              />
              <path 
                d="M 300 175 C 298 165 308 162 315 168 C 318 172 315 180 308 182 Z" 
                fill="url(#goldMane)" 
              />

              {/* Chin / Jaw Accent */}
              <path 
                d="M 370 335 C 385 340 400 330 410 318 C 395 332 375 342 355 340 C 362 338 368 336 370 335 Z" 
                fill="#FFF2A1" 
              />
            </g>
          </g>
        )}

        {/* CROWN (Positioned majestically on top of the lion's head, tilted 15 degrees) */}
        <g id="royal-crown" transform={showCrownOnly ? "translate(40, 80) scale(1.1)" : "translate(100, 15) rotate(-14 200 120)"}>
          {/* Main Crown Base Arch/Ring */}
          <path 
            d="M 120 150 C 170 132 250 132 300 150 L 290 166 C 245 150 175 150 130 166 Z" 
            fill="url(#crownGold)" 
          />
          <path 
            d="M 125 152 C 170 136 245 136 295 152 L 290 160 C 245 145 175 145 130 160 Z" 
            fill="url(#crownHighlight)" 
          />

          {/* Crown Jewels on Rim */}
          <circle cx="150" cy="155" r="4" fill="#A81238" />
          <circle cx="180" cy="149" r="4" fill="#10B981" />
          <circle cx="210" cy="146" r="5" fill="#1E3A8A" />
          <circle cx="240" cy="149" r="4" fill="#10B981" />
          <circle cx="270" cy="155" r="4" fill="#A81238" />

          {/* Crown Spikes & Peaks (5 Peaks with Central Regal Diamond) */}
          <path 
            d="M 120 150 L 100 80 L 140 125 L 165 55 L 195 120 L 210 25 L 225 120 L 255 55 L 280 125 L 320 80 L 300 150 Z" 
            fill="url(#crownGold)" 
          />

          {/* Crown Inner Shading / Cutouts */}
          <path 
            d="M 120 150 L 100 80 L 140 125 L 165 55 L 195 120 L 210 25 L 225 120 L 255 55 L 280 125 L 320 80 L 300 150 Z" 
            stroke="#9E5D00" 
            strokeWidth="3" 
          />

          {/* Central Diamond Cutout on Middle Peak */}
          <polygon points="210,50 219,70 210,90 201,70" fill="#FFFFFF" opacity="0.9" />
          <polygon points="210,55 216,70 210,85 204,70" fill="url(#crownGold)" />

          {/* Diamond Jewels on Left & Right Spikes */}
          <polygon points="165,75 171,88 165,100 159,88" fill="#FFFFFF" opacity="0.8" />
          <polygon points="255,75 261,88 255,100 249,88" fill="#FFFFFF" opacity="0.8" />

          {/* Gold Spheres / Crosses on Top Peak Tips */}
          <circle cx="100" cy="78" r="6" fill="#FFF2A1" />
          <circle cx="165" cy="52" r="7" fill="#FFF2A1" />
          <circle cx="210" cy="22" r="9" fill="#FFF2A1" />
          <circle cx="255" cy="52" r="7" fill="#FFF2A1" />
          <circle cx="320" cy="78" r="6" fill="#FFF2A1" />
        </g>
      </g>
    </svg>
  );
};
