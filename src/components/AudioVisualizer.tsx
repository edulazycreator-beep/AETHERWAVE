import React, { useEffect, useRef } from 'react';
import { VisualizerMode } from '../types/radio';
import { DynamicPalette } from '../utils/colorExtractor';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: VisualizerMode;
  palette: DynamicPalette;
  eqGains: number[];
  volume: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  isPlaying,
  mode,
  palette,
  eqGains,
  volume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      let hasRealSignal = false;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > 3) {
            hasRealSignal = true;
            break;
          }
        }
      }

      phaseRef.current += isPlaying ? 0.08 : 0.015;
      const t = phaseRef.current;

      // Calculate synthetic or real normalized spectrum (36 bins)
      const numBins = 36;
      const spectrum: number[] = [];
      const volScale = Math.max(0.25, volume);

      for (let i = 0; i < numBins; i++) {
        // Map EQ band gain boost (-12 to +12 dB) across the spectrum
        const bandIndex = Math.min(4, Math.floor((i / numBins) * 5));
        const eqBoost = 1 + (eqGains[bandIndex] || 0) * 0.045;

        if (hasRealSignal) {
          const rawVal = dataArray[Math.min(bufferLength - 1, i * 2)] / 255;
          spectrum.push(Math.min(1, Math.max(0.06, rawVal * eqBoost)));
        } else if (isPlaying) {
          // Realistic multi-harmonic acoustic wave simulation when CORS blocks byte inspection
          const bassEnvelope = i < 8 ? 0.68 : i < 20 ? 0.52 : 0.36;
          const wave1 = Math.sin(t * 2.4 + i * 0.45) * 0.25;
          const wave2 = Math.cos(t * 3.9 - i * 0.7) * 0.18;
          const beatPulse = Math.pow(Math.sin(t * 1.6), 4) * (i < 10 ? 0.28 : 0.1);
          const val = Math.max(
            0.08,
            Math.min(0.96, (bassEnvelope + wave1 + wave2 + beatPulse) * eqBoost * volScale)
          );
          spectrum.push(val);
        } else {
          // Idle gentle breathing line
          const idleWave = 0.07 + Math.sin(t + i * 0.3) * 0.025;
          spectrum.push(idleWave);
        }
      }

      const [r1, g1, b1] = palette.primary;
      const [r2, g2, b2] = palette.secondary;
      const [r3, g3, b3] = palette.accent;

      if (mode === 'bars') {
        const gap = 4;
        const barWidth = (width - gap * (numBins - 1)) / numBins;

        for (let i = 0; i < numBins; i++) {
          const val = spectrum[i];
          const barHeight = Math.max(6, val * (height - 16));
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.95)`);
          grad.addColorStop(0.5, `rgba(${r2}, ${g2}, ${b2}, 0.85)`);
          grad.addColorStop(1, `rgba(${r3}, ${g3}, ${b3}, 0.75)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, Math.max(2, barWidth), barHeight, 999);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        // Dual layered glassmorphic sine waves
        for (let layer = 0; layer < 2; layer++) {
          ctx.beginPath();
          const sliceWidth = width / (numBins - 1);
          for (let i = 0; i < numBins; i++) {
            const val = spectrum[i];
            const offset =
              Math.sin(t * (layer === 0 ? 1.5 : -1.2) + i * 0.35) *
              val *
              (height * (layer === 0 ? 0.38 : 0.26));
            const x = i * sliceWidth;
            const y = height / 2 + offset;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              const prevX = (i - 1) * sliceWidth;
              const prevVal = spectrum[i - 1];
              const prevOffset =
                Math.sin(t * (layer === 0 ? 1.5 : -1.2) + (i - 1) * 0.35) *
                prevVal *
                (height * (layer === 0 ? 0.38 : 0.26));
              const prevY = height / 2 + prevOffset;
              const cx = (prevX + x) / 2;
              ctx.quadraticCurveTo(prevX, prevY, cx, (prevY + y) / 2);
            }
          }

          ctx.strokeStyle =
            layer === 0
              ? `rgba(${r1}, ${g1}, ${b1}, 0.95)`
              : `rgba(${r3}, ${g3}, ${b3}, 0.65)`;
          ctx.lineWidth = layer === 0 ? 3 : 2;
          ctx.stroke();

          // Soft fill under wave
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
          fillGrad.addColorStop(
            0,
            layer === 0
              ? `rgba(${r1}, ${g1}, ${b1}, 0.25)`
              : `rgba(${r2}, ${g2}, ${b2}, 0.14)`
          );
          fillGrad.addColorStop(1, 'rgba(9, 13, 22, 0)');
          ctx.fillStyle = fillGrad;
          ctx.fill();
        }
      } else {
        // Circular Harmonic Orb mode
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.24;
        const avgEnergy =
          spectrum.reduce((acc, v) => acc + v, 0) / Math.max(1, spectrum.length);

        // Glowing core orb
        const radialGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          2,
          centerX,
          centerY,
          baseRadius * (1.5 + avgEnergy * 0.8)
        );
        radialGrad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.55)`);
        radialGrad.addColorStop(0.6, `rgba(${r2}, ${g2}, ${b2}, 0.22)`);
        radialGrad.addColorStop(1, 'rgba(9, 13, 22, 0)');

        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 2.1, 0, Math.PI * 2);
        ctx.fill();

        // Radial frequency spokes
        for (let i = 0; i < numBins; i++) {
          const angle = (i / numBins) * Math.PI * 2 + t * 0.2;
          const val = spectrum[i];
          const innerR = baseRadius * 0.85;
          const outerR = innerR + val * (Math.min(width, height) * 0.24);

          const x1 = centerX + Math.cos(angle) * innerR;
          const y1 = centerY + Math.sin(angle) * innerR;
          const x2 = centerX + Math.cos(angle) * outerR;
          const y2 = centerY + Math.sin(angle) * outerR;

          ctx.strokeStyle =
            i % 2 === 0
              ? `rgba(${r1}, ${g1}, ${b1}, 0.9)`
              : `rgba(${r3}, ${g3}, ${b3}, 0.8)`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animationFrameId);
  }, [analyser, isPlaying, mode, palette, eqGains, volume]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 sm:h-28 rounded-2xl bg-slate-950/55 border border-white/10 block"
    />
  );
};
