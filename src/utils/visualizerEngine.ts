import { DEFAULT_COVER_IMAGE, PALETTES } from '../constants/visualizer';
import {
  BackdropOverlayMode,
  FrameMotionMode,
  FrameRotationTarget,
  VisualDNA,
} from '../types/audio';
import { OrbFxState, renderOrbFxFrame } from './orbEffectsRenderer';
import {
  createInitialStudioFrame,
  drawMediaCover,
  drawStudioEditOverlay,
  getStudioShapeRadii,
  LiveOrbSnapshot,
  StudioFrameState,
  traceStudioFramePath,
} from './studioFrameRenderer';

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  colorIdx: number;
}

export interface StarPoint {
  x: number;
  y: number;
  z: number;
  colorIdx: number;
}

export interface MeteorItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  colorIdx: number;
}

export interface NeuralNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIdx: number;
}

export interface VisualizerSimState {
  freqData: Uint8Array<ArrayBuffer>;
  timeData: Uint8Array<ArrayBuffer>;
  peakCaps: Float32Array;
  stars: StarPoint[];
  sparks: SparkParticle[];
  meteors: MeteorItem[];
  neuralNodes: NeuralNode[];
  smoothBass: number;
  smoothMid: number;
  smoothHigh: number;
  prevBass: number;
  phase: number;
  songHue: number;
  frameCounter: number;
  anchorX: number;
  anchorY: number;
  softFrameCanvas?: HTMLCanvasElement;
  softMaskCanvas?: HTMLCanvasElement;
}

export interface RenderVisualizerFrameParams {
  ctx: CanvasRenderingContext2D;
  sim: VisualizerSimState;
  width: number;
  height: number;
  nowSec: number;
  dtSec: number;
  isPlaying: boolean;
  vizMode: number;
  paletteIndex: number;
  visualDna: VisualDNA;
  isZenMode: boolean;
  isRecordArmed: boolean;
  isRecording: boolean;
  studioActive: boolean;
  layeredBg: boolean;
  prefersReducedMotion: boolean;
  /** Optional active studio frame state (mutated smoothly for drift unless paused/editing). */
  studioFrame: StudioFrameState | null;
  frameMotion?: FrameMotionMode;
  frameRotationTarget?: FrameRotationTarget;
  isEditingStudioFrame?: boolean;
  /** Media source rendered inside the studio frame or centered orb. */
  mediaSource: CanvasImageSource | null;
  mediaWidth: number;
  mediaHeight: number;
  /** Optional track caption rendered beneath the cover frame/orb when enabled. */
  coverCaptionTitle?: string | null;
  coverCaptionArtist?: string | null;
  /** Optional fullscreen photo/video backdrop rendered behind all visualizer themes. */
  backdropSource?: CanvasImageSource | null;
  backdropWidth?: number;
  backdropHeight?: number;
  backdropOverlay?: BackdropOverlayMode;
  /** Skips drawing the default centered cover orb when recording with a fullscreen custom backdrop. */
  skipFallbackCenterOrb?: boolean;
  showStudioOverlay?: boolean;
  /** Optional Zen Mode flying orbs snapshot list + resolver for orb cover images. */
  orbSnapshots?: LiveOrbSnapshot[] | null;
  orbViewportWidth?: number;
  orbViewportHeight?: number;
  resolveOrbImage?: (src: string) => { img: HTMLImageElement; ok: boolean } | null;
  /** Advances Zen orb positions slightly per frame during offline rendering. */
  advanceOrbPhysics?: boolean;
}

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [h, s * 100, l * 100];
}

function hsla(hex: string, hueShift: number, alpha: number, satBoost = 0, lightBoost = 0): string {
  const [h, s, l] = hexToHsl(hex);
  const nh = (((h + hueShift) % 360) + 360) % 360;
  const ns = s < 5 ? s : Math.min(100, Math.max(15, s + satBoost));
  const nl = Math.min(96, Math.max(12, l + lightBoost));
  return `hsla(${nh.toFixed(1)}, ${ns.toFixed(0)}%, ${nl.toFixed(0)}%, ${alpha.toFixed(3)})`;
}

function seededUnit(seed: number, index: number): number {
  const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function createVisualizerSimState(width: number, height: number): VisualizerSimState {
  const isDesktop = width >= 1024;
  return {
    freqData: new Uint8Array(256),
    timeData: new Uint8Array(256),
    peakCaps: new Float32Array(72),
    stars: Array.from({ length: 160 }, (_, i) => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
      colorIdx: i % 4,
    })),
    sparks: Array.from({ length: 96 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2.5 - 0.5,
      life: Math.random() * 80,
      maxLife: 60 + Math.random() * 70,
      size: 1.5 + Math.random() * 3,
      colorIdx: i % 4,
    })),
    meteors: Array.from({ length: 16 }, (_, i) => ({
      x: Math.random() * width * 1.4,
      y: -Math.random() * height * 0.6,
      vx: -6 - Math.random() * 6,
      vy: 4 + Math.random() * 5,
      len: 50 + Math.random() * 110,
      colorIdx: i % 4,
    })),
    neuralNodes: Array.from({ length: 48 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0018,
      vy: (Math.random() - 0.5) * 0.0018,
      colorIdx: i % 4,
    })),
    smoothBass: 0,
    smoothMid: 0,
    smoothHigh: 0,
    prevBass: 0,
    phase: 0,
    songHue: Math.random() * 360,
    frameCounter: 0,
    anchorX: isDesktop ? width * 0.34 : width * 0.5,
    anchorY: isDesktop ? height * 0.47 : height * 0.49,
  };
}

export function cloneOrbFxState(src: OrbFxState): OrbFxState {
  return {
    ...src,
    waveClones: src.waveClones.map((c) => ({
      ...c,
      radii: new Float32Array(c.radii),
      unitX: c.unitX ? new Float32Array(c.unitX) : undefined,
      unitY: c.unitY ? new Float32Array(c.unitY) : undefined,
    })),
    particles: src.particles.map((p) => ({ ...p })),
  };
}

export function cloneStudioFrameState(src: StudioFrameState): StudioFrameState {
  return {
    ...src,
    fxState: cloneOrbFxState(src.fxState),
  };
}

export function cloneOrbSnapshots(snaps: LiveOrbSnapshot[]): LiveOrbSnapshot[] {
  return snaps.map((s) => ({
    ...s,
    fxState: cloneOrbFxState(s.fxState),
  }));
}

export function fillIdleSpectrum(
  freqData: Uint8Array,
  timeData: Uint8Array,
  nowSec: number,
  dyn: number,
  seed: number,
  prefersReducedMotion: boolean
): void {
  const amp = prefersReducedMotion ? 26 : 38;
  for (let i = 0; i < freqData.length; i++) {
    freqData[i] = Math.max(
      10,
      Math.floor(Math.sin(nowSec * 1.5 * dyn + i * 0.14 + seed) * amp + amp + 14)
    );
    timeData[i] = Math.floor(
      128 + Math.sin(nowSec * 2.1 * dyn + i * 0.12) * (prefersReducedMotion ? 12 : 20)
    );
  }
}

