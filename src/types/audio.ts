export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  sourceName: string;
  durationHint?: number;
  isObjectUrl?: boolean;
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
