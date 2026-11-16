import { Pause, Play } from 'lucide-react';
import { useEffect, useId, useMemo, useRef } from 'react';
import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { useI18n } from '../i18n/I18nContext';
import { Track } from '../types/audio';
import { trackEvent } from '../utils/analytics';
import {
  createOrbFxState,
  getShapeClipPath,
  hslToCss,
  OrbFxMode,
  OrbFxState,
  OrbShape,
  pickCompanionOrbStyle,
  pickTrackOrbStyle,
  renderOrbFxFrame,
} from '../utils/orbEffectsRenderer';

interface FloatingTrackOrbsProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  showCaptions: boolean;
  isLayeredBackground?: boolean;
  onSelectTrack: (index: number) => void;
  onTogglePlay: () => void;
}

type OrbEffect = 'pulse' | 'shimmer' | 'sparkle' | 'neon' | 'aurora';

const EFFECTS: OrbEffect[] = ['pulse', 'shimmer', 'sparkle', 'neon', 'aurora'];
const GLOW_COLORS = [
  '168, 85, 247', // purple
  '236, 72, 153', // pink
  '6, 182, 212',  // cyan
  '59, 130, 246', // blue
  '16, 185, 129', // emerald
  '245, 158, 11', // amber
];

interface OrbPhysics {
  indexInPlaylist: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  effect: OrbEffect;
  fxMode: OrbFxMode;
  shape: OrbShape;
  fxState: OrbFxState;
  glowRgb: string;
  isActive: boolean;
  wobbleAmp: number;
  wobblePhase: number;
  impactAngleRad: number;
  flash: number;
}

interface CollisionSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rgb: string;
}

interface ImpactRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  rgb: string;
}


let measureCtx: CanvasRenderingContext2D | null = null;

function fitTextToArcWidth(text: string, maxWidthPx: number): string {
  const clean = text.trim();
  if (!clean) return '';

  if (typeof document === 'undefined') {
    const estMaxChars = Math.max(8, Math.floor(maxWidthPx / 6.2));
    return clean.length > estMaxChars ? `${clean.slice(0, estMaxChars - 1).trimEnd()}...` : clean;
  }

  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }

  if (!measureCtx) {
    const estMaxChars = Math.max(8, Math.floor(maxWidthPx / 6.2));
    return clean.length > estMaxChars ? `${clean.slice(0, estMaxChars - 1).trimEnd()}...` : clean;
  }

  measureCtx.font = '600 9.5px "Plus Jakarta Sans", system-ui, sans-serif';
  // Account slightly for letterSpacing along curved arc (~0.5px per char)
  const measureWithSpacing = (s: string) =>
    measureCtx!.measureText(s).width + Math.max(0, s.length - 1) * 0.45;

  if (measureWithSpacing(clean) <= maxWidthPx) {
    return clean;
  }

  let lo = 1;
  let hi = clean.length;
  let best = '...';

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = `${clean.slice(0, mid).trimEnd()}...`;
    if (measureWithSpacing(candidate) <= maxWidthPx) {
      best = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best;
}

