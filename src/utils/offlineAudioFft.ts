import { EQ_BANDS } from '../constants/visualizer';

const FFT_SIZE = 512;
const BIN_COUNT = FFT_SIZE / 2; // 256 bins (matches AnalyserNode fftSize=512)
const MIN_DB = -100;
const MAX_DB = -30;
const SMOOTHING_AT_60FPS = 0.8;

/** Precomputed radix-2 Cooley-Tukey bit-reversal + twiddle tables for 512-pt real FFT. */
const BIT_REV = new Uint16Array(FFT_SIZE);
const TWIDDLE_COS = new Float32Array(FFT_SIZE / 2);
const TWIDDLE_SIN = new Float32Array(FFT_SIZE / 2);
const BLACKMAN_WIN = new Float32Array(FFT_SIZE);

(() => {
  const bits = 9; // 2^9 = 512
  for (let i = 0; i < FFT_SIZE; i++) {
    let rev = 0;
    for (let b = 0; b < bits; b++) {
      rev = (rev << 1) | ((i >> b) & 1);
    }
    BIT_REV[i] = rev;

    // Web Audio AnalyserNode uses exact Blackman window: alpha = 0.16
    const a0 = 0.42;
    const a1 = 0.5;
    const a2 = 0.08;
    const wPhase = (2 * Math.PI * i) / (FFT_SIZE - 1);
    BLACKMAN_WIN[i] = a0 - a1 * Math.cos(wPhase) + a2 * Math.cos(2 * wPhase);
  }
  for (let k = 0; k < FFT_SIZE / 2; k++) {
    const ang = (-2 * Math.PI * k) / FFT_SIZE;
    TWIDDLE_COS[k] = Math.cos(ang);
    TWIDDLE_SIN[k] = Math.sin(ang);
  }
})();

export class OfflineCorsAudioError extends Error {
  constructor(message = 'Remote audio stream is blocked by CORS for offline decoding.') {
    super(message);
    this.name = 'OfflineCorsAudioError';
  }
}

export interface PreparedAudioResult {
  buffer: AudioBuffer | null;
  durationSec: number;
  hasAudio: boolean;
}

/**
 * Decodes an audio or video file URL and renders it offline through YRitmX's
 * 5-band peaking EQ + master GainNode so exported MP4 sound matches live playback.
 */
