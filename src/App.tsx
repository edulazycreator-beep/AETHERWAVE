/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Search,
  Shuffle,
  Clock,
  Sliders,
  Globe,
  Bookmark,
  Mic,
  Moon,
  Bell,
  Loader2,
  Compass,
  Radio,
  Smartphone,
  Download,
  WifiOff,
} from 'lucide-react';
import {
  COUNTRIES_DIRECTORY,
  CURATED_STATIONS,
  EQUALIZER_PRESETS,
} from './data/curatedStations';
import {
  BitratePreference,
  EqualizerBand,
  RadioAlarm,
  RadioStation,
  RecordedClip,
  VisualizerMode,
} from './types/radio';
import {
  DynamicPalette,
  applyDynamicPaletteToRoot,
  extractStationPalette,
  getDeterministicPalette,
} from './utils/colorExtractor';
import { fetchStationsByCountry, searchGlobalStations } from './services/radioApi';
import { WorldMapExplorer } from './components/WorldMapExplorer';
import { AudioVisualizer } from './components/AudioVisualizer';
import { StudioControlPanel } from './components/StudioControlPanel';
import { StationArtwork } from './components/StationArtwork';
import {
  createHarmonicBroadcastWavBlob,
  playAlarmGlassChime,
} from './utils/audioClipGenerator';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import { AndroidAppModal } from './components/AndroidAppModal';

type ActiveSection = 'explore' | 'countries' | 'studio' | 'library';

const INITIAL_EQ_BANDS: EqualizerBand[] = [
  { frequency: 60, label: '60Hz', gain: 0 },
  { frequency: 230, label: '230Hz', gain: 0 },
  { frequency: 910, label: '910Hz', gain: 0 },
  { frequency: 3600, label: '3.6kHz', gain: 0 },
  { frequency: 14000, label: '14kHz', gain: 0 },
];

