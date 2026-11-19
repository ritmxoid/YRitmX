export type OrbShape =
  | 'circle'
  | 'star4'
  | 'star5'
  | 'star6'
  | 'star8'
  | 'poly3'
  | 'diamond'
  | 'poly5'
  | 'poly6'
  | 'poly8'
  | 'heart'
  | 'square'
  | 'rect_h'
  | 'rect_v';

export type OrbFxMode =
  | 'ripples'
  | 'electric_arcs'
  | 'micro_trail'
  | 'glitch_cyber'
  | 'shatter_dots'
  | 'radiant_rays'
  | 'neon_halos'
  | 'solar_corona'
  | 'orbital_satellites'
  | 'prism_radar'
  | 'crystal_shards'
  | 'radar_comet'
  | 'radar_track'
  | 'radar_star4'
  | 'radar_sparkler'
  | 'combo_aurora_spark'
  | 'canvas_bloom'
  | 'soft_fade';

export const RADAR_FX_MODES: OrbFxMode[] = [
  'radar_comet',
  'radar_track',
  'radar_star4',
  'radar_sparkler',
];

export const ORB_FX_MODES: OrbFxMode[] = [
  'ripples',
  'electric_arcs',
  'micro_trail',
  'glitch_cyber',
  'shatter_dots',
  'radiant_rays',
  'neon_halos',
  'solar_corona',
  'orbital_satellites',
  'prism_radar',
  'crystal_shards',
  'radar_comet',
  'radar_track',
  'radar_star4',
  'radar_sparkler',
  'combo_aurora_spark',
  'canvas_bloom',
];

export const ORB_SHAPES: OrbShape[] = [
  'circle',
  'star5',
  'poly6',
  'heart',
  'star6',
  'diamond',
  'star4',
  'poly8',
  'star8',
  'poly5',
  'poly3',
];

export interface ContourWaveClone {
  radii: Float32Array;
  unitX?: Float32Array;
  unitY?: Float32Array;
  expandPx: number;
  expandSpeed: number;
  life: number;
  maxLife: number;
  hueBase: number;
  gradAngle: number;
  intensity: number;
  lineWidth: number;
  deform: number;
  impactAngleRad: number;
}

export interface MicroParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export interface OrbFxState {
  waveClones: ContourWaveClone[];
  particles: MicroParticle[];
  lastWaveFrame: number;
  shatterSpread: number;
  glitchTimer: number;
  glitchSeed: number;
  radarPos: number;
  radarDir: 1 | -1;
  radarSpeedMult: number;
  radarHueA: number;
  radarHueB: number;
  radarHueC: number;
}

export function createOrbFxState(): OrbFxState {
  const hueA = Math.random() * 360;
  const hueB = (hueA + 70 + Math.random() * 140) % 360;
  const hueC = (hueB + 70 + Math.random() * 140) % 360;
  return {
    waveClones: [],
    particles: [],
    lastWaveFrame: -30,
    shatterSpread: 0,
    glitchTimer: 0,
    glitchSeed: 0,
    radarPos: Math.random(),
    radarDir: Math.random() > 0.5 ? 1 : -1,
    radarSpeedMult: 0.84 + Math.random() * 0.44,
    radarHueA: hueA,
    radarHueB: hueB,
    radarHueC: hueC,
  };
}

let lastPickedFxIndex = -1;
let lastPickedShapeIndex = -1;

export function pickTrackOrbStyle(): { fxMode: OrbFxMode; shape: OrbShape } {
  let fxIdx = Math.floor(Math.random() * ORB_FX_MODES.length);
  if (fxIdx === lastPickedFxIndex) {
    fxIdx = (fxIdx + 1 + Math.floor(Math.random() * (ORB_FX_MODES.length - 1))) % ORB_FX_MODES.length;
  }
  lastPickedFxIndex = fxIdx;

  // Pick one distinct non-circle figure (star, polygon, diamond, or heart) per track
  let shapeIdx = 1 + Math.floor(Math.random() * (ORB_SHAPES.length - 1));
  if (shapeIdx === lastPickedShapeIndex) {
    shapeIdx = 1 + (shapeIdx % (ORB_SHAPES.length - 1));
  }
  lastPickedShapeIndex = shapeIdx;

  return {
    fxMode: ORB_FX_MODES[fxIdx],
    shape: ORB_SHAPES[shapeIdx],
  };
}

export function pickCompanionOrbStyle(
  trackFx: OrbFxMode,
  _trackShape: OrbShape,
  companionIdx: number
): { fxMode: OrbFxMode; shape: OrbShape } {
  if (RADAR_FX_MODES.includes(trackFx)) {
    const startIdx = RADAR_FX_MODES.indexOf(trackFx);
    const nextIdx = (startIdx + 1 + companionIdx) % RADAR_FX_MODES.length;
    return { fxMode: RADAR_FX_MODES[nextIdx], shape: 'circle' };
  }
  return { fxMode: trackFx, shape: 'circle' };
}

export function hslToCss(h: number, s: number, l: number, a = 1): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s));
  const lit = Math.min(96, Math.max(8, l));
  const alpha = Math.min(1, Math.max(0, a));
  return `hsla(${hue.toFixed(1)}, ${sat.toFixed(0)}%, ${lit.toFixed(0)}%, ${alpha.toFixed(3)})`;
}

function createContourGradient(
  ctx: CanvasRenderingContext2D,
  spanR: number,
  baseHue: number,
  gradAngle: number,
  sat: number,
  light: number,
  alpha: number
): CanvasGradient {
  const cos = Math.cos(gradAngle);
  const sin = Math.sin(gradAngle);
  const grad = ctx.createLinearGradient(-cos * spanR, -sin * spanR, cos * spanR, sin * spanR);
  grad.addColorStop(0, hslToCss(baseHue, sat, light, alpha));
  grad.addColorStop(0.33, hslToCss(baseHue + 75, sat, light + 6, alpha));
  grad.addColorStop(0.67, hslToCss(baseHue + 165, sat, light + 2, alpha));
  grad.addColorStop(1, hslToCss(baseHue + 250, sat, light + 5, alpha));
  return grad;
}

export const CONTOUR_SEGMENTS = 32;

