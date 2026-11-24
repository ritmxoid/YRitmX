import defaultCoverImg from '../assets/images/default_yritmx_cover.svg';
import demoCosmicImg from '../assets/images/demo_cosmic_cover_1794804181390.jpg';
import demoSynthwaveImg from '../assets/images/demo_synthwave_cover_1794804180575.jpg';
import { EqPreset, PaletteConfig, VisualDNA, VizModeConfig } from '../types/audio';

export const DEFAULT_COVER_IMAGE = defaultCoverImg;
export const DEMO_SYNTHWAVE_COVER = demoSynthwaveImg;
export const DEMO_COSMIC_COVER = demoCosmicImg;

export const VIZ_CAROUSEL_MODE_ID = -1;
export const CAROUSEL_INTERVAL_OPTIONS = [5, 10, 15, 20, 25, 30] as const;
export type CarouselIntervalSec = (typeof CAROUSEL_INTERVAL_OPTIONS)[number];

// Ambient/backdrop layers that blend cleanly behind any foreground visualizer without clutter
export const AMBIENT_MIX_POOL = [0, 4, 8, 9, 10, 11, 12, 13, 16, 19, 20, 22, 24, 26, 28, 29];

export function pickRandomMixLayers(primaryMode: number, count: number): number[] {
  if (count <= 0) return [];
  const candidates = AMBIENT_MIX_POOL.filter((id) => id !== primaryMode);
  const picked: number[] = [];
  while (picked.length < count && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    picked.push(candidates.splice(idx, 1)[0]);
  }
  return picked;
}

export function createRandomVisualDna(primaryMode: number, mixEnabled: boolean): VisualDNA {
  let extraCount = 0;
  if (mixEnabled) {
    const roll = Math.random();
    if (roll < 0.4) {
      extraCount = 0;
    } else if (roll < 0.75) {
      extraCount = 1;
    } else {
      extraCount = 2;
    }
  }
  return {
    seed: Math.random() * 10000 + 1,
    hueShift: Math.round((Math.random() - 0.5) * 320),
    dynamics: 0.72 + Math.random() * 0.78,
    density: 0.68 + Math.random() * 0.72,
    glow: 0.75 + Math.random() * 0.65,
    direction: Math.random() > 0.5 ? 1 : -1,
    mixLayers: pickRandomMixLayers(primaryMode, extraCount),
  };
}

export const VIZ_MODES: VizModeConfig[] = [
  { id: 0, label: '1. Live Aura (Bass)' },
  { id: 1, label: '2. Spectral Waves' },
  { id: 2, label: '3. Rhythm Particles' },
  { id: 3, label: '4. Kaleidoscope' },
  { id: 4, label: '5. Mesh Gradient' },
  { id: 5, label: '6. Spectrum Bars' },
  { id: 6, label: '7. Circular Equalizer' },
  { id: 7, label: '8. Oscilloscope' },
  { id: 8, label: '9. Neon Cover Halo' },
  { id: 9, label: '10. Pulsing Orbit' },
  { id: 10, label: '11. Sparkling Fire' },
  { id: 11, label: '12. Deep Space (Stars)' },
  { id: 12, label: '13. Galactic Nebula' },
  { id: 13, label: '14. Aurora Borealis' },
  { id: 14, label: '15. Solar Corona' },
  { id: 15, label: '16. Synthwave Horizon' },
  { id: 16, label: '17. Bioluminescence' },
  { id: 17, label: '18. Plasma Arc' },
  { id: 18, label: '19. Crystal Matrix' },
  { id: 19, label: '20. Water Ripple' },
  { id: 20, label: '21. Galaxy Vortex' },
  { id: 21, label: '22. Laser Show' },
  { id: 22, label: '23. Constellation Neural Net' },
  { id: 23, label: '24. Fluorescent Contour' },
  { id: 24, label: '25. Meteor Shower' },
  { id: 25, label: '26. Holographic Tunnel' },
  { id: 26, label: '27. Magnetic Field' },
  { id: 27, label: '28. Supernova Flash' },
  { id: 28, label: '29. Flowing Spectrum' },
  { id: 29, label: '30. Magic Hexagon' },
];

export const PALETTES: PaletteConfig[] = [
  { id: 0, name: 'Neon Purple', colors: ['#a855f7', '#ec4899', '#6366f1', '#3b82f6'] },
  { id: 1, name: 'Cyberpunk Neon', colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'] },
  { id: 2, name: 'Deep Space', colors: ['#4f46e5', '#7c3aed', '#db2777', '#0284c7'] },
  { id: 3, name: 'Vivid Sunset', colors: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'] },
  { id: 4, name: 'Monochrome', colors: ['#ffffff', '#cbd5e1', '#64748b', '#334155'] },
  { id: 5, name: 'Emerald Aurora', colors: ['#10b981', '#06b6d4', '#34d399', '#3b82f6'] },
  { id: 6, name: 'Molten Gold', colors: ['#f59e0b', '#fbbf24', '#ef4444', '#fb7185'] },
  { id: 7, name: 'Fluorescent Lime', colors: ['#a3e635', '#22d3ee', '#10b981', '#facc15'] },
];

export const EQ_BANDS = [
  { freq: 60, label: '60 Hz', desc: 'Sub-bass' },
  { freq: 230, label: '230 Hz', desc: 'Warmth' },
  { freq: 910, label: '910 Hz', desc: 'Midrange' },
  { freq: 3600, label: '3.6 kHz', desc: 'Presence' },
  { freq: 14000, label: '14 kHz', desc: 'Air' },
] as const;

export const EQ_PRESETS: EqPreset[] = [
  { id: 'flat', label: 'Flat', gains: [0, 0, 0, 0, 0] },
  { id: 'bass', label: 'Bass Boost', gains: [6, 4, -1, 1, 2] },
  { id: 'electronic', label: 'Electronic', gains: [5, 2, -2, 3, 5] },
  { id: 'vocal', label: 'Vocal', gains: [-2, 0, 4, 3, 1] },
  { id: 'night', label: 'Night', gains: [-3, 2, 3, 1, -2] },
];
