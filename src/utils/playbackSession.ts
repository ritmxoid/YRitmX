export type ActiveSourceType = 'audius' | 'url' | 'folder' | 'demo';

export interface SavedPlaybackSession {
  sourceType: ActiveSourceType;
  audiusHandle?: string;
  url?: string;
  folderId?: string;
  folderName?: string;
  trackId?: string;
  trackTitle?: string;
  trackArtist?: string;
  trackIndex: number;
  currentTime: number;
  wasPlaying: boolean;
  updatedAt?: number;
}

export interface SavedPlayerPrefs {
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  eqGains: number[];
}

const STORAGE_SESSION_KEY = 'yritmx_playback_session';
const STORAGE_PREFS_KEY = 'yritmx_player_prefs';

const DEFAULT_PREFS: SavedPlayerPrefs = {
  volume: 0.8,
  isMuted: false,
  isShuffle: false,
  isRepeat: false,
  eqGains: [0, 0, 0, 0, 0],
};

export function loadPlaybackSession(): SavedPlaybackSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedPlaybackSession>;
    if (
      parsed.sourceType !== 'audius' &&
      parsed.sourceType !== 'url' &&
      parsed.sourceType !== 'folder' &&
      parsed.sourceType !== 'demo'
    ) {
      return null;
    }
    return {
      sourceType: parsed.sourceType,
      audiusHandle: typeof parsed.audiusHandle === 'string' ? parsed.audiusHandle : undefined,
      url: typeof parsed.url === 'string' ? parsed.url : undefined,
      folderId: typeof parsed.folderId === 'string' ? parsed.folderId : undefined,
      folderName: typeof parsed.folderName === 'string' ? parsed.folderName : undefined,
      trackId: typeof parsed.trackId === 'string' ? parsed.trackId : undefined,
      trackTitle: typeof parsed.trackTitle === 'string' ? parsed.trackTitle : undefined,
      trackArtist: typeof parsed.trackArtist === 'string' ? parsed.trackArtist : undefined,
      trackIndex:
        typeof parsed.trackIndex === 'number' && Number.isFinite(parsed.trackIndex) && parsed.trackIndex >= 0
          ? Math.floor(parsed.trackIndex)
          : 0,
      currentTime:
        typeof parsed.currentTime === 'number' && Number.isFinite(parsed.currentTime) && parsed.currentTime >= 0
          ? parsed.currentTime
          : 0,
      wasPlaying: Boolean(parsed.wasPlaying),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function savePlaybackSession(session: SavedPlaybackSession): void {
  try {
    localStorage.setItem(
      STORAGE_SESSION_KEY,
      JSON.stringify({
        ...session,
        updatedAt: Date.now(),
      })
    );
  } catch {
    // ignore storage errors
  }
}

export function loadPlayerPrefs(): SavedPlayerPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS, eqGains: [...DEFAULT_PREFS.eqGains] };
    const parsed = JSON.parse(raw) as Partial<SavedPlayerPrefs>;
    const volume =
      typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
        ? Math.max(0, Math.min(1, parsed.volume))
        : DEFAULT_PREFS.volume;
    const eqGains =
      Array.isArray(parsed.eqGains) &&
      parsed.eqGains.length === 5 &&
      parsed.eqGains.every((v) => typeof v === 'number' && Number.isFinite(v))
        ? parsed.eqGains.map((v) => Math.max(-12, Math.min(12, v)))
        : [...DEFAULT_PREFS.eqGains];
    return {
      volume,
      isMuted: Boolean(parsed.isMuted),
      isShuffle: Boolean(parsed.isShuffle),
      isRepeat: Boolean(parsed.isRepeat),
      eqGains,
    };
  } catch {
    return { ...DEFAULT_PREFS, eqGains: [...DEFAULT_PREFS.eqGains] };
  }
}

export function savePlayerPrefs(prefs: SavedPlayerPrefs): void {
  try {
    localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}
