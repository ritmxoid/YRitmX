import {
  Cloud,
  Disc3,
  Download,
  Eye,
  EyeOff,
  FolderOpen,
  Globe,
  Layers,
  ListMusic,
  Maximize2,
  Menu,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
  Type,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EqualizerModal } from './components/EqualizerModal';
import { FloatingTrackOrbs } from './components/FloatingTrackOrbs';
import {
  FirstLaunchInstallModal,
  MobileMenuModal,
  MobilePlaylistModal,
  PWAInstallGuideModal,
} from './components/MobileModals';
import { PlaylistItems } from './components/PlaylistItems';
import { SourcesModal } from './components/SourcesModal';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { useFullscreen } from './hooks/useFullscreen';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  DEFAULT_COVER_IMAGE,
  EQ_BANDS,
  PALETTES,
  VIZ_MODES,
} from './constants/visualizer';
import { APP_VERSION } from './constants/version';
import {
  ConfirmDeleteTarget,
  SavedFolderEntry,
  SavedUrlEntry,
  SourceTab,
  ToastMessage,
  Track,
  VisualDNA,
} from './types/audio';
import { useI18n } from './i18n/I18nContext';
import { trackEvent } from './utils/analytics';
import { DEFAULT_AUDIUS_HANDLE, fetchAudiusProfileTracks } from './utils/audiusApi';
import { createDemoTracks } from './utils/demoAudioGenerator';
import {
  deleteDirectoryHandle,
  getDirectoryHandle,
  queryDirectoryPermission,
  readAudioFilesFromDirectoryHandle,
  saveDirectoryHandle,
} from './utils/folderHandleStore';
import { parseAudioMetadata } from './utils/id3Parser';
import {
  ActiveSourceType,
  loadPlaybackSession,
  loadPlayerPrefs,
  savePlaybackSession,
  savePlayerPrefs,
  SavedPlaybackSession,
} from './utils/playbackSession';
import { loadTracksFromUrlSource } from './utils/urlSourceParser';

const STORAGE_PROFILES_KEY = 'yritmx_profiles';
const STORAGE_HANDLE_KEY = 'yritmx_current_handle';
const STORAGE_FOLDERS_KEY = 'yritmx_saved_folders';
const STORAGE_URLS_KEY = 'yritmx_saved_urls';
const STORAGE_CAPTIONS_KEY = 'yritmx_orb_captions';
const STORAGE_ORBS_KEY = 'yritmx_show_orbs';
const STORAGE_INSTALL_PROMO_KEY = 'yritmx_install_promo_seen';

// Ambient/backdrop layers that blend cleanly behind any foreground visualizer without clutter
const AMBIENT_MIX_POOL = [0, 4, 8, 9, 10, 11, 12, 13, 16, 19, 20, 22, 24, 26];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickRandomMixLayers(primaryMode: number, count: number): number[] {
  if (count <= 0) return [];
  const candidates = AMBIENT_MIX_POOL.filter((id) => id !== primaryMode);
  const picked: number[] = [];
  while (picked.length < count && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    picked.push(candidates.splice(idx, 1)[0]);
  }
  return picked;
}

function createRandomVisualDna(primaryMode: number, mixEnabled: boolean): VisualDNA {
  let extraCount = 0;
  if (mixEnabled) {
    const roll = Math.random();
    if (roll < 0.4) {
      extraCount = 0; // Чистая одиночная тема для разнообразия
    } else if (roll < 0.75) {
      extraCount = 1; // 2 совмещённых фона
    } else {
      extraCount = 2; // 3 совмещённых фона
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

function getInitialProfiles(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
    if (raw === null) return [DEFAULT_AUDIUS_HANDLE];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => (x.toLowerCase() === 'ritmixoid' ? DEFAULT_AUDIUS_HANDLE : x));
      return Array.from(new Set(cleaned));
    }
  } catch {
    // ignore storage errors
  }
  return [DEFAULT_AUDIUS_HANDLE];
}

function getInitialHandle(): string {
  try {
    const raw = localStorage.getItem(STORAGE_HANDLE_KEY);
    if (!raw || raw.toLowerCase() === 'ritmixoid') return DEFAULT_AUDIUS_HANDLE;
    return raw;
  } catch {
    return DEFAULT_AUDIUS_HANDLE;
  }
}

interface RestoreOptions {
  trackId?: string;
  trackTitle?: string;
  trackIndex?: number;
  time?: number;
}

interface PendingFolderRestore {
  folderId: string;
  folderName: string;
  trackId?: string;
  trackTitle?: string;
  trackArtist?: string;
  trackIndex: number;
  currentTime: number;
  hasHandle: boolean;
}

function resolveRestoreTarget(
  tracks: Track[],
  restore?: RestoreOptions
): { index: number; seekTime: number } {
  if (!restore || tracks.length === 0) return { index: 0, seekTime: 0 };
  let index = -1;
  let matchedByIdentity = false;

  if (restore.trackId) {
    index = tracks.findIndex((track) => track.id === restore.trackId);
    if (index !== -1) matchedByIdentity = true;
  }
  if (index === -1 && restore.trackTitle) {
    const normalized = restore.trackTitle.trim().toLowerCase();
    index = tracks.findIndex((track) => track.title.trim().toLowerCase() === normalized);
    if (index !== -1) matchedByIdentity = true;
  }
  if (
    index === -1 &&
    typeof restore.trackIndex === 'number' &&
    Number.isFinite(restore.trackIndex) &&
    restore.trackIndex >= 0 &&
    restore.trackIndex < tracks.length
  ) {
    index = restore.trackIndex;
    matchedByIdentity = true;
  }
  if (index === -1) index = 0;

  const seekTime =
    matchedByIdentity &&
    typeof restore.time === 'number' &&
    Number.isFinite(restore.time) &&
    restore.time > 0.5
      ? restore.time
      : 0;

  return { index, seekTime };
}