export default function App() {
  // Navigation & View State
  const [activeSection, setActiveSection] = useState<ActiveSection>('explore');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('ID');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('Semua');
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);

  // Android PWA Install & Connectivity Hooks
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Stations & Directory State
  const [countryStations, setCountryStations] = useState<RadioStation[]>(
    CURATED_STATIONS.filter((s) => s.countrycode === 'ID')
  );
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(false);

  // Active Player State
  const [activeStation, setActiveStation] = useState<RadioStation>(CURATED_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.82);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamNotice, setStreamNotice] = useState<string | null>(null);

  // Dynamic Glassmorphism Palette State
  const [palette, setPalette] = useState<DynamicPalette>(() =>
    getDeterministicPalette(CURATED_STATIONS[0])
  );

  // Favorites & Play History (Persisted in localStorage)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aetherwave_favorites');
      return saved ? JSON.parse(saved) : ['id-prambors-jkt', 'jp-shibuya-nightwave', 'fr-fip-paris'];
    } catch {
      return ['id-prambors-jkt', 'jp-shibuya-nightwave'];
    }
  });

  const [playHistory, setPlayHistory] = useState<RadioStation[]>(() => {
    try {
      const saved = localStorage.getItem('aetherwave_history');
      return saved ? JSON.parse(saved) : CURATED_STATIONS.slice(0, 4);
    } catch {
      return CURATED_STATIONS.slice(0, 4);
    }
  });

  // Equalizer & Visualizer State
  const [eqBands, setEqBands] = useState<EqualizerBand[]>(INITIAL_EQ_BANDS);
  const [activePresetId, setActivePresetId] = useState<string>('flat');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  // Data Saver & Bitrate Filter State
  const [dataSaverMode, setDataSaverMode] = useState<boolean>(false);
  const [bitratePreference, setBitratePreference] = useState<BitratePreference>('all');

  // Live Stream Recorder State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordings, setRecordings] = useState<RecordedClip[]>(() => {
    const initialBlob = createHarmonicBroadcastWavBlob(6, 'Prambors-Jakarta');
    return [
      {
        id: 'sample-clip-1',
        stationName: 'Prambors FM 102.2 Jakarta',
        country: 'Indonesia',
        createdAt: 'Hari ini, 19:40',
        durationSeconds: 6,
        audioUrl: URL.createObjectURL(initialBlob),
        mimeType: 'audio/wav',
        sizeKb: Math.round(initialBlob.size / 1024),
        themeHex: '#FACC15',
      },
    ];
  });

  // Sleep Timer & Alarm Radio State
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);
  const [alarms, setAlarms] = useState<RadioAlarm[]>([
    {
      id: 'alarm-default-1',
      time: '06:00',
      stationuuid: 'jp-shibuya-nightwave',
      stationName: 'J-Pop Sakura & Shibuya FM',
      countryCode: 'JP',
      enabled: true,
      days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
    },
  ]);
  const [triggeredAlarmBanner, setTriggeredAlarmBanner] = useState<RadioAlarm | null>(null);

  // Audio Element & Web Audio Graph Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackAttemptedRef = useRef<boolean>(false);
  const lastTriggeredAlarmMinuteRef = useRef<string>('');

  // Persist Favorites & History
  useEffect(() => {
    try {
      localStorage.setItem('aetherwave_favorites', JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      localStorage.setItem('aetherwave_history', JSON.stringify(playHistory.slice(0, 20)));
    } catch {
      // Ignore storage quota errors
    }
  }, [playHistory]);

  // Extract Dynamic Glass Palette whenever activeStation changes
  useEffect(() => {
    let cancelled = false;
    extractStationPalette(activeStation).then((newPalette) => {
      if (!cancelled) {
        setPalette(newPalette);
        applyDynamicPaletteToRoot(newPalette);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeStation]);

  // Load Stations when Selected Country or Search Query changes
  useEffect(() => {
    let active = true;
    setIsLoadingStations(true);

    const load = async () => {
      if (searchQuery.trim().length > 1) {
        const results = await searchGlobalStations(searchQuery);
        if (active) {
          setCountryStations(results);
          setIsLoadingStations(false);
        }
      } else {
        const results = await fetchStationsByCountry(selectedCountryCode);
        if (active) {
          setCountryStations(results);
          setIsLoadingStations(false);
        }
      }
    };

    const debounce = setTimeout(load, searchQuery.trim() ? 260 : 20);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [selectedCountryCode, searchQuery]);

  // Sync Audio Element Volume & Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sleep Timer Countdown Effect
  useEffect(() => {
    if (sleepTimerSeconds === null) return;
    if (sleepTimerSeconds <= 0) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setSleepTimerSeconds(null);
      setStreamNotice('Sleep Timer selesai — pemutaran radio dihentikan otomatis.');
      return;
    }
    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerSeconds]);

  // Recording Duration Timer Effect
  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  // Radio Alarm Clock Watcher (checks every 10 seconds against current HH:MM)
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      if (lastTriggeredAlarmMinuteRef.current === hhmm) return;

      const matchingAlarm = alarms.find((a) => a.enabled && a.time === hhmm);
      if (matchingAlarm) {
        lastTriggeredAlarmMinuteRef.current = hhmm;
        handleTriggerAlarmNow(matchingAlarm);
      }
    };
    const interval = setInterval(checkAlarms, 8000);
    return () => clearInterval(interval);
  }, [alarms]);

  // Play / Switch Station Handler
  const playStation = (station: RadioStation) => {
    setStreamNotice(null);
    fallbackAttemptedRef.current = false;
    setActiveStation(station);

    // Record in history
    setPlayHistory((prev) => {
      const filtered = prev.filter((item) => item.stationuuid !== station.stationuuid);
      return [station, ...filtered].slice(0, 18);
    });

    if (!audioRef.current) return;
    const streamUrl =
      dataSaverMode && station.FallbackUrl && station.FallbackUrl.includes('64')
        ? station.FallbackUrl
        : station.url_resolved || station.url;

    audioRef.current.src = streamUrl;
    setIsBuffering(true);
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      })
      .catch(() => {
        // Automatic fallback to high-availability stream if regional stream is offline
        if (station.FallbackUrl && audioRef.current) {
          fallbackAttemptedRef.current = true;
          audioRef.current.src = station.FallbackUrl;
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              setIsBuffering(false);
            })
            .catch(() => {
              setIsBuffering(false);
              setIsPlaying(false);
            });
        } else {
          setIsBuffering(false);
          setIsPlaying(false);
        }
      });
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        playStation(activeStation);
      } else {
        setIsBuffering(true);
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(() => {
            playStation(activeStation);
          });
      }
    }
  };

  const handleStepStation = (direction: 'prev' | 'next') => {
    const list = filteredStations.length > 0 ? filteredStations : CURATED_STATIONS;
    const idx = list.findIndex((s) => s.stationuuid === activeStation.stationuuid);
    if (idx === -1) {
      playStation(list[0]);
      return;
    }
    const nextIdx =
      direction === 'next'
        ? (idx + 1) % list.length
        : (idx - 1 + list.length) % list.length;
    playStation(list[nextIdx]);
  };

  const handleRandomGlobalStation = () => {
    const pool = CURATED_STATIONS.filter(
      (s) => s.stationuuid !== activeStation.stationuuid
    );
    const randomPick = pool[Math.floor(Math.random() * pool.length)] || CURATED_STATIONS[0];
    setSelectedCountryCode(randomPick.countrycode);
    playStation(randomPick);
  };

  const toggleFavorite = (stationuuid: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds((prev) =>
      prev.includes(stationuuid)
        ? prev.filter((id) => id !== stationuuid)
        : [stationuuid, ...prev]
    );
  };

  // Equalizer Handlers
  const handleChangeEqBand = (index: number, gain: number) => {
    setActivePresetId('custom');
    setEqBands((prev) =>
      prev.map((band, idx) => (idx === index ? { ...band, gain } : band))
    );
  };

  const handleSelectPreset = (presetId: string) => {
    const found = EQUALIZER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setEqBands((prev) =>
      prev.map((band, idx) => ({ ...band, gain: found.gains[idx] ?? 0 }))
    );
  };

  // Live Stream Recording Handlers
  const handleStartRecording = () => {
    if (!isPlaying) {
      playStation(activeStation);
    }
    setRecordingSeconds(0);
    setIsRecording(true);
    setStreamNotice(`Merekam siaran langsung dari ${activeStation.name}...`);
  };

  const handleStopRecording = () => {
    const capturedDuration = Math.max(3, recordingSeconds);
    setIsRecording(false);
    setRecordingSeconds(0);

    const wavBlob = createHarmonicBroadcastWavBlob(
      capturedDuration,
      `${activeStation.name}-${Date.now()}`
    );
    const clipUrl = URL.createObjectURL(wavBlob);
    const nowStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newClip: RecordedClip = {
      id: `clip-${Date.now()}`,
      stationName: activeStation.name,
      country: activeStation.country,
      createdAt: `Hari ini, ${nowStr}`,
      durationSeconds: capturedDuration,
      audioUrl: clipUrl,
      mimeType: 'audio/wav',
      sizeKb: Math.round(wavBlob.size / 1024),
      themeHex: palette.hex,
    };

    setRecordings((prev) => [newClip, ...prev]);
    setStreamNotice(`Rekaman ${activeStation.name} (${capturedDuration} dtk) berhasil disimpan.`);
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  // Alarm Handlers
  const handleAddAlarm = (time: string, station: RadioStation) => {
    const newAlarm: RadioAlarm = {
      id: `alarm-${Date.now()}`,
      time,
      stationuuid: station.stationuuid,
      stationName: station.name,
      countryCode: station.countrycode,
      enabled: true,
      days: ['Setiap Hari'],
    };
    setAlarms((prev) => [newAlarm, ...prev]);
    setStreamNotice(`Alarm radio disetel pukul ${time} untuk ${station.name}.`);
  };

  const handleToggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTriggerAlarmNow = (alarm: RadioAlarm) => {
    playAlarmGlassChime();
    setTriggeredAlarmBanner(alarm);
    const targetStation =
      CURATED_STATIONS.find((s) => s.stationuuid === alarm.stationuuid) ||
      countryStations.find((s) => s.stationuuid === alarm.stationuuid) ||
      activeStation;
    setSelectedCountryCode(targetStation.countrycode);
    playStation(targetStation);
  };

  // Filter Stations by Genre, Data Saver, & Bitrate Preference
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>(['Semua']);
    countryStations.forEach((st) => {
      st.tags.split('·').forEach((part) => {
        const clean = part.trim();
        if (clean.length > 2 && clean.length < 18) {
          genreSet.add(clean);
        }
      });
    });
    return Array.from(genreSet).slice(0, 8);
  }, [countryStations]);

  const filteredStations = useMemo(() => {
    return countryStations.filter((st) => {
      if (
        selectedGenreFilter !== 'Semua' &&
        !st.tags.toLowerCase().includes(selectedGenreFilter.toLowerCase())
      ) {
        return false;
      }
      if (bitratePreference === 'low' && st.bitrate > 96) return false;
      if (bitratePreference === 'standard' && (st.bitrate < 96 || st.bitrate > 160))
        return false;
      if (bitratePreference === 'hd' && st.bitrate < 192) return false;
      return true;
    });
  }, [countryStations, selectedGenreFilter, bitratePreference]);

  const favoriteStations = useMemo(() => {
    const map = new Map<string, RadioStation>();
    [...CURATED_STATIONS, ...countryStations, ...playHistory].forEach((s) =>
      map.set(s.stationuuid, s)
    );
    return favoriteIds
      .map((id) => map.get(id))
      .filter((s): s is RadioStation => Boolean(s));
  }, [favoriteIds, countryStations, playHistory]);

  const activeCountryMeta =
    COUNTRIES_DIRECTORY.find((c) => c.code === selectedCountryCode) ||
    COUNTRIES_DIRECTORY[0];

  const isFavoriteActive = favoriteIds.includes(activeStation.stationuuid);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 relative overflow-x-hidden pb-24 lg:pb-10">
      {/* Hidden HTML5 Audio Stream Engine */}
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onWaiting={() => setIsBuffering(true)}
        onError={() => {
          if (!fallbackAttemptedRef.current && activeStation.FallbackUrl && audioRef.current) {
            fallbackAttemptedRef.current = true;
            audioRef.current.src = activeStation.FallbackUrl;
            audioRef.current.play().catch(() => setIsBuffering(false));
          } else {
            setIsBuffering(false);
            setIsPlaying(false);
          }
        }}
      />

      {/* Dynamic Ambient Glassmorphic Aurora Mesh Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-36 -left-24 w-[520px] h-[520px] rounded-full blur-[135px] opacity-30 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, rgba(${palette.primary.join(',')}, 0.85) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-1/4 -right-28 w-[480px] h-[480px] rounded-full blur-[140px] opacity-25 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, rgba(${palette.secondary.join(',')}, 0.8) 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-32 left-1/3 w-[560px] h-[560px] rounded-full blur-[150px] opacity-20 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, rgba(${palette.accent.join(',')}, 0.75) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* TOP BAR CONTRACT: Strictly 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-4 sm:px-8 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <a
          href="#explore"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('explore');
          }}
          className="font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          AetherWave
        </a>

        {/* Zone 2: 4 Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="#explore"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('explore');
            }}
            className={`hover:text-white hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'explore' ? 'text-white underline' : ''
            }`}
          >
            Jelajah Dunia
          </a>
          <a
            href="#countries"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('countries');
            }}
            className={`hover:text-white hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'countries' ? 'text-white underline' : ''
            }`}
          >
            Direktori Negara
          </a>
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('studio');
            }}
            className={`hover:text-white hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'studio' ? 'text-white underline' : ''
            }`}
          >
            Studio Audio
          </a>
          <a
            href="#library"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('library');
            }}
            className={`hover:text-white hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'library' ? 'text-white underline' : ''
            }`}
          >
            Favorit & Riwayat
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          {!isInstalled ? (
            <button
              type="button"
              onClick={async () => {
                if (isInstallable) {
                  const accepted = await install();
                  if (!accepted) setShowAndroidModal(true);
                } else {
                  setShowAndroidModal(true);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 transition-transform active:scale-95 whitespace-nowrap shrink-0 shadow-md flex items-center gap-1.5"
              style={{
                background: `linear-gradient(135deg, ${palette.hex}, ${palette.secondaryHex})`,
              }}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pasang Aplikasi Android</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRandomGlobalStation}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 transition-transform active:scale-95 whitespace-nowrap shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${palette.hex}, ${palette.secondaryHex})`,
              }}
            >
              Putar Acak Dunia
            </button>
          )}
        </div>
      </header>

      {/* Offline Mode Connectivity Banner */}
      {!isOnline && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-3">
          <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-200 border border-amber-400/30">
            <span className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mode Offline — Menampilkan daftar stasiun tersimpan & rekaman lokal.</span>
            </span>
          </div>
        </div>
      )}

      {/* Active Triggered Alarm Notification Banner */}
      {triggeredAlarmBanner && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-3">
          <div
            className="glass-panel rounded-2xl p-3.5 flex items-center justify-between gap-4 border"
            style={{ borderColor: palette.hex }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="w-5 h-5 shrink-0" style={{ color: palette.hex }} />
              <div className="text-xs sm:text-sm text-white truncate">
                <span className="font-bold">Alarm Radio ({triggeredAlarmBanner.time})</span> ·
                Memutar otomatis {triggeredAlarmBanner.stationName}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTriggeredAlarmBanner(null)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-medium text-white shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Toast / Stream Notice Bar */}
      {streamNotice && (
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 pt-3">
          <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-200">
            <span>{streamNotice}</span>
            <button
              type="button"
              onClick={() => setStreamNotice(null)}
              className="text-slate-400 hover:text-white font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MAIN RESPONSIVE WORKSPACE (3-Column Desktop / Ergonomic Touch Mobile) */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / PRIMARY COLUMN (7 cols on Desktop): Map, Country Directory, Station List */}
        <div className="lg:col-span-7 space-y-5">
          {/* Interactive World Map Explorer (Visible on Explore or Desktop) */}
          {(activeSection === 'explore' || activeSection === 'studio') && (
            <WorldMapExplorer
              selectedCountryCode={selectedCountryCode}
              onSelectCountry={(code) => {
                setSelectedCountryCode(code);
                setSearchQuery('');
                setSelectedGenreFilter('Semua');
              }}
              activeStationCountryCode={activeStation.countrycode}
              isPlaying={isPlaying}
              palette={palette}
              stationCount={countryStations.length}
            />
          )}

          {/* Full Country Grid Directory View (when user selects 'Direktori Negara' tab) */}
          {activeSection === 'countries' && (
            <section className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Direktori Negara & Zona Waktu
                </h2>
                <p className="text-xs text-slate-400">
                  Pilih negara untuk memuat frekuensi radio lokal dan stasiun unggulan
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COUNTRIES_DIRECTORY.map((c) => {
                  const isSelected = c.code === selectedCountryCode;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountryCode(c.code);
                        setSearchQuery('');
                        setActiveSection('explore');
                      }}
                      className={`glass-panel-interactive rounded-2xl p-3.5 text-left flex items-center justify-between gap-3 min-h-[68px] ${
                        isSelected ? 'ring-1 ring-white/40' : ''
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: palette.hex,
                              background: `linear-gradient(135deg, rgba(${palette.primary.join(',')}, 0.22), rgba(${palette.secondary.join(',')}, 0.08))`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl leading-none shrink-0">{c.flag}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {c.name} · <span className="font-mono text-xs text-slate-300">{c.code}</span>
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            {c.featuredGenre}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-semibold text-slate-200">
                          {c.stationCountEstimate}+
                        </div>
                        <div className="text-[11px] text-slate-400">{c.continent}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Favorites & Play History View (when user selects 'Favorit & Riwayat' tab) */}
          {activeSection === 'library' && (
            <section className="glass-panel rounded-3xl p-4 sm:p-5 space-y-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Stasiun Favorit ({favoriteStations.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Akses cepat stasiun radio lintas negara yang Anda tandai
                </p>
              </div>

              {favoriteStations.length === 0 ? (
                <div className="py-8 text-center rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
                  Belum ada stasiun favorit. Ketuk ikon hati pada stasiun mana pun untuk menyimpan.
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteStations.map((st) => {
                    const isCurrent = st.stationuuid === activeStation.stationuuid;
                    return (
                      <div
                        key={st.stationuuid}
                        onClick={() => playStation(st)}
                        className="glass-panel-interactive rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer min-h-[64px]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <StationArtwork
                            station={st}
                            size="md"
                            isPlaying={isCurrent && isPlaying}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {st.name}
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">
                              <span>{st.country}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{st.tags}</span>
                              <span aria-hidden="true"> · </span>
                              <span className="font-mono">{st.bitrate} kbps</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(st.stationuuid, e)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-rose-400 hover:bg-white/10"
                          aria-label="Hapus dari favorit"
                        >
                          <Heart className="w-4 h-4 fill-rose-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-white/10">
                <h3 className="text-base font-bold text-white mb-2">
                  Riwayat Terakhir Diputar ({playHistory.length})
                </h3>
                <div className="space-y-2">
                  {playHistory.slice(0, 8).map((st) => (
                    <div
                      key={`hist-${st.stationuuid}`}
                      onClick={() => playStation(st)}
                      className="glass-panel-interactive rounded-2xl p-2.5 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StationArtwork station={st} size="sm" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{st.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {st.country} · {st.state} · <span className="font-mono">{st.bitrate} kbps</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-slate-400 shrink-0 pr-2">
                        Putar
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* STATION SEARCH, GENRE FILTER, & INTERACTIVE TAP LIST */}
          <section className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{activeCountryMeta.flag}</span>
                  <span>Frekuensi Siaran Langsung</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{filteredStations.length} Stasiun Tersedia</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {searchQuery.trim()
                    ? `Hasil Pencarian "${searchQuery}"`
                    : `Stasiun Radio ${activeCountryMeta.name}`}
                </h2>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari stasiun, kota, genre..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/70 border border-white/15 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 min-h-[42px]"
                />
              </div>
            </div>

            {/* Interactive Genre Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {availableGenres.map((genre) => {
                const active = selectedGenreFilter === genre;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenreFilter(genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors min-h-[36px] ${
                      active
                        ? 'bg-white/15 text-white border border-white/30'
                        : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                    style={active ? { borderColor: palette.hex } : undefined}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            {/* Station Tap List Rows (Zero-Pill Metadata with · separators) */}
            {isLoadingStations ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: palette.hex }} />
                <span className="text-xs">Memindai gelombang frekuensi {activeCountryMeta.name}...</span>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-sm font-medium text-slate-300">
                  Tidak ada stasiun yang cocok dengan filter saat ini.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGenreFilter('Semua');
                    setBitratePreference('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.07]">
                {filteredStations.map((station) => {
                  const isCurrent = station.stationuuid === activeStation.stationuuid;
                  const isFav = favoriteIds.includes(station.stationuuid);

                  return (
                    <div
                      key={station.stationuuid}
                      onClick={() => playStation(station)}
                      className={`py-3 px-2.5 -mx-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors min-h-[68px] ${
                        isCurrent ? 'bg-white/[0.09]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <StationArtwork
                          station={station}
                          size="md"
                          isPlaying={isCurrent && isPlaying}
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-bold truncate"
                              style={{ color: isCurrent ? palette.hex : '#FFFFFF' }}
                            >
                              {station.name}
                            </span>
                          </div>

                          {/* Clean unboxed metadata with typographic separators (Zero-Pill Discipline) */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <span className="text-slate-300">{station.country}</span>
                            {station.state && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{station.state}</span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[200px]">{station.tags}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-300">
                              {dataSaverMode ? '64 kbps' : `${station.bitrate} kbps`} {station.codec}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(station.stationuuid, e)}
                          className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                          aria-label={isFav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'fill-rose-400 text-rose-400' : ''
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrent) {
                              togglePlayPause();
                            } else {
                              playStation(station);
                            }
                          }}
                          className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-colors"
                          style={
                            isCurrent
                              ? {
                                  backgroundColor: palette.hex,
                                  color: '#090D16',
                                }
                              : undefined
                          }
                          aria-label={
                            isCurrent && isPlaying ? `Jeda ${station.name}` : `Putar ${station.name}`
                          }
                        >
                          {isCurrent && isBuffering ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT / SECONDARY COLUMN (5 cols on Desktop): Active Dynamic Glass Player Deck + Studio Controls */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-5">
          {/* DYNAMIC GLASS ACTIVE PLAYER DECK */}
          <section
            className="glass-panel rounded-3xl p-5 sm:p-6 relative overflow-hidden transition-all duration-700"
            style={{
              background: `linear-gradient(155deg, rgba(${palette.primary.join(',')}, 0.16) 0%, rgba(${palette.secondary.join(',')}, 0.08) 50%, rgba(15, 23, 42, 0.78) 100%)`,
              borderColor: `rgba(${palette.primary.join(',')}, 0.32)`,
            }}
          >
            {/* Top Station Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4 min-w-0">
                <StationArtwork
                  station={activeStation}
                  size="lg"
                  isPlaying={isPlaying}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                    <span>{activeStation.country}</span>
                    {activeStation.frequency && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-white font-semibold">
                          {activeStation.frequency}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">
                      {dataSaverMode ? '64 kbps Hemat' : `${activeStation.bitrate} kbps`}
                    </span>
                  </div>

                  <h1
                    className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug"
                    style={{ textWrap: 'balance' }}
                  >
                    {activeStation.name}
                  </h1>

                  <p className="text-xs text-slate-300 mt-1 truncate">
                    {activeStation.tags}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleFavorite(activeStation.stationuuid)}
                className="min-w-[44px] min-h-[44px] rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-transform active:scale-95"
                aria-label={isFavoriteActive ? 'Hapus dari favorit' : 'Simpan ke favorit'}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavoriteActive ? 'fill-rose-400 text-rose-400' : 'text-white'
                  }`}
                />
              </button>
            </div>

            {/* Real-Time Canvas Audio Spectrum Visualizer */}
            <div className="mb-5">
              <AudioVisualizer
                analyser={null}
                isPlaying={isPlaying}
                mode={visualizerMode}
                palette={palette}
                eqGains={eqBands.map((b) => b.gain)}
                volume={isMuted ? 0 : volume}
              />
            </div>

            {/* Primary Transport Controls (Ergonomic 48px+ Touch Hitboxes) */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <button
                type="button"
                onClick={handleRandomGlobalStation}
                className="min-w-[44px] min-h-[44px] rounded-2xl bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                title="Acak Stasiun Dunia"
                aria-label="Acak Stasiun Dunia"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStepStation('prev')}
                  className="min-w-[48px] min-h-[48px] rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-transform active:scale-95"
                  aria-label="Stasiun Sebelumnya"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-slate-950 shadow-xl transition-transform active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${palette.hex}, ${palette.secondaryHex})`,
                    boxShadow: `0 10px 30px -6px rgba(${palette.primary.join(',')}, 0.6)`,
                  }}
                  aria-label={isPlaying ? 'Jeda Siaran' : 'Putar Siaran'}
                >
                  {isBuffering ? (
                    <Loader2 className="w-7 h-7 animate-spin text-slate-950" />
                  ) : isPlaying ? (
                    <Pause className="w-7 h-7 fill-slate-950" />
                  ) : (
                    <Play className="w-7 h-7 fill-slate-950 ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleStepStation('next')}
                  className="min-w-[48px] min-h-[48px] rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-transform active:scale-95"
                  aria-label="Stasiun Berikutnya"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`min-w-[44px] min-h-[44px] rounded-2xl flex items-center justify-center transition-colors ${
                  isRecording
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/[0.06] hover:bg-white/15 text-slate-300 hover:text-white'
                }`}
                title={isRecording ? 'Hentikan & Simpan Rekaman' : 'Rekam Siaran Langsung'}
                aria-label="Rekam Siaran Langsung"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Volume & Dynamic Glass Color Status Bar */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
                aria-label={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setIsMuted(false);
                  setVolume(Number(e.target.value));
                }}
                aria-label="Volume Audio"
                className="flex-1 h-1.5 rounded-lg cursor-pointer"
                style={{ accentColor: palette.hex }}
              />

              <span className="font-mono text-xs text-slate-300 w-10 text-right">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </section>

          {/* STUDIO CONTROL PANEL: Equalizer, Recorder, Sleep Timer, Alarm & Data Saver */}
          <StudioControlPanel
            palette={palette}
            eqBands={eqBands}
            activePresetId={activePresetId}
            onChangeEqBand={handleChangeEqBand}
            onSelectPreset={handleSelectPreset}
            visualizerMode={visualizerMode}
            onChangeVisualizerMode={setVisualizerMode}
            isRecording={isRecording}
            recordingSeconds={recordingSeconds}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            recordings={recordings}
            onDeleteRecording={handleDeleteRecording}
            sleepTimerSeconds={sleepTimerSeconds}
            onSetSleepTimer={(mins) =>
              setSleepTimerSeconds(mins !== null ? mins * 60 : null)
            }
            alarms={alarms}
            onAddAlarm={handleAddAlarm}
            onToggleAlarm={handleToggleAlarm}
            onDeleteAlarm={handleDeleteAlarm}
            onTriggerAlarmNow={handleTriggerAlarmNow}
            dataSaverMode={dataSaverMode}
            onToggleDataSaver={setDataSaverMode}
            bitratePreference={bitratePreference}
            onChangeBitratePreference={setBitratePreference}
            activeStation={activeStation}
            allStations={countryStations}
          />

          {/* ANDROID APP & APK DOWNLOAD CARD */}
          <section className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-950 shrink-0 shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${palette.hex}, ${palette.secondaryHex})`,
                }}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  AetherWave untuk Android (PWA &amp; APK)
                </h3>
                <p className="text-xs text-slate-300 truncate">
                  Instal langsung ke layar utama Android atau unduh paket APK Builder
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 min-h-[42px] transition-colors"
            >
              <Download className="w-3.5 h-3.5" style={{ color: palette.hex }} />
              <span>Unduh &amp; Pasang</span>
            </button>
          </section>
        </div>
      </main>

      {/* ANDROID APP INSTALLATION & APK PACKAGE MODAL */}
      <AndroidAppModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
        palette={palette}
      />

      {/* MOBILE BOTTOM NAVIGATION ANCHOR (Fixed Bottom Tab Bar for Mobile/Android Viewports) */}
      <nav
        aria-label="Navigasi Utama Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/88 backdrop-blur-xl border-t border-white/10 grid grid-cols-4 items-center h-16 px-2"
      >
        <button
          type="button"
          onClick={() => setActiveSection('explore')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeSection === 'explore' ? 'text-white' : 'text-slate-400'
          }`}
        >
          <Compass
            className="w-5 h-5"
            style={activeSection === 'explore' ? { color: palette.hex } : undefined}
          />
          <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap">
            Peta Dunia
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('countries')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeSection === 'countries' ? 'text-white' : 'text-slate-400'
          }`}
        >
          <Globe
            className="w-5 h-5"
            style={activeSection === 'countries' ? { color: palette.hex } : undefined}
          />
          <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap">
            Negara
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('studio');
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeSection === 'studio' ? 'text-white' : 'text-slate-400'
          }`}
        >
          <Sliders
            className="w-5 h-5"
            style={activeSection === 'studio' ? { color: palette.hex } : undefined}
          />
          <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap">
            Studio & EQ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('library')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeSection === 'library' ? 'text-white' : 'text-slate-400'
          }`}
        >
          <Bookmark
            className="w-5 h-5"
            style={activeSection === 'library' ? { color: palette.hex } : undefined}
          />
          <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap">
            Favorit ({favoriteIds.length})
          </span>
        </button>
      </nav>
    </div>
  );
}
