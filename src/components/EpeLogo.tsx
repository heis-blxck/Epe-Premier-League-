import React, { useState, useEffect } from 'react';

interface EpeLogoProps {
  className?: string;
  showCrownOnly?: boolean;
  logoUrl?: string;
}

const MASTER_LOGO_URL = 'https://i.postimg.cc/hjmBHkfN/08469fba-3b41-4117-964b-745b2eca53f4-20260726-052311-0000.png';

export const EpeLogo: React.FC<EpeLogoProps> = ({ className = 'w-12 h-12', logoUrl }) => {
  const primarySrc = logoUrl && logoUrl.trim() !== '' ? logoUrl : MASTER_LOGO_URL;
  const [imgSrc, setImgSrc] = useState<string>(primarySrc);

  useEffect(() => {
    const nextSrc = logoUrl && logoUrl.trim() !== '' ? logoUrl : MASTER_LOGO_URL;
    setImgSrc(nextSrc);
  }, [logoUrl]);

  const handleError = () => {
    if (imgSrc !== '/logo.png') {
      setImgSrc('/logo.png');
    } else if (imgSrc !== '/logo.jpg') {
      setImgSrc('/logo.jpg');
    }
  };

  return (
    <img 
      src={imgSrc} 
      alt="Epe Premier League" 
      onError={handleError}
      loading="eager"
      fetchPriority="high"
      className={className}
      style={{ background: 'transparent', objectFit: 'contain' }}
    />
  );
};