export function stepAndRenderVisualizerFrame(params: RenderVisualizerFrameParams): void {
  const {
    ctx,
    sim,
    width,
    height,
    nowSec,
    dtSec,
    isPlaying: playing,
    vizMode: primaryMode,
    paletteIndex: pIdx,
    visualDna: dna,
    isZenMode: zen,
    isRecordArmed: armedNow,
    isRecording: recordingNow,
    studioActive: inStudio,
    layeredBg: layeredNow,
    prefersReducedMotion,
    studioFrame,
    frameMotion = 'static',
    frameRotationTarget = 'none',
    isEditingStudioFrame = false,
    mediaSource,
    mediaWidth,
    mediaHeight,
    coverCaptionTitle = null,
    coverCaptionArtist = null,
    backdropSource = null,
    backdropWidth = 0,
    backdropHeight = 0,
    backdropOverlay = 'visualizer',
    skipFallbackCenterOrb = false,
    showStudioOverlay = false,
    orbSnapshots,
    orbViewportWidth,
    orbViewportHeight,
    resolveOrbImage,
    advanceOrbPhysics = false,
  } = params;

  const stepScale = Math.max(0.4, Math.min(3, dtSec * 60));
  sim.frameCounter += Math.max(1, Math.round(stepScale));

  const palette = PALETTES[pIdx]?.colors ?? PALETTES[0].colors;
  const hueShift = dna.hueShift;
  const dyn = dna.dynamics;
  const baseDen = dna.density;
  const glow = dna.glow;
  const dir = dna.direction;
  const seed = dna.seed;

  const stepSpeed = playing
    ? (prefersReducedMotion ? 0.01 : 0.018) * dyn
    : (prefersReducedMotion ? 0.0045 : 0.007) * dyn;
  sim.phase += stepSpeed * stepScale * dir;

  const isDesktop = width >= 1024;
  const targetX = armedNow || zen || !isDesktop ? width * 0.5 : width * 0.34;
  const targetY = armedNow || zen || !isDesktop ? height * 0.49 : height * 0.47;
  const anchorLerp = 1 - Math.pow(1 - 0.08, stepScale);
  sim.anchorX += (targetX - sim.anchorX) * anchorLerp;
  sim.anchorY += (targetY - sim.anchorY) * anchorLerp;

  const { freqData, timeData, peakCaps, stars, sparks, meteors, neuralNodes } = sim;

  let bassSum = 0;
  let midSum = 0;
  let highSum = 0;
  for (let i = 0; i < 12; i++) bassSum += freqData[i];
  for (let i = 12; i < 64; i++) midSum += freqData[i];
  for (let i = 64; i < 160; i++) highSum += freqData[i];

  const rawBass = bassSum / (12 * 255);
  const rawMid = midSum / (52 * 255);
  const rawHigh = highSum / (96 * 255);

  sim.prevBass = sim.smoothBass;
  const bassLerp = 1 - Math.pow(1 - 0.24, stepScale);
  const otherLerp = 1 - Math.pow(1 - 0.18, stepScale);
  sim.smoothBass += (rawBass - sim.smoothBass) * bassLerp;
  sim.smoothMid += (rawMid - sim.smoothMid) * otherLerp;
  sim.smoothHigh += (rawHigh - sim.smoothHigh) * otherLerp;

  const smoothBass = sim.smoothBass;
  const smoothMid = sim.smoothMid;
  const smoothHigh = sim.smoothHigh;
  const prevBass = sim.prevBass;
  const phase = sim.phase;
  const anchorX = sim.anchorX;
  const anchorY = sim.anchorY;
  const beatImpulse = Math.max(0, smoothBass - prevBass) * 5;

  const minDim = Math.min(width, height);
  const coverRadius = zen
    ? isDesktop
      ? 125
      : 95
    : isDesktop
    ? 165
    : Math.min(130, minDim * 0.28);

  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, width, height);

  const hasCustomBackdrop = Boolean(backdropSource && backdropWidth > 0 && backdropHeight > 0);
  const effectiveOverlay: BackdropOverlayMode =
    hasCustomBackdrop || backdropOverlay === 'clean'
      ? backdropOverlay
      : 'visualizer';

  if (hasCustomBackdrop && backdropSource) {
    ctx.save();
    ctx.globalAlpha = effectiveOverlay === 'visualizer' ? 0.72 + smoothBass * 0.14 : 1;
    ctx.translate(width * 0.5, height * 0.5);
    drawMediaCover(ctx, backdropSource, backdropWidth, backdropHeight, width * 0.5, height * 0.5);
    ctx.restore();

    if (effectiveOverlay === 'visualizer') {
      // Measured contrast scrim so 28 reactive visualizers and floating orbs remain sharp over any footage
      ctx.fillStyle = 'rgba(10, 10, 12, 0.34)';
      ctx.fillRect(0, 0, width, height);
    }
  }

  const seedAngle = seededUnit(seed, 1) * Math.PI * 2;
  const seedFoldCount = Math.max(
    6,
    Math.floor((6 + seededUnit(seed, 4) * 10) * (0.8 + baseDen * 0.2))
  );
  const seedHarmonic = 1 + Math.floor(seededUnit(seed, 5) * 4);

  if (effectiveOverlay === 'visualizer') {
    // Ambient background wash
    const bgGrad = ctx.createRadialGradient(
      anchorX,
      anchorY,
      coverRadius * 0.2,
      anchorX,
      anchorY,
      minDim * 0.95
    );
    bgGrad.addColorStop(0, hsla(palette[0], hueShift, (0.14 + smoothBass * 0.16) * glow));
    bgGrad.addColorStop(0.5, hsla(palette[2], hueShift, 0.06 * glow));
    bgGrad.addColorStop(1, 'rgba(10, 10, 12, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  const drawThemeLayer = (
    mode: number,
    layerAlpha: number,
    densityScale: number,
    colorOffset: number,
    hueOffset: number
  ) => {
    const den = baseDen * densityScale;
    const colorAt = (idx: number, alpha: number, sat = 0, light = 0) =>
      hsla(palette[(idx + colorOffset) % palette.length], hueShift + hueOffset, alpha, sat, light);

    ctx.save();
    ctx.globalAlpha = layerAlpha;

    if (mode === 0) {
      const baseR = coverRadius * 0.95 + smoothBass * 125 * dyn;
      const lobes = 3 + (seedFoldCount % 3);
      for (let l = 0; l < lobes; l++) {
        const a = seedAngle + (l / lobes) * Math.PI * 2 + phase * (0.45 + l * 0.1);
        const dist = (28 + smoothMid * 68) * den;
        const ox = anchorX + Math.cos(a) * dist;
        const oy = anchorY + Math.sin(a) * dist;
        const g = ctx.createRadialGradient(ox, oy, baseR * 0.1, ox, oy, baseR * 1.6);
        g.addColorStop(0, colorAt(l, 0.48 * glow));
        g.addColorStop(0.45, colorAt(l + 1, 0.2 * glow));
        g.addColorStop(1, 'rgba(10, 10, 12, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, baseR * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let r = 0; r < 4; r++) {
        const ringR = coverRadius * (0.95 + r * 0.28) + freqData[r * 8] * 0.26 * dyn;
        ctx.strokeStyle = colorAt(r, 0.22 + smoothBass * 0.38);
        ctx.lineWidth = 1.5 * glow;
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (mode === 1) {
      const layers = 3 + (seedHarmonic % 2);
      for (let layer = 0; layer < layers; layer++) {
        ctx.strokeStyle = colorAt(layer, (0.8 - layer * 0.16) * glow);
        ctx.lineWidth = (2.8 - layer * 0.4) * glow;
        ctx.beginPath();
        const points = 96;
        for (let i = 0; i <= points; i++) {
          const norm = i / points;
          const x = norm * width;
          const bin = Math.floor(norm * 128);
          const amp = (freqData[bin] / 255) * (height * 0.24 * dyn) * (1 - layer * 0.15);
          const wave =
            Math.sin(
              i * (0.09 + seedHarmonic * 0.03) +
                phase * (1.1 + layer * 0.3) +
                seedAngle +
                colorOffset
            ) * amp;
          const y = anchorY + wave;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (mode === 2) {
      const count = Math.max(18, Math.floor(52 * den));
      for (let i = 0; i < count; i++) {
        const sOff = seededUnit(seed, i + 10);
        const angle = (i / count) * Math.PI * 2 + phase * (0.3 + sOff * 0.2) + seedAngle;
        const binVal = freqData[(i * 2) % 128] / 255;
        const dist = coverRadius * 0.8 + binVal * minDim * 0.34 * dyn + smoothBass * 45;
        const x = anchorX + Math.cos(angle) * dist;
        const y = anchorY + Math.sin(angle) * dist;
        ctx.fillStyle = colorAt(i, 0.5 + binVal * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, (2.2 + binVal * 6) * glow, 0, Math.PI * 2);
        ctx.fill();
        if (i % 3 === 0) {
          ctx.strokeStyle = colorAt(i, 0.14 + binVal * 0.2);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(anchorX, anchorY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    } else if (mode === 3) {
      ctx.save();
      ctx.translate(anchorX, anchorY);
      ctx.rotate(phase * 0.25 + seedAngle + colorOffset * 0.4);
      const folds = Math.max(6, Math.floor(seedFoldCount * densityScale));
      const stepAngle = (Math.PI * 2) / folds;
      for (let s = 0; s < folds; s++) {
        ctx.save();
        ctx.rotate(s * stepAngle);
        for (let b = 0; b < 12; b++) {
          const val = freqData[b * 4] / 255;
          const dist = coverRadius * 0.55 + b * (minDim * 0.024) + val * 34 * dyn;
          const len = (14 + val * 44) * den;
          ctx.strokeStyle = colorAt(b, 0.35 + val * 0.58);
          ctx.lineWidth = 2 * glow;
          ctx.beginPath();
          ctx.moveTo(dist, -len * 0.32);
          ctx.lineTo(dist + len * 0.55, 0);
          ctx.lineTo(dist, len * 0.32);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    } else if (mode === 4) {
      const energies = [smoothBass, smoothMid, smoothHigh, (smoothBass + smoothHigh) * 0.5];
      for (let i = 0; i < 4; i++) {
        const orbitAngle = phase * (0.28 + i * 0.11) + i * 1.57 + seedAngle + colorOffset;
        const bx = anchorX + Math.cos(orbitAngle) * (width * 0.25);
        const by = anchorY + Math.sin(orbitAngle * 1.15) * (height * 0.24);
        const br = minDim * (0.35 + energies[i] * 0.38 * dyn) * den;
        const grad = ctx.createRadialGradient(bx, by, 10, bx, by, br);
        grad.addColorStop(0, colorAt(i, (0.44 + energies[i] * 0.28) * glow));
        grad.addColorStop(1, 'rgba(10, 10, 12, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mode === 5) {
      const bars = Math.max(24, Math.floor(60 * densityScale));
      const barAreaW = Math.min(width * 0.88, 1200);
      const startX = (width - barAreaW) / 2;
      const step = barAreaW / bars;
      const barW = Math.max(3, step * 0.62);
      const baselineY = height * 0.74;
      for (let i = 0; i < bars; i++) {
        const val = freqData[(i * 2) % 128] / 255;
        const barH = Math.max(4, val * height * 0.42 * dyn);
        if (colorOffset === 0) {
          peakCaps[i] =
            barH > peakCaps[i] ? barH : Math.max(4, peakCaps[i] - 1.6 * stepScale);
        }
        const x = startX + i * step;
        const grad = ctx.createLinearGradient(x, baselineY - barH, x, baselineY);
        grad.addColorStop(0, colorAt(Math.floor((i / bars) * 4), 0.92));
        grad.addColorStop(1, colorAt(Math.floor((i / bars) * 4), 0.2));
        ctx.fillStyle = grad;
        ctx.fillRect(x, baselineY - barH, barW, barH);
        ctx.fillStyle = colorAt(Math.floor((i / bars) * 4), 0.16);
        ctx.fillRect(x, baselineY + 3, barW, barH * 0.25);
        if (colorOffset === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(x, baselineY - peakCaps[i] - 3, barW, 2);
        }
      }
    } else if (mode === 6) {
      const bars = Math.max(28, Math.floor(60 * den));
      const innerR = coverRadius * 1.04 + smoothBass * 22;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2 + phase * 0.2;
        const val = freqData[(i * 2) % 128] / 255;
        const len = 10 + val * (minDim * 0.22 * dyn);
        ctx.strokeStyle = colorAt(i, 0.55 + val * 0.45);
        ctx.lineWidth = 3 * glow;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(anchorX + Math.cos(angle) * innerR, anchorY + Math.sin(angle) * innerR);
        ctx.lineTo(
          anchorX + Math.cos(angle) * (innerR + len),
          anchorY + Math.sin(angle) * (innerR + len)
        );
        ctx.stroke();
      }
    } else if (mode === 7) {
      const sliceW = width / timeData.length;
      for (let tr = 0; tr < 3; tr++) {
        ctx.strokeStyle = colorAt(tr, tr === 0 ? 0.92 : 0.45);
        ctx.lineWidth = (tr === 0 ? 2.6 : 1.4) * glow;
        ctx.beginPath();
        const shift = tr * 16 + colorOffset * 8;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[(i + shift) % timeData.length] - 128) / 128;
          const x = i * sliceW;
          const y = anchorY + v * height * (0.28 - tr * 0.06) * dyn;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (mode === 8) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const layers = Math.max(3, Math.floor(5 * densityScale));
      for (let l = 0; l < layers; l++) {
        const r = coverRadius * (1.06 + l * 0.14) + smoothBass * (18 + l * 10) * dyn;
        const grad = ctx.createRadialGradient(anchorX, anchorY, r * 0.85, anchorX, anchorY, r * 1.18);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, colorAt(l, (0.34 - l * 0.05) * glow, 20, 10));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, r * 1.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = colorAt(l, (0.72 - l * 0.12) * glow, 25, 12);
        ctx.lineWidth = (3.0 - l * 0.45) * glow;
        ctx.beginPath();
        const pts = 84;
        for (let i = 0; i <= pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const bin = freqData[(i * 2) % 128] / 255;
          const wobble = Math.sin(a * (3 + l) + phase * (1.6 + l * 0.25)) * (6 + bin * 26 * dyn);
          const rr = coverRadius * (1.05 + l * 0.11) + wobble + smoothBass * 18;
          const px = anchorX + Math.cos(a) * rr;
          const py = anchorY + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    } else if (mode === 9) {
      const orbitCount = Math.max(2, Math.floor(4 * den));
      for (let o = 0; o < orbitCount; o++) {
        const tilt = seedAngle + (o / orbitCount) * Math.PI + phase * 0.12;
        const rx = coverRadius * (1.28 + o * 0.24) + smoothBass * 32 * dyn;
        const ry = rx * (0.34 + 0.14 * Math.sin(phase * 0.5 + o));

        ctx.save();
        ctx.translate(anchorX, anchorY);
        ctx.rotate(tilt);

        ctx.strokeStyle = colorAt(o, (0.52 + smoothMid * 0.35) * glow, 15, 8);
        ctx.lineWidth = (2.2 + smoothBass * 2.5) * glow;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        const satCount = 2 + (o % 2);
        for (let s = 0; s < satCount; s++) {
          const theta = phase * (1.4 + o * 0.35) + (s * Math.PI * 2) / satCount;
          const sx = Math.cos(theta) * rx;
          const sy = Math.sin(theta) * ry;
          const satR = (4 + smoothHigh * 7) * glow;
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, satR * 3.5);
          sg.addColorStop(0, colorAt(o + s, 0.95, 25, 22));
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(sx, sy, satR * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    } else if (mode === 10) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const activeSparks = Math.min(sparks.length, Math.max(24, Math.floor(80 * den)));
      for (let i = 0; i < activeSparks; i++) {
        const sp = sparks[i];
        if (colorOffset === 0 || i % 2 === 0) {
          const speedBoost = (1 + smoothBass * 3.4 * dyn + beatImpulse * 2) * stepScale;
          sp.x += sp.vx * speedBoost;
          sp.y += sp.vy * speedBoost;
          sp.vx += Math.sin(phase * 2 + i) * 0.06 * stepScale;
          sp.life += stepScale;

          if (sp.life > sp.maxLife || sp.y < -20 || sp.x < -20 || sp.x > width + 20) {
            const angle = Math.random() * Math.PI * 2;
            const spawnR = coverRadius * (0.7 + Math.random() * 0.6);
            sp.x = anchorX + Math.cos(angle) * spawnR;
            sp.y = anchorY + Math.sin(angle) * spawnR;
            sp.vx = Math.cos(angle) * (0.8 + Math.random() * 2.5);
            sp.vy = Math.sin(angle) * (0.8 + Math.random() * 2.5) - 1.2;
            sp.life = 0;
            sp.maxLife = 45 + Math.random() * 65;
          }
        }

        const alpha = Math.sin(Math.min(1, sp.life / sp.maxLife) * Math.PI);
        const r = sp.size * (1 + smoothHigh * 1.4) * glow;
        ctx.strokeStyle = colorAt(sp.colorIdx, alpha * 0.85, 25, 16);
        ctx.lineWidth = r * 0.75;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x - sp.vx * 3.5, sp.y - sp.vy * 3.5);
        ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.8).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (mode === 11) {
      const speed =
        (0.004 + smoothBass * 0.022) * dyn * (prefersReducedMotion ? 0.25 : 1) * stepScale;
      const count = Math.min(stars.length, Math.max(40, Math.floor(135 * den)));
      for (let i = 0; i < count; i++) {
        const st = stars[i];
        st.z -= speed;
        if (st.z <= 0.02) {
          st.x = (Math.random() - 0.5) * 2;
          st.y = (Math.random() - 0.5) * 2;
          st.z = 1;
        }
        const px = anchorX + (st.x / st.z) * (width * 0.45);
        const py = anchorY + (st.y / st.z) * (height * 0.45);
        const prevZ = Math.min(1, st.z + speed * 2.2);
        const ox = anchorX + (st.x / prevZ) * (width * 0.45);
        const oy = anchorY + (st.y / prevZ) * (height * 0.45);
        const brightness = 1 - st.z;
        ctx.strokeStyle = colorAt(st.colorIdx, brightness * 0.9, 10, 25);
        ctx.lineWidth = Math.max(1, brightness * 2.8 * glow);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    } else if (mode === 12) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const arms = 3 + (seedHarmonic % 2);
      const ptsPerArm = Math.max(16, Math.floor(38 * den));
      for (let a = 0; a < arms; a++) {
        const baseA = (a / arms) * Math.PI * 2 + phase * 0.25 + seedAngle;
        for (let i = 1; i < ptsPerArm; i++) {
          const t = i / ptsPerArm;
          const bin = freqData[(i * 3) % 128] / 255;
          const r = coverRadius * 0.65 + t * minDim * 0.48 + bin * 24 * dyn;
          const theta = baseA + t * 3.8 * dir;
          const x = anchorX + Math.cos(theta) * r;
          const y = anchorY + Math.sin(theta) * r * 0.72;
          const size = (3 + (1 - t) * 14 + bin * 14) * glow;
          const g = ctx.createRadialGradient(x, y, 0, x, y, size);
          g.addColorStop(0, colorAt(a + i, (0.3 - t * 0.2) * glow, 20, 10));
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (mode === 13) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const ribbons = Math.max(2, Math.floor(4 * densityScale));
      for (let r = 0; r < ribbons; r++) {
        const pts = 40;
        const yBase = height * (0.22 + r * 0.14);
        for (let i = 0; i < pts; i++) {
          const norm = i / pts;
          const x = norm * width;
          const bin = freqData[(i * 2 + r * 8) % 128] / 255;
          const waveY =
            yBase + Math.sin(norm * 5 + phase * (0.8 + r * 0.2) + seedAngle) * (45 + smoothMid * 60);
          const curtainH = (110 + bin * 180 * dyn) * glow;
          const grad = ctx.createLinearGradient(x, waveY - curtainH * 0.4, x, waveY + curtainH);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.35, colorAt(r, 0.14 + bin * 0.18, 25, 8));
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, waveY - curtainH * 0.4, width / pts + 2, curtainH * 1.4);
        }
      }
      ctx.restore();
    } else if (mode === 14) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rays = Math.max(24, Math.floor(58 * den));
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2 + phase * 0.15;
        const bin = freqData[(i * 2) % 128] / 255;
        const innerR = coverRadius * 0.92;
        const outerR = coverRadius * 1.2 + bin * minDim * 0.34 * dyn + smoothBass * 45;
        const grad = ctx.createLinearGradient(
          anchorX + Math.cos(angle) * innerR,
          anchorY + Math.sin(angle) * innerR,
          anchorX + Math.cos(angle) * outerR,
          anchorY + Math.sin(angle) * outerR
        );
        grad.addColorStop(0, colorAt(i, 0.7 * glow, 25, 18));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = (3 + bin * 5) * glow;
        ctx.beginPath();
        ctx.moveTo(anchorX + Math.cos(angle) * innerR, anchorY + Math.sin(angle) * innerR);
        ctx.lineTo(anchorX + Math.cos(angle) * outerR, anchorY + Math.sin(angle) * outerR);
        ctx.stroke();
      }
      ctx.restore();
    } else if (mode === 15) {
      const horizonY = height * 0.56;
      const sunR = minDim * (0.2 + smoothBass * 0.08);
      const sunGrad = ctx.createLinearGradient(anchorX, horizonY - sunR, anchorX, horizonY);
      sunGrad.addColorStop(0, colorAt(0, 0.85, 25, 15));
      sunGrad.addColorStop(1, colorAt(1, 0.25, 25, 5));
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(anchorX, horizonY - sunR * 0.2, sunR, Math.PI, 0);
      ctx.fill();

      ctx.strokeStyle = colorAt(1, (0.35 + smoothBass * 0.4) * glow, 20, 10);
      ctx.lineWidth = 1.4 * glow;
      const cols = 14;
      for (let i = -cols; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(anchorX + i * 24, horizonY);
        ctx.lineTo(anchorX + i * 150, height);
        ctx.stroke();
      }
      const rows = 10;
      const scroll = (phase * 1.4) % 1;
      for (let r = 0; r < rows; r++) {
        const t = Math.pow((r + ((scroll + 1) % 1)) / rows, 2);
        const y = horizonY + t * (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (mode === 16) {
      const strands = Math.max(6, Math.floor(14 * den));
      for (let s = 0; s < strands; s++) {
        const baseA = (s / strands) * Math.PI * 2 + seedAngle;
        const bin = freqData[(s * 6) % 128] / 255;
        ctx.strokeStyle = colorAt(s, (0.35 + bin * 0.5) * glow, 25, 12);
        ctx.lineWidth = 2 * glow;
        ctx.beginPath();
        const segs = 20;
        for (let j = 0; j <= segs; j++) {
          const t = j / segs;
          const r = coverRadius * 0.85 + t * minDim * 0.38;
          const wiggle = Math.sin(t * 6 - phase * 2 + s) * (18 + bin * 35 * dyn);
          const a = baseA + wiggle * 0.008;
          const px = anchorX + Math.cos(a) * r;
          const py = anchorY + Math.sin(a) * r;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    } else if (mode === 17) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const arcs = Math.max(4, Math.floor(7 * den));
      for (let a = 0; a < arcs; a++) {
        const a1 = seedAngle + (a / arcs) * Math.PI * 2 + phase * 0.8;
        const a2 = a1 + (Math.PI * 2) / arcs;
        const r1 = coverRadius * 1.05 + smoothBass * 28;
        const r2 = coverRadius * 1.25 + smoothHigh * 60 * dyn;
        ctx.strokeStyle = colorAt(a, (0.6 + smoothHigh * 0.4) * glow, 25, 22);
        ctx.lineWidth = (1.6 + smoothBass * 2.2) * glow;
        ctx.beginPath();
        const steps = 14;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const ang = a1 + (a2 - a1) * t;
          const jitter =
            s === 0 || s === steps
              ? 0
              : Math.sin(nowSec * 28 + s * 9 + a * 5) * (14 + smoothHigh * 42 * dyn);
          const rr = r1 + (r2 - r1) * Math.sin(t * Math.PI) + jitter;
          const px = anchorX + Math.cos(ang) * rr;
          const py = anchorY + Math.sin(ang) * rr;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (mode === 18) {
      const rings = 3;
      for (let r = 0; r < rings; r++) {
        const sides = 5 + r * 2;
        const radius = coverRadius * (1.15 + r * 0.34) + smoothBass * 40 * dyn;
        const rot = phase * (0.4 + r * 0.2) * (r % 2 === 0 ? 1 : -1) + seedAngle;
        ctx.strokeStyle = colorAt(r, (0.45 + smoothMid * 0.45) * glow, 15, 10);
        ctx.lineWidth = 2 * glow;
        ctx.beginPath();
        for (let v = 0; v <= sides; v++) {
          const ang = rot + (v / sides) * Math.PI * 2;
          const px = anchorX + Math.cos(ang) * radius;
          const py = anchorY + Math.sin(ang) * radius * (0.85 + 0.15 * Math.cos(phase + r));
          if (v === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    } else if (mode === 19) {
      const rippleCount = Math.max(4, Math.floor(8 * den));
      for (let i = 0; i < rippleCount; i++) {
        const progress = (((phase * 0.35 * dir + i / rippleCount) % 1) + 1) % 1;
        const r = coverRadius * 0.8 + progress * minDim * 0.55;
        const alpha = (1 - progress) * (0.45 + smoothBass * 0.45) * glow;
        ctx.strokeStyle = colorAt(i, alpha, 15, 12);
        ctx.lineWidth = (1.5 + (1 - progress) * 4 * smoothBass * dyn) * glow;
        ctx.beginPath();
        ctx.arc(anchorX, anchorY, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (mode === 20) {
      const count = Math.max(40, Math.floor(96 * den));
      for (let i = 0; i < count; i++) {
        const t = i / count;
        const bin = freqData[i % 128] / 255;
        const ang = t * Math.PI * 10 + phase * (0.9 + t * 0.4) + seedAngle;
        const r = coverRadius * 0.9 + t * minDim * 0.46 + bin * 28 * dyn;
        const px = anchorX + Math.cos(ang) * r;
        const py = anchorY + Math.sin(ang) * r;
        ctx.fillStyle = colorAt(i, (0.3 + (1 - t) * 0.6) * glow, 20, 14);
        ctx.beginPath();
        ctx.arc(px, py, (1.8 + bin * 5) * glow, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mode === 21) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const beams = Math.max(5, Math.floor(10 * den));
      for (let b = 0; b < beams; b++) {
        const bin = freqData[(b * 8) % 128] / 255;
        const sweep = Math.sin(phase * (1.1 + b * 0.15) + seedAngle + b) * 0.7;
        const originX = width * ((b + 0.5) / beams);
        const originY = b % 2 === 0 ? 0 : height;
        const targetX2 = originX + Math.sin(sweep) * width * 0.45;
        const targetY2 = b % 2 === 0 ? height : 0;

        const grad = ctx.createLinearGradient(originX, originY, targetX2, targetY2);
        grad.addColorStop(0, colorAt(b, (0.45 + bin * 0.45) * glow, 25, 16));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = (3 + bin * 10 * dyn) * glow;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(targetX2, targetY2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (mode === 22) {
      const count = Math.min(neuralNodes.length, Math.max(20, Math.floor(42 * den)));
      const speed = (1 + smoothBass * 2.5) * dyn * stepScale;
      for (let i = 0; i < count; i++) {
        const n = neuralNodes[i];
        n.x = (n.x + n.vx * speed + 1) % 1;
        n.y = (n.y + n.vy * speed + 1) % 1;
      }
      const maxDist = minDim * 0.19;
      for (let i = 0; i < count; i++) {
        const ax = neuralNodes[i].x * width;
        const ay = neuralNodes[i].y * height;
        const bin = freqData[(i * 2) % 128] / 255;
        for (let j = i + 1; j < count; j++) {
          const bx = neuralNodes[j].x * width;
          const by = neuralNodes[j].y * height;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * (0.32 + smoothMid * 0.45) * glow;
            ctx.strokeStyle = colorAt(i, alpha, 15, 10);
            ctx.lineWidth = 1.2 * glow;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
        ctx.fillStyle = colorAt(neuralNodes[i].colorIdx, 0.75 + bin * 0.25, 20, 18);
        ctx.beginPath();
        ctx.arc(ax, ay, (2.2 + bin * 4) * glow, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mode === 23) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const ribbons = 3;
      for (let r = 0; r < ribbons; r++) {
        ctx.strokeStyle = colorAt(r, 0.65 * glow, 25, 16);
        ctx.lineWidth = 2.4 * glow;
        ctx.beginPath();
        const steps = 130;
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          const rx = coverRadius * (1.28 + r * 0.16) + smoothBass * 36 * dyn;
          const ry = coverRadius * (1.28 + r * 0.16) + smoothMid * 36 * dyn;
          const px = anchorX + Math.sin(t * (2 + r) + phase + seedAngle) * rx;
          const py = anchorY + Math.cos(t * (3 + r) - phase * 0.8) * ry;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (mode === 24) {
      const count = Math.min(meteors.length, Math.max(6, Math.floor(14 * den)));
      const speedMult = (0.7 + smoothBass * 1.9) * dyn * stepScale;
      for (let i = 0; i < count; i++) {
        const m = meteors[i];
        m.x += m.vx * speedMult;
        m.y += m.vy * speedMult;
        if (m.y > height + 100 || m.x < -150) {
          m.x = Math.random() * width * 1.3 + width * 0.1;
          m.y = -40 - Math.random() * 140;
        }
        const tx = m.x - m.vx * (m.len / 8);
        const ty = m.y - m.vy * (m.len / 8);
        const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
        grad.addColorStop(0, colorAt(m.colorIdx, 0.95, 20, 26));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = (2 + smoothHigh * 3) * glow;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    } else if (mode === 25) {
      const rings = Math.max(6, Math.floor(12 * den));
      const sides = 6 + (seedFoldCount % 4);
      for (let r = 0; r < rings; r++) {
        const depth = (((phase * 0.45 * dir + r / rings) % 1) + 1) % 1;
        const radius =
          coverRadius * 0.6 + Math.pow(depth, 1.5) * minDim * 0.72 + smoothBass * 28;
        const rot = phase * 0.4 + depth * 1.4 + seedAngle;
        const alpha = Math.sin(depth * Math.PI) * 0.65 * glow;
        ctx.strokeStyle = colorAt(r, alpha, 20, 12);
        ctx.lineWidth = (1.2 + depth * 2.4) * glow;
        ctx.beginPath();
        for (let v = 0; v <= sides; v++) {
          const ang = rot + (v / sides) * Math.PI * 2;
          const px = anchorX + Math.cos(ang) * radius;
          const py = anchorY + Math.sin(ang) * radius;
          if (v === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    } else if (mode === 26) {
      const loops = Math.max(5, Math.floor(10 * den));
      for (let l = 1; l <= loops; l++) {
        const scale = (l / loops) * minDim * 0.45 + coverRadius * 0.65 + smoothBass * 32 * dyn;
        ctx.strokeStyle = colorAt(l, (0.28 + smoothMid * 0.35) * glow, 18, 12);
        ctx.lineWidth = 1.6 * glow;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          for (let t = 0; t <= 42; t++) {
            const a = (t / 42) * Math.PI;
            const r = scale * Math.pow(Math.sin(a), 1.4);
            const px = anchorX + side * Math.sin(a) * r;
            const py = anchorY - Math.cos(a) * r * 0.85;
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }
    } else if (mode === 27) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rays = Math.max(18, Math.floor(38 * den));
      for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2 + phase * 0.12 + seedAngle;
        const bin = freqData[(i * 3) % 128] / 255;
        const len = coverRadius * 1.1 + (0.2 + bin) * minDim * 0.42 * dyn + beatImpulse * 90;
        const grad = ctx.createLinearGradient(
          anchorX,
          anchorY,
          anchorX + Math.cos(ang) * len,
          anchorY + Math.sin(ang) * len
        );
        grad.addColorStop(0, colorAt(i, 0.85 * glow, 25, 24));
        grad.addColorStop(0.5, colorAt(i + 1, 0.32 * glow, 20, 10));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = (1.5 + bin * 4) * glow;
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(anchorX + Math.cos(ang) * len, anchorY + Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  };

  if (effectiveOverlay === 'visualizer') {
    // Render secondary mixed layers behind primary layer for rich multi-theme compositions
    const mixLayers = dna.mixLayers ?? [];
    if (mixLayers.length > 0) {
      drawThemeLayer(mixLayers[0], 0.44, 0.62, 1, 35);
    }
    if (mixLayers.length > 1) {
      drawThemeLayer(mixLayers[1], 0.28, 0.52, 2, -45);
    }

    // Render primary visualizer theme on top
    drawThemeLayer(primaryMode, 1.0, 1.0, 0, 0);
  }

  // Shared audio metrics for reactive studio frame & recording overlays
  const rawEnergyNorm = Math.max(
    0,
    Math.min(1, (smoothBass * 0.52 + smoothMid * 0.33 + smoothHigh * 0.15 - 0.11) / 0.48)
  );
  const intenseBoost = Math.pow(rawEnergyNorm, 1.7);
  const beatKick = Math.max(0, smoothBass - prevBass) * 2.8;
  const melodyIntensity = playing
    ? Math.min(1, rawEnergyNorm * 0.58 + intenseBoost * 0.34 + beatKick * 0.5)
    : 0.12;
  sim.songHue =
    (sim.songHue + (playing ? 0.3 + rawEnergyNorm * 0.55 + intenseBoost * 0.45 : 0.1) * stepScale) %
    360;
  const songHue = sim.songHue;

  const drawFramedMediaWithContour = (
    frame: StudioFrameState,
    source: CanvasImageSource | null,
    srcW: number,
    srcH: number,
    showOverlay: boolean,
    opacityMult = 1,
    rotTarget: FrameRotationTarget = 'none'
  ) => {
    const { rx, ry } = getStudioShapeRadii(
      frame.shape,
      frame.baseSize,
      frame.scaleX,
      frame.scaleY
    );
    const audioScale = 1 + smoothBass * (0.04 + intenseBoost * 0.055);
    const drawRx = rx * audioScale;
    const drawRy = ry * audioScale;
    const innerRot =
      rotTarget === 'frame-only'
        ? -frame.rotation
        : rotTarget === 'media-only'
        ? frame.mediaRotation ?? 0
        : 0;

    const isSoftFade = frame.fxMode === 'soft_fade';

    ctx.save();
    ctx.globalAlpha = opacityMult;
    ctx.translate(frame.cx, frame.cy);
    ctx.rotate(frame.rotation);

    if (isSoftFade && typeof document !== 'undefined') {
      const m = ctx.getTransform();
      const tScale = Math.max(
        1,
        Math.min(3, Math.min(Math.hypot(m.a, m.b) || 1, Math.hypot(m.c, m.d) || 1))
      );
      const pad = 4;
      const bufLogicalW = Math.ceil((drawRx + pad) * 2);
      const bufLogicalH = Math.ceil((drawRy + pad) * 2);
      const bufPxW = Math.max(16, Math.ceil(bufLogicalW * tScale));
      const bufPxH = Math.max(16, Math.ceil(bufLogicalH * tScale));

      if (!sim.softFrameCanvas) {
        sim.softFrameCanvas = document.createElement('canvas');
      }
      if (!sim.softMaskCanvas) {
        sim.softMaskCanvas = document.createElement('canvas');
      }
      const softCanvas = sim.softFrameCanvas;
      const maskCanvas = sim.softMaskCanvas;
      if (softCanvas.width !== bufPxW || softCanvas.height !== bufPxH) {
        softCanvas.width = bufPxW;
        softCanvas.height = bufPxH;
      }
      if (maskCanvas.width !== bufPxW || maskCanvas.height !== bufPxH) {
        maskCanvas.width = bufPxW;
        maskCanvas.height = bufPxH;
      }

      const softCtx = softCanvas.getContext('2d');
      const maskCtx = maskCanvas.getContext('2d');
      if (softCtx && maskCtx) {
        // 1. Draw media unclipped into offscreen frame canvas
        softCtx.setTransform(1, 0, 0, 1, 0, 0);
        softCtx.clearRect(0, 0, bufPxW, bufPxH);
        softCtx.save();
        softCtx.globalCompositeOperation = 'source-over';
        softCtx.translate(bufPxW * 0.5, bufPxH * 0.5);
        softCtx.scale(tScale, tScale);
        if (source && srcW > 0 && srcH > 0) {
          if (Math.abs(innerRot) > 0.0001) {
            softCtx.rotate(innerRot);
            const diagR = Math.hypot(drawRx, drawRy);
            drawMediaCover(softCtx, source, srcW, srcH, diagR, diagR);
          } else {
            drawMediaCover(softCtx, source, srcW, srcH, drawRx, drawRy);
          }
        } else {
          const fallbackGrad = softCtx.createRadialGradient(
            0,
            0,
            8,
            0,
            0,
            Math.max(drawRx, drawRy)
          );
          fallbackGrad.addColorStop(0, hsla(palette[0], hueShift, 0.85));
          fallbackGrad.addColorStop(1, '#09090f');
          softCtx.fillStyle = fallbackGrad;
          softCtx.fillRect(-drawRx, -drawRy, drawRx * 2, drawRy * 2);
        }
        softCtx.restore();

        // 2. Build smooth feathered alpha mask matching the active frame shape
        maskCtx.setTransform(1, 0, 0, 1, 0, 0);
        maskCtx.clearRect(0, 0, bufPxW, bufPxH);
        maskCtx.save();
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.translate(bufPxW * 0.5, bufPxH * 0.5);
        maskCtx.scale(tScale, tScale);
        if (frame.shape === 'circle') {
          const safeRx = Math.max(2, drawRx);
          maskCtx.save();
          maskCtx.scale(1, Math.max(0.1, drawRy) / safeRx);
          const radGrad = maskCtx.createRadialGradient(0, 0, safeRx * 0.42, 0, 0, safeRx);
          radGrad.addColorStop(0, 'rgba(0,0,0,1)');
          radGrad.addColorStop(0.32, 'rgba(0,0,0,0.94)');
          radGrad.addColorStop(0.62, 'rgba(0,0,0,0.56)');
          radGrad.addColorStop(0.84, 'rgba(0,0,0,0.18)');
          radGrad.addColorStop(1, 'rgba(0,0,0,0)');
          maskCtx.fillStyle = radGrad;
          maskCtx.beginPath();
          maskCtx.arc(0, 0, safeRx, 0, Math.PI * 2);
          maskCtx.fill();
          maskCtx.restore();
        } else {
          const steps = 20;
          maskCtx.fillStyle = '#000000';
          for (let sIdx = 0; sIdx < steps; sIdx++) {
            const t = sIdx / (steps - 1);
            const scale = 1.0 - t * 0.48;
            maskCtx.globalAlpha = 0.024 + t * 0.14;
            traceStudioFramePath(maskCtx, frame.shape, drawRx * scale, drawRy * scale);
            maskCtx.fill();
          }
          maskCtx.globalAlpha = 1;
          traceStudioFramePath(maskCtx, frame.shape, drawRx * 0.5, drawRy * 0.5);
          maskCtx.fill();
        }
        maskCtx.restore();

        // 3. Apply feathered alpha mask cleanly via destination-in
        softCtx.save();
        softCtx.setTransform(1, 0, 0, 1, 0, 0);
        softCtx.globalCompositeOperation = 'destination-in';
        softCtx.drawImage(maskCanvas, 0, 0);
        softCtx.restore();

        ctx.drawImage(
          softCanvas,
          -bufLogicalW * 0.5,
          -bufLogicalH * 0.5,
          bufLogicalW,
          bufLogicalH
        );
      }
    } else {
      traceStudioFramePath(ctx, frame.shape, drawRx, drawRy);
      ctx.save();
      ctx.clip();

      if (source && srcW > 0 && srcH > 0) {
        if (Math.abs(innerRot) > 0.0001) {
          ctx.rotate(innerRot);
          const diagR = Math.hypot(drawRx, drawRy);
          drawMediaCover(ctx, source, srcW, srcH, diagR, diagR);
        } else {
          drawMediaCover(ctx, source, srcW, srcH, drawRx, drawRy);
        }
      } else {
        const fallbackGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, Math.max(drawRx, drawRy));
        fallbackGrad.addColorStop(0, hsla(palette[0], hueShift, 0.85));
        fallbackGrad.addColorStop(1, '#09090f');
        ctx.fillStyle = fallbackGrad;
        ctx.fillRect(-drawRx, -drawRy, drawRx * 2, drawRy * 2);
      }

      // Subtle studio edge vignette inside geometric clip
      const innerShade = ctx.createRadialGradient(
        0,
        0,
        Math.min(drawRx, drawRy) * 0.45,
        0,
        0,
        Math.max(drawRx, drawRy)
      );
      innerShade.addColorStop(0, 'rgba(0,0,0,0)');
      innerShade.addColorStop(1, 'rgba(5,5,10,0.28)');
      ctx.fillStyle = innerShade;
      ctx.fillRect(-drawRx, -drawRy, drawRx * 2, drawRy * 2);
      ctx.restore();
    }

    if (showOverlay) {
      drawStudioEditOverlay(ctx, drawRx, drawRy);
    }
    ctx.restore();

    if (!isSoftFade) {
      // Reactive neon contour synced on exact same HTML5 canvas
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      renderOrbFxFrame({
        ctx,
        fxState: frame.fxState,
        fxMode: frame.fxMode,
        shape: frame.shape,
        orbIndex: 0,
        isActive: true,
        cx: frame.cx,
        cy: frame.cy,
        vx: frame.vx,
        vy: frame.vy,
        radius: drawRx,
        radiusY: drawRy,
        rotRad: frame.rotation,
        phase: frame.phase,
        deform: 0,
        impactAngleRad: 0,
        songHue,
        melodyIntensity,
        energyNorm: rawEnergyNorm,
        intenseBoost,
        beatKick,
        smoothBass,
        smoothHigh,
        freqBuf: freqData,
        playing,
        layeredBg: layeredNow,
        frameCounter: sim.frameCounter,
        opacityMult,
        stepScale,
      });
      ctx.restore();
    }

    if (coverCaptionTitle && coverCaptionTitle.trim()) {
      const titleRaw = coverCaptionTitle.trim();
      const artistRaw = coverCaptionArtist?.trim() || '';
      const frameSpanY =
        rotTarget === 'frame-only' || rotTarget === 'both'
          ? Math.max(drawRx, drawRy) * 1.04
          : drawRy;
      const gap = Math.max(12, Math.min(22, Math.min(drawRx, drawRy) * 0.16));
      const titleFontSize = Math.round(Math.max(12, Math.min(20, Math.min(width, height) * 0.028)));
      const artistFontSize = Math.round(Math.max(10, titleFontSize * 0.78));
      const maxTextW = Math.max(120, Math.min(width - 44, Math.max(220, drawRx * 2.55)));

      const trimToWidth = (text: string, font: string, maxW: number): string => {
        ctx.font = font;
        if (ctx.measureText(text).width <= maxW) return text;
        let end = text.length;
        while (end > 1 && ctx.measureText(`${text.slice(0, end)}…`).width > maxW) {
          end -= 1;
        }
        return `${text.slice(0, Math.max(1, end))}…`;
      };

      const titleFont = `700 ${titleFontSize}px Inter, system-ui, -apple-system, sans-serif`;
      const artistFont = `500 ${artistFontSize}px Inter, system-ui, -apple-system, sans-serif`;
      const titleText = trimToWidth(titleRaw, titleFont, maxTextW);
      const artistText = artistRaw ? trimToWidth(artistRaw, artistFont, maxTextW) : '';

      ctx.save();
      ctx.globalAlpha = opacityMult;
      ctx.font = titleFont;
      const titleW = ctx.measureText(titleText).width;
      let artistW = 0;
      if (artistText) {
        ctx.font = artistFont;
        artistW = ctx.measureText(artistText).width;
      }

      const padX = Math.round(titleFontSize * 0.9);
      const padY = Math.round(titleFontSize * 0.45);
      const lineGap = artistText ? Math.round(titleFontSize * 0.25) : 0;
      const boxW = Math.min(width - 20, Math.max(titleW, artistW) + padX * 2);
      const boxH = padY * 2 + titleFontSize + (artistText ? lineGap + artistFontSize : 0);
      const boxCenterX = Math.max(boxW * 0.5 + 10, Math.min(width - boxW * 0.5 - 10, frame.cx));
      let boxTopY = frame.cy + frameSpanY + gap;
      if (boxTopY + boxH > height - 14) {
        const aboveY = frame.cy - frameSpanY - gap - boxH;
        boxTopY = aboveY >= 14 ? aboveY : Math.max(14, height - boxH - 14);
      }
      const boxLeftX = boxCenterX - boxW * 0.5;
      const cornerR = Math.min(16, boxH * 0.36);

      ctx.beginPath();
      ctx.moveTo(boxLeftX + cornerR, boxTopY);
      ctx.lineTo(boxLeftX + boxW - cornerR, boxTopY);
      ctx.quadraticCurveTo(boxLeftX + boxW, boxTopY, boxLeftX + boxW, boxTopY + cornerR);
      ctx.lineTo(boxLeftX + boxW, boxTopY + boxH - cornerR);
      ctx.quadraticCurveTo(boxLeftX + boxW, boxTopY + boxH, boxLeftX + boxW - cornerR, boxTopY + boxH);
      ctx.lineTo(boxLeftX + cornerR, boxTopY + boxH);
      ctx.quadraticCurveTo(boxLeftX, boxTopY + boxH, boxLeftX, boxTopY + boxH - cornerR);
      ctx.lineTo(boxLeftX, boxTopY + cornerR);
      ctx.quadraticCurveTo(boxLeftX, boxTopY, boxLeftX + cornerR, boxTopY);
      ctx.closePath();

      ctx.fillStyle = 'rgba(8, 9, 16, 0.64)';
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = hsla(palette[0], hueShift, 0.42, 12, 16);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
      ctx.font = titleFont;
      ctx.fillText(titleText, boxCenterX, boxTopY + padY);

      if (artistText) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.84)';
        ctx.font = artistFont;
        ctx.fillText(artistText, boxCenterX, boxTopY + padY + titleFontSize + lineGap);
      }
      ctx.restore();
    }
  };

  const advanceFrameDrift = (frame: StudioFrameState) => {
    const driftSpeed =
      (0.45 + smoothBass * 0.85) * (prefersReducedMotion ? 0.4 : 1) * stepScale;
    frame.vx += Math.sin(frame.phase * 0.65) * 0.008 * stepScale;
    frame.vy += Math.cos(frame.phase * 0.78) * 0.008 * stepScale;
    const vMag = Math.hypot(frame.vx, frame.vy) || 0.01;
    const targetV = 0.52 + intenseBoost * 0.38;
    const nextV = vMag + (targetV - vMag) * (1 - Math.pow(0.96, stepScale));
    frame.vx = (frame.vx / vMag) * nextV;
    frame.vy = (frame.vy / vMag) * nextV;

    frame.cx += frame.vx * driftSpeed;
    frame.cy += frame.vy * driftSpeed;

    const { rx, ry } = getStudioShapeRadii(
      frame.shape,
      frame.baseSize,
      frame.scaleX,
      frame.scaleY
    );
    const marginX = Math.min(width * 0.36, rx + 22);
    const minY = Math.min(height * 0.42, 74 + ry);
    const maxY = Math.max(minY + 10, height - 92 - ry);

    if (frame.cx < marginX) {
      frame.cx = marginX;
      frame.vx = Math.abs(frame.vx);
    } else if (frame.cx > width - marginX) {
      frame.cx = width - marginX;
      frame.vx = -Math.abs(frame.vx);
    }
    if (frame.cy < minY) {
      frame.cy = minY;
      frame.vy = Math.abs(frame.vy);
    } else if (frame.cy > maxY) {
      frame.cy = maxY;
      frame.vy = -Math.abs(frame.vy);
    }
  };

  if (inStudio) {
    const activeFrame = studioFrame ?? createInitialStudioFrame(width, height);
    activeFrame.phase += ((playing ? 0.014 : 0.006) + smoothBass * 0.025) * stepScale;

    if (!isEditingStudioFrame) {
      const rotDelta = (0.0065 + smoothMid * 0.01) * stepScale;
      if (frameRotationTarget === 'frame-only' || frameRotationTarget === 'both') {
        activeFrame.rotation += rotDelta;
      } else if (frameRotationTarget === 'media-only') {
        activeFrame.mediaRotation = (activeFrame.mediaRotation ?? 0) + rotDelta;
      }

      if (frameMotion === 'floating') {
        advanceFrameDrift(activeFrame);
      }
    }

    drawFramedMediaWithContour(
      activeFrame,
      mediaSource,
      mediaWidth,
      mediaHeight,
      showStudioOverlay && !recordingNow,
      1,
      frameRotationTarget
    );
  } else if (effectiveOverlay === 'orb-only' || recordingNow || armedNow) {
    if (orbSnapshots && orbSnapshots.length > 0) {
      if (recordingNow) {
        const vw = Math.max(1, orbViewportWidth || width);
        const vh = Math.max(1, orbViewportHeight || height);
        const uniformScale = armedNow ? Math.min(width / vw, height / vh) : 1;

        for (let i = 0; i < orbSnapshots.length; i++) {
          const snap = orbSnapshots[i];

          if (advanceOrbPhysics) {
            snap.phase += (0.015 + smoothBass * 0.025) * stepScale;
            snap.rotRad += 0.006 * stepScale * (i % 2 === 0 ? 1 : -1);
            const speedBoost = (0.7 + smoothBass * 0.9) * stepScale;
            snap.cx += snap.vx * speedBoost;
            snap.cy += snap.vy * speedBoost;
            const pad = snap.radius + 16;
            if (snap.cx < pad) {
              snap.cx = pad;
              snap.vx = Math.abs(snap.vx);
            } else if (snap.cx > vw - pad) {
              snap.cx = vw - pad;
              snap.vx = -Math.abs(snap.vx);
            }
            if (snap.cy < pad) {
              snap.cy = pad;
              snap.vy = Math.abs(snap.vy);
            } else if (snap.cy > vh - pad) {
              snap.cy = vh - pad;
              snap.vy = -Math.abs(snap.vy);
            }
          }

          const resolved = resolveOrbImage ? resolveOrbImage(snap.coverSrc) : null;
          const orbImg = resolved?.img ?? null;
          const ok = Boolean(resolved?.ok && orbImg);
          const scx = armedNow ? width * 0.5 + (snap.cx - vw * 0.5) * uniformScale : snap.cx;
          const scy = armedNow ? height * 0.5 + (snap.cy - vh * 0.5) * uniformScale : snap.cy;
          const sr = snap.radius * (armedNow ? Math.max(uniformScale, 0.52) : 1);

          ctx.save();
          ctx.globalAlpha = snap.opacity;
          ctx.translate(scx, scy);
          ctx.rotate(snap.rotRad);
          traceStudioFramePath(ctx, snap.shape, sr, sr);
          ctx.save();
          ctx.clip();
          if (ok && orbImg) {
            drawMediaCover(ctx, orbImg, orbImg.naturalWidth, orbImg.naturalHeight, sr, sr);
          }
          ctx.restore();
          ctx.restore();

          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          renderOrbFxFrame({
            ctx,
            fxState: snap.fxState,
            fxMode: snap.fxMode,
            shape: snap.shape,
            orbIndex: i,
            isActive: snap.isActive,
            cx: scx,
            cy: scy,
            vx: snap.vx * uniformScale,
            vy: snap.vy * uniformScale,
            radius: sr,
            rotRad: snap.rotRad,
            phase: snap.phase,
            deform: snap.deform,
            impactAngleRad: snap.impactAngleRad,
            songHue,
            melodyIntensity,
            energyNorm: rawEnergyNorm,
            intenseBoost,
            beatKick,
            smoothBass,
            smoothHigh,
            freqBuf: freqData,
            playing,
            layeredBg: layeredNow,
            frameCounter: sim.frameCounter,
            opacityMult: snap.opacity,
            stepScale,
          });
          ctx.restore();
        }
      }
    } else if (effectiveOverlay === 'orb-only' || !skipFallbackCenterOrb) {
      // Floating track orb (for 'orb-only' over clean video/photo) or centered cover orb for standard recording
      const recFrame = studioFrame ?? createInitialStudioFrame(width, height);
      recFrame.phase += (0.015 + smoothBass * 0.025) * stepScale;
      if (effectiveOverlay === 'orb-only' || frameMotion === 'floating') {
        advanceFrameDrift(recFrame);
      } else {
        recFrame.cx = anchorX;
        recFrame.cy = anchorY;
      }
      const rotDelta = (0.0065 + smoothMid * 0.01) * stepScale;
      if (frameRotationTarget === 'frame-only' || frameRotationTarget === 'both') {
        recFrame.rotation += rotDelta;
      } else if (frameRotationTarget === 'media-only') {
        recFrame.mediaRotation = (recFrame.mediaRotation ?? 0) + rotDelta;
      }

      const orbCoverResolved = resolveOrbImage ? resolveOrbImage(DEFAULT_COVER_IMAGE) : null;
      const drawSource = mediaSource ?? (orbCoverResolved?.ok ? orbCoverResolved.img : null);
      const drawW = mediaSource
        ? mediaWidth
        : orbCoverResolved?.ok
        ? orbCoverResolved.img.naturalWidth
        : 0;
      const drawH = mediaSource
        ? mediaHeight
        : orbCoverResolved?.ok
        ? orbCoverResolved.img.naturalHeight
        : 0;

      drawFramedMediaWithContour(
        recFrame,
        drawSource,
        drawW,
        drawH,
        false,
        1,
        frameRotationTarget
      );
    }
  }
}