const shapeBaseCache = new Map<OrbShape, { x: Float32Array; y: Float32Array; r: Float32Array }>();
const shapeClipCache = new Map<OrbShape, string | undefined>();

function buildRawControlVertices(shape: OrbShape): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];

  if (shape === 'heart') {
    const samples = 36;
    for (let i = 0; i < samples; i++) {
      const t = (i / samples) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );
      pts.push({
        x: hx / 16.6,
        y: (hy - 2.3) / 16.6,
      });
    }
    return pts;
  }

  if (shape.startsWith('star')) {
    const tips = parseInt(shape.slice(4), 10) || 5;
    const innerR = tips <= 4 ? 0.46 : tips === 5 ? 0.49 : tips === 6 ? 0.56 : 0.62;
    const total = tips * 2;
    for (let i = 0; i < total; i++) {
      const ang = -Math.PI / 2 + (i / total) * Math.PI * 2;
      const rad = i % 2 === 0 ? 1.0 : innerR;
      pts.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
    }
    return pts;
  }

  if (shape === 'square' || shape === 'rect_h' || shape === 'rect_v') {
    pts.push({ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 });
    return pts;
  }

  if (shape === 'diamond') {
    for (let i = 0; i < 4; i++) {
      const ang = -Math.PI / 2 + (i / 4) * Math.PI * 2;
      pts.push({ x: Math.cos(ang) * 0.98, y: Math.sin(ang) * 0.98 });
    }
    return pts;
  }

  if (shape.startsWith('poly')) {
    const sides = parseInt(shape.slice(4), 10) || 6;
    const yOffset = sides === 3 ? 0.14 : 0;
    const radScale = sides === 3 ? 0.96 : 0.98;
    for (let i = 0; i < sides; i++) {
      const ang = -Math.PI / 2 + (i / sides) * Math.PI * 2;
      pts.push({
        x: Math.cos(ang) * radScale,
        y: Math.sin(ang) * radScale + yOffset,
      });
    }
    return pts;
  }

  // circle
  for (let i = 0; i < CONTOUR_SEGMENTS; i++) {
    const ang = (i / CONTOUR_SEGMENTS) * Math.PI * 2;
    pts.push({ x: Math.cos(ang), y: Math.sin(ang) });
  }
  return pts;
}

export function getNormalizedShapeGeometry(shape: OrbShape): {
  x: Float32Array;
  y: Float32Array;
  r: Float32Array;
} {
  const cached = shapeBaseCache.get(shape);
  if (cached) return cached;

  const ctrl = buildRawControlVertices(shape);
  const outX = new Float32Array(CONTOUR_SEGMENTS);
  const outY = new Float32Array(CONTOUR_SEGMENTS);
  const outR = new Float32Array(CONTOUR_SEGMENTS);

  if (shape === 'circle' || shape === 'heart') {
    // Resample uniformly along parameter/control array
    for (let k = 0; k < CONTOUR_SEGMENTS; k++) {
      const f = (k / CONTOUR_SEGMENTS) * ctrl.length;
      const i0 = Math.floor(f) % ctrl.length;
      const i1 = (i0 + 1) % ctrl.length;
      const frac = f - Math.floor(f);
      const px = ctrl[i0].x * (1 - frac) + ctrl[i1].x * frac;
      const py = ctrl[i0].y * (1 - frac) + ctrl[i1].y * frac;
      outX[k] = px;
      outY[k] = py;
      outR[k] = Math.hypot(px, py) || 0.01;
    }
  } else {
    // Resample uniformly along polygon/star perimeter so corners stay crisp
    const edgeLens: number[] = [];
    let totalPerim = 0;
    for (let i = 0; i < ctrl.length; i++) {
      const next = (i + 1) % ctrl.length;
      const len = Math.hypot(ctrl[next].x - ctrl[i].x, ctrl[next].y - ctrl[i].y);
      edgeLens.push(len);
      totalPerim += len;
    }

    for (let k = 0; k < CONTOUR_SEGMENTS; k++) {
      let targetDist = (k / CONTOUR_SEGMENTS) * totalPerim;
      let edgeIdx = 0;
      while (edgeIdx < ctrl.length - 1 && targetDist > edgeLens[edgeIdx]) {
        targetDist -= edgeLens[edgeIdx];
        edgeIdx++;
      }
      const next = (edgeIdx + 1) % ctrl.length;
      const t = edgeLens[edgeIdx] > 0 ? targetDist / edgeLens[edgeIdx] : 0;
      const px = ctrl[edgeIdx].x * (1 - t) + ctrl[next].x * t;
      const py = ctrl[edgeIdx].y * (1 - t) + ctrl[next].y * t;
      outX[k] = px;
      outY[k] = py;
      outR[k] = Math.hypot(px, py) || 0.01;
    }
  }

  const res = { x: outX, y: outY, r: outR };
  shapeBaseCache.set(shape, res);
  return res;
}

export function getShapeClipPath(shape: OrbShape): string | undefined {
  if (shape === 'circle') return undefined;
  if (shapeClipCache.has(shape)) return shapeClipCache.get(shape);

  const ctrl = buildRawControlVertices(shape);
  const polyStr = ctrl
    .map((pt) => `${(50 + pt.x * 50).toFixed(1)}% ${(50 + pt.y * 50).toFixed(1)}%`)
    .join(', ');
  const clip = `polygon(${polyStr})`;
  shapeClipCache.set(shape, clip);
  return clip;
}

const scratchX = new Float32Array(CONTOUR_SEGMENTS);
const scratchY = new Float32Array(CONTOUR_SEGMENTS);
const scratchUx = new Float32Array(CONTOUR_SEGMENTS);
const scratchUy = new Float32Array(CONTOUR_SEGMENTS);
const scratchRadii = new Float32Array(CONTOUR_SEGMENTS);

