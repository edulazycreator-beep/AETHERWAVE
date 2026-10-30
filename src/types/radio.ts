export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  FallbackUrl?: string;
  favicon: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  tags: string;
  bitrate: number;
  codec: string;
  votes: number;
  lat: number;
  lng: number;
  frequency?: string;
  themePalette?: {
    primary: [number, number, number];
    secondary: [number, number, number];
    accent: [number, number, number];
    hex: string;
  };
}

export interface CountryMetadata {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  continent: 'Asia' | 'Eropa' | 'Amerika' | 'Timur Tengah & Afrika' | 'Oseania';
  timezone: string;
  lat: number;
  lng: number;
  mapX: number; // SVG 0-1000 coordinate
  mapY: number; // SVG 0-500 coordinate
  stationCountEstimate: number;
  featuredGenre: string;
}

export type VisualizerMode = 'bars' | 'wave' | 'orb';

export type BitratePreference = 'all' | 'low' | 'standard' | 'hd';

export interface EqualizerBand {
  frequency: number;
  label: string;
  gain: number; // -12 to +12 dB
}

export interface EqualizerPreset {
  id: string;
  name: string;
  gains: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
}

export interface RecordedClip {
  id: string;
  stationName: string;
  country: string;
  createdAt: string;
  durationSeconds: number;
  audioUrl: string;
  mimeType: string;
  sizeKb: number;
  themeHex: string;
}

export interface RadioAlarm {
  id: string;
  time: string; // HH:MM
  stationuuid: string;
  stationName: string;
  countryCode: string;
  enabled: boolean;
  days: string[];
}