export default function App() {
  const { t } = useI18n();
  const initialPrefsRef = useRef(loadPlayerPrefs());
  const initialSessionRef = useRef<SavedPlaybackSession | null>(loadPlaybackSession());
  const initialRestoreConsumedRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceCreatedRef = useRef(false);
  const objectUrlsRef = useRef<string[]>([]);
  const folderCacheRef = useRef<Map<string, Track[]>>(new Map());
  const toastIdRef = useRef(1);

  const activeSessionRef = useRef<{
    sourceType: ActiveSourceType;
    audiusHandle?: string;
    url?: string;
    folderId?: string;
    folderName?: string;
  } | null>(null);
  const pendingSeekRef = useRef<{ src: string; time: number } | null>(null);
  const lastTimeFlushRef = useRef(0);
  const playlistRef = useRef<Track[]>([]);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [awaitingAutoplayUnlock, setAwaitingAutoplayUnlock] = useState(false);
  const [pendingFolderRestore, setPendingFolderRestore] =
    useState<PendingFolderRestore | null>(null);
  const [isShuffle, setIsShuffle] = useState(() => initialPrefsRef.current.isShuffle);
  const [isRepeat, setIsRepeat] = useState(() => initialPrefsRef.current.isRepeat);
  const [volume, setVolume] = useState(() => initialPrefsRef.current.volume);
  const [isMuted, setIsMuted] = useState(() => initialPrefsRef.current.isMuted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [mixEnabled, setMixEnabled] = useState(true);
  const [vizMode, setVizMode] = useState(() => Math.floor(Math.random() * VIZ_MODES.length));
  const [paletteIndex, setPaletteIndex] = useState(() => Math.floor(Math.random() * PALETTES.length));
  const [visualDna, setVisualDna] = useState<VisualDNA>(() =>
    createRandomVisualDna(0, true)
  );
  const [autoVisualPerTrack, setAutoVisualPerTrack] = useState(true);
  const [showOrbs, setShowOrbs] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORBS_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [showOrbCaptions, setShowOrbCaptions] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CAPTIONS_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [eqGains, setEqGains] = useState<number[]>(() => initialPrefsRef.current.eqGains);
  const [uiVisible, setUiVisible] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const [savedProfiles, setSavedProfiles] = useState<string[]>(getInitialProfiles);
  const [currentHandle, setCurrentHandle] = useState<string>(getInitialHandle);

  const [savedFolders, setSavedFolders] = useState<SavedFolderEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FOLDERS_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as SavedFolderEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const [savedUrls, setSavedUrls] = useState<SavedUrlEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_URLS_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as SavedUrlEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [activeUrlId, setActiveUrlId] = useState<string | null>(null);

  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [sourcesTab, setSourcesTab] = useState<SourceTab>('audius');
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobilePlaylistOpen, setIsMobilePlaylistOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isInstallPromoOpen, setIsInstallPromoOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const {
    isNativeFullscreen,
    isStandaloneDisplay,
    toggleFullscreen,
  } = useFullscreen();

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-2), { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const revokeLocalObjectUrls = useCallback(() => {
    const cachedUrls = new Set<string>();
    folderCacheRef.current.forEach((tracks) => {
      for (const t of tracks) {
        cachedUrls.add(t.src);
        if (t.cover.startsWith('blob:')) cachedUrls.add(t.cover);
      }
    });
    for (const url of objectUrlsRef.current) {
      if (!cachedUrls.has(url)) {
        URL.revokeObjectURL(url);
      }
    }
    objectUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      folderCacheRef.current.forEach((tracks) => {
        for (const t of tracks) {
          if (t.isObjectUrl) URL.revokeObjectURL(t.src);
          if (t.cover.startsWith('blob:')) URL.revokeObjectURL(t.cover);
        }
      });
    };
  }, []);

  const ensureAudioGraph = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (!audioCtxRef.current) {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextCtor();
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 512;
      analyserNode.smoothingTimeConstant = 0.8;

      const gainNode = ctx.createGain();
      gainNode.gain.value = isMuted ? 0 : volume;

      const filters = EQ_BANDS.map((band, idx) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.freq;
        filter.Q.value = 1;
        filter.gain.value = eqGains[idx] ?? 0;
        return filter;
      });

      if (!sourceCreatedRef.current) {
        const source = ctx.createMediaElementSource(audioEl);
        let lastNode: AudioNode = source;
        for (const f of filters) {
          lastNode.connect(f);
          lastNode = f;
        }
        lastNode.connect(gainNode);
        gainNode.connect(analyserNode);
        analyserNode.connect(ctx.destination);
        sourceCreatedRef.current = true;
      }

      audioCtxRef.current = ctx;
      analyserRef.current = analyserNode;
      gainNodeRef.current = gainNode;
      filtersRef.current = filters;
      setAnalyser(analyserNode);
    }

    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
  }, [eqGains, isMuted, volume]);

  // Randomize primary mode, palette, mixed extra layers (1-2 additional backgrounds), and VisualDNA
  const randomizeVisual = useCallback(
    (overrideMix?: boolean) => {
      const useMix = overrideMix ?? mixEnabled;
      const nextMode = Math.floor(Math.random() * VIZ_MODES.length);
      setVizMode((prev) => {
        const chosen =
          nextMode === prev
            ? (prev + 1 + Math.floor(Math.random() * 5)) % VIZ_MODES.length
            : nextMode;
        setVisualDna(createRandomVisualDna(chosen, useMix));
        return chosen;
      });
      setPaletteIndex((prev) => {
        const next = Math.floor(Math.random() * PALETTES.length);
        return next === prev ? (prev + 1) % PALETTES.length : next;
      });
      trackEvent('visualizer_randomize', { mix_enabled: useMix });
    },
    [mixEnabled]
  );

  const toggleMixEnabled = useCallback(() => {
    setMixEnabled((prev) => {
      const next = !prev;
      setVisualDna((dna) => ({
        ...dna,
        mixLayers: next ? pickRandomMixLayers(vizMode, Math.random() > 0.35 ? 2 : 1) : [],
      }));
      showToast(next ? t.mixEnabledToast : t.mixDisabledToast, 'info');
      trackEvent('visualizer_mix_toggle', { enabled: next });
      return next;
    });
  }, [showToast, t.mixDisabledToast, t.mixEnabledToast, vizMode]);

  const toggleOrbs = useCallback(() => {
    setShowOrbs((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_ORBS_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      showToast(next ? t.orbsEnabledToast : t.orbsDisabledToast, 'info');
      trackEvent('orbs_visibility_toggle', { enabled: next });
      return next;
    });
  }, [showToast, t.orbsDisabledToast, t.orbsEnabledToast]);

  const toggleOrbCaptions = useCallback(() => {
    setShowOrbCaptions((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_CAPTIONS_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      showToast(next ? t.captionEnabledToast : t.captionDisabledToast, 'info');
      trackEvent('orb_captions_toggle', { enabled: next });
      return next;
    });
  }, [showToast, t.captionDisabledToast, t.captionEnabledToast]);

  const currentTrack = playlist[currentIndex] ?? null;

  const filteredPlaylist = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return playlist;
    return playlist.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }, [playlist, searchQuery]);

  // Keep live refs synced for unload/visibility session flushing
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const persistCurrentSession = useCallback(
    (overrides?: Partial<SavedPlaybackSession>) => {
      const active = activeSessionRef.current;
      if (!active && !overrides?.sourceType) return;

      const list = playlistRef.current;
      const idx = overrides?.trackIndex ?? currentIndexRef.current;
      const track = list[idx];
      const audioTime = audioRef.current?.currentTime;
      const resolvedTime =
        overrides?.currentTime ??
        (typeof audioTime === 'number' && Number.isFinite(audioTime) ? audioTime : 0);

      savePlaybackSession({
        sourceType: overrides?.sourceType ?? active!.sourceType,
        audiusHandle: overrides?.audiusHandle ?? active?.audiusHandle,
        url: overrides?.url ?? active?.url,
        folderId: overrides?.folderId ?? active?.folderId,
        folderName: overrides?.folderName ?? active?.folderName,
        trackId: overrides?.trackId ?? track?.id,
        trackTitle: overrides?.trackTitle ?? track?.title,
        trackArtist: overrides?.trackArtist ?? track?.artist,
        trackIndex: idx,
        currentTime: Math.max(0, resolvedTime),
        wasPlaying: overrides?.wasPlaying ?? isPlayingRef.current,
        updatedAt: Date.now(),
      });
    },
    []
  );

  // Flush final playback position & playing state when app hides or closes
  useEffect(() => {
    const flush = () => {
      persistCurrentSession();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [persistCurrentSession]);

  // Persist player preferences across sessions
  useEffect(() => {
    savePlayerPrefs({ volume, isMuted, isShuffle, isRepeat, eqGains });
  }, [eqGains, isMuted, isRepeat, isShuffle, volume]);

  // Sync volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync EQ bands
  useEffect(() => {
    filtersRef.current.forEach((filter, idx) => {
      filter.gain.value = eqGains[idx] ?? 0;
    });
  }, [eqGains]);

  const saveProfileToHistory = useCallback((handle: string) => {
    setSavedProfiles((prev) => {
      const exists = prev.some((p) => p.toLowerCase() === handle.toLowerCase());
      const next = exists ? prev : [...prev, handle];
      try {
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setCurrentHandle(handle);
    try {
      localStorage.setItem(STORAGE_HANDLE_KEY, handle);
    } catch {
      // ignore
    }
  }, []);

  const startPlaybackSafe = useCallback(
    async (withAudioGraph: boolean) => {
      const audioEl = audioRef.current;
      if (!audioEl) return false;
      if (withAudioGraph) {
        ensureAudioGraph();
      }
      try {
        await audioEl.play();
        setIsPlaying(true);
        setAwaitingAutoplayUnlock(false);
        return true;
      } catch {
        setIsPlaying(false);
        return false;
      }
    },
    [ensureAudioGraph]
  );

  // Unlock AudioContext & start playback on first user gesture if autoplay was blocked
  useEffect(() => {
    if (!awaitingAutoplayUnlock) return;
    const unlock = (ev: Event) => {
      const target = ev.target as HTMLElement | null;
      if (target?.closest('[data-play-toggle="true"]')) {
        return;
      }
      ensureAudioGraph();
      if (audioRef.current && audioRef.current.src) {
        void audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setAwaitingAutoplayUnlock(false);
            persistCurrentSession({
              currentTime: audioRef.current?.currentTime ?? 0,
              wasPlaying: true,
            });
          })
          .catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [awaitingAutoplayUnlock, ensureAudioGraph, persistCurrentSession]);

  // Attach FFT analyser on first interaction if autoplay succeeded automatically
  useEffect(() => {
    if (!isPlaying || analyser) return;
    const connectGraph = () => {
      ensureAudioGraph();
    };
    window.addEventListener('pointerdown', connectGraph, { once: true });
    window.addEventListener('keydown', connectGraph, { once: true });
    return () => {
      window.removeEventListener('pointerdown', connectGraph);
      window.removeEventListener('keydown', connectGraph);
    };
  }, [analyser, ensureAudioGraph, isPlaying]);

  const loadAudiusTracks = useCallback(
    async (
      handle: string,
      options?: {
        closeModal?: boolean;
        autoPlay?: boolean;
        isInitial?: boolean;
        restore?: RestoreOptions;
      }
    ) => {
      setIsLoadingTracks(true);
      setLoadError(null);
      pendingSeekRef.current = null;
      try {
        const { tracks, resolvedHandle } = await fetchAudiusProfileTracks(handle);
        revokeLocalObjectUrls();

        const { index, seekTime } = resolveRestoreTarget(tracks, options?.restore);
        const targetTrack = tracks[index];

        playlistRef.current = tracks;
        currentIndexRef.current = index;
        setPendingFolderRestore(null);
        setPlaylist(tracks);
        setCurrentIndex(index);
        setCurrentTime(seekTime);
        setDuration(targetTrack?.durationHint ?? 0);
        setActiveFolderId(null);
        setActiveUrlId(null);

        activeSessionRef.current = {
          sourceType: 'audius',
          audiusHandle: resolvedHandle,
        };
        initialRestoreConsumedRef.current = true;

        if (autoVisualPerTrack) {
          randomizeVisual();
        }

        if (audioRef.current && targetTrack) {
          audioRef.current.pause();
          if (seekTime > 0) {
            pendingSeekRef.current = { src: targetTrack.src, time: seekTime };
          }
          audioRef.current.src = targetTrack.src;
        }

        saveProfileToHistory(resolvedHandle);
        trackEvent('source_audius_load', {
          handle: resolvedHandle,
          track_count: tracks.length,
          is_initial: Boolean(options?.isInitial),
        });
        if (options?.closeModal) setIsSourcesOpen(false);

        let started = false;
        if (options?.autoPlay) {
          started = await startPlaybackSafe(!options.isInitial);
          if (started) {
            if (!options.isInitial) {
              showToast(t.audiusPlayingToast(resolvedHandle, tracks.length), 'success');
            }
          } else {
            setAwaitingAutoplayUnlock(true);
            if (!options.isInitial) {
              showToast(t.audiusLoadedToast(resolvedHandle, tracks.length), 'success');
            }
          }
        } else if (!options?.isInitial) {
          showToast(t.audiusLoadedToast(resolvedHandle, tracks.length), 'success');
        }

        persistCurrentSession({
          sourceType: 'audius',
          audiusHandle: resolvedHandle,
          trackId: targetTrack?.id,
          trackTitle: targetTrack?.title,
          trackArtist: targetTrack?.artist,
          trackIndex: index,
          currentTime: seekTime,
          wasPlaying: started,
        });
      } catch (err) {
        if (options?.isInitial && typeof navigator !== 'undefined' && !navigator.onLine) {
          setLoadError(null);
        } else {
          const msg = err instanceof Error ? err.message : t.audiusErrorFallback;
          setLoadError(msg);
          showToast(msg, 'error');
        }
      } finally {
        setIsLoadingTracks(false);
      }
    },
    [
      autoVisualPerTrack,
      persistCurrentSession,
      randomizeVisual,
      revokeLocalObjectUrls,
      saveProfileToHistory,
      showToast,
      startPlaybackSafe,
      t,
    ]
  );

  const handleTriggerDemo = useCallback(
    async (options?: {
      autoPlay?: boolean;
      isInitial?: boolean;
      restore?: RestoreOptions;
    }) => {
      try {
        if (!options?.isInitial) {
          ensureAudioGraph();
        }
        setIsLoadingTracks(true);
        setLoadError(null);
        pendingSeekRef.current = null;

        const demoTracks = await createDemoTracks();
        revokeLocalObjectUrls();

        const { index, seekTime } = resolveRestoreTarget(demoTracks, options?.restore);
        const targetTrack = demoTracks[index];

        playlistRef.current = demoTracks;
        currentIndexRef.current = index;
        setPendingFolderRestore(null);
        setPlaylist(demoTracks);
        setCurrentIndex(index);
        setCurrentTime(seekTime);
        setDuration(targetTrack?.durationHint ?? 24);
        setActiveFolderId(null);
        setActiveUrlId(null);

        activeSessionRef.current = { sourceType: 'demo' };
        initialRestoreConsumedRef.current = true;

        if (autoVisualPerTrack) {
          randomizeVisual();
        }

        let started = false;
        const shouldPlay = options?.autoPlay ?? true;
        if (audioRef.current && targetTrack) {
          if (seekTime > 0) {
            pendingSeekRef.current = { src: targetTrack.src, time: seekTime };
          }
          audioRef.current.src = targetTrack.src;
          if (shouldPlay) {
            started = await startPlaybackSafe(!options?.isInitial);
            if (!started) {
              setAwaitingAutoplayUnlock(true);
            }
          }
        }

        persistCurrentSession({
          sourceType: 'demo',
          trackId: targetTrack?.id,
          trackTitle: targetTrack?.title,
          trackArtist: targetTrack?.artist,
          trackIndex: index,
          currentTime: seekTime,
          wasPlaying: started,
        });

        trackEvent('source_demo_start', { track_count: demoTracks.length });
        if (!options?.isInitial) {
          showToast(t.demoStartedToast, 'success');
        }
      } catch {
        showToast(t.demoFailedToast, 'error');
      } finally {
        setIsLoadingTracks(false);
      }
    },
    [
      autoVisualPerTrack,
      ensureAudioGraph,
      persistCurrentSession,
      randomizeVisual,
      revokeLocalObjectUrls,
      showToast,
      startPlaybackSafe,
      t,
    ]
  );

  const loadParsedAudioFiles = useCallback(
    async (
      files: File[],
      folderId: string,
      folderName: string,
      options?: {
        saveHandle?: FileSystemDirectoryHandle;
        restore?: RestoreOptions;
        closeModal?: boolean;
        autoPlay?: boolean;
        isInitial?: boolean;
        toastType?: 'loaded' | 'opened';
      }
    ) => {
      const sortedFiles = [...files].sort((a, b) => {
        const relA = (a.webkitRelativePath || a.name).toLowerCase();
        const relB = (b.webkitRelativePath || b.name).toLowerCase();
        return relA.localeCompare(relB);
      });

      setIsParsingFiles(true);
      pendingSeekRef.current = null;
      try {
        const parsedTracks: Track[] = [];
        const newObjectUrls: string[] = [];

        for (let i = 0; i < sortedFiles.length; i++) {
          const file = sortedFiles[i];
          const audioUrl = URL.createObjectURL(file);
          newObjectUrls.push(audioUrl);
          const tags = await parseAudioMetadata(file);
          if (tags.coverUrl) newObjectUrls.push(tags.coverUrl);

          parsedTracks.push({
            id: `local-${folderId}-${i}-${file.name}-${file.size}`,
            title: tags.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: tags.artist || folderName,
            cover: tags.coverUrl || DEFAULT_COVER_IMAGE,
            src: audioUrl,
            sourceName: `${t.folderPrefix}: ${folderName}`,
            isObjectUrl: true,
          });
        }

        if (options?.saveHandle) {
          await saveDirectoryHandle(folderId, options.saveHandle);
        }

        objectUrlsRef.current.push(...newObjectUrls);
        folderCacheRef.current.set(folderId, parsedTracks);

        const entry: SavedFolderEntry = {
          id: folderId,
          name: folderName,
          trackCount: parsedTracks.length,
          addedAt: Date.now(),
          hasDirectoryHandle: Boolean(options?.saveHandle),
        };

        setSavedFolders((prev) => {
          const existing = prev.find((f) => f.id === folderId || f.name === folderName);
          const mergedEntry: SavedFolderEntry = {
            ...entry,
            hasDirectoryHandle:
              Boolean(options?.saveHandle) || Boolean(existing?.hasDirectoryHandle),
          };
          const filtered = prev.filter((f) => f.id !== folderId && f.name !== folderName);
          const next = [mergedEntry, ...filtered];
          try {
            localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });

        const { index, seekTime } = resolveRestoreTarget(parsedTracks, options?.restore);
        const targetTrack = parsedTracks[index];

        playlistRef.current = parsedTracks;
        currentIndexRef.current = index;
        setPendingFolderRestore(null);
        setPlaylist(parsedTracks);
        setCurrentIndex(index);
        setCurrentTime(seekTime);
        setDuration(0);
        setLoadError(null);
        setActiveFolderId(folderId);
        setActiveUrlId(null);
        if (options?.closeModal !== false) {
          setIsSourcesOpen(false);
        }

        activeSessionRef.current = {
          sourceType: 'folder',
          folderId,
          folderName,
        };
        initialRestoreConsumedRef.current = true;

        if (autoVisualPerTrack) {
          randomizeVisual();
        }

        let started = false;
        const shouldPlay = options?.autoPlay ?? true;
        if (audioRef.current && targetTrack) {
          if (seekTime > 0) {
            pendingSeekRef.current = { src: targetTrack.src, time: seekTime };
          }
          audioRef.current.src = targetTrack.src;
          if (shouldPlay) {
            started = await startPlaybackSafe(!options?.isInitial);
            if (!started) {
              setAwaitingAutoplayUnlock(true);
            }
          }
        }

        persistCurrentSession({
          sourceType: 'folder',
          folderId,
          folderName,
          trackId: targetTrack?.id,
          trackTitle: targetTrack?.title,
          trackArtist: targetTrack?.artist,
          trackIndex: index,
          currentTime: seekTime,
          wasPlaying: started,
        });

        trackEvent('source_folder_load', {
          folder_name: folderName,
          track_count: parsedTracks.length,
        });
        if (!options?.isInitial) {
          showToast(
            options?.toastType === 'opened'
              ? t.folderOpenedToast(folderName)
              : t.folderLoadedToast(folderName, parsedTracks.length),
            'success'
          );
        }
      } finally {
        setIsParsingFiles(false);
      }
    },
    [autoVisualPerTrack, persistCurrentSession, randomizeVisual, showToast, startPlaybackSafe, t]
  );

  const handleSelectDirectoryPicker = useCallback(async () => {
    const pickerFn = (
      window as unknown as {
        showDirectoryPicker?: (opts?: {
          mode?: 'read' | 'readwrite';
        }) => Promise<FileSystemDirectoryHandle>;
      }
    ).showDirectoryPicker;
    if (!pickerFn) return;

    try {
      const dirHandle = await pickerFn({ mode: 'read' });
      const files = await readAudioFilesFromDirectoryHandle(dirHandle);
      if (files.length === 0) {
        showToast(t.noAudioInFolderToast, 'error');
        return;
      }

      const folderName = dirHandle.name || t.localFilesLabel;
      const folderId = `folder-${hashString(folderName + '-' + files.length)}`;
      const matchingPending =
        pendingFolderRestore &&
        (pendingFolderRestore.folderId === folderId ||
          pendingFolderRestore.folderName === folderName)
          ? {
              trackId: pendingFolderRestore.trackId,
              trackTitle: pendingFolderRestore.trackTitle,
              trackIndex: pendingFolderRestore.trackIndex,
              time: pendingFolderRestore.currentTime,
            }
          : undefined;

      await loadParsedAudioFiles(files, folderId, folderName, {
        saveHandle: dirHandle,
        restore: matchingPending,
        closeModal: true,
        autoPlay: true,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      showToast(t.noAudioInFolderToast, 'error');
    }
  }, [loadParsedAudioFiles, pendingFolderRestore, showToast, t]);

  const handleSelectFolderInputFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).filter(
        (f) => f.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(f.name)
      );

      if (files.length === 0) {
        showToast(t.noAudioInFolderToast, 'error');
        return;
      }

      const firstRel = files[0]?.webkitRelativePath;
      const folderName = firstRel ? firstRel.split('/')[0] : t.localFilesLabel;
      const folderId = `folder-${hashString(folderName + '-' + files.length)}`;
      const matchingPending =
        pendingFolderRestore &&
        (pendingFolderRestore.folderId === folderId ||
          pendingFolderRestore.folderName === folderName)
          ? {
              trackId: pendingFolderRestore.trackId,
              trackTitle: pendingFolderRestore.trackTitle,
              trackIndex: pendingFolderRestore.trackIndex,
              time: pendingFolderRestore.currentTime,
            }
          : undefined;

      await loadParsedAudioFiles(files, folderId, folderName, {
        restore: matchingPending,
        closeModal: true,
        autoPlay: true,
      });
    },
    [loadParsedAudioFiles, pendingFolderRestore, showToast, t]
  );

  const handleSelectSavedFolder = useCallback(
    async (folder: SavedFolderEntry) => {
      const matchingPending =
        pendingFolderRestore &&
        (pendingFolderRestore.folderId === folder.id ||
          pendingFolderRestore.folderName === folder.name)
          ? {
              trackId: pendingFolderRestore.trackId,
              trackTitle: pendingFolderRestore.trackTitle,
              trackIndex: pendingFolderRestore.trackIndex,
              time: pendingFolderRestore.currentTime,
            }
          : undefined;

      const cached = folderCacheRef.current.get(folder.id);
      if (cached && cached.length > 0) {
        const { index, seekTime } = resolveRestoreTarget(cached, matchingPending);
        const targetTrack = cached[index];

        pendingSeekRef.current = null;
        playlistRef.current = cached;
        currentIndexRef.current = index;
        setPendingFolderRestore(null);
        setPlaylist(cached);
        setCurrentIndex(index);
        setCurrentTime(seekTime);
        setDuration(0);
        setActiveFolderId(folder.id);
        setActiveUrlId(null);
        setIsSourcesOpen(false);
        activeSessionRef.current = {
          sourceType: 'folder',
          folderId: folder.id,
          folderName: folder.name,
        };
        initialRestoreConsumedRef.current = true;

        if (autoVisualPerTrack) randomizeVisual();
        let started = false;
        if (audioRef.current && targetTrack) {
          if (seekTime > 0) {
            pendingSeekRef.current = { src: targetTrack.src, time: seekTime };
          }
          audioRef.current.src = targetTrack.src;
          started = await startPlaybackSafe(true);
        }
        persistCurrentSession({
          sourceType: 'folder',
          folderId: folder.id,
          folderName: folder.name,
          trackId: targetTrack?.id,
          trackTitle: targetTrack?.title,
          trackArtist: targetTrack?.artist,
          trackIndex: index,
          currentTime: seekTime,
          wasPlaying: started,
        });
        showToast(t.folderOpenedToast(folder.name), 'success');
        return;
      }

      const dirHandle = await getDirectoryHandle(folder.id);
      if (dirHandle) {
        const files = await readAudioFilesFromDirectoryHandle(dirHandle);
        if (files.length > 0) {
          await loadParsedAudioFiles(files, folder.id, folder.name, {
            saveHandle: dirHandle,
            restore: matchingPending,
            closeModal: true,
            autoPlay: true,
            toastType: 'opened',
          });
          return;
        }
      }

      showToast(t.reselectFolderToast(folder.name), 'info');
    },
    [
      autoVisualPerTrack,
      loadParsedAudioFiles,
      pendingFolderRestore,
      persistCurrentSession,
      randomizeVisual,
      showToast,
      startPlaybackSafe,
      t,
    ]
  );

  const handleLoadUrlSource = useCallback(
    async (
      rawUrl: string,
      options?: {
        autoPlay?: boolean;
        isInitial?: boolean;
        restore?: RestoreOptions;
      }
    ) => {
      setIsLoadingUrl(true);
      setLoadError(null);
      pendingSeekRef.current = null;
      try {
        const { tracks, label, normalizedUrl } = await loadTracksFromUrlSource(rawUrl);
        revokeLocalObjectUrls();

        const urlId = `url-${hashString(normalizedUrl)}`;
        const entry: SavedUrlEntry = {
          id: urlId,
          url: normalizedUrl,
          label,
          addedAt: Date.now(),
        };

        setSavedUrls((prev) => {
          const filtered = prev.filter((u) => u.id !== urlId && u.url !== normalizedUrl);
          const next = [entry, ...filtered];
          try {
            localStorage.setItem(STORAGE_URLS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });

        const { index, seekTime } = resolveRestoreTarget(tracks, options?.restore);
        const targetTrack = tracks[index];

        playlistRef.current = tracks;
        currentIndexRef.current = index;
        setPendingFolderRestore(null);
        setPlaylist(tracks);
        setCurrentIndex(index);
        setCurrentTime(seekTime);
        setDuration(targetTrack?.durationHint ?? 0);
        setActiveUrlId(urlId);
        setActiveFolderId(null);
        if (!options?.isInitial) {
          setIsSourcesOpen(false);
        }

        activeSessionRef.current = {
          sourceType: 'url',
          url: normalizedUrl,
        };
        initialRestoreConsumedRef.current = true;

        if (autoVisualPerTrack) {
          randomizeVisual();
        }

        let started = false;
        const shouldPlay = options?.autoPlay ?? true;
        if (audioRef.current && targetTrack) {
          if (seekTime > 0) {
            pendingSeekRef.current = { src: targetTrack.src, time: seekTime };
          }
          audioRef.current.src = targetTrack.src;
          if (shouldPlay) {
            started = await startPlaybackSafe(!options?.isInitial);
            if (!started) {
              setAwaitingAutoplayUnlock(true);
            }
          }
        }

        persistCurrentSession({
          sourceType: 'url',
          url: normalizedUrl,
          trackId: targetTrack?.id,
          trackTitle: targetTrack?.title,
          trackArtist: targetTrack?.artist,
          trackIndex: index,
          currentTime: seekTime,
          wasPlaying: started,
        });

        trackEvent('source_url_load', {
          label,
          track_count: tracks.length,
        });
        if (!options?.isInitial) {
          showToast(t.urlLoadedToast(tracks.length), 'success');
        }
      } catch (err) {
        if (options?.isInitial && typeof navigator !== 'undefined' && !navigator.onLine) {
          setLoadError(null);
        } else {
          const msg = err instanceof Error ? err.message : t.urlErrorFallback;
          if (options?.isInitial) setLoadError(msg);
          showToast(msg, 'error');
        }
      } finally {
        setIsLoadingUrl(false);
        if (options?.isInitial) {
          setIsLoadingTracks(false);
        }
      }
    },
    [
      autoVisualPerTrack,
      persistCurrentSession,
      randomizeVisual,
      revokeLocalObjectUrls,
      showToast,
      startPlaybackSafe,
      t,
    ]
  );

  // Track browser online/offline transitions smoothly
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Restore last active playlist/source, exact track, and playback position on startup
  useEffect(() => {
    const session = initialSessionRef.current;
    const restore: RestoreOptions | undefined = session
      ? {
          trackId: session.trackId,
          trackTitle: session.trackTitle,
          trackIndex: session.trackIndex,
          time: session.currentTime,
        }
      : undefined;
    const online = typeof navigator === 'undefined' ? true : navigator.onLine;

    if (session?.sourceType === 'demo') {
      setIsLoadingTracks(true);
      void handleTriggerDemo({
        isInitial: true,
        autoPlay: session.wasPlaying !== false,
        restore,
      });
      return;
    }

    if (session?.sourceType === 'folder' && session.folderId) {
      const folderId = session.folderId;
      const folderName = session.folderName || t.localFilesLabel;
      setIsLoadingTracks(true);
      void (async () => {
        try {
          const dirHandle = await getDirectoryHandle(folderId);
          if (dirHandle) {
            const perm = await queryDirectoryPermission(dirHandle);
            if (perm === 'granted') {
              const files = await readAudioFilesFromDirectoryHandle(dirHandle);
              if (files.length > 0) {
                await loadParsedAudioFiles(files, folderId, folderName, {
                  saveHandle: dirHandle,
                  restore,
                  closeModal: false,
                  autoPlay: session.wasPlaying !== false,
                  isInitial: true,
                  toastType: 'opened',
                });
                return;
              }
            }
          }
          setPendingFolderRestore({
            folderId,
            folderName,
            trackId: session.trackId,
            trackTitle: session.trackTitle,
            trackArtist: session.trackArtist,
            trackIndex: session.trackIndex ?? 0,
            currentTime: session.currentTime ?? 0,
            hasHandle: Boolean(dirHandle),
          });
          initialRestoreConsumedRef.current = true;
        } catch {
          setPendingFolderRestore({
            folderId,
            folderName,
            trackId: session.trackId,
            trackTitle: session.trackTitle,
            trackArtist: session.trackArtist,
            trackIndex: session.trackIndex ?? 0,
            currentTime: session.currentTime ?? 0,
            hasHandle: false,
          });
          initialRestoreConsumedRef.current = true;
        } finally {
          setIsLoadingTracks(false);
        }
      })();
      return;
    }

    if (session?.sourceType === 'url' && session.url) {
      if (!online) {
        setIsLoadingTracks(false);
        setLoadError(null);
        return;
      }
      setIsLoadingTracks(true);
      void handleLoadUrlSource(session.url, {
        isInitial: true,
        autoPlay: session.wasPlaying !== false,
        restore,
      });
      return;
    }

    if (!online) {
      setIsLoadingTracks(false);
      setLoadError(null);
      return;
    }

    const targetHandle =
      session?.sourceType === 'audius' && session.audiusHandle
        ? session.audiusHandle
        : currentHandle || DEFAULT_AUDIUS_HANDLE;

    void loadAudiusTracks(targetHandle, {
      autoPlay: session ? session.wasPlaying !== false : true,
      isInitial: true,
      restore,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry online restore when connection returns if initial startup happened offline
  useEffect(() => {
    if (
      isOnline &&
      playlist.length === 0 &&
      !isLoadingTracks &&
      !pendingFolderRestore &&
      !initialRestoreConsumedRef.current
    ) {
      const session = initialSessionRef.current;
      const restore: RestoreOptions | undefined = session
        ? {
            trackId: session.trackId,
            trackTitle: session.trackTitle,
            trackIndex: session.trackIndex,
            time: session.currentTime,
          }
        : undefined;

      if (session?.sourceType === 'url' && session.url) {
        void handleLoadUrlSource(session.url, {
          isInitial: true,
          autoPlay: session.wasPlaying !== false,
          restore,
        });
      } else if (!session || session.sourceType === 'audius') {
        const targetHandle = session?.audiusHandle || currentHandle || DEFAULT_AUDIUS_HANDLE;
        void loadAudiusTracks(targetHandle, {
          autoPlay: false,
          isInitial: true,
          restore,
        });
      }
    }
  }, [
    currentHandle,
    handleLoadUrlSource,
    isLoadingTracks,
    isOnline,
    loadAudiusTracks,
    pendingFolderRestore,
    playlist.length,
  ]);

  const handleConfirmDelete = useCallback(
    (target: ConfirmDeleteTarget) => {
      trackEvent('source_delete', { source_type: target.type });
      if (target.type === 'audius') {
        setSavedProfiles((prev) => {
          const next = prev.filter((p) => p !== target.id);
          try {
            localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        showToast(t.profileRemovedToast(target.label), 'info');
      } else if (target.type === 'folder') {
        folderCacheRef.current.delete(target.id);
        void deleteDirectoryHandle(target.id);
        setSavedFolders((prev) => {
          const next = prev.filter((f) => f.id !== target.id);
          try {
            localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        if (activeFolderId === target.id) setActiveFolderId(null);
        showToast(t.folderRemovedToast(target.label), 'info');
      } else if (target.type === 'url') {
        setSavedUrls((prev) => {
          const next = prev.filter((u) => u.id !== target.id);
          try {
            localStorage.setItem(STORAGE_URLS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        if (activeUrlId === target.id) setActiveUrlId(null);
        showToast(t.urlRemovedToast(target.label), 'info');
      }
    },
    [activeFolderId, activeUrlId, showToast, t]
  );

  const selectTrack = useCallback(
    async (index: number, autoPlay = true) => {
      if (index < 0 || index >= playlist.length) return;
      const track = playlist[index];
      pendingSeekRef.current = null;
      currentIndexRef.current = index;
      setCurrentIndex(index);
      setCurrentTime(0);
      setDuration(track.durationHint ?? 0);
      trackEvent('track_select', {
        track_title: track.title,
        artist: track.artist,
        index,
      });

      if (autoVisualPerTrack) {
        randomizeVisual();
      }

      const audioEl = audioRef.current;
      if (!audioEl) return;
      audioEl.src = track.src;

      let started = false;
      if (autoPlay) {
        started = await startPlaybackSafe(true);
        if (!started) {
          showToast(t.pressPlayToast, 'info');
        }
      }

      persistCurrentSession({
        trackId: track.id,
        trackTitle: track.title,
        trackArtist: track.artist,
        trackIndex: index,
        currentTime: 0,
        wasPlaying: started,
      });
    },
    [
      autoVisualPerTrack,
      persistCurrentSession,
      playlist,
      randomizeVisual,
      showToast,
      startPlaybackSafe,
      t,
    ]
  );

  const togglePlay = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (playlist.length === 0) {
      await handleTriggerDemo();
      return;
    }

    ensureAudioGraph();

    if (isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
      persistCurrentSession({
        currentTime: audioEl.currentTime,
        wasPlaying: false,
      });
      trackEvent('audio_pause', {
        track_title: currentTrack?.title,
        artist: currentTrack?.artist,
      });
    } else {
      if (!audioEl.src && currentTrack) {
        audioEl.src = currentTrack.src;
      }
      const started = await startPlaybackSafe(true);
      if (started) {
        persistCurrentSession({
          currentTime: audioEl.currentTime,
          wasPlaying: true,
        });
        trackEvent('audio_play', {
          track_title: currentTrack?.title,
          artist: currentTrack?.artist,
        });
      } else {
        showToast(t.streamFailedToast, 'error');
      }
    }
  }, [
    currentTrack,
    ensureAudioGraph,
    handleTriggerDemo,
    isPlaying,
    persistCurrentSession,
    playlist.length,
    showToast,
    startPlaybackSafe,
    t,
  ]);

  const nextTrack = useCallback(
    (forceAutoPlay?: boolean) => {
      if (playlist.length === 0) return;
      trackEvent('track_next', { shuffle: isShuffle });
      const nextIdx = isShuffle
        ? Math.floor(Math.random() * playlist.length)
        : (currentIndex + 1) % playlist.length;
      void selectTrack(nextIdx, forceAutoPlay ?? isPlaying);
    },
    [currentIndex, isPlaying, isShuffle, playlist.length, selectTrack]
  );

  const prevTrack = useCallback(() => {
    if (playlist.length === 0) return;
    trackEvent('track_prev');
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    void selectTrack(prevIdx, isPlaying);
  }, [currentIndex, isPlaying, playlist.length, selectTrack]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        void togglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay]);

  const handleSeek = (clientX: number, rect: DOMRect) => {
    const audioEl = audioRef.current;
    if (!audioEl || !Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
    pendingSeekRef.current = null;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioEl.currentTime = ratio * audioEl.duration;
    setCurrentTime(audioEl.currentTime);
    persistCurrentSession({ currentTime: audioEl.currentTime });
    trackEvent('audio_seek', { progress_pct: Math.round(ratio * 100) });
  };

  // Auto-enter Floating Track Orbs mode after 10 seconds of inactivity while playing
  useEffect(() => {
    const anyModalOpen =
      isSourcesOpen ||
      isEqOpen ||
      isMobileMenuOpen ||
      isMobilePlaylistOpen ||
      isInstallGuideOpen ||
      isInstallPromoOpen;

    if (!isPlaying || !uiVisible || anyModalOpen) {
      return;
    }

    let timeoutId = 0;
    let lastMoveReset = 0;

    const armTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setUiVisible(false);
        trackEvent('zen_mode_toggle', { zen_enabled: true, trigger: 'auto' });
      }, 10000);
    };

    const handleActivity = () => {
      armTimer();
    };

    const handlePointerMove = () => {
      const now = performance.now();
      if (now - lastMoveReset > 350) {
        lastMoveReset = now;
        armTimer();
      }
    };

    armTimer();
    window.addEventListener('pointerdown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('wheel', handleActivity, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('wheel', handleActivity);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [
    isEqOpen,
    isInstallGuideOpen,
    isInstallPromoOpen,
    isMobileMenuOpen,
    isMobilePlaylistOpen,
    isPlaying,
    isSourcesOpen,
    uiVisible,
  ]);

  // Show mystical install promo modal once on first launch when not already installed
  useEffect(() => {
    if (isInstalled || isStandaloneDisplay) {
      setIsInstallPromoOpen(false);
      return;
    }
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(STORAGE_INSTALL_PROMO_KEY) === 'true';
    } catch {
      alreadySeen = false;
    }
    if (alreadySeen) return;

    const timerId = window.setTimeout(() => {
      setIsInstallPromoOpen(true);
      trackEvent('pwa_promo_shown');
    }, 700);
    return () => window.clearTimeout(timerId);
  }, [isInstalled, isStandaloneDisplay]);

  const dismissInstallPromo = useCallback(() => {
    setIsInstallPromoOpen(false);
    try {
      localStorage.setItem(STORAGE_INSTALL_PROMO_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const openSources = useCallback((tab: SourceTab) => {
    setSourcesTab(tab);
    setIsSourcesOpen(true);
    trackEvent('modal_open', { modal: 'sources', tab });
  }, []);

  const handleResumePendingFolder = useCallback(async () => {
    if (!pendingFolderRestore) return;
    const { folderId, folderName, trackId, trackTitle, trackIndex, currentTime: savedTime } =
      pendingFolderRestore;
    try {
      const dirHandle = await getDirectoryHandle(folderId);
      if (dirHandle) {
        const files = await readAudioFilesFromDirectoryHandle(dirHandle);
        if (files.length > 0) {
          await loadParsedAudioFiles(files, folderId, folderName, {
            saveHandle: dirHandle,
            restore: {
              trackId,
              trackTitle,
              trackIndex,
              time: savedTime,
            },
            closeModal: true,
            autoPlay: true,
            toastType: 'opened',
          });
          return;
        }
      }
    } catch {
      // fallback to manual folder re-selection modal below
    }
    openSources('folder');
    showToast(t.reselectFolderToast(folderName), 'info');
  }, [loadParsedAudioFiles, openSources, pendingFolderRestore, showToast, t]);

  const handleInstallApp = useCallback(async () => {
    if (isInstalled) {
      showToast(t.alreadyInstalledToast, 'info');
      return;
    }
    const outcome = await promptInstall();
    trackEvent('pwa_install_attempt', { outcome });
    if (outcome === 'accepted') {
      showToast(t.installedSuccessToast, 'success');
    } else if (outcome === 'manual') {
      setIsInstallGuideOpen(true);
    }
  }, [isInstalled, promptInstall, showToast, t]);

  const handleToggleFullscreen = useCallback(async () => {
    const outcome = await toggleFullscreen();
    trackEvent('fullscreen_toggle', { outcome });
    if (outcome === 'ios-guide') {
      setIsInstallGuideOpen(true);
    } else if (outcome === 'unsupported') {
      showToast(t.otherInstallIntro, 'info');
    }
  }, [showToast, t.otherInstallIntro, toggleFullscreen]);

  const handleStageBackgroundClick = (e: MouseEvent<HTMLElement>) => {
    if (
      isSourcesOpen ||
      isEqOpen ||
      isMobileMenuOpen ||
      isMobilePlaylistOpen ||
      isInstallGuideOpen ||
      isInstallPromoOpen
    ) {
      return;
    }
    const target = e.target as HTMLElement;
    if (
      target.closest(
        'header, footer, button, a, input, select, textarea, [role="slider"], [data-no-zen-toggle="true"]'
      )
    ) {
      return;
    }
    setUiVisible((v) => {
      const nextVisible = !v;
      trackEvent('zen_mode_toggle', { zen_enabled: !nextVisible, trigger: 'stage_click' });
      return nextVisible;
    });
  };

  return (
    <div
      data-app-version={APP_VERSION}
      onClick={handleStageBackgroundClick}
      className="min-h-[100dvh] bg-[#0a0a0c] text-gray-100 flex flex-col justify-between relative overflow-x-hidden"
    >
      {/* FULL-SCREEN MULTI-LAYER REACTIVE CANVAS VISUALIZER */}
      <VisualizerCanvas
        analyser={analyser}
        isPlaying={isPlaying}
        vizMode={vizMode}
        paletteIndex={paletteIndex}
        visualDna={visualDna}
        isZenMode={!uiVisible}
      />

      {/* ZEN MODE: FLOATING CIRCULAR TRACK ORBS (2-5 ORBS) */}
      {!uiVisible && showOrbs && (
        <FloatingTrackOrbs
          tracks={playlist}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          analyser={analyser}
          showCaptions={showOrbCaptions}
          isLayeredBackground={mixEnabled && visualDna.mixLayers.length > 0}
          onSelectTrack={(idx) => void selectTrack(idx, true)}
          onTogglePlay={() => void togglePlay()}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`px-4 py-2.5 rounded-2xl glass text-xs font-semibold shadow-xl border transition-opacity duration-200 ${
              t.type === 'error'
                ? 'border-red-500/40 text-red-200'
                : t.type === 'success'
                ? 'border-emerald-500/40 text-emerald-200'
                : 'border-purple-500/40 text-purple-200'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* TOP HEADER */}
      <header
        className={`relative z-20 w-full glass border-b border-white/10 px-4 sm:px-6 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 sm:py-3 [@media(max-height:540px)_and_(orientation:landscape)]:py-1.5 flex items-center justify-between gap-3 sm:gap-4 transition-opacity duration-300 ${
          uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#090D0B] border border-lime-400/20 flex items-center justify-center shadow-lg shadow-lime-950/30 shrink-0 overflow-hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
              className="w-full h-full"
            >
              <rect width="64" height="64" rx="16" fill="#090D0B" />
              <rect x="13" y="22" width="7" height="22" rx="3.5" fill="#A3E635" />
              <rect x="24" y="13" width="7" height="38" rx="3.5" fill="#84CC16" />
              <rect x="35" y="19" width="7" height="26" rx="3.5" fill="#BEF264" />
              <rect x="46" y="27" width="7" height="16" rx="3.5" fill="#4D7C0F" />
              <circle cx="49.5" cy="18.5" r="3.5" fill="#A3E635" />
            </svg>
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="flex items-center">
              <span className="sr-only">YRitmX</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="16 8 342 84"
                aria-hidden="true"
                className="h-6 sm:h-7 w-auto block"
              >
                <path
                  fill="#68e524"
                  d="M21 26h10.5L43 55.5L54.5 26H65L41.5 88H31l7-18.5L21 26z"
                />
                <path
                  fill="#ffffff"
                  d="M78 26h9.5v8.5C90.5 28.5 95.5 25 102.5 25c8.5 0 13.5 5.5 13.5 15v7h-9.5v-6c0-4.5-2.5-7-6.5-7-4.5 0-8 3-8 8.5V76H78V26z"
                />
                <circle fill="#ffffff" cx="148" cy="11" r="6" />
                <path
                  fill="#ffffff"
                  d="M132 26h21v41h13v9h-36v-9h13V35h-11v-9z"
                />
                <path
                  fill="#ffffff"
                  d="M191 14h10v12h14v9h-14v41h-10V35h-12v-9h12V14z"
                />
                <path
                  fill="#ffffff"
                  d="M230 26h9v6.5c2.5-4.5 6.5-7.5 12-7.5 5.5 0 9.5 2.5 11.5 7.5 3-5 7.5-7.5 13-7.5 8 0 12.5 5.5 12.5 15v36h-9V41.5c0-5-2-7.5-6-7.5-4 0-6.5 3-6.5 8V76h-9V41.5c0-5-2-7.5-6-7.5-4 0-6.5 3-6.5 8V76h-9V26z"
                />
                <path
                  fill="#b2ed11"
                  d="M300 26h11.5l11.5 17.5L334.5 26H346l-17 24.5L355 88h-11.5l-20.5-30.5L310.5 76H299l18-25.5L300 26z"
                />
              </svg>
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium whitespace-nowrap [@media(max-height:540px)_and_(orientation:landscape)]:hidden sm:block mt-0.5">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* DESKTOP + MENU CONTROLS */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={toggleOrbs}
              title={t.orbsBtnTitle}
              aria-pressed={showOrbs}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                showOrbs
                  ? 'bg-emerald-600/25 text-emerald-200 border-emerald-400/50 shadow-sm shadow-emerald-950/40'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5" />
              <span>{t.orbsBtn}</span>
            </button>

            <button
              type="button"
              onClick={toggleOrbCaptions}
              title={t.captionBtnTitle}
              aria-pressed={showOrbCaptions}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                showOrbCaptions
                  ? 'bg-emerald-600/25 text-emerald-200 border-emerald-400/50 shadow-sm shadow-emerald-950/40'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{t.captionBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => openSources('folder')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.folderBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => openSources('audius')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{t.audiusBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => openSources('url')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.urlBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEqOpen(true);
                trackEvent('modal_open', { modal: 'equalizer' });
              }}
              aria-label={t.eqLabel}
              title={t.eqLabel}
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={() => void handleInstallApp()}
                aria-label={t.installAppBtn}
                title={t.installAppBtn}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600/20 text-purple-200 border border-purple-500/35 hover:bg-purple-600/30 transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.installBtn}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setUiVisible((v) => {
                  const next = !v;
                  trackEvent('zen_mode_toggle', { zen_enabled: !next, trigger: 'button' });
                  return next;
                })
              }
              aria-label={t.zenLabel}
              title={t.zenTitle}
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
            >
              {uiVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {!isStandaloneDisplay && (
            <button
              type="button"
              onClick={() => void handleToggleFullscreen()}
              aria-label={isNativeFullscreen ? t.fullscreenExitLabel : t.fullscreenEnterLabel}
              title={isNativeFullscreen ? t.fullscreenExitLabel : t.fullscreenEnterLabel}
              className={`p-2.5 rounded-xl glass transition cursor-pointer ${
                isNativeFullscreen
                  ? 'text-purple-300 bg-purple-600/20 border-purple-500/40'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {isNativeFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(true);
              trackEvent('modal_open', { modal: 'menu' });
            }}
            aria-label={t.openMenuLabel}
            title={t.menuTitle}
            className="p-2.5 rounded-xl glass text-gray-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-3 lg:px-6 lg:py-4 [@media(max-height:540px)_and_(orientation:landscape)]:py-1.5 grid grid-cols-1 md:grid-cols-12 landscape:grid-cols-12 gap-4 lg:gap-6 items-center cursor-pointer select-none">
        {/* LEFT/CENTER: CLICKABLE ALBUM ART (Hidden when Zen Floating Orbs take over) */}
        <section
          className={`md:col-span-6 lg:col-span-7 landscape:col-span-6 lg:landscape:col-span-7 flex flex-col items-center justify-center text-center py-2 lg:py-4 [@media(max-height:540px)_and_(orientation:landscape)]:py-0 transition-all duration-300 ${
            uiVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={() => openSources(!isOnline && playlist.length === 0 ? 'folder' : 'audius')}
            aria-label={t.coverAriaLabel}
            className="relative group w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 [@media(max-height:540px)_and_(orientation:landscape)]:w-36 [@media(max-height:540px)_and_(orientation:landscape)]:h-36 [@media(min-height:541px)_and_(max-height:700px)_and_(orientation:landscape)]:w-48 [@media(min-height:541px)_and_(max-height:700px)_and_(orientation:landscape)]:h-48 rounded-3xl overflow-hidden glass shadow-2xl shadow-purple-950/50 border border-white/10 transition-transform duration-300 hover:scale-[1.02] cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <img
              src={currentTrack?.cover || DEFAULT_COVER_IMAGE}
              alt={currentTrack?.title || 'YRitmX'}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = '1';
                  img.src = DEFAULT_COVER_IMAGE;
                }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/55 backdrop-blur-md text-[11px] font-medium text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
              {t.changeSourceBadge}
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-[11px] font-medium text-purple-300 mb-1 truncate">
                {currentTrack?.sourceName ||
                  (pendingFolderRestore
                    ? `${t.folderPrefix}: ${pendingFolderRestore.folderName}`
                    : !isOnline
                    ? t.offlineCoverSubtitle
                    : `Audius: @${currentHandle}`)}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {currentTrack?.title ||
                  pendingFolderRestore?.trackTitle ||
                  (isLoadingTracks
                    ? t.loadingRitmXoid
                    : !isOnline
                    ? t.chooseDeviceFolderBtn
                    : t.chooseTrack)}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 truncate">
                {currentTrack?.artist ||
                  pendingFolderRestore?.trackArtist ||
                  'YRitmX Audio Engine'}
              </p>
            </div>
          </button>

          {pendingFolderRestore && !currentTrack && uiVisible && (
            <button
              type="button"
              onClick={() => void handleResumePendingFolder()}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/45 border border-purple-400/50 text-xs font-semibold text-purple-100 shadow-lg shadow-purple-950/40 transition flex items-center gap-2 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{t.resumeFolderBtn(pendingFolderRestore.folderName)}</span>
            </button>
          )}

          {awaitingAutoplayUnlock && currentTrack && !isPlaying && uiVisible && (
            <button
              type="button"
              data-play-toggle="true"
              onClick={() => void togglePlay()}
              className="mt-3 px-4 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/40 text-xs font-semibold text-purple-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {t.unlockAudioPrefix} ({currentTrack.title})
              </span>
            </button>
          )}

          {/* DESKTOP VISUALIZATION & MIX CONTROLS */}
          <div className="hidden lg:flex flex-wrap items-center justify-center gap-2 mt-4 xl:mt-6 [@media(max-height:660px)]:mt-3">
            <div
              data-no-zen-toggle="true"
              className="glass px-3 py-2 rounded-xl flex items-center gap-2 cursor-default"
            >
              <label htmlFor="desktop-viz-select" className="text-xs text-gray-400 whitespace-nowrap">
                {t.visualLabel}
              </label>
              <select
                id="desktop-viz-select"
                value={vizMode}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  setVizMode(id);
                  trackEvent('visualizer_mode_change', {
                    mode_id: id,
                    mode_label: VIZ_MODES[id]?.label,
                  });
                }}
                className="bg-transparent text-xs text-purple-300 font-semibold focus:outline-none cursor-pointer max-w-[190px]"
              >
                {VIZ_MODES.map((m) => (
                  <option key={m.id} value={m.id} className="bg-gray-900 text-gray-100">
                    {t.vizModes[m.id] ?? m.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              data-no-zen-toggle="true"
              className="glass px-3 py-2 rounded-xl flex items-center gap-2 cursor-default"
            >
              <label htmlFor="desktop-palette-select" className="text-xs text-gray-400 whitespace-nowrap">
                {t.paletteLabel}
              </label>
              <select
                id="desktop-palette-select"
                value={paletteIndex}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  setPaletteIndex(id);
                  trackEvent('visualizer_palette_change', {
                    palette_id: id,
                    palette_name: PALETTES[id]?.name,
                  });
                }}
                className="bg-transparent text-xs text-purple-300 font-semibold focus:outline-none cursor-pointer"
              >
                {PALETTES.map((p) => (
                  <option key={p.id} value={p.id} className="bg-gray-900 text-gray-100">
                    {t.palettes[p.id] ?? p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => randomizeVisual()}
              title={t.newLookTitle}
              className="px-3 py-2 rounded-xl glass text-xs font-medium text-gray-200 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.newLookBtn}</span>
            </button>

            <button
              type="button"
              onClick={toggleMixEnabled}
              title={t.mixLayersTitle}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                mixEnabled
                  ? 'bg-sky-600/20 border-sky-500/35 text-sky-200'
                  : 'glass border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.mixLayersBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !autoVisualPerTrack;
                setAutoVisualPerTrack(next);
                showToast(next ? t.autoBgOnToast : t.autoBgOffToast, 'info');
                trackEvent('visualizer_auto_toggle', { enabled: next });
              }}
              title={t.autoBgTitle}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                autoVisualPerTrack
                  ? 'bg-purple-600/20 border-purple-500/35 text-purple-200'
                  : 'glass border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.autoBgBtn}</span>
            </button>
          </div>
        </section>

        {/* RIGHT: DESKTOP & LANDSCAPE PLAYLIST PANEL */}
        {uiVisible && (
          <section
            data-no-zen-toggle="true"
            className="hidden md:flex landscape:flex md:col-span-6 lg:col-span-5 landscape:col-span-6 lg:landscape:col-span-5 flex-col glass rounded-3xl p-4 sm:p-5 h-[360px] lg:h-[400px] xl:h-[450px] max-h-[58vh] [@media(max-height:540px)_and_(orientation:landscape)]:h-[205px] [@media(max-height:540px)_and_(orientation:landscape)]:p-3 border border-white/10 cursor-default"
          >
            <div className="flex items-center justify-between gap-3 pb-2.5 sm:pb-3 border-b border-white/10 mb-2.5 sm:mb-3">
              <div className="flex items-center gap-2 shrink-0">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-sm text-white">
                  {t.playlistTitle} (<span className="font-mono tabular-nums">{playlist.length}</span>)
                </h3>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchAriaLabel}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-purple-500 w-32 sm:w-44"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
              <PlaylistItems
                tracks={playlist}
                filteredTracks={filteredPlaylist}
                currentTrackId={currentTrack?.id}
                isPlaying={isPlaying}
                isLoading={isLoadingTracks}
                isOffline={!isOnline}
                errorMessage={loadError}
                onSelectTrack={(idx) => void selectTrack(idx, true)}
                onTriggerDemo={() => void handleTriggerDemo()}
                onOpenFolderSource={() => openSources('folder')}
              />
            </div>
          </section>
        )}
      </main>

      {/* BOTTOM FIXED CONTROLLER */}
      <footer
        className={`relative z-20 w-full glass border-t border-white/10 px-4 sm:px-6 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:py-3 [@media(max-height:540px)_and_(orientation:landscape)]:py-1.5 transition-opacity duration-300 ${
          uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-2 sm:gap-2.5 [@media(max-height:540px)_and_(orientation:landscape)]:gap-1">
          {/* PROGRESS BAR */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 w-10 text-right font-mono tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div
              role="slider"
              tabIndex={0}
              aria-label={t.playbackSliderLabel}
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration)}
              aria-valuenow={Math.floor(currentTime)}
              onClick={(e) => handleSeek(e.clientX, e.currentTarget.getBoundingClientRect())}
              onKeyDown={(e) => {
                const audioEl = audioRef.current;
                if (!audioEl || !duration) return;
                if (e.key === 'ArrowRight') {
                  pendingSeekRef.current = null;
                  audioEl.currentTime = Math.min(duration, audioEl.currentTime + 5);
                  setCurrentTime(audioEl.currentTime);
                  persistCurrentSession({ currentTime: audioEl.currentTime });
                } else if (e.key === 'ArrowLeft') {
                  pendingSeekRef.current = null;
                  audioEl.currentTime = Math.max(0, audioEl.currentTime - 5);
                  setCurrentTime(audioEl.currentTime);
                  persistCurrentSession({ currentTime: audioEl.currentTime });
                }
              }}
              className="flex-1 relative group cursor-pointer py-2 focus-visible:outline-none"
            >
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-[width] duration-100"
                />
              </div>
            </div>
            <span className="text-[11px] text-gray-400 w-10 font-mono tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* PLAYBACK CONTROLS & VOLUME */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEqOpen(true);
                  trackEvent('modal_open', { modal: 'equalizer' });
                }}
                aria-label={t.eqLabel}
                className="p-2.5 rounded-xl bg-white/5 text-purple-300 cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobilePlaylistOpen(true);
                  trackEvent('modal_open', { modal: 'playlist' });
                }}
                aria-label={t.openPlaylistLabel}
                className="px-2.5 py-2 rounded-xl bg-white/5 text-purple-300 flex md:hidden landscape:hidden items-center gap-1.5 cursor-pointer"
              >
                <ListMusic className="w-4 h-4" />
                <span className="text-[11px] font-mono tabular-nums">{playlist.length}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mx-auto lg:mx-0">
              <button
                type="button"
                onClick={() => {
                  const next = !isShuffle;
                  setIsShuffle(next);
                  showToast(next ? t.shuffleOnToast : t.shuffleOffToast, 'info');
                  trackEvent('toggle_shuffle', { enabled: next });
                }}
                aria-label={t.shuffleLabel}
                title={t.shuffleLabel}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  isShuffle ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={prevTrack}
                aria-label={t.prevTrackLabel}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 transition cursor-pointer"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                data-play-toggle="true"
                onClick={() => void togglePlay()}
                aria-label={isPlaying ? t.pauseLabel : t.playLabel}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/50 hover:scale-105 transition cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => nextTrack()}
                aria-label={t.nextTrackLabel}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 transition cursor-pointer"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !isRepeat;
                  setIsRepeat(next);
                  showToast(next ? t.repeatOnToast : t.repeatOffToast, 'info');
                  trackEvent('toggle_repeat', { enabled: next });
                }}
                aria-label={t.repeatLabel}
                title={t.repeatLabel}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  isRepeat ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setIsMuted((m) => {
                    const next = !m;
                    trackEvent('toggle_mute', { muted: next });
                    return next;
                  })
                }
                aria-label={isMuted ? t.unmuteLabel : t.muteLabel}
                className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                aria-label={t.volumeLabel}
                onChange={(e) => {
                  const next = parseFloat(e.target.value);
                  setVolume(next);
                  if (next > 0 && isMuted) setIsMuted(false);
                }}
                className="w-24 h-1.5 bg-white/10 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      </footer>

      {/* HIDDEN HTML5 AUDIO ELEMENT */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setCurrentTime(el.currentTime);
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setDuration(el.duration);
          }
          const now = Date.now();
          if (now - lastTimeFlushRef.current >= 2000) {
            lastTimeFlushRef.current = now;
            persistCurrentSession({ currentTime: el.currentTime });
          }
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setDuration(el.duration);
          }
          const pending = pendingSeekRef.current;
          if (
            pending &&
            (el.src === pending.src || el.currentSrc === pending.src || !pending.src)
          ) {
            pendingSeekRef.current = null;
            const maxTarget =
              Number.isFinite(el.duration) && el.duration > 1 ? el.duration - 0.5 : pending.time;
            const targetTime = Math.max(0, Math.min(pending.time, maxTarget));
            if (targetTime > 0) {
              try {
                el.currentTime = targetTime;
                setCurrentTime(targetTime);
              } catch {
                // ignore seek failures on non-seekable streams
              }
            }
          }
        }}
        onEnded={() => {
          trackEvent('track_complete', {
            track_title: currentTrack?.title,
            repeat: isRepeat,
          });
          if (isRepeat && audioRef.current) {
            audioRef.current.currentTime = 0;
            void audioRef.current.play();
          } else {
            nextTrack(true);
          }
        }}
        onError={() => {
          if (playlist.length === 0) return;
          pendingSeekRef.current = null;
          setIsPlaying(false);
          trackEvent('stream_error', { track_title: currentTrack?.title });
          showToast(t.streamErrorToast, 'error');
        }}
      />

      {/* UNIFIED SOURCES MODAL */}
      <SourcesModal
        isOpen={isSourcesOpen}
        activeTab={sourcesTab}
        onTabChange={setSourcesTab}
        onClose={() => setIsSourcesOpen(false)}
        savedProfiles={savedProfiles}
        currentHandle={currentHandle}
        isLoadingAudius={isLoadingTracks}
        onLoadAudiusProfile={(h) =>
          void loadAudiusTracks(h, { closeModal: true, autoPlay: true })
        }
        savedFolders={savedFolders}
        activeFolderId={activeFolderId}
        isParsingFiles={isParsingFiles}
        onSelectFolderInputFiles={(files) => void handleSelectFolderInputFiles(files)}
        onSelectDirectoryPicker={() => void handleSelectDirectoryPicker()}
        onSelectSavedFolder={(folder) => void handleSelectSavedFolder(folder)}
        savedUrls={savedUrls}
        activeUrlId={activeUrlId}
        isLoadingUrl={isLoadingUrl}
        onLoadUrlSource={(u) => void handleLoadUrlSource(u)}
        onSelectSavedUrl={(entry) => void handleLoadUrlSource(entry.url)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* EQUALIZER MODAL */}
      <EqualizerModal
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        gains={eqGains}
        onGainChange={(idx, val) =>
          setEqGains((prev) => prev.map((g, i) => (i === idx ? val : g)))
        }
        onApplyPreset={(gains) => setEqGains(gains)}
      />

      {/* MOBILE DRAWERS */}
      <MobileMenuModal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        vizMode={vizMode}
        paletteIndex={paletteIndex}
        autoVisualPerTrack={autoVisualPerTrack}
        mixEnabled={mixEnabled}
        showOrbs={showOrbs}
        showOrbCaptions={showOrbCaptions}
        isAppInstalled={isInstalled}
        isFullscreen={isNativeFullscreen}
        onChangeVizMode={(id) => {
          setVizMode(id);
          trackEvent('visualizer_mode_change', {
            mode_id: id,
            mode_label: VIZ_MODES[id]?.label,
          });
        }}
        onChangePalette={(id) => {
          setPaletteIndex(id);
          trackEvent('visualizer_palette_change', {
            palette_id: id,
            palette_name: PALETTES[id]?.name,
          });
        }}
        onToggleAutoVisual={() =>
          setAutoVisualPerTrack((v) => {
            const next = !v;
            trackEvent('visualizer_auto_toggle', { enabled: next });
            return next;
          })
        }
        onToggleMix={toggleMixEnabled}
        onToggleOrbs={toggleOrbs}
        onToggleOrbCaptions={toggleOrbCaptions}
        onOpenSources={(tab) => openSources(tab)}
        onOpenEqualizer={() => {
          setIsEqOpen(true);
          trackEvent('modal_open', { modal: 'equalizer' });
        }}
        onToggleUI={() => {
          setUiVisible(false);
          trackEvent('zen_mode_toggle', { zen_enabled: true, trigger: 'menu' });
        }}
        onToggleFullscreen={() => void handleToggleFullscreen()}
        onInstallApp={() => void handleInstallApp()}
      />

      <PWAInstallGuideModal
        isOpen={isInstallGuideOpen}
        isIOS={isIOS}
        onClose={() => setIsInstallGuideOpen(false)}
      />

      <FirstLaunchInstallModal
        isOpen={isInstallPromoOpen && !isInstalled && !isStandaloneDisplay}
        onInstall={() => {
          dismissInstallPromo();
          void handleInstallApp();
        }}
        onDismiss={dismissInstallPromo}
      />

      <MobilePlaylistModal
        isOpen={isMobilePlaylistOpen}
        onClose={() => setIsMobilePlaylistOpen(false)}
        tracks={playlist}
        filteredTracks={filteredPlaylist}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentTrackId={currentTrack?.id}
        isPlaying={isPlaying}
        isLoading={isLoadingTracks}
        isOffline={!isOnline}
        errorMessage={loadError}
        onSelectTrack={(idx) => void selectTrack(idx, true)}
        onTriggerDemo={() => void handleTriggerDemo()}
        onOpenFolderSource={() => openSources('folder')}
      />
    </div>
  );
}