function traceSmoothPolygon(
  ctx: CanvasRenderingContext2D,
  xs: Float32Array,
  ys: Float32Array,
  smoothCurve: boolean
) {
  ctx.beginPath();
  if (smoothCurve) {
    const startMidX = (xs[CONTOUR_SEGMENTS - 1] + xs[0]) * 0.5;
    const startMidY = (ys[CONTOUR_SEGMENTS - 1] + ys[0]) * 0.5;
    ctx.moveTo(startMidX, startMidY);
    for (let k = 0; k < CONTOUR_SEGMENTS; k++) {
      const next = (k + 1) % CONTOUR_SEGMENTS;
      const midX = (xs[k] + xs[next]) * 0.5;
      const midY = (ys[k] + ys[next]) * 0.5;
      ctx.quadraticCurveTo(xs[k], ys[k], midX, midY);
    }
  } else {
    ctx.moveTo(xs[0], ys[0]);
    for (let k = 1; k < CONTOUR_SEGMENTS; k++) {
      ctx.lineTo(xs[k], ys[k]);
    }
  }
  ctx.closePath();
}

export interface RenderOrbFxParams {
  ctx: CanvasRenderingContext2D;
  fxState: OrbFxState;
  fxMode: OrbFxMode;
  shape: OrbShape;
  orbIndex: number;
  isActive: boolean;
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  radius: number;
  radiusY?: number;
  rotRad: number;
  phase: number;
  deform: number;
  impactAngleRad: number;
  songHue: number;
  melodyIntensity: number;
  energyNorm: number;
  intenseBoost: number;
  beatKick: number;
  smoothBass: number;
  smoothHigh: number;
  freqBuf: Uint8Array;
  playing: boolean;
  layeredBg: boolean;
  frameCounter: number;
  opacityMult?: number;
  stepScale?: number;
}

