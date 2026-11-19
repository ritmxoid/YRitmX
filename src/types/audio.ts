export type MediaKind = 'audio' | 'video' | 'image';
export type RecordAspectRatio = '9:16' | '1:1' | '16:9';
export type RecordQualityPreset = '480p' | '720p' | '1080p';
export type RecordRenderMode = 'live' | 'offline';
export type StageMediaDisplayMode = 'frame' | 'backdrop';
export type FrameMotionMode = 'static' | 'floating';
export type FrameRotationTarget = 'none' | 'frame-only' | 'both' | 'media-only';
export type BackdropOverlayMode = 'visualizer' | 'orb-only' | 'clean';

export interface StageMediaItem {
  kind: 'image' | 'video';
  src: string;
  name: string;
}

export interface CustomStageMedia {
  kind: 'image' | 'video' | 'camera';
  src: string;
  name: string;
  displayMode: StageMediaDisplayMode;
  frameMotion: FrameMotionMode;
  frameRotationTarget: FrameRotationTarget;
  backdropOverlay: BackdropOverlayMode;
  soundEnabled: boolean;
  soundVolume: number;
}

export interface StageBgAudio {
  src: string;
  name: string;
  volume: number;
  enabled: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  sourceName: string;
  mediaType?: MediaKind;
  durationHint?: number;
  isObjectUrl?: boolean;
  isRadio?: boolean;
}

export interface ToastMessage {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
}

export interface PaletteConfig {
  id: number;
  name: string;
  colors: [string, string, string, string];
}

export interface VizModeConfig {
  id: number;
  label: string;
}

export interface EqPreset {
  id: string;
  label: string;
  gains: [number, number, number, number, number];
}

export type SourceTab = 'audius' | 'folder' | 'url';

export interface SavedFolderEntry {
  id: string;
  name: string;
  trackCount: number;
  addedAt: number;
  hasDirectoryHandle?: boolean;
}

export interface SavedUrlEntry {
  id: string;
  url: string;
  label: string;
  addedAt: number;
}

export interface ConfirmDeleteTarget {
  type: SourceTab;
  id: string;
  label: string;
}

export interface VisualDNA {
  seed: number;
  hueShift: number;
  dynamics: number;
  density: number;
  glow: number;
  direction: 1 | -1;
  mixLayers: number[];
}
