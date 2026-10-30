import React, { useState } from 'react';
import {
  Sliders,
  Mic,
  Square,
  Download,
  Trash2,
  Moon,
  Bell,
  Plus,
  Play,
  Pause,
  Gauge,
  Check,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { EQUALIZER_PRESETS, CURATED_STATIONS } from '../data/curatedStations';
import {
  BitratePreference,
  EqualizerBand,
  RadioAlarm,
  RadioStation,
  RecordedClip,
  VisualizerMode,
} from '../types/radio';
import { DynamicPalette } from '../utils/colorExtractor';

interface StudioControlPanelProps {
  palette: DynamicPalette;
  // Equalizer & Visualizer
  eqBands: EqualizerBand[];
  activePresetId: string;
  onChangeEqBand: (index: number, gain: number) => void;
  onSelectPreset: (presetId: string) => void;
  visualizerMode: VisualizerMode;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  // Recorder
  isRecording: boolean;
  recordingSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordings: RecordedClip[];
  onDeleteRecording: (id: string) => void;
  // Sleep Timer & Alarm
  sleepTimerSeconds: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
  alarms: RadioAlarm[];
  onAddAlarm: (time: string, station: RadioStation) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onTriggerAlarmNow: (alarm: RadioAlarm) => void;
  // Data Saver & Bitrate
  dataSaverMode: boolean;
  onToggleDataSaver: (val: boolean) => void;
  bitratePreference: BitratePreference;
  onChangeBitratePreference: (pref: BitratePreference) => void;
  activeStation: RadioStation;
  allStations: RadioStation[];
}

export const StudioControlPanel: React.FC<StudioControlPanelProps> = ({
  palette,
  eqBands,
  activePresetId,
  onChangeEqBand,
  onSelectPreset,
  visualizerMode,
  onChangeVisualizerMode,
  isRecording,
  recordingSeconds,
  onStartRecording,
  onStopRecording,
  recordings,
  onDeleteRecording,
  sleepTimerSeconds,
  onSetSleepTimer,
  alarms,
  onAddAlarm,
  onToggleAlarm,
  onDeleteAlarm,
  onTriggerAlarmNow,
  dataSaverMode,
  onToggleDataSaver,
  bitratePreference,
  onChangeBitratePreference,
  activeStation,
  allStations,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'eq' | 'recorder' | 'timer' | 'datasaver'>('eq');
  const [newAlarmTime, setNewAlarmTime] = useState('06:30');
  const [selectedAlarmStationId, setSelectedAlarmStationId] = useState(
    activeStation.stationuuid
  );
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [clipAudioElem, setClipAudioElem] = useState<HTMLAudioElement | null>(null);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handlePlayRecordedClip = (clip: RecordedClip) => {
    if (playingClipId === clip.id && clipAudioElem) {
      clipAudioElem.pause();
      setPlayingClipId(null);
      return;
    }
    if (clipAudioElem) {
      clipAudioElem.pause();
    }
    const audio = new Audio(clip.audioUrl);
    audio.onended = () => setPlayingClipId(null);
    audio.play().catch(() => setPlayingClipId(null));
    setClipAudioElem(audio);
    setPlayingClipId(clip.id);
  };

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStation =
      allStations.find((s) => s.stationuuid === selectedAlarmStationId) ||
      CURATED_STATIONS.find((s) => s.stationuuid === selectedAlarmStationId) ||
      activeStation;
    onAddAlarm(newAlarmTime, targetStation);
  };

  const estimatedDataPerHourMb = dataSaverMode
    ? 28
    : activeStation.bitrate >= 192
    ? 86
    : activeStation.bitrate <= 64
    ? 28
    : 56;

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5">
      {/* Studio Sub-Navigation Segmented Bar */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-950/65 border border-white/10 mb-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('eq')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all min-h-[42px] whitespace-nowrap ${
            activeSubTab === 'eq'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" style={activeSubTab === 'eq' ? { color: palette.hex } : undefined} />
          <span className="truncate">Equalizer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('recorder')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all min-h-[42px] whitespace-nowrap ${
            activeSubTab === 'recorder'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic
            className="w-3.5 h-3.5 shrink-0"
            style={
              isRecording
                ? { color: '#F43F5E' }
                : activeSubTab === 'recorder'
                ? { color: palette.hex }
                : undefined
            }
          />
          <span className="truncate">
            {isRecording ? `Rekam ${formatDuration(recordingSeconds)}` : 'Perekam'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('timer')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all min-h-[42px] whitespace-nowrap ${
            activeSubTab === 'timer'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5 shrink-0" style={activeSubTab === 'timer' ? { color: palette.hex } : undefined} />
          <span className="truncate">
            {sleepTimerSeconds ? formatDuration(sleepTimerSeconds) : 'Timer & Alarm'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('datasaver')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium transition-all min-h-[42px] whitespace-nowrap ${
            activeSubTab === 'datasaver'
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 shrink-0" style={activeSubTab === 'datasaver' ? { color: palette.hex } : undefined} />
          <span className="truncate">Bitrate</span>
        </button>
      </div>

      {/* TAB 1: 5-BAND EQUALIZER & VISUALIZER MODE */}
      {activeSubTab === 'eq' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">Studio Equalizer 5-Band</h3>
              <p className="text-xs text-slate-400">
                Sesuaikan karakter frekuensi kaca akustik & mode spektrum
              </p>
            </div>

            {/* Visualizer Mode Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/60 border border-white/10">
              {(['bars', 'wave', 'orb'] as VisualizerMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeVisualizerMode(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                    visualizerMode === m
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'bars' ? 'Spektrum' : m === 'wave' ? 'Gelombang' : 'Orbital'}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Selector Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {EQUALIZER_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all min-h-[36px] ${
                    isSelected
                      ? 'text-white border border-white/30'
                      : 'bg-white/[0.04] text-slate-300 border border-white/5 hover:bg-white/10'
                  }`}
                  style={
                    isSelected
                      ? {
                          background: `linear-gradient(135deg, rgba(${palette.primary.join(',')}, 0.28), rgba(${palette.secondary.join(',')}, 0.12))`,
                          borderColor: palette.hex,
                        }
                      : undefined
                  }
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* 5-Band Sliders */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-2 pb-1 px-2 rounded-2xl bg-slate-950/50 border border-white/10">
            {eqBands.map((band, idx) => (
              <div key={band.frequency} className="flex flex-col items-center py-2">
                <span className="font-mono text-[11px] text-slate-300 mb-2">
                  {band.gain > 0 ? `+${band.gain}` : band.gain}dB
                </span>
                <div className="h-28 flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={band.gain}
                    onChange={(e) => onChangeEqBand(idx, Number(e.target.value))}
                    aria-label={`Frekuensi ${band.label}`}
                    className="w-24 -rotate-90 accent-sky-400 cursor-pointer"
                    style={{ accentColor: palette.hex }}
                  />
                </div>
                <span className="font-mono text-[11px] font-medium text-slate-400 mt-2">
                  {band.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE STREAM RECORDER */}
      {activeSubTab === 'recorder' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-white/10">
            <div className="min-w-0">
              <div className="text-xs text-slate-400">Siaran Aktif</div>
              <div className="text-sm font-bold text-white truncate">{activeStation.name}</div>
              <div className="text-xs font-mono text-slate-300 mt-0.5">
                {isRecording
                  ? `Merekam langsung · ${formatDuration(recordingSeconds)}`
                  : 'Siap merekam potongan audio siaran'}
              </div>
            </div>

            {!isRecording ? (
              <button
                type="button"
                onClick={onStartRecording}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shrink-0 min-h-[44px] shadow-lg transition-transform active:scale-95"
                style={{
                  background: `linear-gradient(135deg, #F43F5E, #E11D48)`,
                }}
              >
                <Mic className="w-4 h-4" />
                <span>Mulai Rekam</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopRecording}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-950 flex items-center gap-2 shrink-0 min-h-[44px] shadow-lg transition-transform active:scale-95"
              >
                <Square className="w-4 h-4 fill-slate-950" />
                <span>Simpan ({formatDuration(recordingSeconds)})</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Daftar Rekaman Tersimpan ({recordings.length})</span>
              <span>Dapat diputar & diunduh</span>
            </div>

            {recordings.length === 0 ? (
              <div className="py-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
                Belum ada rekaman siaran. Tekan tombol Mulai Rekam saat mendengarkan radio.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recordings.map((clip) => {
                  const isPlayingThis = playingClipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => handlePlayRecordedClip(clip)}
                        className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0"
                        aria-label={isPlayingThis ? 'Jeda rekaman' : 'Putar rekaman'}
                      >
                        {isPlayingThis ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white truncate">
                          {clip.stationName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {clip.country} · {formatDuration(clip.durationSeconds)} · {clip.sizeKb} KB · {clip.createdAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={clip.audioUrl}
                          download={`AetherWave-${clip.stationName.replace(/\s+/g, '-')}.wav`}
                          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                          title="Unduh Rekaman Audio"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onDeleteRecording(clip.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                          title="Hapus Rekaman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SLEEP TIMER & ALARM RADIO */}
      {activeSubTab === 'timer' && (
        <div className="space-y-4">
          {/* Sleep Timer Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" style={{ color: palette.hex }} />
                <span>Sleep Timer (Matikan Otomatis)</span>
              </span>
              {sleepTimerSeconds !== null && (
                <span className="font-mono text-xs text-sky-300">
                  Aktif: {formatDuration(sleepTimerSeconds)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {[15, 30, 45, 60, 90].map((mins) => {
                const isSelected =
                  sleepTimerSeconds !== null &&
                  Math.ceil(sleepTimerSeconds / 60) === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onSetSleepTimer(mins)}
                    className={`py-2 rounded-xl font-mono text-xs font-medium border transition-all min-h-[40px] ${
                      isSelected
                        ? 'bg-white/20 text-white border-white/40'
                        : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onSetSleepTimer(null)}
                className="py-2 rounded-xl text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 min-h-[40px]"
              >
                Off
              </button>
            </div>
          </div>

          {/* Radio Alarm Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" style={{ color: palette.hex }} />
                <span>Alarm Radio Bangun Tidur</span>
              </span>
              <span className="text-[11px] text-slate-400">Putar otomatis stasiun pilihan</span>
            </div>

            <form onSubmit={handleCreateAlarm} className="flex flex-wrap sm:flex-nowrap gap-2 mb-3">
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-950/75 border border-white/15 font-mono text-xs text-white focus:outline-none focus:border-sky-400 min-h-[42px]"
              />
              <select
                value={selectedAlarmStationId}
                onChange={(e) => setSelectedAlarmStationId(e.target.value)}
                className="flex-1 min-w-[140px] px-3 py-2 rounded-xl bg-slate-950/75 border border-white/15 text-xs text-white focus:outline-none focus:border-sky-400 min-h-[42px]"
              >
                {CURATED_STATIONS.map((st) => (
                  <option key={st.stationuuid} value={st.stationuuid} className="bg-slate-900 text-white">
                    {st.country} — {st.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-white hover:bg-slate-200 flex items-center gap-1 shrink-0 min-h-[42px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{alarm.time}</span>
                      <span className="text-xs text-slate-300 truncate">{alarm.stationName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onTriggerAlarmNow(alarm)}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-medium text-slate-200"
                      title="Simulasikan bunyi alarm sekarang"
                    >
                      Uji Alarm
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleAlarm(alarm.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        alarm.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {alarm.enabled ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAlarm(alarm.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                      aria-label="Hapus alarm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA SAVER & BITRATE SELECTOR */}
      {activeSubTab === 'datasaver' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-white/10">
            <div>
              <div className="text-sm font-bold text-white">Mode Hemat Data Seluler</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Prioritaskan aliran AAC+/MP3 rendah kuota (&le; 64 kbps) saat di jaringan seluler
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dataSaverMode}
              onClick={() => onToggleDataSaver(!dataSaverMode)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[42px] shrink-0 ${
                dataSaverMode
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              {dataSaverMode ? 'Hemat Data: ON' : 'Hemat Data: OFF'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Filter Kualitas Bitrate Stasiun</span>
              <span className="font-mono text-slate-200">
                Estimasi: ~{estimatedDataPerHourMb} MB / jam
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'all', label: 'Semua Bitrate', desc: '32 – 320 kbps' },
                  { id: 'low', label: 'Hemat Kuota', desc: '≤ 64 kbps AAC' },
                  { id: 'standard', label: 'Standar Jernih', desc: '128 kbps MP3' },
                  { id: 'hd', label: 'Audiophile HD', desc: '≥ 192 kbps' },
                ] as Array<{ id: BitratePreference; label: string; desc: string }>
              ).map((opt) => {
                const active = bitratePreference === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeBitratePreference(opt.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      active
                        ? 'bg-white/15 border-white/35 text-white'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                    style={active ? { borderColor: palette.hex } : undefined}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{opt.label}</span>
                      {active && <Check className="w-3.5 h-3.5" style={{ color: palette.hex }} />}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
