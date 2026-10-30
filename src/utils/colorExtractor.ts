import { RadioStation } from '../types/radio';

export interface DynamicPalette {
  primary: [number, number, number];
  secondary: [number, number, number];
  accent: [number, number, number];
  hex: string;
  secondaryHex: string;
  accentHex: string;
}

const CURATED_PALETTES: DynamicPalette[] = [
  {
    primary: [56, 189, 248],   // Sky Cyan
    secondary: [129, 140, 248], // Indigo
    accent: [244, 114, 182],    // Rose Pink
    hex: '#38BDF8',
    secondaryHex: '#818CF8',
    accentHex: '#F472B6',
  },
  {
    primary: [251, 146, 60],   // Sunset Amber
    secondary: [244, 63, 94],  // Coral Red
    accent: [168, 85, 247],    // Purple
    hex: '#FB923C',
    secondaryHex: '#F43F5E',
    accentHex: '#A855F7',
  },
  {
    primary: [52, 211, 153],   // Emerald Mint
    secondary: [20, 184, 166], // Teal
    accent: [56, 189, 248],    // Sky
    hex: '#34D399',
    secondaryHex: '#14B8A6',
    accentHex: '#38BDF8',
  },
  {
    primary: [167, 139, 250],  // Violet Glow
    secondary: [236, 72, 153], // Magenta
    accent: [56, 189, 248],    // Cyan
    hex: '#A78BFA',
    secondaryHex: '#EC4899',
    accentHex: '#38BDF8',
  },
  {
    primary: [250, 204, 21],   // Warm Gold
    secondary: [249, 115, 22], // Orange
    accent: [236, 72, 153],    // Pink
    hex: '#FACC15',
    secondaryHex: '#F97316',
    accentHex: '#EC4899',
  },
  {
    primary: [45, 212, 191],   // Aqua
    secondary: [59, 130, 246], // Royal Blue
    accent: [168, 85, 247],    // Orchid
    hex: '#2DD4BF',
    secondaryHex: '#3B82F6',
    accentHex: '#A855F7',
  },
];

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const clamped = Math.max(0, Math.min(255, Math.round(x)));
        const hex = clamped.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Boosts luminance/saturation so the dynamic glass glow is always vibrant and readable against dark obsidian
 */
function normalizeVibrantColor(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // If too dark or too gray, boost towards a vibrant tint
  if (max < 95) {
    const factor = 180 / Math.max(max, 25);
    r = Math.min(255, r * factor + 30);
    g = Math.min(255, g * factor + 40);
    b = Math.min(255, b * factor + 60);
  }
  if (max - min < 35) {
    r = Math.min(255, r * 0.85 + 40);
    g = Math.min(255, g * 1.05 + 60);
    b = Math.min(255, b * 1.2 + 90);
  }
  return [Math.round(r), Math.round(g), Math.round(b)];
}

export function getDeterministicPalette(station: RadioStation): DynamicPalette {
  if (station.themePalette) {
    const [r2, g2, b2] = station.themePalette.secondary;
    const [r3, g3, b3] = station.themePalette.accent;
    return {
      ...station.themePalette,
      secondaryHex: rgbToHex(r2, g2, b2),
      accentHex: rgbToHex(r3, g3, b3),
    };
  }
  const str = `${station.name}-${station.countrycode}-${station.tags}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % CURATED_PALETTES.length;
  return CURATED_PALETTES[idx];
}

export async function extractStationPalette(station: RadioStation): Promise<DynamicPalette> {
  const fallback = getDeterministicPalette(station);
  if (!station.favicon || station.favicon.trim() === '') {
    return fallback;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    const timeout = setTimeout(() => {
      resolve(fallback);
    }, 1800);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          // Skip transparent, near-black, or near-white pixels
          if (a < 128) continue;
          if (r > 235 && g > 235 && b > 235) continue;
          if (r < 20 && g < 20 && b < 20) continue;

          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }

        if (count < 5) {
          resolve(fallback);
          return;
        }

        const primary = normalizeVibrantColor(rSum / count, gSum / count, bSum / count);
        const secondary: [number, number, number] = [
          Math.min(255, Math.max(40, Math.round(primary[2] * 0.8 + 45))),
          Math.min(255, Math.max(40, Math.round(primary[0] * 0.75 + 35))),
          Math.min(255, Math.max(60, Math.round(primary[1] * 0.9 + 50))),
        ];
        const accent: [number, number, number] = [
          Math.min(255, Math.max(60, Math.round(primary[1] * 0.9 + 50))),
          Math.min(255, Math.max(40, Math.round(primary[2] * 0.7 + 30))),
          Math.min(255, Math.max(60, Math.round(primary[0] * 0.85 + 45))),
        ];

        resolve({
          primary,
          secondary,
          accent,
          hex: rgbToHex(primary[0], primary[1], primary[2]),
          secondaryHex: rgbToHex(secondary[0], secondary[1], secondary[2]),
          accentHex: rgbToHex(accent[0], accent[1], accent[2]),
        });
      } catch {
        resolve(fallback);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(fallback);
    };

    img.src = station.favicon;
  });
}

export function applyDynamicPaletteToRoot(palette: DynamicPalette): void {
  const root = document.documentElement;
  root.style.setProperty('--dynamic-primary', palette.primary.join(', '));
  root.style.setProperty('--dynamic-secondary', palette.secondary.join(', '));
  root.style.setProperty('--dynamic-accent', palette.accent.join(', '));
}
