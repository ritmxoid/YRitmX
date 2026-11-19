import { RecordAspectRatio, RecordQualityPreset } from '../types/audio';

export interface RecordingDimensions {
  exportWidth: number;
  exportHeight: number;
  logicalWidth: number;
  logicalHeight: number;
  bitrate: number;
  offlineBitrate: number;
  offlineFps: number;
  audioBitrate: number;
}

export const RECORD_ASPECT_OPTIONS: RecordAspectRatio[] = ['9:16', '1:1', '16:9'];

export const RECORD_QUALITY_OPTIONS: Array<{
  id: RecordQualityPreset;
  shortLabel: string;
  pxValue: number;
}> = [
  { id: '480p', shortLabel: '480 px', pxValue: 480 },
  { id: '720p', shortLabel: '720 px', pxValue: 720 },
  { id: '1080p', shortLabel: '1080 px', pxValue: 1080 },
];

const BITRATE_BY_QUALITY: Record<RecordQualityPreset, number> = {
  '480p': 2_500_000,
  '720p': 5_000_000,
  '1080p': 8_500_000,
};

const OFFLINE_PRESET_BY_QUALITY: Record<
  RecordQualityPreset,
  { bitrate: number; fps: number; audioBitrate: number }
> = {
  '480p': { bitrate: 3_500_000, fps: 30, audioBitrate: 128_000 },
  '720p': { bitrate: 6_500_000, fps: 30, audioBitrate: 192_000 },
  '1080p': { bitrate: 12_000_000, fps: 60, audioBitrate: 320_000 },
};

const LOGICAL_BY_ASPECT: Record<RecordAspectRatio, { w: number; h: number }> = {
  '9:16': { w: 540, h: 960 },
  '1:1': { w: 720, h: 720 },
  '16:9': { w: 1280, h: 720 },
};

const EXPORT_DIMS: Record<RecordAspectRatio, Record<RecordQualityPreset, [number, number]>> = {
  '9:16': {
    '480p': [480, 854],
    '720p': [720, 1280],
    '1080p': [1080, 1920],
  },
  '1:1': {
    '480p': [480, 480],
    '720p': [720, 720],
    '1080p': [1080, 1080],
  },
  '16:9': {
    '480p': [854, 480],
    '720p': [1280, 720],
    '1080p': [1920, 1080],
  },
};

export function getRecordingDimensions(
  aspect: RecordAspectRatio,
  quality: RecordQualityPreset
): RecordingDimensions {
  const [exportWidth, exportHeight] = EXPORT_DIMS[aspect][quality];
  const logical = LOGICAL_BY_ASPECT[aspect];
  const offline = OFFLINE_PRESET_BY_QUALITY[quality];
  return {
    exportWidth,
    exportHeight,
    logicalWidth: logical.w,
    logicalHeight: logical.h,
    bitrate: BITRATE_BY_QUALITY[quality],
    offlineBitrate: offline.bitrate,
    offlineFps: offline.fps,
    audioBitrate: offline.audioBitrate,
  };
}