export function FloatingTrackOrbs({
  tracks,
  currentIndex,
  isPlaying,
  analyser,
  showCaptions,
  isLayeredBackground = false,
  onSelectTrack,
  onTogglePlay,
}: FloatingTrackOrbsProps) {
  const { t } = useI18n();
  const basePathId = useId();
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const coverRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverTextRefs = useRef<(HTMLDivElement | null)[]>([]);
  const livePropsRef = useRef({ isPlaying, analyser, isLayeredBackground });
  livePropsRef.current = { isPlaying, analyser, isLayeredBackground };

  // Active track orb + 1 to 4 random companion track orbs (2 to 5 spheres total)
  // Each track change picks fresh effects (13 modes) and morphed shapes (circles, stars, polygons, hearts)
  const orbSpecs = useMemo(() => {
    if (tracks.length === 0) return [];
    const activeTrack = tracks[currentIndex];
    if (!activeTrack) return [];

    const others = tracks
      .map((tr, idx) => ({ track: tr, indexInPlaylist: idx }))
      .filter((item) => item.indexInPlaylist !== currentIndex);

    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }

    const companionCount = Math.min(others.length, 1 + Math.floor(Math.random() * 4));
    const selectedCompanions = others.slice(0, companionCount);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const activeSize = isMobile ? 96 : 116;

    const trackStyle = pickTrackOrbStyle();
    const totalOrbs = 1 + selectedCompanions.length;
    const shapedSlot = Math.floor(Math.random() * totalOrbs);
    const activeShape: OrbShape = shapedSlot === 0 ? trackStyle.shape : 'circle';

    return [
      {
        track: activeTrack,
        indexInPlaylist: currentIndex,
        isActive: true,
        size: activeSize,
        effect: EFFECTS[Math.floor(Math.random() * EFFECTS.length)],
        fxMode: trackStyle.fxMode,
        shape: activeShape,
        clipPath: getShapeClipPath(activeShape),
        glowRgb: GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)],
      },
      ...selectedCompanions.map((item, idx) => {
        const compShape: OrbShape = shapedSlot === idx + 1 ? trackStyle.shape : 'circle';
        const compStyle = pickCompanionOrbStyle(trackStyle.fxMode, compShape, idx);
        const finalShape: OrbShape = compShape;
        return {
          track: item.track,
          indexInPlaylist: item.indexInPlaylist,
          isActive: false,
          size: (isMobile ? 64 : 76) + (idx % 3) * 10,
          effect: EFFECTS[(idx + Math.floor(Math.random() * EFFECTS.length)) % EFFECTS.length],
          fxMode: compStyle.fxMode,
          shape: finalShape,
          clipPath: getShapeClipPath(finalShape),
          glowRgb:
            GLOW_COLORS[(idx + Math.floor(Math.random() * GLOW_COLORS.length)) % GLOW_COLORS.length],
        };
      }),
    ];
  }, [tracks, currentIndex]);

  useEffect(() => {
    if (orbSpecs.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fxCanvas = fxCanvasRef.current;
    const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const pad = 20;

    const resizeFxCanvas = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      if (!fxCanvas || !fxCtx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      fxCanvas.width = Math.floor(width * dpr);
      fxCanvas.height = Math.floor(height * dpr);
      fxCanvas.style.width = `${width}px`;
      fxCanvas.style.height = `${height}px`;
      fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeFxCanvas();
    window.addEventListener('resize', resizeFxCanvas);

    const fxFactor = 1 / 1.5;

    const physics: OrbPhysics[] = orbSpecs.map((spec, idx) => {
      const angle = (idx / orbSpecs.length) * Math.PI * 2 + Math.random() * 0.7;
      const startDist = spec.isActive
        ? 0
        : Math.min(width, height) * (0.22 + Math.random() * 0.16);
      const speed = spec.isActive ? 0.85 : 1.05;
      const moveAngle = Math.random() * Math.PI * 2;
      return {
        indexInPlaylist: spec.indexInPlaylist,
        x: width / 2 + Math.cos(angle) * startDist - spec.size / 2,
        y: height / 2 + Math.sin(angle) * startDist - spec.size / 2,
        vx: Math.cos(moveAngle) * speed,
        vy: Math.sin(moveAngle) * speed,
        size: spec.size,
        phase: Math.random() * Math.PI * 2,
        effect: spec.effect,
        fxMode: spec.fxMode,
        shape: spec.shape,
        fxState: createOrbFxState(),
        glowRgb: spec.glowRgb,
        isActive: spec.isActive,
        wobbleAmp: 0,
        wobblePhase: 0,
        impactAngleRad: 0,
        flash: 0,
      };
    });

    const sparks: CollisionSpark[] = [];
    const ripples: ImpactRipple[] = [];
    const pairCooldown = new Map<string, number>();

    const spawnCollisionFx = (
      cx: number,
      cy: number,
      nx: number,
      ny: number,
      rgbA: string,
      rgbB: string,
      count: number,
      maxRipple: number,
      softness: number
    ) => {
      if (count > 0 && sparks.length < 100) {
        for (let i = 0; i < count; i++) {
          const spread = (Math.random() - 0.5) * Math.PI * 1.3;
          const baseAng = Math.atan2(ny, nx) + spread;
          const spd = (0.7 + Math.random() * 1.9) * (0.55 + softness * 0.65) * fxFactor;
          sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(baseAng) * spd,
            vy: Math.sin(baseAng) * spd,
            life: 0,
            maxLife: 28 + Math.random() * 24,
            size: (1.1 + Math.random() * (1.2 + softness * 1.1)) * 0.85,
            rgb: i % 2 === 0 ? rgbA : rgbB,
          });
        }
      }
      if (maxRipple > 0 && ripples.length < 16) {
        ripples.push({
          x: cx,
          y: cy,
          radius: 5,
          maxRadius: maxRipple * fxFactor,
          life: 0,
          maxLife: 34,
          rgb: rgbA,
        });
      }
    };

    const freqBuf = new Uint8Array(128);
    let smoothEnergy = 0.1;
    let smoothBass = 0.08;
    let smoothHigh = 0.07;
    let prevBass = 0.08;
    let smoothTempo = 0.275;
    let songHue = Math.random() * 360;
    let animId = 0;
    let frameCounter = 0;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      frameCounter += 1;

      if (window.innerWidth !== width || window.innerHeight !== height) {
        resizeFxCanvas();
      }

      const {
        analyser: activeAnalyser,
        isPlaying: playing,
        isLayeredBackground: layeredBg,
      } = livePropsRef.current;

      let rawBass = 0.07;
      let rawMid = 0.07;
      let rawHigh = 0.05;

      if (activeAnalyser && playing) {
        activeAnalyser.getByteFrequencyData(freqBuf);
        let bSum = 0;
        let mSum = 0;
        let hSum = 0;
        for (let i = 0; i < 8; i++) bSum += freqBuf[i];
        for (let i = 8; i < 24; i++) mSum += freqBuf[i];
        for (let i = 24; i < 52; i++) hSum += freqBuf[i];
        rawBass = bSum / (8 * 255);
        rawMid = mSum / (16 * 255);
        rawHigh = hSum / (28 * 255);
      } else {
        const tm = performance.now() * 0.0008;
        rawBass = 0.05 + (Math.sin(tm) * 0.5 + 0.5) * 0.05;
        rawMid = 0.05 + (Math.cos(tm * 0.8) * 0.5 + 0.5) * 0.04;
        rawHigh = 0.04;
      }

      prevBass = smoothBass;
      smoothBass += (rawBass - smoothBass) * 0.1;
      smoothHigh += (rawHigh - smoothHigh) * 0.1;
      const rawEnergy = rawBass * 0.52 + rawMid * 0.33 + rawHigh * 0.15;
      smoothEnergy += (rawEnergy - smoothEnergy) * 0.055;

      const beatKick = Math.max(0, smoothBass - prevBass) * 2.8;
      const energyNorm = Math.max(0, Math.min(1, (smoothEnergy - 0.11) / 0.48));
      const intenseBoost = Math.pow(energyNorm, 1.7);

      // Smooth, 2x gentler flight speed across the entire spectrum
      const targetTempo =
        (playing
          ? 0.72 +
            Math.pow(smoothEnergy, 1.35) * 1.25 +
            intenseBoost * 1.75 +
            beatKick * (0.28 + intenseBoost * 0.95)
          : 0.48) * 0.5;
      smoothTempo += (targetTempo - smoothTempo) * (0.06 + intenseBoost * 0.06);

      const effectIntensity = playing ? 0.24 + smoothEnergy * 0.9 + intenseBoost * 0.45 : 0.22;

      // Collision expressiveness 1.5x softer across the entire intensity range
      const maxEdgeWobble = (0.022 + energyNorm * 0.035 + intenseBoost * 0.14) * fxFactor;
      const maxOrbWobble = (0.026 + energyNorm * 0.04 + intenseBoost * 0.18) * fxFactor;
      const sparkCountEdge =
        energyNorm < 0.2 ? 1 : Math.max(1, Math.round((2 + intenseBoost * 7) * fxFactor));
      const sparkCountOrb =
        energyNorm < 0.2 ? 2 : Math.max(2, Math.round((3 + intenseBoost * 11) * fxFactor));

      for (let i = 0; i < physics.length; i++) {
        const p = physics[i];
        p.phase +=
          (prefersReducedMotion ? 0.008 : 0.011) +
          smoothEnergy * 0.022 +
          intenseBoost * 0.02;

        const wander = (0.01 + smoothEnergy * 0.018 + intenseBoost * 0.036) * 0.5;
        p.vx += Math.sin(p.phase * 0.78 + i * 2.1) * wander;
        p.vy += Math.cos(p.phase * 0.92 + i * 1.7) * wander;

        const edgeMargin = 24 * (1 - intenseBoost * 0.65);
        const edgeSteerStrength = 0.042 * (1 - intenseBoost * 0.72);
        if (edgeMargin > 2) {
          if (p.x < pad + edgeMargin) {
            const factor = (pad + edgeMargin - p.x) / edgeMargin;
            p.vx += factor * edgeSteerStrength;
          } else if (p.x + p.size > width - pad - edgeMargin) {
            const factor = (p.x + p.size - (width - pad - edgeMargin)) / edgeMargin;
            p.vx -= factor * edgeSteerStrength;
          }
          if (p.y < pad + edgeMargin) {
            const factor = (pad + edgeMargin - p.y) / edgeMargin;
            p.vy += factor * edgeSteerStrength;
          } else if (p.y + p.size > height - pad - edgeMargin) {
            const factor = (p.y + p.size - (height - pad - edgeMargin)) / edgeMargin;
            p.vy -= factor * edgeSteerStrength;
          }
        }

        const targetMag =
          (p.isActive ? 0.85 : 1.05) + intenseBoost * (p.isActive ? 0.35 : 0.45);
        const mag = Math.hypot(p.vx, p.vy) || 0.01;
        const adjustedMag = mag + (targetMag - mag) * 0.05;
        p.vx = (p.vx / mag) * adjustedMag;
        p.vy = (p.vy / mag) * adjustedMag;

        p.x += p.vx * smoothTempo;
        p.y += p.vy * smoothTempo;

        const wallDamp = 0.78 + intenseBoost * 0.2;
        const edgeCooldownOk = p.wobbleAmp < maxEdgeWobble * 0.55;
        const edgeFlashTarget = (0.2 + intenseBoost * 0.75) * fxFactor;

        if (p.x < pad) {
          p.x = pad;
          if (p.vx < -0.01) {
            p.vx = Math.abs(p.vx) * wallDamp;
            if (edgeCooldownOk) {
              p.wobbleAmp = maxEdgeWobble;
              p.wobblePhase = 0;
              p.impactAngleRad = 0;
              p.flash = Math.max(p.flash, edgeFlashTarget);
              spawnCollisionFx(
                pad,
                p.y + p.size / 2,
                1,
                0,
                p.glowRgb,
                '255, 255, 255',
                sparkCountEdge,
                22 + intenseBoost * 24,
                Math.max(energyNorm, intenseBoost)
              );
            }
          }
        } else if (p.x + p.size > width - pad) {
          p.x = width - pad - p.size;
          if (p.vx > 0.01) {
            p.vx = -Math.abs(p.vx) * wallDamp;
            if (edgeCooldownOk) {
              p.wobbleAmp = maxEdgeWobble;
              p.wobblePhase = 0;
              p.impactAngleRad = 0;
              p.flash = Math.max(p.flash, edgeFlashTarget);
              spawnCollisionFx(
                width - pad,
                p.y + p.size / 2,
                -1,
                0,
                p.glowRgb,
                '255, 255, 255',
                sparkCountEdge,
                22 + intenseBoost * 24,
                Math.max(energyNorm, intenseBoost)
              );
            }
          }
        }

        if (p.y < pad) {
          p.y = pad;
          if (p.vy < -0.01) {
            p.vy = Math.abs(p.vy) * wallDamp;
            if (edgeCooldownOk) {
              p.wobbleAmp = maxEdgeWobble;
              p.wobblePhase = 0;
              p.impactAngleRad = Math.PI / 2;
              p.flash = Math.max(p.flash, edgeFlashTarget);
              spawnCollisionFx(
                p.x + p.size / 2,
                pad,
                0,
                1,
                p.glowRgb,
                '255, 255, 255',
                sparkCountEdge,
                22 + intenseBoost * 24,
                Math.max(energyNorm, intenseBoost)
              );
            }
          }
        } else if (p.y + p.size > height - pad) {
          p.y = height - pad - p.size;
          if (p.vy > 0.01) {
            p.vy = -Math.abs(p.vy) * wallDamp;
            if (edgeCooldownOk) {
              p.wobbleAmp = maxEdgeWobble;
              p.wobblePhase = 0;
              p.impactAngleRad = Math.PI / 2;
              p.flash = Math.max(p.flash, edgeFlashTarget);
              spawnCollisionFx(
                p.x + p.size / 2,
                height - pad,
                0,
                -1,
                p.glowRgb,
                '255, 255, 255',
                sparkCountEdge,
                22 + intenseBoost * 24,
                Math.max(energyNorm, intenseBoost)
              );
            }
          }
        }

        if (p.wobbleAmp > 0.001) {
          p.wobblePhase += 0.16 + intenseBoost * 0.16;
          p.wobbleAmp *= 0.945 - intenseBoost * 0.028;
        } else {
          p.wobbleAmp = 0;
        }
        if (p.flash > 0.008) {
          p.flash *= 0.91 - intenseBoost * 0.03;
        } else {
          p.flash = 0;
        }
      }

      // Orb-to-orb soft steering & collisions (1.5x gentler expressiveness)
      for (let i = 0; i < physics.length; i++) {
        for (let j = i + 1; j < physics.length; j++) {
          const a = physics[i];
          const b = physics[j];
          const rA = a.size / 2;
          const rB = b.size / 2;
          const ax = a.x + rA;
          const ay = a.y + rA;
          const bx = b.x + rB;
          const by = b.y + rB;
          const dx = bx - ax;
          const dy = by - ay;
          const dist = Math.hypot(dx, dy) || 0.01;
          const minDist = rA + rB + 5;
          const softPadding = 22 * (1 - intenseBoost * 0.85);
          const softZone = minDist + softPadding;

          if (dist < softZone) {
            const nx = dx / dist;
            const ny = dy / dist;

            if (softPadding > 2) {
              const cushionFactor = (softZone - dist) / softPadding;
              const steer = cushionFactor * 0.055 * (1 - intenseBoost * 0.85);
              a.vx -= nx * steer;
              a.vy -= ny * steer;
              b.vx += nx * steer;
              b.vy += ny * steer;
            }

            if (dist < minDist) {
              const overlap = minDist - dist;
              const sepFactor = 0.26 + intenseBoost * 0.24;
              a.x -= nx * overlap * sepFactor;
              a.y -= ny * overlap * sepFactor;
              b.x += nx * overlap * sepFactor;
              b.y += ny * overlap * sepFactor;

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const restitution = 0.42 + intenseBoost * 0.5;
                const impulseBlend = 0.42 + intenseBoost * 0.08;
                const impulse = -(1 + restitution) * velAlongNormal * impulseBlend;
                a.vx -= impulse * nx;
                a.vy -= impulse * ny;
                b.vx += impulse * nx;
                b.vy += impulse * ny;

                const key = `${i}-${j}`;
                const lastHit = pairCooldown.get(key) ?? -100;
                const hitCooldown = Math.round(24 - intenseBoost * 12);
                if (frameCounter - lastHit > hitCooldown) {
                  pairCooldown.set(key, frameCounter);
                  const impactAng = Math.atan2(ny, nx);
                  const impactStrength = Math.min(1, Math.abs(velAlongNormal) * 1.8);
                  const wobble = maxOrbWobble * (0.55 + impactStrength * 0.45);
                  const orbFlashTarget = (0.18 + intenseBoost * 0.78) * fxFactor;

                  a.wobbleAmp = Math.max(a.wobbleAmp, wobble);
                  a.wobblePhase = 0;
                  a.impactAngleRad = impactAng;
                  a.flash = Math.max(a.flash, orbFlashTarget);

                  b.wobbleAmp = Math.max(b.wobbleAmp, wobble);
                  b.wobblePhase = 0;
                  b.impactAngleRad = impactAng;
                  b.flash = Math.max(b.flash, orbFlashTarget);

                  const hitX = ax + nx * rA;
                  const hitY = ay + ny * rA;
                  spawnCollisionFx(
                    hitX,
                    hitY,
                    -ny,
                    nx,
                    a.glowRgb,
                    b.glowRgb,
                    sparkCountOrb,
                    28 + intenseBoost * 36,
                    Math.max(energyNorm, intenseBoost)
                  );
                }
              }
            }
          }
        }
      }

      // Precompute orb visual scale/opacity/deform so contour FX & DOM stay frame-locked
      const orbRenderStates = physics.map((p) => {
        let baseScale = 1;
        let opacity = p.isActive ? 1 : 0.88;
        let glowRadius = p.isActive
          ? 18 + smoothBass * (26 + intenseBoost * 18) * effectIntensity
          : 11 + smoothHigh * (18 + intenseBoost * 10) * effectIntensity;
        let glowAlpha = p.isActive
          ? 0.42 + smoothBass * 0.42 * effectIntensity
          : 0.28 + smoothHigh * 0.36 * effectIntensity;

        const bassScaleBoost = 1 + intenseBoost * 0.85;
        if (p.effect === 'pulse') {
          baseScale =
            1 +
            Math.sin(p.phase * 1.4) * (0.032 + intenseBoost * 0.02) * effectIntensity +
            (p.isActive ? smoothBass * 0.11 * bassScaleBoost : smoothBass * 0.07 * bassScaleBoost);
        } else if (p.effect === 'shimmer') {
          opacity = p.isActive
            ? 0.88 + Math.sin(p.phase * 1.8) * 0.12
            : 0.66 + Math.sin(p.phase * 1.6) * 0.26;
          baseScale = 1 + Math.cos(p.phase * 1.1) * 0.028 + smoothBass * 0.07 * bassScaleBoost;
        } else if (p.effect === 'sparkle') {
          const flicker = Math.sin(p.phase * 3.6) * Math.cos(p.phase * 2.1);
          glowRadius += Math.max(0, flicker) * (18 + intenseBoost * 10) * effectIntensity;
          glowAlpha = Math.min(0.95, glowAlpha + Math.max(0, flicker) * 0.3);
          baseScale = 1 + smoothBass * 0.08 * bassScaleBoost;
        } else if (p.effect === 'neon') {
          glowRadius += 10 + Math.sin(p.phase * 1.3) * 8 * effectIntensity;
          baseScale = 1 + (p.isActive ? smoothBass * 0.095 : smoothHigh * 0.065) * bassScaleBoost;
        } else {
          opacity = 0.78 + Math.sin(p.phase * 1.2) * 0.18;
          baseScale = 1 + Math.sin(p.phase * 1.0) * 0.032 + smoothBass * 0.075 * bassScaleBoost;
        }

        const deform = p.wobbleAmp * Math.sin(p.wobblePhase);
        glowRadius += p.flash * (11 + intenseBoost * 10);
        glowAlpha = Math.min(1, glowAlpha + p.flash * (0.18 + intenseBoost * 0.18));

        return { baseScale, opacity, glowRadius, glowAlpha, deform };
      });

      // Continuous smooth hue progression across the song & melody-driven luminosity
      const melodyIntensity = playing
        ? Math.min(1, energyNorm * 0.58 + intenseBoost * 0.34 + beatKick * 0.5)
        : 0.08;
      songHue =
        (songHue + (playing ? 0.3 + energyNorm * 0.55 + intenseBoost * 0.45 : 0.1)) % 360;

      // Draw gentle collision sparks, ripples, and per-orb 13-mode audio-reactive effects
      if (fxCtx) {
        fxCtx.clearRect(0, 0, width, height);
        fxCtx.save();
        fxCtx.globalCompositeOperation = 'lighter';

        const rotSpeedFactor = prefersReducedMotion ? 0.1 : 0.22;
        for (let i = 0; i < physics.length; i++) {
          const p = physics[i];
          const st = orbRenderStates[i];
          const rotRad =
            p.shape === 'circle' || p.shape === 'heart'
              ? 0
              : p.phase * rotSpeedFactor * (i % 2 === 0 ? 1 : -1);

          renderOrbFxFrame({
            ctx: fxCtx,
            fxState: p.fxState,
            fxMode: p.fxMode,
            shape: p.shape,
            orbIndex: i,
            isActive: p.isActive,
            cx: p.x + p.size / 2,
            cy: p.y + p.size / 2,
            vx: p.vx,
            vy: p.vy,
            radius: (p.size / 2) * st.baseScale,
            rotRad,
            phase: p.phase,
            deform: st.deform,
            impactAngleRad: p.impactAngleRad,
            songHue,
            melodyIntensity,
            energyNorm,
            intenseBoost,
            beatKick,
            smoothBass,
            smoothHigh,
            freqBuf,
            playing,
            layeredBg,
            frameCounter,
          });
        }

        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.life += 1;
          const progress = rp.life / rp.maxLife;
          if (progress >= 1) {
            ripples.splice(i, 1);
            continue;
          }
          rp.radius = 5 + progress * rp.maxRadius;
          const alpha = ((1 - progress) * (0.24 + intenseBoost * 0.48)) * fxFactor;
          fxCtx.strokeStyle = `rgba(${rp.rgb}, ${alpha.toFixed(3)})`;
          fxCtx.lineWidth = Math.max(0.6, (1 - progress) * (1.6 + intenseBoost * 0.9));
          fxCtx.beginPath();
          fxCtx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
          fxCtx.stroke();
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.life += 1;
          if (sp.life >= sp.maxLife) {
            sparks.splice(i, 1);
            continue;
          }
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vx *= 0.955;
          sp.vy *= 0.955;
          const alpha = ((1 - sp.life / sp.maxLife) * (0.42 + intenseBoost * 0.54)) * fxFactor;
          fxCtx.strokeStyle = `rgba(${sp.rgb}, ${alpha.toFixed(3)})`;
          fxCtx.lineWidth = sp.size;
          fxCtx.lineCap = 'round';
          fxCtx.beginPath();
          fxCtx.moveTo(sp.x, sp.y);
          fxCtx.lineTo(
            sp.x - sp.vx * (1.5 + intenseBoost * 0.5),
            sp.y - sp.vy * (1.5 + intenseBoost * 0.5)
          );
          fxCtx.stroke();

          fxCtx.fillStyle = `rgba(255, 255, 255, ${(alpha * (0.55 + intenseBoost * 0.25)).toFixed(3)})`;
          fxCtx.beginPath();
          fxCtx.arc(sp.x, sp.y, sp.size * 0.4, 0, Math.PI * 2);
          fxCtx.fill();
        }

        fxCtx.restore();
      }

      // Apply GPU-composited transforms + subtle contour membrane shudder & synchronized shape rotation
      for (let i = 0; i < physics.length; i++) {
        const p = physics[i];
        const el = orbRefs.current[i];
        if (!el) continue;

        const coverEl = coverRefs.current[i];
        const hoverEl = hoverTextRefs.current[i];
        const { baseScale, opacity, glowRadius, glowAlpha, deform } = orbRenderStates[i];
        const sx = baseScale * (1 - deform);
        const sy = baseScale * (1 + deform);
        const deg = (p.impactAngleRad * 180) / Math.PI;
        const rotSpeedFactor = prefersReducedMotion ? 0.1 : 0.22;
        const rotRad =
          p.shape === 'circle' || p.shape === 'heart'
            ? 0
            : p.phase * rotSpeedFactor * (i % 2 === 0 ? 1 : -1);
        const rotDeg = (rotRad * 180) / Math.PI;

        // Subtle beat-reactive micro-tremor & organic border-radius shudder (circles only)
        let tremorX = 0;
        let tremorY = 0;
        if (playing) {
          if (p.shape === 'circle') {
            const shudderPct = Math.min(
              4.5,
              0.35 + energyNorm * 1.45 + intenseBoost * 1.9 + beatKick * 1.8
            );
            const s1 = Math.sin(p.phase * 6.4 + i * 1.7) * shudderPct;
            const s2 = Math.cos(p.phase * 7.8 + i * 2.3) * shudderPct;
            const s3 = Math.sin(p.phase * 8.9 - i * 1.1) * shudderPct;
            const s4 = Math.cos(p.phase * 5.7 + i * 2.9) * shudderPct;
            el.style.borderRadius = `${(50 + s1).toFixed(2)}% ${(50 - s2).toFixed(2)}% ${(50 + s3).toFixed(2)}% ${(50 - s4).toFixed(2)}% / ${(50 - s3).toFixed(2)}% ${(50 + s1).toFixed(2)}% ${(50 - s4).toFixed(2)}% ${(50 + s2).toFixed(2)}%`;
          } else {
            el.style.borderRadius = '0px';
          }

          const tremorAmp = prefersReducedMotion
            ? 0
            : Math.min(1.6, beatKick * (0.5 + intenseBoost * 1.5));
          if (tremorAmp > 0.05) {
            tremorX = Math.sin(p.phase * 22 + i * 3.1) * tremorAmp;
            tremorY = Math.cos(p.phase * 25 + i * 2.4) * tremorAmp;
          }
        } else {
          el.style.borderRadius = p.shape === 'circle' ? '50%' : '0px';
        }

        const tx = p.x + tremorX;
        const ty = p.y + tremorY;

        el.style.transform =
          Math.abs(deform) > 0.0012
            ? `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${deg.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) rotate(${(-deg).toFixed(1)}deg)`
            : `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${baseScale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);

        if (coverEl) {
          coverEl.style.transform = rotRad !== 0 ? `rotate(${rotDeg.toFixed(2)}deg)` : '';
        }
        if (hoverEl) {
          hoverEl.style.transform = rotRad !== 0 ? `rotate(${(-rotDeg).toFixed(2)}deg)` : '';
        }

        if (p.shape === 'circle') {
          const orbHue = (songHue + i * 42) % 360;
          const orbSat = 74 + melodyIntensity * 26;
          const orbLight = 52 + melodyIntensity * 26;
          const dynGlowCss = hslToCss(orbHue, orbSat, orbLight, glowAlpha);
          const dynInsetCss = hslToCss(
            orbHue + 70,
            orbSat,
            orbLight + 6,
            0.22 + melodyIntensity * 0.2 + p.flash * (0.16 + intenseBoost * 0.14)
          );
          const dynBorderCss = hslToCss(
            orbHue + 25,
            orbSat,
            Math.min(88, orbLight + 8),
            Math.min(1, 0.42 + glowAlpha * 0.55)
          );
          const clampedGlow = Math.min(20, glowRadius);
          el.style.boxShadow = `0 0 ${clampedGlow.toFixed(0)}px ${dynGlowCss}, inset 0 0 14px ${dynInsetCss}`;
          el.style.borderColor = dynBorderCss;
        } else {
          el.style.boxShadow = 'none';
          el.style.borderColor = 'transparent';
        }
      }
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeFxCanvas);
    };
  }, [orbSpecs]);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden">
      <canvas
        ref={fxCanvasRef}
        aria-hidden="true"
        className="fixed inset-0 w-full h-full pointer-events-none"
      />

      {orbSpecs.map((spec, idx) => {
        const svgPad = 20;
        const svgDim = spec.size + svgPad * 2;
        const center = svgDim / 2;
        const arcR = spec.size / 2 + 10;
        // 260-degree counter-clockwise arc centered at the bottom so text reads left-to-right
        const startRad = (220 * Math.PI) / 180;
        const endRad = (-40 * Math.PI) / 180;
        const x1 = center + arcR * Math.cos(startRad);
        const y1 = center + arcR * Math.sin(startRad);
        const x2 = center + arcR * Math.cos(endRad);
        const y2 = center + arcR * Math.sin(endRad);
        const arcPath = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${arcR} ${arcR} 0 1 0 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        const pathId = `${basePathId}-orb-arc-${idx}`;
        const maxArcPx = arcR * ((246 * Math.PI) / 180);
        const fittedCaption = showCaptions ? fitTextToArcWidth(spec.track.title, maxArcPx) : '';

        return (
          <button
            key={`${spec.track.id}-${idx}`}
            ref={(el) => {
              orbRefs.current[idx] = el;
            }}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              trackEvent('orb_click', {
                action: spec.isActive ? 'toggle_play' : 'select_track',
                fx_mode: spec.fxMode,
                shape: spec.shape,
                track_title: spec.track.title,
              });
              if (spec.isActive) {
                onTogglePlay();
              } else {
                onSelectTrack(spec.indexInPlaylist);
              }
            }}
            style={{
              width: `${spec.size}px`,
              height: `${spec.size}px`,
            }}
            title={`${spec.track.title} — ${spec.track.artist}`}
            aria-label={
              spec.isActive
                ? `${t.orbPlayTitle}: ${spec.track.title}`
                : `${t.orbSwitchTitle} ${spec.track.title}`
            }
            className={`fixed top-0 left-0 overflow-visible pointer-events-auto cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white will-change-transform ${
              spec.shape === 'circle' ? 'rounded-full border-2' : 'border-0'
            }`}
          >
            <div
              ref={(el) => {
                coverRefs.current[idx] = el;
              }}
              style={spec.clipPath ? { clipPath: spec.clipPath } : undefined}
              className={`relative w-full h-full overflow-hidden ${
                spec.shape === 'circle' ? 'rounded-[inherit]' : ''
              }`}
            >
              <img
                src={spec.track.cover || DEFAULT_COVER_IMAGE}
                alt={spec.track.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = DEFAULT_COVER_IMAGE;
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                <div
                  ref={(el) => {
                    hoverTextRefs.current[idx] = el;
                  }}
                  className="flex flex-col items-center justify-center max-w-full"
                >
                  {spec.isActive ? (
                    isPlaying ? (
                      <Pause className="w-6 h-6 text-white fill-current" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                    )
                  ) : (
                    <Play className="w-5 h-5 text-white fill-current mb-0.5" />
                  )}
                  <span className="text-[10px] font-semibold text-white leading-tight line-clamp-2 max-w-full">
                    {spec.track.title}
                  </span>
                </div>
              </div>
            </div>

            {showCaptions && fittedCaption && (
              <svg
                width={svgDim}
                height={svgDim}
                viewBox={`0 0 ${svgDim} ${svgDim}`}
                aria-hidden="true"
                className="pointer-events-none absolute -top-[20px] -left-[20px] overflow-visible select-none"
              >
                <defs>
                  <path id={pathId} d={arcPath} />
                </defs>
                <text
                  fill="rgba(248, 250, 252, 0.92)"
                  stroke="rgba(10, 10, 14, 0.85)"
                  strokeWidth="2.4"
                  paintOrder="stroke"
                  fontSize="9.5"
                  fontWeight="600"
                  letterSpacing="0.4px"
                >
                  <textPath
                    href={`#${pathId}`}
                    startOffset="50%"
                    textAnchor="middle"
                  >
                    {fittedCaption}
                  </textPath>
                </text>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
