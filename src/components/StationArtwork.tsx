import React, { useState } from 'react';
import { Radio } from 'lucide-react';
import { COUNTRIES_DIRECTORY } from '../data/curatedStations';
import { RadioStation } from '../types/radio';
import { getDeterministicPalette } from '../utils/colorExtractor';

interface StationArtworkProps {
  station: RadioStation;
  size?: 'sm' | 'md' | 'lg';
  isPlaying?: boolean;
}

export const StationArtwork: React.FC<StationArtworkProps> = ({
  station,
  size = 'md',
  isPlaying = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const palette = getDeterministicPalette(station);
  const countryMeta = COUNTRIES_DIRECTORY.find(
    (c) => c.code === station.countrycode.toUpperCase()
  );

  const initials = station.name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const sizeClasses =
    size === 'lg'
      ? 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl text-xl'
      : size === 'md'
      ? 'w-12 h-12 rounded-2xl text-sm'
      : 'w-10 h-10 rounded-xl text-xs';

  const showImage = Boolean(station.favicon && station.favicon.trim() !== '' && !imgError);

  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center font-display font-bold text-white border border-white/20 shadow-inner select-none ${sizeClasses}`}
      style={{
        background: `linear-gradient(135deg, rgba(${palette.primary.join(',')}, 0.48) 0%, rgba(${palette.secondary.join(',')}, 0.32) 55%, rgba(${palette.accent.join(',')}, 0.36) 100%)`,
        boxShadow: isPlaying
          ? `0 0 28px -4px rgba(${palette.primary.join(',')}, 0.55)`
          : undefined,
      }}
    >
      {showImage ? (
        <img
          src={station.favicon}
          alt={`Logo stasiun radio ${station.name}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="tracking-tight">{initials || <Radio className="w-5 h-5" />}</span>
          {size === 'lg' && station.frequency && (
            <span className="font-mono text-[10px] font-medium text-white/80 mt-1">
              {station.frequency}
            </span>
          )}
        </div>
      )}

      {/* Subtle Country Flag Corner Indicator */}
      {countryMeta && (
        <span
          className={`absolute bottom-0.5 right-1 leading-none drop-shadow ${
            size === 'lg' ? 'text-sm' : 'text-[11px]'
          }`}
          title={countryMeta.name}
        >
          {countryMeta.flag}
        </span>
      )}
    </div>
  );
};
