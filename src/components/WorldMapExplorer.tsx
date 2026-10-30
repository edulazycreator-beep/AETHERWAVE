import React, { useEffect, useState } from 'react';
import { Compass, Globe, MapPin, Radio, Clock } from 'lucide-react';
import { COUNTRIES_DIRECTORY } from '../data/curatedStations';
import { CountryMetadata } from '../types/radio';
import { DynamicPalette } from '../utils/colorExtractor';

interface WorldMapExplorerProps {
  selectedCountryCode: string;
  onSelectCountry: (code: string) => void;
  activeStationCountryCode?: string;
  isPlaying: boolean;
  palette: DynamicPalette;
  stationCount: number;
}

const CONTINENTS: Array<'Semua' | CountryMetadata['continent']> = [
  'Semua',
  'Asia',
  'Eropa',
  'Amerika',
  'Timur Tengah & Afrika',
  'Oseania',
];

export const WorldMapExplorer: React.FC<WorldMapExplorerProps> = ({
  selectedCountryCode,
  onSelectCountry,
  activeStationCountryCode,
  isPlaying,
  palette,
  stationCount,
}) => {
  const [selectedContinent, setSelectedContinent] = useState<'Semua' | CountryMetadata['continent']>('Semua');
  const [hoveredCountry, setHoveredCountry] = useState<CountryMetadata | null>(null);
  const [localTimeStr, setLocalTimeStr] = useState<string>('');

  const activeCountry =
    COUNTRIES_DIRECTORY.find((c) => c.code === selectedCountryCode) || COUNTRIES_DIRECTORY[0];

  useEffect(() => {
    const updateClock = () => {
      try {
        const formatter = new Intl.DateTimeFormat('id-ID', {
          timeZone: activeCountry.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        setLocalTimeStr(formatter.format(new Date()));
      } catch {
        setLocalTimeStr(new Date().toLocaleTimeString('id-ID', { hour12: false }));
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [activeCountry]);

  const filteredCountries =
    selectedContinent === 'Semua'
      ? COUNTRIES_DIRECTORY
      : COUNTRIES_DIRECTORY.filter((c) => c.continent === selectedContinent);

  const displayCountry = hoveredCountry || activeCountry;

  return (
    <section className="glass-panel rounded-3xl p-4 sm:p-5 relative overflow-hidden">
      {/* Top Header & Region Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
            <Globe className="w-3.5 h-3.5" style={{ color: palette.hex }} />
            <span>Peta Frekuensi Global Interaktif</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300">{COUNTRIES_DIRECTORY.length} Negara Utama</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Jelajahi Siaran Dunia
          </h2>
        </div>

        {/* Continent Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/60 border border-white/10 overflow-x-auto no-scrollbar">
          {CONTINENTS.map((continent) => {
            const active = selectedContinent === continent;
            return (
              <button
                key={continent}
                type="button"
                onClick={() => setSelectedContinent(continent)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all min-h-[36px] ${
                  active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={
                  active
                    ? {
                        borderColor: `rgba(${palette.primary.join(',')}, 0.5)`,
                        boxShadow: `0 0 16px -4px rgba(${palette.primary.join(',')}, 0.35)`,
                      }
                    : undefined
                }
              >
                {continent}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Glass World Map Canvas */}
      <div className="relative w-full aspect-[2/1] min-h-[210px] sm:min-h-[250px] rounded-2xl bg-slate-950/75 border border-white/10 overflow-hidden select-none">
        {/* Dynamic Ambient Glow Behind Active Pin */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle at ${(activeCountry.mapX / 1000) * 100}% ${(activeCountry.mapY / 500) * 100}%, rgba(${palette.primary.join(',')}, 0.25) 0%, rgba(${palette.secondary.join(',')}, 0.08) 38%, transparent 70%)`,
          }}
        />

        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full object-cover"
          role="img"
          aria-label="Peta dunia interaktif pemilihan stasiun radio per negara"
        >
          <defs>
            <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="continent-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.11)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.04)" />
            </linearGradient>
          </defs>

          {/* Subtle Latitude/Longitude Grid */}
          <rect width="1000" height="500" fill="url(#map-grid)" />
          {/* Equator & Tropics */}
          <line
            x1="0"
            y1="250"
            x2="1000"
            y2="250"
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 6"
          />

          {/* Stylized World Continents Geometry */}
          <g fill="url(#continent-fill)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2">
            {/* North America */}
            <path d="M 75 70 L 185 55 L 285 95 L 290 155 L 235 210 L 195 235 L 155 200 L 115 145 Z" />
            {/* Greenland */}
            <path d="M 305 40 L 385 35 L 365 88 L 312 78 Z" />
            {/* South America */}
            <path d="M 245 255 L 335 275 L 365 340 L 320 445 L 280 455 L 255 350 Z" />
            {/* Europe */}
            <path d="M 445 72 L 555 62 L 580 130 L 535 168 L 460 165 L 440 125 Z" />
            {/* Africa */}
            <path d="M 442 185 L 555 185 L 610 265 L 568 405 L 510 412 L 478 310 L 432 245 Z" />
            {/* Asia & Middle East */}
            <path d="M 565 72 L 775 58 L 895 110 L 875 215 L 795 255 L 710 265 L 645 235 L 580 215 L 565 140 Z" />
            {/* Indonesia & Maritime Southeast Asia */}
            <path d="M 738 272 L 828 276 L 845 312 L 750 308 Z" />
            {/* Japan Archipelago */}
            <path d="M 845 145 L 872 155 L 860 190 L 838 178 Z" />
            {/* Australia & Oceania */}
            <path d="M 775 335 L 895 335 L 905 415 L 805 422 L 768 380 Z" />
          </g>

          {/* Animated Connection Arc between Active Playing Country and Selected Country */}
          {activeStationCountryCode &&
            activeStationCountryCode !== selectedCountryCode && (() => {
              const fromCountry = COUNTRIES_DIRECTORY.find(
                (c) => c.code === activeStationCountryCode
              );
              const toCountry = activeCountry;
              if (!fromCountry || !toCountry) return null;
              const midX = (fromCountry.mapX + toCountry.mapX) / 2;
              const midY = Math.min(fromCountry.mapY, toCountry.mapY) - 45;
              return (
                <path
                  d={`M ${fromCountry.mapX} ${fromCountry.mapY} Q ${midX} ${midY} ${toCountry.mapX} ${toCountry.mapY}`}
                  fill="none"
                  stroke={palette.hex}
                  strokeWidth="1.75"
                  strokeDasharray="5 5"
                  opacity="0.65"
                />
              );
            })()}

          {/* Interactive Country Nodes */}
          {COUNTRIES_DIRECTORY.map((country) => {
            const isSelected = country.code === selectedCountryCode;
            const isStreamingCountry = country.code === activeStationCountryCode && isPlaying;
            const isVisibleInFilter =
              selectedContinent === 'Semua' || country.continent === selectedContinent;

            return (
              <g
                key={country.code}
                transform={`translate(${country.mapX}, ${country.mapY})`}
                onClick={() => onSelectCountry(country.code)}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer transition-opacity duration-300"
                style={{ opacity: isVisibleInFilter ? 1 : 0.25 }}
              >
                {/* Larger invisible touch target for mobile fingers */}
                <circle r="24" fill="transparent" />

                {/* Outer Ripple Ring for Selected or Streaming Country */}
                {(isSelected || isStreamingCountry) && (
                  <circle
                    r={isSelected ? '16' : '13'}
                    fill={`rgba(${palette.primary.join(',')}, 0.18)`}
                    stroke={palette.hex}
                    strokeWidth="1.5"
                  />
                )}

                {/* Core Node Pin */}
                <circle
                  r={isSelected ? '7.5' : '5.5'}
                  fill={isSelected ? palette.hex : '#F8FAFC'}
                  stroke="#090D16"
                  strokeWidth="2"
                />

                {/* Country Code Micro Label on Map */}
                <text
                  y="-12"
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : 'rgba(226, 232, 240, 0.85)'}
                  fontSize={isSelected ? '11' : '9.5'}
                  fontWeight={isSelected ? '700' : '600'}
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  className="pointer-events-none select-none drop-shadow"
                >
                  {country.flag} {country.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Bottom Floating Country Telemetry Bar Inside Map */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl leading-none shrink-0" aria-hidden="true">
              {displayCountry.flag}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white truncate">
                  {displayCountry.name}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline truncate">
                  · {displayCountry.nativeName}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">{displayCountry.featuredGenre}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-300 shrink-0">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" style={{ color: palette.hex }} />
              <span>{stationCount} Stasiun</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="flex items-center gap-1" title="Waktu Lokal Negara">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{localTimeStr}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Touch-Friendly Country Selector Strip */}
      <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filteredCountries.map((country) => {
          const active = country.code === selectedCountryCode;
          return (
            <button
              key={country.code}
              type="button"
              onClick={() => onSelectCountry(country.code)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap shrink-0 transition-all min-h-[44px] ${
                active
                  ? 'bg-white/16 text-white border border-white/30 shadow-sm'
                  : 'bg-white/[0.04] text-slate-300 border border-white/5 hover:bg-white/10 hover:text-white'
              }`}
              style={
                active
                  ? {
                      borderColor: `rgba(${palette.primary.join(',')}, 0.65)`,
                      background: `linear-gradient(135deg, rgba(${palette.primary.join(',')}, 0.24), rgba(${palette.secondary.join(',')}, 0.10))`,
                    }
                  : undefined
              }
            >
              <span className="text-base leading-none">{country.flag}</span>
              <span>{country.name}</span>
              <span className="font-mono text-[11px] text-slate-400">
                {country.code}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