export function renderOrbFxFrame(params: RenderOrbFxParams): void {
  const {
    ctx,
    fxState,
    fxMode,
    shape,
    orbIndex,
    isActive,
    cx,
    cy,
    vx,
    vy,
    radius: r,
    radiusY,
    rotRad,
    phase,
    deform,
    impactAngleRad,
    songHue,
    melodyIntensity,
    energyNorm,
    intenseBoost,
    beatKick,
    smoothHigh,
    freqBuf,
    playing,
    layeredBg,
    frameCounter,
    opacityMult = 1,
    stepScale = 1,
  } = params;

  if (fxMode === 'soft_fade') {
    return;
  }

  const rxFrame = r;
  const ryFrame = radiusY ?? r;
  const rMax = Math.max(rxFrame, ryFrame);

  const geom = getNormalizedShapeGeometry(shape);
  const orbHue = (songHue + orbIndex * 42) % 360;
  const gradAngle = phase * 1.15 + orbIndex * 0.85;
  const sat = 74 + melodyIntensity * 26;
  const light = 48 + melodyIntensity * 32;
  const smoothCurve = shape === 'circle' || shape === 'heart';
  const orbWeight = isActive ? 1.16 : 0.94;

  const contourAmp = playing
    ? 1.0 + energyNorm * 3.2 + intenseBoost * 4.4 + beatKick * 4.8
    : 0.4;

  // Populate base contour vertices in local rotated frame (supporting anisotropic rxFrame/ryFrame)
  for (let k = 0; k < CONTOUR_SEGMENTS; k++) {
    const ang = (k / CONTOUR_SEGMENTS) * Math.PI * 2;
    const sym = k <= CONTOUR_SEGMENTS / 2 ? k : CONTOUR_SEGMENTS - k;
    const binIdx = 2 + ((sym + orbIndex * 3) % 36);
    const binVal = playing ? freqBuf[binIdx] / 255 : 0;

    const harmonicWave =
      Math.sin(ang * 7 + phase * 6.8 + orbIndex * 1.3) * 0.55 +
      Math.cos(ang * 11 - phase * 8.4 + orbIndex * 2.1) * 0.45;
    const dr = Math.max(
      -0.5,
      (harmonicWave * 0.45 + binVal * (0.55 + intenseBoost * 0.68)) * contourAmp * orbWeight
    );
    const sx = geom.x[k] * rxFrame;
    const sy = geom.y[k] * ryFrame;
    const sDist = Math.hypot(sx, sy) || 0.01;
    const ux = sx / sDist;
    const uy = sy / sDist;
    scratchUx[k] = ux;
    scratchUy[k] = uy;
    scratchRadii[k] = sDist + 1.0 + dr;
    scratchX[k] = sx + ux * (1.0 + dr);
    scratchY[k] = sy + uy * (1.0 + dr);
  }

  const sampleContourAt = (uRaw: number): { x: number; y: number; nx: number; ny: number } => {
    const u = ((uRaw % 1) + 1) % 1;
    const f = u * CONTOUR_SEGMENTS;
    const k0 = Math.floor(f) % CONTOUR_SEGMENTS;
    const k1 = (k0 + 1) % CONTOUR_SEGMENTS;
    const frac = f - Math.floor(f);
    const px = scratchX[k0] * (1 - frac) + scratchX[k1] * frac;
    const py = scratchY[k0] * (1 - frac) + scratchY[k1] * frac;
    const dist = Math.hypot(px, py) || 1;
    return { x: px, y: py, nx: px / dist, ny: py / dist };
  };

  const isRadarMode =
    fxMode === 'radar_comet' ||
    fxMode === 'radar_track' ||
    fxMode === 'radar_star4' ||
    fxMode === 'radar_sparkler';

  if (isRadarMode) {
    const stepU =
      (playing
        ? 0.0036 + melodyIntensity * 0.0046 + beatKick * 0.0032
        : 0.0018) *
      fxState.radarSpeedMult *
      stepScale;
    fxState.radarPos = (fxState.radarPos + fxState.radarDir * stepU + 10) % 1;
  }

  // World-space particle FX (micro_trail, combo_aurora_spark, radar_sparkler)
  if (fxMode === 'radar_sparkler') {
    const headLocal = sampleContourAt(fxState.radarPos);
    let sx = headLocal.x;
    let sy = headLocal.y;
    let snx = headLocal.nx;
    let sny = headLocal.ny;

    if (rotRad !== 0) {
      const cr = Math.cos(rotRad);
      const sr = Math.sin(rotRad);
      const rx = sx * cr - sy * sr;
      const ry = sx * sr + sy * cr;
      sx = rx;
      sy = ry;
      const rnx = snx * cr - sny * sr;
      const rny = snx * sr + sny * cr;
      snx = rnx;
      sny = rny;
    }

    if (Math.abs(deform) > 0.0012) {
      const ca = Math.cos(-impactAngleRad);
      const sa = Math.sin(-impactAngleRad);
      const dx = (sx * ca - sy * sa) * (1 - deform);
      const dy = (sx * sa + sy * ca) * (1 + deform);
      const ca2 = Math.cos(impactAngleRad);
      const sa2 = Math.sin(impactAngleRad);
      sx = dx * ca2 - dy * sa2;
      sy = dx * sa2 + dy * ca2;
    }

    const wx = cx + sx;
    const wy = cy + sy;
    const maxSparklerParticles = layeredBg ? 22 : 38;
    const spawnCount = playing ? (beatKick > 0.1 ? 3 : 2) : 1;

    for (let s = 0; s < spawnCount && fxState.particles.length < maxSparklerParticles; s++) {
      if (!playing && Math.random() > 0.45) break;
      const spreadAngle = Math.atan2(sny, snx) + (Math.random() - 0.5) * 1.9;
      const spd = 0.55 + Math.random() * (1.55 + melodyIntensity * 1.45 + beatKick * 1.1);
      const palettePick = Math.random();
      const sparkHue =
        palettePick < 0.34
          ? fxState.radarHueA
          : palettePick < 0.67
          ? fxState.radarHueB
          : fxState.radarHueC;
      fxState.particles.push({
        x: wx + (Math.random() - 0.5) * 2.5,
        y: wy + (Math.random() - 0.5) * 2.5,
        vx: Math.cos(spreadAngle) * spd - vx * 0.25,
        vy: Math.sin(spreadAngle) * spd - vy * 0.25,
        life: 0,
        maxLife: 16 + Math.random() * 18,
        size: 0.9 + Math.random() * (1.2 + melodyIntensity * 1.1),
        hue: (sparkHue + phase * 36 + Math.random() * 30) % 360,
      });
    }
  } else if (fxMode === 'micro_trail' || fxMode === 'combo_aurora_spark') {
    const maxParticles = layeredBg ? 18 : 34;
    const spawnChance = playing ? (0.35 + melodyIntensity * 0.65) : 0.15;
    if (fxState.particles.length < maxParticles && Math.random() < spawnChance) {
      const count = playing && beatKick > 0.1 ? (layeredBg ? 2 : 3) : 1;
      for (let s = 0; s < count && fxState.particles.length < maxParticles; s++) {
        const k = Math.floor(Math.random() * CONTOUR_SEGMENTS);
        const lx = scratchX[k];
        const ly = scratchY[k];
        const cosR = Math.cos(rotRad);
        const sinR = Math.sin(rotRad);
        const wx = cx + (lx * cosR - ly * sinR);
        const wy = cy + (lx * sinR + ly * cosR);
        const outAngle = Math.atan2(wy - cy, wx - cx) + (Math.random() - 0.5) * 0.7;
        const speed = 0.45 + Math.random() * (1.2 + melodyIntensity * 1.4);
        fxState.particles.push({
          x: wx,
          y: wy,
          vx: Math.cos(outAngle) * speed - vx * 0.45,
          vy: Math.sin(outAngle) * speed - vy * 0.45,
          life: 0,
          maxLife: 24 + Math.random() * 24,
          size: 1.2 + Math.random() * (1.5 + melodyIntensity * 1.4),
          hue: (orbHue + Math.random() * 110) % 360,
        });
      }
    }
  }

  if (
    fxMode === 'radar_sparkler' ||
    fxMode === 'micro_trail' ||
    fxMode === 'combo_aurora_spark'
  ) {
    for (let i = fxState.particles.length - 1; i >= 0; i--) {
      const pt = fxState.particles[i];
      pt.life += stepScale;
      if (pt.life >= pt.maxLife) {
        fxState.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * stepScale;
      pt.y += pt.vy * stepScale;
      const damp = Math.pow(0.94, stepScale);
      pt.vx *= damp;
      pt.vy *= damp;
      const pProg = Math.min(1, pt.life / pt.maxLife);
      const pAlpha = (1 - pProg) * (0.45 + melodyIntensity * 0.55);
      ctx.fillStyle = hslToCss(pt.hue, 96, 66 + melodyIntensity * 22, pAlpha);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (1 - pProg * 0.55), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Local transform block (center, collision squash, shape rotation)
  ctx.save();
  ctx.translate(cx, cy);
  if (Math.abs(deform) > 0.0012) {
    ctx.rotate(impactAngleRad);
    ctx.scale(1 - deform, 1 + deform);
    ctx.rotate(-impactAngleRad);
  }
  if (rotRad !== 0) {
    ctx.rotate(rotRad);
  }

  const alphaMult = Math.max(0.05, Math.min(1, opacityMult));
  const contourAlpha = (playing ? Math.min(0.98, 0.32 + melodyIntensity * 0.66) : 0.22) * alphaMult;
  const primaryGrad = createContourGradient(
    ctx,
    rMax + 14,
    orbHue,
    gradAngle,
    sat,
    Math.min(92, light + 8),
    contourAlpha
  );

  // Helper to draw the clean glowing shape outline
  const strokeBaseGlowShape = (lineMult = 1) => {
    traceSmoothPolygon(ctx, scratchX, scratchY, smoothCurve);
    ctx.globalAlpha = 0.25 + melodyIntensity * 0.15;
    ctx.strokeStyle = primaryGrad;
    ctx.lineWidth = (3.8 + melodyIntensity * 4.2) * lineMult;
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = primaryGrad;
    ctx.lineWidth = (1.25 + melodyIntensity * 1.55) * lineMult;
    ctx.stroke();
  };

  if (fxMode === 'ripples') {
    // Hybrid water-ripple clones
    const maxClones = layeredBg ? (isActive ? 2 : 1) : isActive ? 4 : 3;
    const spawnCooldown = layeredBg
      ? Math.max(24, Math.round(44 - melodyIntensity * 16))
      : Math.max(15, Math.round(34 - melodyIntensity * 16));
    const beatCooldown = layeredBg ? 18 : 12;
    const beatTriggered = beatKick > 0.095 && frameCounter - fxState.lastWaveFrame >= beatCooldown;

    if (playing && (beatTriggered || frameCounter - fxState.lastWaveFrame >= spawnCooldown)) {
      fxState.lastWaveFrame = frameCounter;
      while (fxState.waveClones.length >= maxClones) {
        fxState.waveClones.shift();
      }
      fxState.waveClones.push({
        radii: new Float32Array(scratchRadii),
        unitX: new Float32Array(scratchUx),
        unitY: new Float32Array(scratchUy),
        expandPx: 1.5,
        expandSpeed: (layeredBg ? 0.6 : 0.7) + melodyIntensity * 0.85 + (isActive ? 0.15 : 0),
        life: 0,
        maxLife: Math.round((layeredBg ? 40 : 48) + melodyIntensity * 16),
        hueBase: orbHue,
        gradAngle,
        intensity: melodyIntensity,
        lineWidth: (layeredBg ? 1.0 : 1.2) + melodyIntensity * 1.25,
        deform,
        impactAngleRad,
      });
    }

    const tmpX = new Float32Array(CONTOUR_SEGMENTS);
    const tmpY = new Float32Array(CONTOUR_SEGMENTS);
    for (let c = fxState.waveClones.length - 1; c >= 0; c--) {
      const clone = fxState.waveClones[c];
      clone.life += stepScale;
      const progress = clone.life / clone.maxLife;
      if (progress >= 1) {
        fxState.waveClones.splice(c, 1);
        continue;
      }
      clone.expandPx += clone.expandSpeed * (1 - progress * 0.35) * stepScale;
      clone.hueBase = (clone.hueBase + 0.25 * stepScale) % 360;

      const fade = Math.pow(1 - progress, 1.65);
      const cloneLum = Math.max(clone.intensity, melodyIntensity * 0.7);
      const cloneAlpha = fade * (0.28 + cloneLum * 0.54) * alphaMult;

      for (let k = 0; k < CONTOUR_SEGMENTS; k++) {
        const ux = clone.unitX ? clone.unitX[k] : scratchUx[k];
        const uy = clone.unitY ? clone.unitY[k] : scratchUy[k];
        const radScale = clone.radii[k] + clone.expandPx;
        tmpX[k] = ux * radScale;
        tmpY[k] = uy * radScale;
      }

      traceSmoothPolygon(ctx, tmpX, tmpY, smoothCurve);
      ctx.strokeStyle = createContourGradient(
        ctx,
        rMax + clone.expandPx + 8,
        clone.hueBase,
        clone.gradAngle + progress * 0.4,
        76 + cloneLum * 24,
        Math.min(90, 52 + cloneLum * 32),
        cloneAlpha
      );
      ctx.lineWidth = Math.max(0.55, clone.lineWidth * (1 - progress * 0.5));
      ctx.stroke();
    }

    strokeBaseGlowShape(1);
  } else if (fxMode === 'electric_arcs') {
    strokeBaseGlowShape(0.85);
    // High-voltage jagged lightning arcs snapping around contour with random vivid colors
    const boltCount = layeredBg ? 3 : 5 + Math.round(melodyIntensity * 4);
    const jitterMax = playing ? 4 + melodyIntensity * 12 + beatKick * 14 : 2;
    for (let b = 0; b < boltCount; b++) {
      const startK = Math.floor(((b / boltCount) * CONTOUR_SEGMENTS + frameCounter * 0.4) % CONTOUR_SEGMENTS);
      const span = 3 + Math.floor(Math.random() * 4);
      const boltHue = (orbHue + Math.random() * 220) % 360;
      const boltAlpha = playing ? 0.45 + melodyIntensity * 0.55 : 0.2;

      ctx.beginPath();
      for (let s = 0; s <= span; s++) {
        const k = (startK + s) % CONTOUR_SEGMENTS;
        const ux = scratchUx[k];
        const uy = scratchUy[k];
        const j = s === 0 || s === span ? 0.5 : (Math.random() - 0.25) * jitterMax;
        const px = scratchX[k] + ux * j;
        const py = scratchY[k] + uy * j;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = hslToCss(boltHue, 100, 72 + melodyIntensity * 20, boltAlpha);
      ctx.lineWidth = 1.1 + melodyIntensity * 1.3;
      ctx.stroke();
    }
  } else if (fxMode === 'micro_trail') {
    strokeBaseGlowShape(1);
  } else if (fxMode === 'glitch_cyber') {
    if (beatKick > 0.08 || Math.random() < 0.06 + intenseBoost * 0.16) {
      fxState.glitchTimer = 3 + Math.floor(Math.random() * 4);
      fxState.glitchSeed = Math.random() * 100;
    } else if (fxState.glitchTimer > 0) {
      fxState.glitchTimer -= 1;
    }

    const glitchAmt = fxState.glitchTimer > 0 ? (2.5 + melodyIntensity * 8 + beatKick * 9) : 0.8;
    const gx1 = Math.sin(fxState.glitchSeed * 1.7 + frameCounter * 0.9) * glitchAmt;
    const gy1 = Math.cos(fxState.glitchSeed * 2.3) * glitchAmt * 0.45;

    // Cyan & Magenta RGB chromatic split contours
    ctx.save();
    ctx.translate(gx1, gy1);
    traceSmoothPolygon(ctx, scratchX, scratchY, smoothCurve);
    ctx.strokeStyle = `rgba(34, 211, 238, ${(0.35 + melodyIntensity * 0.55).toFixed(3)})`;
    ctx.lineWidth = 1.4 + melodyIntensity;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-gx1 * 0.9, -gy1);
    traceSmoothPolygon(ctx, scratchX, scratchY, smoothCurve);
    ctx.strokeStyle = `rgba(244, 63, 94, ${(0.35 + melodyIntensity * 0.55).toFixed(3)})`;
    ctx.lineWidth = 1.4 + melodyIntensity;
    ctx.stroke();
    ctx.restore();

    strokeBaseGlowShape(0.8);

    // Random horizontal glitch arc shards
    if (fxState.glitchTimer > 0 && !layeredBg) {
      for (let g = 0; g < 3; g++) {
        const ang = ((fxState.glitchSeed + g * 2.1) % (Math.PI * 2));
        const len = 0.25 + Math.random() * 0.4;
        const rr = rMax + 3 + Math.random() * 10;
        ctx.beginPath();
        ctx.arc(Math.sin(frameCounter + g) * 4, 0, rr, ang, ang + len);
        ctx.strokeStyle = hslToCss(orbHue + g * 120, 100, 75, 0.7);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  } else if (fxMode === 'shatter_dots') {
    const targetSpread = playing ? Math.min(1, beatKick * 2.4 + intenseBoost * 0.65) : 0;
    fxState.shatterSpread += (targetSpread - fxState.shatterSpread) * (targetSpread > fxState.shatterSpread ? 0.35 : 0.08);
    const scatterPx = fxState.shatterSpread * (12 + intenseBoost * 16);

    // Draw scattered arc segments & glowing dots that fly out and reassemble
    const segStep = 2;
    for (let k = 0; k < CONTOUR_SEGMENTS; k += segStep) {
      const next = (k + 1) % CONTOUR_SEGMENTS;
      const ux = scratchUx[k];
      const uy = scratchUy[k];
      const waveOffset = scatterPx * (0.65 + 0.5 * Math.sin(k * 1.9 + phase * 4));
      const x1 = scratchX[k] + ux * waveOffset;
      const y1 = scratchY[k] + uy * waveOffset;
      const x2 = scratchX[next] + scratchUx[next] * waveOffset;
      const y2 = scratchY[next] + scratchUy[next] * waveOffset;

      const segHue = (orbHue + k * 9) % 360;
      ctx.strokeStyle = hslToCss(segHue, sat, Math.min(90, light + 8), 0.38 + melodyIntensity * 0.58);
      ctx.lineWidth = 1.4 + melodyIntensity * 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Luminous node dot
      ctx.fillStyle = hslToCss(segHue + 40, 100, 80, 0.5 + melodyIntensity * 0.5);
      ctx.beginPath();
      ctx.arc(x1, y1, 1.4 + melodyIntensity * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (fxMode === 'radiant_rays') {
    strokeBaseGlowShape(0.85);
    const rayStep = layeredBg ? 2 : 1;
    ctx.lineCap = 'round';
    for (let k = 0; k < CONTOUR_SEGMENTS; k += rayStep) {
      const binIdx = 2 + ((k + orbIndex * 2) % 36);
      const binVal = playing ? freqBuf[binIdx] / 255 : 0.12;
      const rayLen = 4 + binVal * (14 + intenseBoost * 24) + beatKick * 12;
      const ux = scratchUx[k];
      const uy = scratchUy[k];
      const x1 = scratchX[k];
      const y1 = scratchY[k];
      const x2 = x1 + ux * rayLen;
      const y2 = y1 + uy * rayLen;

      const rayHue = (orbHue + k * 11) % 360;
      const rayGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      rayGrad.addColorStop(0, hslToCss(rayHue, sat, light + 12, 0.4 + melodyIntensity * 0.55));
      rayGrad.addColorStop(1, hslToCss(rayHue + 60, sat, light + 20, 0));
      ctx.strokeStyle = rayGrad;
      ctx.lineWidth = 1.4 + melodyIntensity * 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else if (fxMode === 'neon_halos') {
    const ringCount = layeredBg ? 2 : 3;
    for (let n = 0; n < ringCount; n++) {
      const ringHue = (orbHue + n * 85 + phase * 22) % 360;
      const ringScale = 1 + (3 + n * 5 + melodyIntensity * 6) / Math.max(24, rMax);
      const tilt = phase * (n % 2 === 0 ? 1.1 : -1.4) + n * 1.2;
      ctx.save();
      ctx.rotate(tilt);
      ctx.scale(ringScale, ringScale * (0.94 + Math.sin(phase * 2 + n) * 0.06));
      traceSmoothPolygon(ctx, scratchX, scratchY, smoothCurve);
      ctx.strokeStyle = hslToCss(ringHue, 96, 58 + melodyIntensity * 24, 0.35 + melodyIntensity * 0.48);
      ctx.lineWidth = 1.6 + (ringCount - n) * 0.55;
      ctx.stroke();
      ctx.restore();
    }
    strokeBaseGlowShape(0.8);
  } else if (fxMode === 'solar_corona') {
    // Fiery undulating plasma corona flares
    const flameX = new Float32Array(CONTOUR_SEGMENTS);
    const flameY = new Float32Array(CONTOUR_SEGMENTS);
    const layers = layeredBg ? 1 : 2;
    for (let l = 0; l < layers; l++) {
      for (let k = 0; k < CONTOUR_SEGMENTS; k++) {
        const ang = (k / CONTOUR_SEGMENTS) * Math.PI * 2;
        const flare =
          Math.max(0, Math.sin(ang * 5 + phase * 4.2 + l * 2)) * (5 + melodyIntensity * 15 + beatKick * 12);
        const ux = scratchUx[k];
        const uy = scratchUy[k];
        flameX[k] = scratchX[k] + ux * (2 + l * 4 + flare);
        flameY[k] = scratchY[k] + uy * (2 + l * 4 + flare);
      }
      traceSmoothPolygon(ctx, flameX, flameY, true);
      ctx.strokeStyle = hslToCss(
        (orbHue + l * 38) % 360,
        100,
        55 + melodyIntensity * 28,
        (0.32 + melodyIntensity * 0.45) * (1 - l * 0.3)
      );
      ctx.lineWidth = 2.2 - l * 0.7 + melodyIntensity * 1.4;
      ctx.stroke();
    }
    strokeBaseGlowShape(1);
  } else if (fxMode === 'orbital_satellites') {
    strokeBaseGlowShape(0.9);
    const satCount = layeredBg ? 2 : 4;
    for (let s = 0; s < satCount; s++) {
      const orbitAngle = phase * (1.8 + s * 0.45) + (s * Math.PI * 2) / satCount;
      const orbitTilt = (s * Math.PI) / satCount;
      const rx = rMax + 10 + s * 4 + melodyIntensity * 5;
      const ry = (rMax + 6 + s * 2) * 0.55;

      const lx = Math.cos(orbitAngle) * rx;
      const ly = Math.sin(orbitAngle) * ry;
      const cosT = Math.cos(orbitTilt);
      const sinT = Math.sin(orbitTilt);
      const sx = lx * cosT - ly * sinT;
      const sy = lx * sinT + ly * cosT;

      const prevAng = orbitAngle - 0.35;
      const plx = Math.cos(prevAng) * rx;
      const ply = Math.sin(prevAng) * ry;
      const psx = plx * cosT - ply * sinT;
      const psy = plx * sinT + ply * cosT;

      const satHue = (orbHue + s * 75) % 360;
      const tailGrad = ctx.createLinearGradient(psx, psy, sx, sy);
      tailGrad.addColorStop(0, hslToCss(satHue, 100, 70, 0));
      tailGrad.addColorStop(1, hslToCss(satHue, 100, 80, 0.85 * alphaMult));
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = 1.6 + melodyIntensity;
      ctx.beginPath();
      ctx.moveTo(psx, psy);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      ctx.fillStyle = hslToCss(satHue + 20, 100, 86, 0.95 * alphaMult);
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2 + melodyIntensity * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (fxMode === 'prism_radar') {
    strokeBaseGlowShape(0.85);
    const sweepAngle = phase * 2.4 + orbIndex;
    const sweepR = rMax + 16 + melodyIntensity * 14;
    const radarGrad = ctx.createLinearGradient(
      0,
      0,
      Math.cos(sweepAngle) * sweepR,
      Math.sin(sweepAngle) * sweepR
    );
    radarGrad.addColorStop(0, hslToCss(orbHue, 90, 65, 0.38 * alphaMult));
    radarGrad.addColorStop(1, hslToCss(orbHue + 70, 95, 75, 0));
    ctx.fillStyle = radarGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, sweepR, sweepAngle - 0.55, sweepAngle);
    ctx.closePath();
    ctx.fill();

    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = hslToCss(orbHue + 50, 95, 70, (0.35 + melodyIntensity * 0.4) * alphaMult);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rxFrame + 9 + smoothHigh * 10, ryFrame + 9 + smoothHigh * 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (fxMode === 'crystal_shards') {
    strokeBaseGlowShape(0.85);
    const cageSides = 6;
    const cageCount = layeredBg ? 1 : 2;
    for (let c = 0; c < cageCount; c++) {
      const cageR = rMax + 7 + c * 6 + melodyIntensity * 8 + beatKick * 7;
      const cageRot = phase * (c === 0 ? 1.1 : -1.5) + c * 0.5;
      ctx.beginPath();
      for (let v = 0; v <= cageSides; v++) {
        const ang = cageRot + (v / cageSides) * Math.PI * 2;
        const px = Math.cos(ang) * cageR;
        const py = Math.sin(ang) * cageR;
        if (v === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = hslToCss(
        (orbHue + c * 110) % 360,
        96,
        68 + melodyIntensity * 20,
        0.4 + melodyIntensity * 0.45
      );
      ctx.lineWidth = 1.2 + melodyIntensity * 0.9;
      ctx.stroke();
    }
  } else if (
    fxMode === 'radar_comet' ||
    fxMode === 'radar_track' ||
    fxMode === 'radar_star4' ||
    fxMode === 'radar_sparkler'
  ) {
    // Sleek subtle reactive outline + pulsing multicolor radar light racing along exact shape contour
    strokeBaseGlowShape(0.48);

    const pulseWave = 0.5 + 0.5 * Math.sin(phase * 4.4 + orbIndex * 1.5);
    const pulseBoost = 1 + pulseWave * 0.28 + melodyIntensity * 0.38 + beatKick * 0.6;
    const headHue = (fxState.radarHueA + phase * 38 + pulseWave * 36) % 360;
    const midHue = (fxState.radarHueB + phase * 28) % 360;
    const tailHue = (fxState.radarHueC + phase * 22) % 360;
    const headPos = sampleContourAt(fxState.radarPos);
    const baseAlpha = playing ? 0.65 + melodyIntensity * 0.35 : 0.42;

    const lerpHue = (h1: number, h2: number, t: number): number => {
      const diff = ((((h2 - h1) % 360) + 540) % 360) - 180;
      return (h1 + diff * t + 360) % 360;
    };

    const drawGlowingTailSegment = (tailLenU: number, steps: number, maxWidth: number) => {
      ctx.lineCap = 'round';
      for (let s = 0; s < steps; s++) {
        const t0 = s / steps;
        const t1 = (s + 1) / steps;
        const u0 = fxState.radarPos - fxState.radarDir * (1 - t0) * tailLenU;
        const u1 = fxState.radarPos - fxState.radarDir * (1 - t1) * tailLenU;
        const p0 = sampleContourAt(u0);
        const p1 = sampleContourAt(u1);
        const segHue =
          t1 < 0.5
            ? lerpHue(tailHue, midHue, t1 * 2)
            : lerpHue(midHue, headHue, (t1 - 0.5) * 2);
        const alpha = Math.pow(t1, 1.9) * baseAlpha * 0.82;
        ctx.strokeStyle = hslToCss(segHue, 96, 62 + t1 * 24, alpha);
        ctx.lineWidth = Math.max(0.5, t1 * maxWidth);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    };

    const drawRadialBeaconGlow = (x: number, y: number, glowR: number, hue: number, alpha: number) => {
      const aura = ctx.createRadialGradient(x, y, 0.5, x, y, glowR);
      aura.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, alpha * 0.95).toFixed(3)})`);
      aura.addColorStop(0.28, hslToCss(hue, 100, 72, alpha * 0.85));
      aura.addColorStop(0.65, hslToCss(midHue, 96, 58, alpha * 0.32));
      aura.addColorStop(1, hslToCss(tailHue, 90, 50, 0));
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fill();
    };

    if (fxMode === 'radar_comet') {
      drawGlowingTailSegment(0.28, 22, 2.8 + melodyIntensity * 2.0);
      const glowR = (9 + melodyIntensity * 7 + beatKick * 6) * pulseBoost * 0.72;
      drawRadialBeaconGlow(headPos.x, headPos.y, glowR, headHue, baseAlpha);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, baseAlpha).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, 1.9 + melodyIntensity * 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (fxMode === 'radar_track') {
      // Short thin lead filament + 20 fading luminous track pearls along the contour behind the head
      drawGlowingTailSegment(0.08, 6, 1.8 + melodyIntensity * 1.1);
      const dotCount = 20;
      const trackSpanU = 0.42;
      for (let d = 1; d <= dotCount; d++) {
        const frac = d / dotCount; // 0 = near head, 1 = oldest tail dot
        const pt = sampleContourAt(fxState.radarPos - fxState.radarDir * frac * trackSpanU);
        const fade = Math.pow(1 - frac, 1.65);
        const dotHue = (headHue + frac * 165) % 360;
        const dotRadius = Math.max(0.55, (1 - frac * 0.72) * (2.1 + melodyIntensity * 1.2));
        ctx.fillStyle = hslToCss(dotHue, 98, 66 + fade * 20, fade * baseAlpha * 0.88);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      const glowR = (8.5 + melodyIntensity * 6.5 + beatKick * 5) * pulseBoost * 0.7;
      drawRadialBeaconGlow(headPos.x, headPos.y, glowR, headHue, baseAlpha);
      ctx.strokeStyle = hslToCss(midHue, 100, 78, baseAlpha * (0.45 + pulseWave * 0.35));
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, 3.6 + pulseWave * 2.4 + beatKick * 2.5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (fxMode === 'radar_star4') {
      drawGlowingTailSegment(0.2, 16, 2.2 + melodyIntensity * 1.5);
      const glowR = (10 + melodyIntensity * 7 + beatKick * 6) * pulseBoost * 0.72;
      drawRadialBeaconGlow(headPos.x, headPos.y, glowR, headHue, baseAlpha * 0.85);

      const starLen = (6.8 + melodyIntensity * 4.8 + beatKick * 4.5) * (0.85 + pulseWave * 0.3);
      const starCross = starLen * 0.42;
      const starAngle = phase * 1.8 * fxState.radarDir;
      ctx.save();
      ctx.translate(headPos.x, headPos.y);
      ctx.rotate(starAngle);

      // Primary 4-pointed radiant star
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const rad = i % 2 === 0 ? starLen : starLen * 0.2;
        const sx = Math.cos(ang) * rad;
        const sy = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = hslToCss(headHue, 100, 82, Math.min(1, baseAlpha));
      ctx.fill();

      // Secondary subtle diagonal shimmer cross
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = Math.PI / 4 + (i * Math.PI) / 4;
        const rad = i % 2 === 0 ? starCross : starCross * 0.22;
        const sx = Math.cos(ang) * rad;
        const sy = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = hslToCss(midHue, 100, 86, baseAlpha * 0.72);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.4 + melodyIntensity * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // radar_sparkler: glowing ember trail + crackling multi-needle bengal sparkler core
      drawGlowingTailSegment(0.14, 12, 2.1 + melodyIntensity * 1.3);
      const glowR = (9 + melodyIntensity * 6.5 + beatKick * 5.5) * pulseBoost * 0.72;
      drawRadialBeaconGlow(headPos.x, headPos.y, glowR, headHue, baseAlpha * 0.9);

      const rayCount = 7;
      ctx.lineCap = 'round';
      for (let rIdx = 0; rIdx < rayCount; rIdx++) {
        const rayAng =
          (rIdx / rayCount) * Math.PI * 2 +
          Math.sin(frameCounter * 0.55 + rIdx * 2.1) * 0.35;
        const rayLen =
          (4.2 + Math.random() * (4.8 + melodyIntensity * 5.5 + beatKick * 5.0));
        const rayHue = rIdx % 2 === 0 ? headHue : midHue;
        ctx.strokeStyle = hslToCss(rayHue, 100, 80, baseAlpha * (0.65 + Math.random() * 0.35));
        ctx.lineWidth = 0.8 + Math.random() * 0.7;
        ctx.beginPath();
        ctx.moveTo(headPos.x, headPos.y);
        ctx.lineTo(
          headPos.x + Math.cos(rayAng) * rayLen,
          headPos.y + Math.sin(rayAng) * rayLen
        );
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, 1.8 + melodyIntensity * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (fxMode === 'canvas_bloom') {
    // Canvas-size luminous swell aura that softly fades in translucency as the sphere expands
    strokeBaseGlowShape(1.1);

    const haloRings = layeredBg ? 1 : 2;
    const swellProgress = Math.max(0, Math.min(1, (1 - alphaMult) / 0.88));
    for (let ring = 0; ring < haloRings; ring++) {
      const expand = 1 + 0.045 * (ring + 1) + swellProgress * (0.04 + ring * 0.035);
      const ringAlpha =
        (0.18 + melodyIntensity * 0.28 + swellProgress * 0.16) *
        alphaMult *
        (ring === 0 ? 1 : 0.62);
      const ringHue = (orbHue + ring * 68 + phase * 18) % 360;

      ctx.save();
      ctx.scale(expand, expand);
      traceSmoothPolygon(ctx, scratchX, scratchY, smoothCurve);
      ctx.strokeStyle = createContourGradient(
        ctx,
        rMax + 22,
        ringHue,
        gradAngle + ring * 1.1,
        sat,
        Math.min(94, light + 12),
        ringAlpha
      );
      ctx.lineWidth = (1.6 + melodyIntensity * 1.8) * (ring === 0 ? 1 : 0.72);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // combo_aurora_spark: glowing wavy contour + beat spark spikes + subtle micro-arcs
    strokeBaseGlowShape(1.05);
    if (playing && (melodyIntensity > 0.28 || beatKick > 0.08)) {
      const spikeCount = layeredBg ? 4 : 8;
      for (let s = 0; s < spikeCount; s++) {
        const k = Math.floor(((s / spikeCount) * CONTOUR_SEGMENTS + frameCounter * 0.3) % CONTOUR_SEGMENTS);
        const ux = scratchUx[k];
        const uy = scratchUy[k];
        const len = 5 + melodyIntensity * 14 + beatKick * 12;
        ctx.strokeStyle = hslToCss((orbHue + s * 45) % 360, 100, 78, (0.45 + melodyIntensity * 0.5) * alphaMult);
        ctx.lineWidth = 1.2 + beatKick * 1.4;
        ctx.beginPath();
        ctx.moveTo(scratchX[k], scratchY[k]);
        ctx.lineTo(scratchX[k] + ux * len, scratchY[k] + uy * len);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