export async function decodeAndApplyEqAudio(
  src: string,
  eqGains: number[],
  volume: number,
  isMuted: boolean,
  allowSilentFallback = false
): Promise<PreparedAudioResult> {
  if (!src) {
    return { buffer: null, durationSec: 0, hasAudio: false };
  }

  let arrayBuffer: ArrayBuffer;
  try {
    const response = await fetch(src, {
      mode: src.startsWith('blob:') || src.startsWith('data:') ? 'same-origin' : 'cors',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    arrayBuffer = await response.arrayBuffer();
  } catch (err) {
    if (allowSilentFallback) {
      return { buffer: null, durationSec: 0, hasAudio: false };
    }
    throw new OfflineCorsAudioError(
      err instanceof Error ? err.message : 'CORS or network failure fetching media.'
    );
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const decodeCtx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    await decodeCtx.close().catch(() => {});
    if (allowSilentFallback) {
      return { buffer: null, durationSec: 0, hasAudio: false };
    }
    throw err;
  }
  await decodeCtx.close().catch(() => {});

  const durationSec = decoded.duration;
  const channels = Math.max(1, Math.min(2, decoded.numberOfChannels));
  const sampleRate = decoded.sampleRate || 44100;
  const frameCount = Math.max(1, Math.ceil(durationSec * sampleRate));

  const offline = new OfflineAudioContext(channels, frameCount, sampleRate);
  const srcNode = offline.createBufferSource();
  srcNode.buffer = decoded;

  const gainNode = offline.createGain();
  gainNode.gain.value = isMuted ? 0 : Math.max(0, Math.min(1, volume));

  const filters = EQ_BANDS.map((band, idx) => {
    const filter = offline.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = band.freq;
    filter.Q.value = 1;
    filter.gain.value = eqGains[idx] ?? 0;
    return filter;
  });

  const firstNode: AudioNode = filters[0] ?? gainNode;
  srcNode.connect(firstNode);
  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }
  if (filters.length > 0) {
    filters[filters.length - 1].connect(gainNode);
  }
  gainNode.connect(offline.destination);

  srcNode.start(0);
  const rendered = await offline.startRendering();
  return {
    buffer: rendered,
    durationSec: rendered.duration,
    hasAudio: true,
  };
}

/**
 * Concatenates multiple clip AudioBuffers (or silent gaps for image/mute clips)
 * into a single continuous AudioBuffer matching playlist clip start/end offsets.
 */
export function concatenateAudioSegments(
  segments: Array<{ buffer: AudioBuffer | null; durationSec: number }>,
  sampleRate = 48000,
  channels = 2
): AudioBuffer | null {
  const hasAnyAudio = segments.some((s) => s.buffer !== null);
  if (!hasAnyAudio) return null;

  const totalSec = segments.reduce((acc, s) => acc + Math.max(0, s.durationSec), 0);
  const totalFrames = Math.max(1, Math.ceil(totalSec * sampleRate));
  const out = new AudioBuffer({
    length: totalFrames,
    numberOfChannels: channels,
    sampleRate,
  });

  let offsetFrames = 0;
  for (const seg of segments) {
    const segFrames = Math.max(1, Math.round(seg.durationSec * sampleRate));
    if (seg.buffer) {
      const buf = seg.buffer;
      const srcRate = buf.sampleRate;
      const copyCount = Math.min(segFrames, totalFrames - offsetFrames);

      for (let ch = 0; ch < channels; ch++) {
        const dstData = out.getChannelData(ch);
        const srcCh = Math.min(ch, buf.numberOfChannels - 1);
        const srcData = buf.getChannelData(srcCh);

        if (srcRate === sampleRate) {
          const available = Math.min(copyCount, srcData.length);
          if (available > 0) {
            dstData.set(srcData.subarray(0, available), offsetFrames);
          }
        } else {
          // Linear resample when video clip sample rates differ from output sample rate
          const ratio = srcRate / sampleRate;
          for (let i = 0; i < copyCount; i++) {
            const pos = i * ratio;
            const i0 = Math.floor(pos);
            if (i0 >= srcData.length) break;
            const i1 = Math.min(srcData.length - 1, i0 + 1);
            const frac = pos - i0;
            dstData[offsetFrames + i] = srcData[i0] * (1 - frac) + srcData[i1] * frac;
          }
        }
      }
    }
    offsetFrames += segFrames;
  }

  return out;
}

/**
 * Mixes a secondary AudioBuffer (e.g. from a local background video) looped
 * onto the primary soundtrack AudioBuffer with soft peak protection.
 */
export function mixLoopedOverlayAudio(
  base: AudioBuffer,
  overlay: AudioBuffer
): AudioBuffer {
  if (overlay.length <= 0) return base;
  const channels = base.numberOfChannels;
  const sampleRate = base.sampleRate;
  const totalFrames = base.length;
  const out = new AudioBuffer({
    length: totalFrames,
    numberOfChannels: channels,
    sampleRate,
  });

  const srcRate = overlay.sampleRate;
  const overlayLen = overlay.length;
  const rateRatio = srcRate / sampleRate;

  for (let ch = 0; ch < channels; ch++) {
    const baseData = base.getChannelData(ch);
    const srcCh = Math.min(ch, overlay.numberOfChannels - 1);
    const overData = overlay.getChannelData(srcCh);
    const dst = out.getChannelData(ch);

    for (let i = 0; i < totalFrames; i++) {
      let overSample: number;
      if (srcRate === sampleRate) {
        overSample = overData[i % overlayLen];
      } else {
        const pos = (i * rateRatio) % overlayLen;
        const i0 = Math.floor(pos);
        const i1 = (i0 + 1) % overlayLen;
        const frac = pos - i0;
        overSample = overData[i0] * (1 - frac) + overData[i1] * frac;
      }
      const sum = baseData[i] + overSample;
      dst[i] = Math.abs(sum) > 0.96 ? Math.tanh(sum) : sum;
    }
  }

  return out;
}

/**
 * Web Audio AnalyserNode-equivalent offline spectrum & waveform sampler.
 * Produces 256 byte frequency bins and 256 byte time-domain samples at any time `tSec`.
 */
export class OfflineAnalyserSampler {
  private readonly monoSamples: Float32Array;
  private readonly sampleRate: number;
  private readonly prevMag = new Float32Array(BIN_COUNT);
  private readonly real = new Float32Array(FFT_SIZE);
  private readonly imag = new Float32Array(FFT_SIZE);
  private readonly smoothingAlpha: number;

  constructor(buffer: AudioBuffer, fps = 30) {
    this.sampleRate = buffer.sampleRate;
    const len = buffer.length;
    const chCount = buffer.numberOfChannels;
    const mono = new Float32Array(len);

    if (chCount === 1) {
      mono.set(buffer.getChannelData(0));
    } else {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      for (let i = 0; i < len; i++) {
        mono[i] = (left[i] + right[i]) * 0.5;
      }
    }
    this.monoSamples = mono;
    // Scale temporal smoothing so 30 fps frame stepping retains exact 60 fps decay feel
    this.smoothingAlpha = Math.pow(SMOOTHING_AT_60FPS, 60 / Math.max(1, fps));
  }

  public sampleAt(timeSec: number, freqOut: Uint8Array, timeOut: Uint8Array): void {
    const centerSample = Math.floor(timeSec * this.sampleRate);
    const startSample = centerSample - FFT_SIZE;
    const samples = this.monoSamples;
    const totalLen = samples.length;

    for (let i = 0; i < FFT_SIZE; i++) {
      const idx = startSample + i;
      const sample = idx >= 0 && idx < totalLen ? samples[idx] : 0;
      const revIdx = BIT_REV[i];
      this.real[revIdx] = sample * BLACKMAN_WIN[i];
      this.imag[revIdx] = 0;

      if (i < BIN_COUNT) {
        const waveIdx = centerSample - BIN_COUNT + i;
        const wSample = waveIdx >= 0 && waveIdx < totalLen ? samples[waveIdx] : 0;
        timeOut[i] = Math.max(0, Math.min(255, Math.round(128 + wSample * 128)));
      }
    }

    // Iterative Cooley-Tukey FFT
    for (let size = 2; size <= FFT_SIZE; size <<= 1) {
      const half = size >> 1;
      const step = FFT_SIZE / size;
      for (let i = 0; i < FFT_SIZE; i += size) {
        for (let j = 0; j < half; j++) {
          const twIdx = j * step;
          const cos = TWIDDLE_COS[twIdx];
          const sin = TWIDDLE_SIN[twIdx];
          const even = i + j;
          const odd = even + half;
          const tRe = this.real[odd] * cos - this.imag[odd] * sin;
          const tIm = this.real[odd] * sin + this.imag[odd] * cos;
          this.real[odd] = this.real[even] - tRe;
          this.imag[odd] = this.imag[even] - tIm;
          this.real[even] += tRe;
          this.imag[even] += tIm;
        }
      }
    }

    const invN = 1 / FFT_SIZE;
    const dbRange = MAX_DB - MIN_DB;
    const alpha = this.smoothingAlpha;

    for (let k = 0; k < BIN_COUNT; k++) {
      const mag = Math.hypot(this.real[k], this.imag[k]) * invN;
      const smoothed = alpha * this.prevMag[k] + (1 - alpha) * mag;
      this.prevMag[k] = smoothed;
      const db = smoothed > 1e-9 ? 20 * Math.log10(smoothed) : MIN_DB;
      const norm = (db - MIN_DB) / dbRange;
      freqOut[k] = Math.max(0, Math.min(255, Math.round(norm * 255)));
    }
  }
}
