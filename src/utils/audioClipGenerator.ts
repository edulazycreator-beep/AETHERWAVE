/**
 * Generates a valid, playable stereo WAV Blob with rich ambient radio chord harmonics
 * Used as a fallback when a cross-origin Icecast stream restricts raw byte capture via MediaElementSource
 */
export function createHarmonicBroadcastWavBlob(durationSeconds: number, seedStr: string): Blob {
  const sampleRate = 22050;
  const clampedDuration = Math.max(3, Math.min(30, durationSeconds));
  const numSamples = sampleRate * clampedDuration;
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseFreq = 220 + (Math.abs(hash) % 110); // Warm A3-D4 root
  const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 1.875]; // Major 7th chord

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Smooth fade in & fade out
    const env =
      t < 0.4
        ? t / 0.4
        : t > clampedDuration - 0.5
        ? Math.max(0, (clampedDuration - t) / 0.5)
        : 1;

    // Gentle rhythmic modulation
    const lfo = 0.75 + 0.25 * Math.sin(2 * Math.PI * 1.5 * t);
    let sample = 0;
    for (let fIdx = 0; fIdx < freqs.length; fIdx++) {
      const f = freqs[fIdx];
      sample += Math.sin(2 * Math.PI * f * t + Math.sin(2 * Math.PI * 2 * t) * 0.2) * (0.22 / (fIdx + 1));
    }

    const pcmValue = Math.max(-1, Math.min(1, sample * env * lfo));
    view.setInt16(offset, pcmValue * 28000, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Plays a gentle 3-note glassmorphic chime using Web Audio API when a Radio Alarm triggers
 */
export function playAlarmGlassChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + idx * 0.16 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.7);
    });
  } catch {
    // Ignore if audio context blocked
  }
}
