import {
  CONTOUR_SEGMENTS,
  createOrbFxState,
  getNormalizedShapeGeometry,
  ORB_FX_MODES,
  OrbFxMode,
  OrbFxState,
  OrbShape,
} from './orbEffectsRenderer';

export const STUDIO_SHAPES: OrbShape[] = [
  'circle',
  'square',
  'rect_h',
  'rect_v',
  'diamond',
  'poly3',
  'poly5',
  'poly6',
  'poly8',
  'star5',
  'star6',
  'heart',
];

export type StudioHitTarget =
  | 'rotate'
  | 'corner_tl'
  | 'corner_tr'
  | 'corner_br'
  | 'corner_bl'
  | 'edge_t'
  | 'edge_r'
  | 'edge_b'
  | 'edge_l'
  | 'body';

export interface StudioFrameState {
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  baseSize: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  mediaRotation?: number;
  shape: OrbShape;
  fxMode: OrbFxMode;
  fxState: OrbFxState;
  editMode: boolean;
  phase: number;
}

export interface LiveOrbSnapshot {
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  radius: number;
  rotRad: number;
  phase: number;
  deform: number;
  impactAngleRad: number;
  opacity: number;
  isActive: boolean;
  shape: OrbShape;
  fxMode: OrbFxMode;
  fxState: OrbFxState;
  coverSrc: string;
}

export function getStudioShapeRadii(
  shape: OrbShape,
  baseSize: number,
  scaleX: number,
  scaleY: number
): { rx: number; ry: number } {
  const half = baseSize * 0.5;
  if (shape === 'rect_h') {
    return { rx: half * 1.32 * scaleX, ry: half * 0.78 * scaleY };
  }
  if (shape === 'rect_v') {
    return { rx: half * 0.78 * scaleX, ry: half * 1.32 * scaleY };
  }
  return { rx: half * scaleX, ry: half * scaleY };
}

export const STUDIO_FX_MODES: OrbFxMode[] = [
  ...ORB_FX_MODES.filter((m) => m !== 'canvas_bloom'),
  'soft_fade',
];

export function createInitialStudioFrame(width: number, height: number): StudioFrameState {
  const minDim = Math.max(260, Math.min(width, height));
  const baseSize = Math.round(Math.max(168, Math.min(340, minDim * 0.44)));
  const randomFx = STUDIO_FX_MODES[Math.floor(Math.random() * STUDIO_FX_MODES.length)];
  return {
    cx: width * 0.5,
    cy: height * 0.48,
    vx: (Math.random() > 0.5 ? 1 : -1) * 0.42,
    vy: (Math.random() > 0.5 ? 1 : -1) * 0.34,
    baseSize,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    mediaRotation: 0,
    shape: 'circle',
    fxMode: randomFx || 'neon_halos',
    fxState: createOrbFxState(),
    editMode: false,
    phase: Math.random() * Math.PI * 2,
  };
}

export function pickNextStudioShape(current: OrbShape): OrbShape {
  const candidates = STUDIO_SHAPES.filter((s) => s !== current);
  return candidates[Math.floor(Math.random() * candidates.length)] || 'circle';
}

export function pickNextStudioFxMode(current: OrbFxMode): OrbFxMode {
  if (current !== 'soft_fade' && Math.random() < 0.16) {
    return 'soft_fade';
  }
  const pool = STUDIO_FX_MODES.filter((m) => m !== current);
  return pool[Math.floor(Math.random() * pool.length)] || 'ripples';
}

export function traceStudioFramePath(
  ctx: CanvasRenderingContext2D,
  shape: OrbShape,
  rx: number,
  ry: number
): void {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.ellipse(0, 0, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2);
    ctx.closePath();
    return;
  }

  if (shape === 'square' || shape === 'rect_h' || shape === 'rect_v') {
    const cornerR = Math.min(18, Math.min(rx, ry) * 0.14);
    ctx.roundRect(-rx, -ry, rx * 2, ry * 2, cornerR);
    return;
  }

  const geom = getNormalizedShapeGeometry(shape);
  if (shape === 'heart') {
    const lastX = geom.x[CONTOUR_SEGMENTS - 1] * rx;
    const lastY = geom.y[CONTOUR_SEGMENTS - 1] * ry;
    const firstX = geom.x[0] * rx;
    const firstY = geom.y[0] * ry;
    ctx.moveTo((lastX + firstX) * 0.5, (lastY + firstY) * 0.5);
    for (let k = 0; k < CONTOUR_SEGMENTS; k++) {
      const next = (k + 1) % CONTOUR_SEGMENTS;
      const kx = geom.x[k] * rx;
      const ky = geom.y[k] * ry;
      const nx = geom.x[next] * rx;
      const ny = geom.y[next] * ry;
      ctx.quadraticCurveTo(kx, ky, (kx + nx) * 0.5, (ky + ny) * 0.5);
    }
    ctx.closePath();
    return;
  }

  ctx.moveTo(geom.x[0] * rx, geom.y[0] * ry);
  for (let k = 1; k < CONTOUR_SEGMENTS; k++) {
    ctx.lineTo(geom.x[k] * rx, geom.y[k] * ry);
  }
  ctx.closePath();
}

export function drawMediaCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  rx: number,
  ry: number
): void {
  const destW = rx * 2;
  const destH = ry * 2;
  if (sourceW <= 0 || sourceH <= 0 || destW <= 0 || destH <= 0) return;

  const srcAspect = sourceW / sourceH;
  const dstAspect = destW / destH;
  let sx = 0;
  let sy = 0;
  let sw = sourceW;
  let sh = sourceH;

  if (srcAspect > dstAspect) {
    sw = sourceH * dstAspect;
    sx = (sourceW - sw) * 0.5;
  } else {
    sh = sourceW / dstAspect;
    sy = (sourceH - sh) * 0.5;
  }

  ctx.drawImage(source, sx, sy, sw, sh, -rx, -ry, destW, destH);
}

const EDIT_PAD = 12;
const ROTATE_STEM = 28;

export function drawStudioEditOverlay(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number
): void {
  const bx = rx + EDIT_PAD;
  const by = ry + EDIT_PAD;

  ctx.save();
  // Crisp dashed studio selection frame
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.88)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-bx, -by, bx * 2, by * 2);
  ctx.setLineDash([]);

  // Stem to top rotation node
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -by);
  ctx.lineTo(0, -by - ROTATE_STEM);
  ctx.stroke();

  // Top rotation node
  ctx.fillStyle = '#0ea5e9';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -by - ROTATE_STEM, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4 Corner scale nodes
  const corners = [
    [-bx, -by],
    [bx, -by],
    [bx, by],
    [-bx, by],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = '#a855f7';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 4 Edge-midpoint deformation handles (pill handles on top/bottom/left/right)
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;

  const drawPill = (x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
    ctx.fill();
    ctx.stroke();
  };

  drawPill(0, -by, 20, 7);
  drawPill(0, by, 20, 7);
  drawPill(-bx, 0, 7, 20);
  drawPill(bx, 0, 7, 20);

  ctx.restore();
}

export function hitTestStudioFrame(
  px: number,
  py: number,
  frame: StudioFrameState
): StudioHitTarget | null {
  const dx = px - frame.cx;
  const dy = py - frame.cy;
  const cos = Math.cos(-frame.rotation);
  const sin = Math.sin(-frame.rotation);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;

  const { rx, ry } = getStudioShapeRadii(
    frame.shape,
    frame.baseSize,
    frame.scaleX,
    frame.scaleY
  );
  const bx = rx + EDIT_PAD;
  const by = ry + EDIT_PAD;
  const hitR = 22;

  if (frame.editMode) {
    if (Math.hypot(lx - 0, ly - (-by - ROTATE_STEM)) <= hitR) return 'rotate';

    if (Math.hypot(lx - -bx, ly - -by) <= hitR) return 'corner_tl';
    if (Math.hypot(lx - bx, ly - -by) <= hitR) return 'corner_tr';
    if (Math.hypot(lx - bx, ly - by) <= hitR) return 'corner_br';
    if (Math.hypot(lx - -bx, ly - by) <= hitR) return 'corner_bl';

    if (Math.hypot(lx - 0, ly - -by) <= hitR) return 'edge_t';
    if (Math.hypot(lx - bx, ly - 0) <= hitR) return 'edge_r';
    if (Math.hypot(lx - 0, ly - by) <= hitR) return 'edge_b';
    if (Math.hypot(lx - -bx, ly - 0) <= hitR) return 'edge_l';
  }

  if (Math.abs(lx) <= rx + 10 && Math.abs(ly) <= ry + 10) {
    return 'body';
  }

  return null;
}
