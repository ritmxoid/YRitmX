import {
  Cloud,
  Disc3,
  Download,
  Eye,
  EyeOff,
  Film,
  FolderOpen,
  Globe,
  HelpCircle,
  ImagePlus,
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
  Square,
  Type,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { DragEvent, MouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EqualizerModal } from './components/EqualizerModal';
import { FloatingTrackOrbs } from './components/FloatingTrackOrbs';
import { HelpModal } from './components/HelpModal';
import {
  FirstLaunchInstallModal,
  MobileMenuModal,
  MobilePlaylistModal,
  PWAInstallGuideModal,
} from './components/MobileModals';
import { PlaylistItems } from './components/PlaylistItems';
import { PlaylistSortControls } from './components/PlaylistSortControls';
import { SourcesModal } from './components/SourcesModal';
import { StageMediaModal } from './components/StageMediaModal';
import { StudioRecordBar } from './components/StudioRecordBar';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { useFullscreen } from './hooks/useFullscreen';
import { usePWAInstall } from './hooks/usePWAInstall';
import { getRecordingDimensions } from './constants/recording';
import {
  CAROUSEL_INTERVAL_OPTIONS,
  createRandomVisualDna,
  DEFAULT_COVER_IMAGE,
  EQ_BANDS,
  PALETTES,
  pickRandomMixLayers,
  VIZ_CAROUSEL_MODE_ID,
  VIZ_MODES,
} from './constants/visualizer';
import { APP_VERSION } from './constants/version';
import {
  BackdropOverlayMode,
  ConfirmDeleteTarget,
  CustomStageMedia,
  FrameMotionMode,
  FrameRotationTarget,
  MediaKind,
  PlaylistSortField,
  PlaylistSortMode,
  RecordAspectRatio,
  RecordQualityPreset,
  RecordRenderMode,
  SavedFolderEntry,
  SavedUrlEntry,
  SourceTab,
  StageBgAudio,
  StageMediaDisplayMode,
  StageMediaItem,
  ToastMessage,
  Track,
  VisualDNA,
} from './types/audio';
import { useI18n } from './i18n/I18nContext';
import { getCloudMessages } from './i18n/cloudMessages';
import { getHelpMessages } from './i18n/helpMessages';
import { getStudioMessages } from './i18n/studioMessages';
import { trackEvent } from './utils/analytics';
import {
  CloudUserInfo,
  deleteCloudSourceItem,
  fetchCloudMediaSources,
  fetchTrackPlayerPlays,
  incrementTrackPlayerPlay,
  isValidTrackStatId,
  registerWithEmailCloud,
  saveCloudMediaSources,
  sendPasswordResetCloud,
  signInWithEmailCloud,
  signInWithGoogleCloud,
  signOutCloud,
  subscribeCloudAuth,
  toAudiusDocId,
  toFolderDocId,
  toUrlDocId,
} from './utils/firebaseCloud';
import {
  exportStudioVideoOffline,
  isExportAbortError,
  OfflineCorsAudioError,
  OfflineExportStage,
  resolveOfflineVideoCapability,
  safeFixMp4,
} from './utils/offlineVideoExporter';
import { LiveOrbSnapshot, StudioFrameState } from './utils/studioFrameRenderer';
import {
  DEFAULT_AUDIUS_HANDLE,
  fetchAudiusProfileTracks,
  formatPlayCount,
  getDefaultAudiusHandleForBrowser,
  getDefaultAudiusProfilesForBrowser,
  INTERNATIONAL_AUDIUS_HANDLE,
} from './utils/audiusApi';
import { createDemoTracks } from './utils/demoAudioGenerator';
import {
  deleteDirectoryHandle,
  deleteFolderFiles,
  getDirectoryHandle,
  getFolderFiles,
  getSavedFoldersMeta,
  queryDirectoryPermission,
  readAudioFilesFromDirectoryHandle,
  saveDirectoryHandle,
  saveFolderFiles,
  saveSavedFoldersMeta,
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
import {
  extractShortRadioName,
  findDefaultFmStationByUrl,
  getDefaultFmStationsForLang,
  getFmStationLabel,
  isNationalFmUrlForOtherLang,
} from './constants/radioStations';

const STORAGE_PROFILES_KEY = 'yritmx_profiles';
const STORAGE_HANDLE_KEY = 'yritmx_current_handle';
const STORAGE_FOLDERS_KEY = 'yritmx_saved_folders';
const STORAGE_URLS_KEY = 'yritmx_saved_urls';
const STORAGE_DEFAULT_FM_SEEDED_KEY = 'yritmx_default_fm_v2';
const STORAGE_CAPTIONS_KEY = 'yritmx_orb_captions';
const STORAGE_ORBS_KEY = 'yritmx_show_orbs';
const STORAGE_INSTALL_PROMO_KEY = 'yritmx_install_promo_seen';
const STORAGE_RECORD_RENDER_MODE_KEY = 'yritmx_record_render_mode';
const STORAGE_CAROUSEL_MODE_KEY = 'yritmx_carousel_mode';
const STORAGE_CAROUSEL_INTERVAL_KEY = 'yritmx_carousel_interval_sec';
const STORAGE_MANUAL_AUDIUS_KEY = 'yritmx_manual_audius';
const STORAGE_DEFAULT_AUDIUS_BOTH_SEEDED_KEY = 'yritmx_audius_both_v1';
const STORAGE_DELETED_AUDIUS_DEFAULTS_KEY = 'yritmx_deleted_audius_defaults';
const IMAGE_SLIDE_DURATION_SEC = 5;

function shuffleTracksArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sortTracksByMode(items: Track[], mode: PlaylistSortMode): Track[] {
  if (mode === 'random') {
    return shuffleTracksArray(items);
  }
  const copy = [...items];
  copy.sort((a, b) => {
    if (mode === 'date-desc' || mode === 'date-asc') {
      const aDate = a.publishedAt ?? 0;
      const bDate = b.publishedAt ?? 0;
      if (aDate !== bDate) {
        return mode === 'date-desc' ? bDate - aDate : aDate - bDate;
      }
      const aPop = a.playCount ?? 0;
      const bPop = b.playCount ?? 0;
      return bPop - aPop;
    }

    const aPop = a.playCount ?? 0;
    const bPop = b.playCount ?? 0;
    if (aPop !== bPop) {
      return mode === 'popular-desc' ? bPop - aPop : aPop - bPop;
    }
    return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
  });
  return copy;
}

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

function isManualAudiusSelection(): boolean {
  try {
    return localStorage.getItem(STORAGE_MANUAL_AUDIUS_KEY) === '1';
  } catch {
    return false;
  }
}

function getDeletedDefaultAudiusHandles(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_AUDIUS_DEFAULTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim().toLowerCase())
    );
  } catch {
    return new Set();
  }
}

function setDeletedDefaultAudiusHandles(handles: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_DELETED_AUDIUS_DEFAULTS_KEY, JSON.stringify(Array.from(handles)));
  } catch {
    // ignore
  }
}

function isDefaultAudiusHandle(handle: string): boolean {
  const lower = handle.trim().toLowerCase();
  return (
    lower === DEFAULT_AUDIUS_HANDLE.toLowerCase() ||
    lower === INTERNATIONAL_AUDIUS_HANDLE.toLowerCase()
  );
}

function getInitialProfiles(): string[] {
  const orderedDefaults = getDefaultAudiusProfilesForBrowser();
  const deletedDefaults = getDeletedDefaultAudiusHandles();
  const activeDefaults = orderedDefaults.filter((h) => !deletedDefaults.has(h.toLowerCase()));

  try {
    const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
    const bothSeeded = localStorage.getItem(STORAGE_DEFAULT_AUDIUS_BOTH_SEEDED_KEY) === '1';
    if (raw === null) {
      try {
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(activeDefaults));
        localStorage.setItem(STORAGE_DEFAULT_AUDIUS_BOTH_SEEDED_KEY, '1');
      } catch {
        // ignore
      }
      return activeDefaults;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      let cleaned = parsed
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => (x.toLowerCase() === 'ritmixoid' ? DEFAULT_AUDIUS_HANDLE : x));

      if (!isManualAudiusSelection()) {
        cleaned = cleaned.filter((x) => x.toLowerCase() !== 'nowellasarah');
      }

      if (!bothSeeded) {
        for (const defHandle of activeDefaults) {
          if (!cleaned.some((x) => x.toLowerCase() === defHandle.toLowerCase())) {
            cleaned = [...cleaned, defHandle];
          }
        }
        if (!isManualAudiusSelection()) {
          const primary = orderedDefaults[0];
          if (!deletedDefaults.has(primary.toLowerCase())) {
            cleaned = [
              primary,
              ...cleaned.filter((x) => x.toLowerCase() !== primary.toLowerCase()),
            ];
          }
        }
      }

      const deduped: string[] = [];
      const seenLower = new Set<string>();
      for (const item of cleaned) {
        const lower = item.toLowerCase();
        if (!seenLower.has(lower)) {
          seenLower.add(lower);
          deduped.push(item);
        }
      }

      try {
        localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(deduped));
        localStorage.setItem(STORAGE_DEFAULT_AUDIUS_BOTH_SEEDED_KEY, '1');
      } catch {
        // ignore
      }
      return deduped;
    }
  } catch {
    // ignore storage errors
  }
  return activeDefaults;
}

function getInitialHandle(): string {
  const orderedDefaults = getDefaultAudiusProfilesForBrowser();
  const deletedDefaults = getDeletedDefaultAudiusHandles();
  const browserDefault =
    orderedDefaults.find((h) => !deletedDefaults.has(h.toLowerCase())) ?? orderedDefaults[0];
  try {
    const raw = localStorage.getItem(STORAGE_HANDLE_KEY);
    if (!raw) return browserDefault;
    const normalized = raw.toLowerCase() === 'ritmixoid' ? DEFAULT_AUDIUS_HANDLE : raw;
    if (
      !isManualAudiusSelection() &&
      (normalized.toLowerCase() === 'ritmxoid' ||
        normalized.toLowerCase() === 'nowellasarah' ||
        normalized.toLowerCase() === 'estelladawnmusic')
    ) {
      return browserDefault;
    }
    return normalized;
  } catch {
    return browserDefault;
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
  const { t, lang } = useI18n();
  const studioT = useMemo(() => getStudioMessages(lang), [lang]);
  const helpT = useMemo(() => getHelpMessages(lang), [lang]);
  const cloudT = useMemo(() => getCloudMessages(lang), [lang]);
  const initialPrefsRef = useRef(loadPlayerPrefs());
  const initialSessionRef = useRef<SavedPlaybackSession | null>(loadPlaybackSession());
  const initialRestoreConsumedRef = useRef(false);

  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const customBgVideoRef = useRef<HTMLVideoElement | null>(null);
  const stageBgAudioRef = useRef<HTMLAudioElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const customBgInputRef = useRef<HTMLInputElement | null>(null);
  const reselectFolderInputRef = useRef<HTMLInputElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const customBgGainRef = useRef<GainNode | null>(null);
  const stageBgAudioGainRef = useRef<GainNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const micHighpassRef = useRef<BiquadFilterNode | null>(null);
  const recLimiterRef = useRef<DynamicsCompressorNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraFacingRef = useRef<'user' | 'environment'>('user');
  const firstFilterOrGainRef = useRef<AudioNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceCreatedRef = useRef(false);
  const videoSourceCreatedRef = useRef(false);
  const customBgSourceCreatedRef = useRef(false);
  const stageBgAudioSourceCreatedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingStartPerfRef = useRef(0);
  const liveOrbsSnapshotRef = useRef<LiveOrbSnapshot[]>([]);
  const studioFrameStateRef = useRef<StudioFrameState | null>(null);
  const offlineAbortRef = useRef<AbortController | null>(null);
  const playHoldTimerRef = useRef(0);
  const playHoldTriggeredRef = useRef(false);
  const fmHoldTimerRef = useRef(0);
  const fmHoldTriggeredRef = useRef(false);
  const coverSwipeStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
    triggered: boolean;
  } | null>(null);
  const coverSwipeHandledRef = useRef(false);
  const coverSwipeResetTimerRef = useRef(0);
  const stageSwipeStartRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
    triggered: boolean;
  } | null>(null);
  const stageSwipeHandledRef = useRef(false);
  const stageSwipeResetTimerRef = useRef(0);
  const isRecordingRef = useRef(false);
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
  const isRecordArmedRef = useRef(false);
  const isStudioModeRef = useRef(false);
  const imageElapsedRef = useRef(0);
  const usingDirectAudioFallbackRef = useRef(false);
  const playbackIntentRef = useRef(false);
  const proxyAttemptedKeyRef = useRef('');
  const fallbackAttemptedKeyRef = useRef('');
  const httpsUpgradeAttemptedKeyRef = useRef('');
  const mirrorRetriesRef = useRef(0);
  const lastFmIndexRef = useRef(-1);
  const lastFmLangRef = useRef(lang);
  const prevLangRef = useRef(lang);
  const fmFlyoutSeqRef = useRef(0);
  const fmFlyoutTimerRef = useRef(0);
  const internalPauseIgnoreUntilRef = useRef(0);
  const lastResumeAttemptRef = useRef(0);
  const lastRadioSrcRef = useRef('');
  const lastRadioMetaWakeRef = useRef(0);
  const audiusBasePlaysRef = useRef<Map<string, number>>(new Map());
  const playerPlaysCacheRef = useRef<Map<string, number>>(new Map());
  const listenTrackerRef = useRef<{
    trackId: string;
    passId: number;
    accumulatedSec: number;
    lastMediaTime: number;
    counted: boolean;
  }>({
    trackId: '',
    passId: 0,
    accumulatedSec: 0,
    lastMediaTime: 0,
    counted: false,
  });

  const [fmFlyout, setFmFlyout] = useState<{ id: number; label: string } | null>(null);
  const [radioNowPlaying, setRadioNowPlaying] = useState<{ title: string; artist: string } | null>(
    null
  );
  const [radioMetaRefreshTick, setRadioMetaRefreshTick] = useState(0);
  const [radioDisplayCycle, setRadioDisplayCycle] = useState<'station' | 'track'>('station');
  const [usingDirectAudioFallback, setUsingDirectAudioFallback] = useState(false);
  const [isStudioMode, setIsStudioMode] = useState(false);
  const [isRecordArmed, setIsRecordArmed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHoldingPlay, setIsHoldingPlay] = useState(false);
  const [recordAspect, setRecordAspect] = useState<RecordAspectRatio>(() =>
    typeof window !== 'undefined' && window.innerHeight >= window.innerWidth ? '9:16' : '16:9'
  );
  const [recordQuality, setRecordQuality] = useState<RecordQualityPreset>('720p');
  const [recordRenderMode, setRecordRenderMode] = useState<RecordRenderMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECORD_RENDER_MODE_KEY);
      return saved === 'offline' ? 'offline' : 'live';
    } catch {
      return 'live';
    }
  });
  const [offlineExportState, setOfflineExportState] = useState<{
    progress: number;
    stage: OfflineExportStage;
  } | null>(null);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [playlistSortMode, setPlaylistSortMode] = useState<PlaylistSortMode | null>(null);
  const playlistSortModeRef = useRef<PlaylistSortMode | null>(null);
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
  const [isCarouselMode, setIsCarouselMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_CAROUSEL_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [carouselIntervalSec, setCarouselIntervalSec] = useState<number>(() => {
    try {
      const parsed = Number(localStorage.getItem(STORAGE_CAROUSEL_INTERVAL_KEY));
      return (CAROUSEL_INTERVAL_OPTIONS as readonly number[]).includes(parsed) ? parsed : 10;
    } catch {
      return 10;
    }
  });
  const [carouselResetTick, setCarouselResetTick] = useState(0);
  const autoCarouselForRadioRef = useRef(false);
  const lastRadioCarouselKeyRef = useRef('');
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
    let existing: SavedUrlEntry[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_URLS_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) {
        existing = parsed as SavedUrlEntry[];
      }
    } catch {
      existing = [];
    }

    let alreadySeeded = false;
    try {
      alreadySeeded = localStorage.getItem(STORAGE_DEFAULT_FM_SEEDED_KEY) === '1';
    } catch {
      alreadySeeded = false;
    }

    const langStations = getDefaultFmStationsForLang(lang);
    const shouldSeedOrMigrate = !alreadySeeded || existing.length === 0;

    if (shouldSeedOrMigrate) {
      const now = Date.now();
      const customEntries = existing.filter((entry) => !findDefaultFmStationByUrl(entry.url));
      const seededDefaultEntries: SavedUrlEntry[] = langStations.map((station, idx) => ({
        id: `url-${hashString(station.url)}`,
        url: station.url,
        label: `${t.radioFmLabel}: ${getFmStationLabel(station, lang)}`,
        addedAt: now - idx,
      }));
      const merged = [...seededDefaultEntries, ...customEntries];
      try {
        localStorage.setItem(STORAGE_URLS_KEY, JSON.stringify(merged));
        localStorage.setItem(STORAGE_DEFAULT_FM_SEEDED_KEY, '1');
      } catch {
        // ignore storage errors
      }
      return merged;
    }

    return existing;
  });
  const [activeUrlId, setActiveUrlId] = useState<string | null>(null);

  const [cloudUser, setCloudUser] = useState<CloudUserInfo | null>(null);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const cloudUserRef = useRef<CloudUserInfo | null>(null);
  const cloudSyncFetchedUidRef = useRef<string | null>(null);
  const savedProfilesRef = useRef<string[]>(savedProfiles);
  const currentHandleRef = useRef<string>(currentHandle);
  const savedUrlsRef = useRef<SavedUrlEntry[]>(savedUrls);
  const activeUrlIdRef = useRef<string | null>(activeUrlId);
  const savedFoldersRef = useRef<SavedFolderEntry[]>(savedFolders);

  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [sourcesTab, setSourcesTab] = useState<SourceTab>('audius');
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobilePlaylistOpen, setIsMobilePlaylistOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isInstallPromoOpen, setIsInstallPromoOpen] = useState(false);
  const [customStageMedia, setCustomStageMedia] = useState<CustomStageMedia | null>(null);
  const [stageAudio, setStageAudio] = useState<StageBgAudio | null>(null);
  const [coverFrameMotion, setCoverFrameMotion] = useState<FrameMotionMode>('static');
  const [coverRotationTarget, setCoverRotationTarget] = useState<FrameRotationTarget>('none');
  const [showCoverCaption, setShowCoverCaption] = useState(false);
  const [stageMediaQueue, setStageMediaQueue] = useState<StageMediaItem[]>([]);
  const [stageMediaIndex, setStageMediaIndex] = useState(0);
  const [cameraOverlayActive, setCameraOverlayActive] = useState(false);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState(0);
  const [isStageMediaOpen, setIsStageMediaOpen] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micVolume, setMicVolume] = useState(1);
  const [micEchoFilter, setMicEchoFilter] = useState(false);
  const micEnabledRef = useRef(false);
  const micVolumeRef = useRef(1);
  const micEchoFilterRef = useRef(false);
  const customStageMediaRef = useRef<CustomStageMedia | null>(null);
  const stageAudioRef = useRef<StageBgAudio | null>(null);
  const coverFrameMotionRef = useRef<FrameMotionMode>('static');
  const coverRotationTargetRef = useRef<FrameRotationTarget>('none');
  const showCoverCaptionRef = useRef(false);
  const stageMediaQueueRef = useRef<StageMediaItem[]>([]);
  const stageMediaIndexRef = useRef(0);
  const cameraOverlayActiveRef = useRef(false);
  const lastRotationTargetRef = useRef<Exclude<FrameRotationTarget, 'none'>>('both');
  const recordingStallCheckRef = useRef<{
    lastTime: number;
    stagnantTicks: number;
    recovering: boolean;
  }>({ lastTime: -1, stagnantTicks: 0, recovering: false });
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

  useEffect(() => {
    savedProfilesRef.current = savedProfiles;
  }, [savedProfiles]);

  useEffect(() => {
    currentHandleRef.current = currentHandle;
  }, [currentHandle]);

  useEffect(() => {
    savedUrlsRef.current = savedUrls;
  }, [savedUrls]);

  // Keep default and custom FM station labels localized and swap national stations when language changes
  useEffect(() => {
    const langChanged = prevLangRef.current !== lang;
    prevLangRef.current = lang;

    setSavedUrls((prev) => {
      let changed = false;
      let working = prev;

      if (langChanged) {
        const nationalStations = getDefaultFmStationsForLang(lang).slice(0, 2);
        const filtered = prev.filter((entry) => {
          if (isNationalFmUrlForOtherLang(entry.url, lang)) {
            changed = true;
            return false;
          }
          return true;
        });

        const existingUrls = new Set(filtered.map((e) => e.url.trim()));
        const missingNational = nationalStations.filter((st) => !existingUrls.has(st.url));
        if (missingNational.length > 0) {
          changed = true;
          const now = Date.now();
          const newNationalEntries: SavedUrlEntry[] = missingNational.map((station, idx) => ({
            id: `url-${hashString(station.url)}`,
            url: station.url,
            label: `${t.radioFmLabel}: ${getFmStationLabel(station, lang)}`,
            addedAt: now - idx,
          }));
          const firstDefaultIdx = filtered.findIndex((e) => Boolean(findDefaultFmStationByUrl(e.url)));
          if (firstDefaultIdx === -1) {
            working = [...newNationalEntries, ...filtered];
          } else {
            working = [
              ...filtered.slice(0, firstDefaultIdx),
              ...newNationalEntries,
              ...filtered.slice(firstDefaultIdx),
            ];
          }
        } else {
          working = filtered;
        }
      }

      const next = working.map((entry) => {
        const matched = findDefaultFmStationByUrl(entry.url);
        if (matched) {
          const localizedLabel = `${t.radioFmLabel}: ${getFmStationLabel(matched, lang)}`;
          const nextUrl = matched.url;
          const nextId = `url-${hashString(nextUrl)}`;
          if (entry.label === localizedLabel && entry.url === nextUrl && entry.id === nextId) {
            return entry;
          }
          changed = true;
          return {
            ...entry,
            id: nextId,
            url: nextUrl,
            label: localizedLabel,
          };
        }

        const radioPrefixMatch = entry.label.match(/^(?:RadioFM|РадиоФМ|РадіоФМ)(?::\s*(.*))?$/i);
        if (radioPrefixMatch) {
          const rawRest = (radioPrefixMatch[1] || '').trim();
          const refined =
            !rawRest || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(rawRest)
              ? extractShortRadioName(entry.url) || rawRest
              : rawRest;
          const localizedCustomLabel = refined ? `${t.radioFmLabel}: ${refined}` : t.radioFmLabel;
          if (entry.label !== localizedCustomLabel) {
            changed = true;
            return {
              ...entry,
              label: localizedCustomLabel,
            };
          }
        }
        return entry;
      });
      if (!changed) return prev;
      try {
        localStorage.setItem(STORAGE_URLS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [lang, t.radioFmLabel]);

  useEffect(() => {
    activeUrlIdRef.current = activeUrlId;
  }, [activeUrlId]);

  useEffect(() => {
    savedFoldersRef.current = savedFolders;
  }, [savedFolders]);

  // Hydrate saved local folder metadata from IndexedDB in case localStorage was cleared
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const idbFolders = await getSavedFoldersMeta();
      if (cancelled || idbFolders.length === 0) return;
      setSavedFolders((prev) => {
        const merged = [...prev];
        let changed = false;
        for (const item of idbFolders) {
          if (!merged.some((f) => f.id === item.id || f.name === item.name)) {
            merged.push(item);
            changed = true;
          }
        }
        if (!changed) return prev;
        try {
          localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        return merged;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncFromCloudForUser = useCallback(
    async (uid: string) => {
      if (cloudSyncFetchedUidRef.current === uid) return;
      cloudSyncFetchedUidRef.current = uid;
      try {
        const snapshot = await fetchCloudMediaSources(uid);
        let addedCount = 0;

        if (snapshot.audiusProfiles.length > 0) {
          const currentProfiles = savedProfilesRef.current;
          const lowerSet = new Set(currentProfiles.map((p) => p.toLowerCase()));
          const toAdd = snapshot.audiusProfiles
            .map((p) => p.handle)
            .filter((handle) => {
              const lower = handle.toLowerCase();
              if (lowerSet.has(lower)) return false;
              lowerSet.add(lower);
              return true;
            });
          if (toAdd.length > 0) {
            addedCount += toAdd.length;
            const nextProfiles = [...currentProfiles, ...toAdd];
            setSavedProfiles(nextProfiles);
            try {
              localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(nextProfiles));
            } catch {
              // ignore
            }
          }
        }

        if (snapshot.urlEntries.length > 0) {
          const currentUrls = savedUrlsRef.current;
          const urlSet = new Set(currentUrls.map((u) => u.url.trim()));
          const toAddUrls = snapshot.urlEntries.filter((entry) => {
            const norm = entry.url.trim();
            if (urlSet.has(norm)) return false;
            urlSet.add(norm);
            return true;
          });
          if (toAddUrls.length > 0) {
            addedCount += toAddUrls.length;
            const nextUrls = [...currentUrls, ...toAddUrls].sort((a, b) => b.addedAt - a.addedAt);
            setSavedUrls(nextUrls);
            try {
              localStorage.setItem(STORAGE_URLS_KEY, JSON.stringify(nextUrls));
            } catch {
              // ignore
            }
          }
        }

        if (snapshot.folderBookmarks.length > 0) {
          const currentFolders = savedFoldersRef.current;
          const idSet = new Set(currentFolders.map((f) => f.id));
          const nameSet = new Set(currentFolders.map((f) => f.name.toLowerCase()));
          const toAddFolders = snapshot.folderBookmarks.filter((f) => {
            if (idSet.has(f.id) || nameSet.has(f.name.toLowerCase())) return false;
            idSet.add(f.id);
            nameSet.add(f.name.toLowerCase());
            return true;
          });
          if (toAddFolders.length > 0) {
            addedCount += toAddFolders.length;
            const nextFolders = [...currentFolders, ...toAddFolders].sort(
              (a, b) => b.addedAt - a.addedAt
            );
            setSavedFolders(nextFolders);
            try {
              localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(nextFolders));
            } catch {
              // ignore
            }
            void saveSavedFoldersMeta(nextFolders);
          }
        }

        if (addedCount > 0) {
          showToast(cloudT.cloudLoadedToast(addedCount), 'info');
        }
      } catch {
        cloudSyncFetchedUidRef.current = null;
        // Non-fatal: keep offline/local lists usable if Firestore fetch fails
      }
    },
    [cloudT, showToast]
  );

  // Subscribe to Firebase Auth & automatically merge cloud-saved sources on sign-in
  useEffect(() => {
    const unsubscribe = subscribeCloudAuth((user) => {
      cloudUserRef.current = user;
      setCloudUser(user);

      if (!user) {
        cloudSyncFetchedUidRef.current = null;
        return;
      }

      void syncFromCloudForUser(user.uid);
    });

    return () => unsubscribe();
  }, [syncFromCloudForUser]);

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
      window.clearTimeout(playHoldTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore cleanup stop errors
        }
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((tr) => tr.stop());
        cameraStreamRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((tr) => tr.stop());
        micStreamRef.current = null;
      }
      if (customStageMediaRef.current?.src.startsWith('blob:')) {
        URL.revokeObjectURL(customStageMediaRef.current.src);
      }
      if (stageAudioRef.current?.src.startsWith('blob:')) {
        URL.revokeObjectURL(stageAudioRef.current.src);
      }
      for (const item of stageMediaQueueRef.current) {
        if (item.src.startsWith('blob:')) {
          URL.revokeObjectURL(item.src);
        }
      }
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

      const firstNode: AudioNode = filters[0] ?? gainNode;
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      if (filters.length > 0) {
        filters[filters.length - 1].connect(gainNode);
      }

      const streamDest = ctx.createMediaStreamDestination();
      streamDestRef.current = streamDest;
      firstFilterOrGainRef.current = firstNode;

      // Silent 0-gain keepalive keeps MediaRecorder audio track active across seeks or track changes
      try {
        const keepaliveOsc = ctx.createOscillator();
        const keepaliveGain = ctx.createGain();
        keepaliveGain.gain.value = 0;
        keepaliveOsc.connect(keepaliveGain);
        keepaliveGain.connect(streamDest);
        keepaliveOsc.start();
      } catch {
        // ignore if oscillator unavailable
      }

      // Studio mix limiter prevents digital clipping when layering music + video audio + mic
      const recLimiter = ctx.createDynamicsCompressor();
      recLimiter.threshold.value = -3;
      recLimiter.knee.value = 6;
      recLimiter.ratio.value = 8;
      recLimiter.attack.value = 0.003;
      recLimiter.release.value = 0.15;
      recLimiter.connect(streamDest);
      recLimiterRef.current = recLimiter;

      // analyserNode acts as a leaf tap (never connected to ctx.destination) so mic audio never echoes out of speakers
      gainNode.connect(analyserNode);
      gainNode.connect(ctx.destination);
      gainNode.connect(recLimiter);

      if (!sourceCreatedRef.current) {
        try {
          const source = ctx.createMediaElementSource(audioEl);
          source.connect(firstNode);
          sourceCreatedRef.current = true;
        } catch {
          // ignore duplicate media element hookup
        }
      }

      if (videoRef.current && !videoSourceCreatedRef.current) {
        try {
          const vSource = ctx.createMediaElementSource(videoRef.current);
          vSource.connect(firstNode);
          videoSourceCreatedRef.current = true;
        } catch {
          // ignore duplicate media element hookup
        }
      }

      // Video overlay gain is independent from track volume so user can lower music under video/voice
      const bgGain = ctx.createGain();
      const activeBg = customStageMediaRef.current;
      bgGain.gain.value =
        activeBg?.kind === 'video' && activeBg.soundEnabled && !isMuted
          ? activeBg.soundVolume
          : 0;
      bgGain.connect(analyserNode);
      bgGain.connect(ctx.destination);
      bgGain.connect(recLimiter);
      customBgGainRef.current = bgGain;

      if (customBgVideoRef.current && !customBgSourceCreatedRef.current) {
        try {
          const bgSource = ctx.createMediaElementSource(customBgVideoRef.current);
          bgSource.connect(bgGain);
          customBgSourceCreatedRef.current = true;
        } catch {
          // ignore duplicate background video hookup
        }
      }

      // 3rd background audio track for fullscreen Photo / Video mode
      const stageAudioGain = ctx.createGain();
      const activeStageAudio = stageAudioRef.current;
      const activeMediaTypeNow = playlistRef.current[currentIndexRef.current]?.mediaType;
      const stageAudioAllowed =
        activeMediaTypeNow === 'video' || activeMediaTypeNow === 'image';
      stageAudioGain.gain.value =
        stageAudioAllowed && activeStageAudio?.enabled && !isMuted
          ? activeStageAudio.volume
          : 0;
      stageAudioGain.connect(analyserNode);
      stageAudioGain.connect(ctx.destination);
      stageAudioGain.connect(recLimiter);
      stageBgAudioGainRef.current = stageAudioGain;

      if (stageBgAudioRef.current && !stageBgAudioSourceCreatedRef.current) {
        try {
          const stgSource = ctx.createMediaElementSource(stageBgAudioRef.current);
          stgSource.connect(stageAudioGain);
          stageBgAudioSourceCreatedRef.current = true;
        } catch {
          // ignore duplicate stage audio hookup
        }
      }

      // Live microphone path: gentle 75Hz high-pass removes rumble/pops, never routed to ctx.destination
      const micHighpass = ctx.createBiquadFilter();
      micHighpass.type = 'highpass';
      micHighpass.frequency.value = 75;
      micHighpass.Q.value = 0.7;
      micHighpassRef.current = micHighpass;

      const micGain = ctx.createGain();
      micGain.gain.value = micEnabledRef.current ? micVolumeRef.current : 0;
      micHighpass.connect(micGain);
      micGain.connect(analyserNode);
      micGain.connect(recLimiter);
      micGainRef.current = micGain;

      if (micStreamRef.current && !micSourceRef.current) {
        try {
          const mSrc = ctx.createMediaStreamSource(micStreamRef.current);
          mSrc.connect(micHighpass);
          micSourceRef.current = mSrc;
        } catch {
          // ignore duplicate mic source hookup
        }
      }

      audioCtxRef.current = ctx;
      analyserRef.current = analyserNode;
      gainNodeRef.current = gainNode;
      filtersRef.current = filters;
      setAnalyser(analyserNode);
    } else {
      if (
        videoRef.current &&
        !videoSourceCreatedRef.current &&
        firstFilterOrGainRef.current
      ) {
        try {
          const vSource = audioCtxRef.current.createMediaElementSource(videoRef.current);
          vSource.connect(firstFilterOrGainRef.current);
          videoSourceCreatedRef.current = true;
        } catch {
          // ignore
        }
      }

      if (
        customBgVideoRef.current &&
        !customBgSourceCreatedRef.current &&
        customBgGainRef.current
      ) {
        try {
          const bgSource = audioCtxRef.current.createMediaElementSource(customBgVideoRef.current);
          bgSource.connect(customBgGainRef.current);
          customBgSourceCreatedRef.current = true;
        } catch {
          // ignore
        }
      }

      if (
        stageBgAudioRef.current &&
        !stageBgAudioSourceCreatedRef.current &&
        stageBgAudioGainRef.current
      ) {
        try {
          const stgSource = audioCtxRef.current.createMediaElementSource(stageBgAudioRef.current);
          stgSource.connect(stageBgAudioGainRef.current);
          stageBgAudioSourceCreatedRef.current = true;
        } catch {
          // ignore
        }
      }

      if (micStreamRef.current && !micSourceRef.current && micGainRef.current) {
        try {
          const mSrc = audioCtxRef.current.createMediaStreamSource(micStreamRef.current);
          mSrc.connect(micHighpassRef.current ?? micGainRef.current);
          micSourceRef.current = mSrc;
        } catch {
          // ignore
        }
      }
    }

    if (audioCtxRef.current.state !== 'running') {
      void audioCtxRef.current.resume().catch(() => {});
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
      setCarouselResetTick((tick) => tick + 1);
      trackEvent('visualizer_randomize', { mix_enabled: useMix });
    },
    [mixEnabled]
  );

  const readSavedCarouselPrefs = useCallback(() => {
    let savedMode = false;
    let savedInterval = 10;
    try {
      savedMode = localStorage.getItem(STORAGE_CAROUSEL_MODE_KEY) === 'true';
      const parsed = Number(localStorage.getItem(STORAGE_CAROUSEL_INTERVAL_KEY));
      if ((CAROUSEL_INTERVAL_OPTIONS as readonly number[]).includes(parsed)) {
        savedInterval = parsed;
      }
    } catch {
      // ignore storage errors
    }
    return { savedMode, savedInterval };
  }, []);

  const syncRadioCarouselForTrack = useCallback(
    (track: Track | undefined, options?: { force?: boolean }): number | null => {
      if (!track) return null;
      if (track.isRadio) {
        const trackKey = `${track.id}|${track.src}`;
        if (!options?.force && lastRadioCarouselKeyRef.current === trackKey) {
          return null;
        }
        const randomSec =
          CAROUSEL_INTERVAL_OPTIONS[
            Math.floor(Math.random() * CAROUSEL_INTERVAL_OPTIONS.length)
          ];
        autoCarouselForRadioRef.current = true;
        lastRadioCarouselKeyRef.current = trackKey;
        setIsCarouselMode(true);
        setCarouselIntervalSec(randomSec);
        setCarouselResetTick((tick) => tick + 1);
        return randomSec;
      }

      lastRadioCarouselKeyRef.current = '';
      if (autoCarouselForRadioRef.current) {
        autoCarouselForRadioRef.current = false;
        const { savedMode, savedInterval } = readSavedCarouselPrefs();
        setIsCarouselMode(savedMode);
        setCarouselIntervalSec(savedInterval);
        setCarouselResetTick((tick) => tick + 1);
      }
      return null;
    },
    [readSavedCarouselPrefs]
  );

  const handleSelectVizModeOrCarousel = useCallback(
    (id: number) => {
      autoCarouselForRadioRef.current = false;
      if (id === VIZ_CAROUSEL_MODE_ID) {
        setIsCarouselMode(true);
        try {
          localStorage.setItem(STORAGE_CAROUSEL_MODE_KEY, 'true');
        } catch {
          // ignore storage errors
        }
        randomizeVisual();
        showToast(studioT.carouselEnabledToast(carouselIntervalSec), 'info');
        trackEvent('visualizer_mode_change', {
          mode_id: VIZ_CAROUSEL_MODE_ID,
          mode_label: 'Carousel',
          interval_sec: carouselIntervalSec,
        });
        return;
      }

      setIsCarouselMode(false);
      try {
        localStorage.setItem(STORAGE_CAROUSEL_MODE_KEY, 'false');
      } catch {
        // ignore storage errors
      }
      setVizMode(id);
      trackEvent('visualizer_mode_change', {
        mode_id: id,
        mode_label: VIZ_MODES[id]?.label,
      });
    },
    [carouselIntervalSec, randomizeVisual, showToast, studioT]
  );

  const handleChangeCarouselInterval = useCallback(
    (sec: number) => {
      autoCarouselForRadioRef.current = false;
      setCarouselIntervalSec(sec);
      setCarouselResetTick((tick) => tick + 1);
      try {
        localStorage.setItem(STORAGE_CAROUSEL_INTERVAL_KEY, String(sec));
      } catch {
        // ignore storage errors
      }
      showToast(studioT.carouselIntervalToast(sec), 'info');
      trackEvent('visualizer_carousel_interval', { interval_sec: sec });
    },
    [showToast, studioT]
  );

  useEffect(() => {
    if (!isCarouselMode || (!isPlaying && !isRecording)) return;
    const id = window.setInterval(() => {
      randomizeVisual();
    }, carouselIntervalSec * 1000);
    return () => window.clearInterval(id);
  }, [
    carouselIntervalSec,
    carouselResetTick,
    isCarouselMode,
    isPlaying,
    isRecording,
    randomizeVisual,
  ]);

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

  // Poll live song & artist metadata (ICY StreamTitle) while an online radio stream plays
  useEffect(() => {
    const rawSrc = currentTrack?.src || '';
    if (!currentTrack?.isRadio || !rawSrc) {
      lastRadioSrcRef.current = '';
      setRadioNowPlaying(null);
      setRadioDisplayCycle('station');
      return;
    }

    if (lastRadioSrcRef.current !== rawSrc) {
      lastRadioSrcRef.current = rawSrc;
      setRadioNowPlaying(null);
      setRadioDisplayCycle('station');
    }

    if (!isOnline || !isPlaying) {
      return;
    }

    let targetUrl = rawSrc;
    if (rawSrc.startsWith('/api/radio-proxy')) {
      try {
        const parsed = new URL(rawSrc, window.location.origin);
        targetUrl = parsed.searchParams.get('url') || rawSrc;
      } catch {
        targetUrl = rawSrc;
      }
    }
    if (!/^https?:\/\//i.test(targetUrl)) {
      return;
    }

    let cancelled = false;
    let activeAbort: AbortController | null = null;

    const fetchNowPlaying = async () => {
      activeAbort?.abort();
      const ctrl = new AbortController();
      activeAbort = ctrl;
      try {
        const res = await fetch(
          `/api/radio-metadata?url=${encodeURIComponent(targetUrl)}`,
          { signal: ctrl.signal, cache: 'no-store' }
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          title?: string | null;
          artist?: string | null;
        };
        if (cancelled) return;
        const nextTitle = typeof data.title === 'string' ? data.title.trim() : '';
        const nextArtist = typeof data.artist === 'string' ? data.artist.trim() : '';
        if (nextTitle) {
          setRadioNowPlaying((prev) => {
            if (prev && prev.title === nextTitle && prev.artist === nextArtist) {
              return prev;
            }
            return { title: nextTitle, artist: nextArtist };
          });
        } else {
          setRadioNowPlaying(null);
        }
      } catch {
        // Ignore transient or aborted metadata polls
      }
    };

    void fetchNowPlaying();
    const pollId = window.setInterval(() => {
      void fetchNowPlaying();
    }, 12000);

    return () => {
      cancelled = true;
      activeAbort?.abort();
      window.clearInterval(pollId);
    };
  }, [currentTrack?.isRadio, currentTrack?.src, isOnline, isPlaying, radioMetaRefreshTick]);

  // Alternate between Station+Link and Song+Artist every 5 seconds when radio metadata is available
  useEffect(() => {
    if (!currentTrack?.isRadio || !radioNowPlaying?.title) {
      setRadioDisplayCycle('station');
      return;
    }
    setRadioDisplayCycle('track');
    const intervalId = window.setInterval(() => {
      setRadioDisplayCycle((prev) => (prev === 'station' ? 'track' : 'station'));
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [currentTrack?.isRadio, currentTrack?.src, radioNowPlaying?.title, radioNowPlaying?.artist]);

  const isShowingRadioNowPlaying = Boolean(
    currentTrack?.isRadio && radioNowPlaying?.title && radioDisplayCycle === 'track'
  );
  const coverDisplayTitle = isShowingRadioNowPlaying
    ? radioNowPlaying!.title
    : currentTrack?.title;
  const coverDisplayArtist = isShowingRadioNowPlaying
    ? radioNowPlaying!.artist || currentTrack?.artist || t.radioFmLabel
    : currentTrack?.artist;

  const hasSortableStats = useMemo(
    () => playlist.some((tr) => typeof tr.playCount === 'number'),
    [playlist]
  );
  const canSortPlaylist = playlist.length > 1;

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

  useEffect(() => {
    isRecordArmedRef.current = isRecordArmed;
  }, [isRecordArmed]);

  useEffect(() => {
    isStudioModeRef.current = isStudioMode;
  }, [isStudioMode]);

  const persistCurrentSession = useCallback(
    (overrides?: Partial<SavedPlaybackSession>) => {
      const active = activeSessionRef.current;
      if (!active && !overrides?.sourceType) return;

      const list = playlistRef.current;
      const idx = overrides?.trackIndex ?? currentIndexRef.current;
      const track = list[idx];
      const activeEl =
        track?.mediaType === 'video'
          ? videoRef.current
          : usingDirectAudioFallbackRef.current
            ? fallbackAudioRef.current
            : audioRef.current;
      const mediaTime = activeEl?.currentTime;
      const resolvedTime =
        overrides?.currentTime ??
        (typeof mediaTime === 'number' && Number.isFinite(mediaTime) ? mediaTime : 0);

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

  const handleTogglePlaylistSort = useCallback(
    (field: PlaylistSortField) => {
      const nextMode: PlaylistSortMode =
        field === 'random'
          ? 'random'
          : field === 'date'
            ? playlistSortModeRef.current === 'date-desc'
              ? 'date-asc'
              : 'date-desc'
            : playlistSortModeRef.current === 'popular-desc'
              ? 'popular-asc'
              : 'popular-desc';

      playlistSortModeRef.current = nextMode;
      setPlaylistSortMode(nextMode);

      const currentList = playlistRef.current;
      if (currentList.length === 0) return;

      const activeTrack = currentList[currentIndexRef.current];
      let sortedList = sortTracksByMode(currentList, nextMode);
      if (
        nextMode === 'random' &&
        currentList.length >= 2 &&
        sortedList.every((tr, idx) => tr.id === currentList[idx]?.id)
      ) {
        sortedList = [...sortedList.slice(1), sortedList[0]];
      }
      const nextActiveIdx = activeTrack
        ? sortedList.findIndex((tr) => tr.id === activeTrack.id)
        : -1;
      const resolvedIndex = nextActiveIdx !== -1 ? nextActiveIdx : 0;

      playlistRef.current = sortedList;
      currentIndexRef.current = resolvedIndex;
      setPlaylist(sortedList);
      setCurrentIndex(resolvedIndex);

      persistCurrentSession({
        trackId: sortedList[resolvedIndex]?.id,
        trackTitle: sortedList[resolvedIndex]?.title,
        trackArtist: sortedList[resolvedIndex]?.artist,
        trackIndex: resolvedIndex,
      });
    },
    [persistCurrentSession]
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
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
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
    const level = isMuted ? 0 : volume;
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = level;
    }
    if (audioRef.current) {
      audioRef.current.volume = level;
    }
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.volume = level;
      fallbackAudioRef.current.muted = isMuted;
    }
    if (videoRef.current) {
      videoRef.current.volume = level;
    }
  }, [volume, isMuted]);

  // Keep customStageMediaRef, cameraOverlayActiveRef and custom background video/camera stream synced
  useEffect(() => {
    customStageMediaRef.current = customStageMedia;
    cameraOverlayActiveRef.current = cameraOverlayActive;
    const camVid = cameraVideoRef.current;
    const vid = customBgVideoRef.current;
    const wantCamera = customStageMedia?.kind === 'camera' || cameraOverlayActive;

    if (camVid) {
      if (wantCamera) {
        camVid.muted = true;
        if (cameraStreamRef.current && camVid.srcObject !== cameraStreamRef.current) {
          camVid.srcObject = cameraStreamRef.current;
        }
        if (cameraStreamRef.current) {
          void camVid.play().catch(() => {});
        }
      } else if (camVid.srcObject) {
        camVid.srcObject = null;
      }
    }

    if (customStageMedia?.kind === 'camera') {
      if (vid) {
        vid.pause();
        if (vid.hasAttribute('src')) {
          vid.removeAttribute('src');
          vid.load();
        }
      }
      if (customBgGainRef.current) {
        customBgGainRef.current.gain.value = 0;
      }
      return;
    }

    if (!vid) return;
    if (vid.srcObject) {
      vid.srcObject = null;
    }

    if (!customStageMedia || customStageMedia.kind !== 'video') {
      vid.pause();
      if (vid.hasAttribute('src')) {
        vid.removeAttribute('src');
        vid.load();
      }
      if (customBgGainRef.current) {
        customBgGainRef.current.gain.value = 0;
      }
      return;
    }

    const sameSrc =
      vid.getAttribute('src') === customStageMedia.src || vid.src === customStageMedia.src;
    if (!sameSrc) {
      if (customStageMedia.src.startsWith('http')) {
        vid.crossOrigin = 'anonymous';
      } else {
        vid.removeAttribute('crossorigin');
      }
      vid.preload = 'auto';
      vid.loop = stageMediaQueue.length <= 1;
      vid.src = customStageMedia.src;
      vid.load();
    } else {
      vid.loop = stageMediaQueue.length <= 1;
    }

    const activeTrackType = playlistRef.current[currentIndexRef.current]?.mediaType;
    const allowCustomVideoPlayback =
      (activeTrackType !== 'video' && activeTrackType !== 'image') ||
      isStudioMode ||
      Boolean(customStageMedia);
    const shouldHear = customStageMedia.soundEnabled && !isMuted;

    vid.muted = !shouldHear;
    if (customBgGainRef.current) {
      customBgGainRef.current.gain.value = shouldHear ? customStageMedia.soundVolume : 0;
      vid.volume = 1;
    } else {
      vid.volume = shouldHear ? customStageMedia.soundVolume : 0;
    }

    let cancelled = false;
    const unlockUnmutedOnGesture = () => {
      if (cancelled) return;
      ensureAudioGraph();
      const latest = customStageMediaRef.current;
      if (latest?.kind === 'video') {
        vid.muted = !(latest.soundEnabled && !isMuted);
      }
    };

    if (allowCustomVideoPlayback && (isPlaying || isRecording)) {
      void vid.play().catch(() => {
        if (cancelled) return;
        // Mobile browsers often block unmuted play outside direct click after OS file dialog: play muted immediately so video renders, then unmute on next tap
        vid.muted = true;
        void vid.play().catch(() => {});
        if (shouldHear) {
          window.addEventListener('pointerdown', unlockUnmutedOnGesture, { once: true });
        }
      });
    } else {
      vid.pause();
      if (vid.readyState < 2) {
        const primeFrame = () => {
          if (cancelled || isPlayingRef.current) return;
          const prevMuted = vid.muted;
          vid.muted = true;
          void vid
            .play()
            .then(() => {
              if (!isPlayingRef.current) {
                vid.pause();
              }
              vid.muted = prevMuted;
            })
            .catch(() => {
              vid.muted = prevMuted;
              if (vid.currentTime < 0.01) {
                try {
                  vid.currentTime = 0.01;
                } catch {
                  // ignore seek errors
                }
              }
            });
        };
        if (vid.readyState >= 1) {
          primeFrame();
        } else {
          vid.addEventListener('loadedmetadata', primeFrame, { once: true });
        }
      }
    }

    return () => {
      cancelled = true;
      window.removeEventListener('pointerdown', unlockUnmutedOnGesture);
    };
  }, [
    cameraOverlayActive,
    customStageMedia,
    ensureAudioGraph,
    isMuted,
    isPlaying,
    isRecording,
    isStudioMode,
    stageMediaQueue.length,
    currentIndex,
    playlist,
  ]);

  // Keep stageAudioRef & 3rd background audio track element synced across Photo / Video playback & recording
  useEffect(() => {
    stageAudioRef.current = stageAudio;
    const el = stageBgAudioRef.current;
    if (!el) return;

    if (!stageAudio) {
      el.pause();
      if (el.hasAttribute('src')) {
        el.removeAttribute('src');
        el.load();
      }
      if (stageBgAudioGainRef.current) {
        stageBgAudioGainRef.current.gain.value = 0;
      }
      return;
    }

    const sameSrc = el.getAttribute('src') === stageAudio.src || el.src === stageAudio.src;
    if (!sameSrc) {
      el.removeAttribute('crossorigin');
      el.preload = 'auto';
      el.loop = true;
      el.src = stageAudio.src;
      el.load();
    } else {
      el.loop = true;
    }

    const activeTrackType = playlistRef.current[currentIndexRef.current]?.mediaType;
    const isMainMediaNow = activeTrackType === 'video' || activeTrackType === 'image';
    const shouldHear = isMainMediaNow && stageAudio.enabled && !isMuted;

    el.muted = !shouldHear;
    if (stageBgAudioGainRef.current) {
      stageBgAudioGainRef.current.gain.value = shouldHear ? stageAudio.volume : 0;
      el.volume = 1;
    } else {
      el.volume = shouldHear ? stageAudio.volume : 0;
    }

    let cancelled = false;
    const unlockStageAudioOnGesture = () => {
      if (cancelled) return;
      ensureAudioGraph();
      const latest = stageAudioRef.current;
      if (latest) {
        el.muted = !(latest.enabled && !isMuted);
      }
    };

    if (isMainMediaNow && (isPlaying || isRecording)) {
      void el.play().catch(() => {
        if (cancelled) return;
        el.muted = true;
        void el.play().catch(() => {});
        if (shouldHear) {
          window.addEventListener('pointerdown', unlockStageAudioOnGesture, { once: true });
        }
      });
    } else {
      el.pause();
    }

    return () => {
      cancelled = true;
      window.removeEventListener('pointerdown', unlockStageAudioOnGesture);
    };
  }, [currentIndex, ensureAudioGraph, isMuted, isPlaying, isRecording, playlist, stageAudio]);

  // Keep live microphone refs & gain synced
  useEffect(() => {
    micEnabledRef.current = micEnabled;
    micVolumeRef.current = micVolume;
    if (micGainRef.current) {
      micGainRef.current.gain.value = micEnabled ? micVolume : 0;
    }
  }, [micEnabled, micVolume]);

  // Sync EQ bands
  useEffect(() => {
    filtersRef.current.forEach((filter, idx) => {
      filter.gain.value = eqGains[idx] ?? 0;
    });
  }, [eqGains]);

  const saveProfileToHistory = useCallback((handle: string) => {
    if (isDefaultAudiusHandle(handle)) {
      const deleted = getDeletedDefaultAudiusHandles();
      if (deleted.delete(handle.trim().toLowerCase())) {
        setDeletedDefaultAudiusHandles(deleted);
      }
    }
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

  const getActiveMediaElement = useCallback(
    (trackOverride?: Track | null): HTMLMediaElement | null => {
      const target = trackOverride ?? playlistRef.current[currentIndexRef.current] ?? null;
      if (target?.mediaType === 'video') {
        return videoRef.current;
      }
      if (usingDirectAudioFallbackRef.current) {
        return fallbackAudioRef.current;
      }
      return audioRef.current;
    },
    []
  );

  const loadTrackIntoMediaElements = useCallback(
    (track: Track | undefined, seekTime = 0) => {
      const audioEl = audioRef.current;
      const fallbackAudioEl = fallbackAudioRef.current;
      const videoEl = videoRef.current;
      if (!track) return;

      internalPauseIgnoreUntilRef.current = performance.now() + 250;
      usingDirectAudioFallbackRef.current = false;
      setUsingDirectAudioFallback(false);
      proxyAttemptedKeyRef.current = '';
      fallbackAttemptedKeyRef.current = '';
      httpsUpgradeAttemptedKeyRef.current = '';
      if (fallbackAudioEl) {
        fallbackAudioEl.pause();
        if (fallbackAudioEl.hasAttribute('src')) {
          fallbackAudioEl.removeAttribute('src');
          fallbackAudioEl.load();
        }
      }

      syncRadioCarouselForTrack(track);

    if (track.mediaType === 'video') {
      if (audioEl) {
        audioEl.pause();
        audioEl.removeAttribute('src');
      }
      const keepStudio =
        isRecordArmedRef.current ||
        cameraOverlayActiveRef.current ||
        Boolean(customStageMediaRef.current);
      isStudioModeRef.current = keepStudio;
      setIsStudioMode(keepStudio);
      setUiVisible(true);
      if (videoEl) {
        videoEl.pause();
        const sameSrc =
          Boolean(videoEl.src) &&
          (videoEl.src === track.src || videoEl.currentSrc === track.src);
        if (sameSrc) {
          try {
            videoEl.currentTime = Math.max(0, seekTime);
          } catch {
            // ignore
          }
        } else {
          if (seekTime > 0) {
            pendingSeekRef.current = { src: track.src, time: seekTime };
          }
          videoEl.src = track.src;
        }
      }
    } else if (track.mediaType === 'image') {
      if (videoEl) {
        videoEl.pause();
        if (videoEl.hasAttribute('src')) {
          videoEl.removeAttribute('src');
          videoEl.load();
        }
      }
      if (audioEl) {
        audioEl.pause();
        audioEl.removeAttribute('src');
      }
      imageElapsedRef.current = Math.max(0, Math.min(IMAGE_SLIDE_DURATION_SEC, seekTime));
      setCurrentTime(imageElapsedRef.current);
      setDuration(IMAGE_SLIDE_DURATION_SEC);
      const keepStudio =
        isRecordArmedRef.current ||
        cameraOverlayActiveRef.current ||
        Boolean(customStageMediaRef.current);
      isStudioModeRef.current = keepStudio;
      setIsStudioMode(keepStudio);
      setUiVisible(true);
    } else {
      if (videoEl) {
        videoEl.pause();
        if (videoEl.hasAttribute('src')) {
          videoEl.removeAttribute('src');
          videoEl.load();
        }
      }
      const hasFullscreenBackdropOnly = Boolean(
        customStageMediaRef.current &&
          customStageMediaRef.current.displayMode === 'backdrop' &&
          !cameraOverlayActiveRef.current
      );
      const keepFrameStudio =
        cameraOverlayActiveRef.current ||
        customStageMediaRef.current?.displayMode === 'frame' ||
        (isRecordArmedRef.current && !hasFullscreenBackdropOnly);
      isStudioModeRef.current = keepFrameStudio;
      setIsStudioMode(keepFrameStudio);
      if (keepFrameStudio || isRecordArmedRef.current) {
        setUiVisible(true);
      }
      if (audioEl) {
        audioEl.pause();
        const sameSrc =
          Boolean(audioEl.src) &&
          (audioEl.src === track.src || audioEl.currentSrc === track.src);
        if (sameSrc) {
          try {
            audioEl.currentTime = Math.max(0, seekTime);
          } catch {
            // ignore
          }
        } else {
          if (seekTime > 0) {
            pendingSeekRef.current = { src: track.src, time: seekTime };
          }
          audioEl.src = track.src;
        }
      }
    }
  }, [syncRadioCarouselForTrack]);

  const startPlaybackSafe = useCallback(
    async (withAudioGraph: boolean, trackOverride?: Track | null) => {
      const target = trackOverride ?? playlistRef.current[currentIndexRef.current] ?? null;
      playbackIntentRef.current = true;
      if (target?.mediaType === 'image') {
        if (withAudioGraph) ensureAudioGraph();
        setIsPlaying(true);
        setAwaitingAutoplayUnlock(false);
        return true;
      }
      const mediaEl = getActiveMediaElement(target);
      if (!mediaEl) return false;
      if (withAudioGraph && !usingDirectAudioFallbackRef.current) {
        ensureAudioGraph();
      }
      try {
        await mediaEl.play();
        setIsPlaying(true);
        setAwaitingAutoplayUnlock(false);
        return true;
      } catch {
        const targetKey = target ? `${target.id}|${target.src}` : '';
        const recoveryInFlight =
          usingDirectAudioFallbackRef.current ||
          (targetKey !== '' &&
            (proxyAttemptedKeyRef.current === targetKey ||
              httpsUpgradeAttemptedKeyRef.current === targetKey));
        if (recoveryInFlight) {
          if (
            usingDirectAudioFallbackRef.current &&
            fallbackAudioRef.current &&
            !fallbackAudioRef.current.paused
          ) {
            setIsPlaying(true);
            setAwaitingAutoplayUnlock(false);
          }
          return true;
        }
        setIsPlaying(false);
        return false;
      }
    },
    [ensureAudioGraph, getActiveMediaElement]
  );

  const recoverPlaybackFromBackground = useCallback(
    async (forceFromGesture = false): Promise<boolean> => {
      const now = performance.now();
      if (!forceFromGesture && now - lastResumeAttemptRef.current < 350) {
        return false;
      }
      lastResumeAttemptRef.current = now;

      if (!forceFromGesture && !playbackIntentRef.current) {
        return false;
      }

      if (
        !usingDirectAudioFallbackRef.current &&
        audioCtxRef.current &&
        audioCtxRef.current.state !== 'running'
      ) {
        try {
          await audioCtxRef.current.resume();
        } catch {
          // ignore until user gesture
        }
      }

      if (!forceFromGesture && isRecordingRef.current) {
        return false;
      }

      const activeTrack = playlistRef.current[currentIndexRef.current] ?? null;
      if (!activeTrack) return false;

      if (activeTrack.mediaType === 'image') {
        if (forceFromGesture) ensureAudioGraph();
        setIsPlaying(true);
        setAwaitingAutoplayUnlock(false);
        return true;
      }

      const mediaEl = getActiveMediaElement(activeTrack);
      if (!mediaEl) return false;

      if (forceFromGesture && !usingDirectAudioFallbackRef.current) {
        ensureAudioGraph();
        if (audioCtxRef.current && audioCtxRef.current.state !== 'running') {
          try {
            await audioCtxRef.current.resume();
          } catch {
            // ignore
          }
        }
      }

      const alreadyHealthy =
        !mediaEl.paused &&
        !mediaEl.error &&
        mediaEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

      if (alreadyHealthy) {
        setIsPlaying(true);
        setAwaitingAutoplayUnlock(false);
        if (activeTrack.isRadio && now - lastRadioMetaWakeRef.current > 8000) {
          lastRadioMetaWakeRef.current = now;
          setRadioMetaRefreshTick((n) => n + 1);
        }
        return true;
      }

      if (!mediaEl.getAttribute('src') && activeTrack.src) {
        mediaEl.src = activeTrack.src;
      }

      const needsReload =
        Boolean(activeTrack.isRadio) ||
        Boolean(mediaEl.error) ||
        mediaEl.readyState === HTMLMediaElement.HAVE_NOTHING ||
        mediaEl.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;

      if (needsReload) {
        const resumePos =
          !activeTrack.isRadio &&
          Number.isFinite(mediaEl.currentTime) &&
          mediaEl.currentTime > 0.5
            ? mediaEl.currentTime
            : 0;
        if (resumePos > 0) {
          pendingSeekRef.current = {
            src: mediaEl.src || mediaEl.currentSrc || activeTrack.src,
            time: resumePos,
          };
        }
        internalPauseIgnoreUntilRef.current = performance.now() + 250;
        mediaEl.load();
      }

      try {
        await mediaEl.play();
        setIsPlaying(true);
        setAwaitingAutoplayUnlock(false);
        if (activeTrack.isRadio) {
          lastRadioMetaWakeRef.current = now;
          setRadioMetaRefreshTick((n) => n + 1);
        }
        return true;
      } catch (err) {
        const targetKey = `${activeTrack.id}|${activeTrack.src}`;
        const recoveryInFlight =
          usingDirectAudioFallbackRef.current ||
          proxyAttemptedKeyRef.current === targetKey ||
          httpsUpgradeAttemptedKeyRef.current === targetKey;
        if (recoveryInFlight) {
          return true;
        }
        const errName = (err as { name?: string } | null)?.name;
        setIsPlaying(false);
        if (errName === 'NotAllowedError') {
          setAwaitingAutoplayUnlock(true);
        }
        return false;
      }
    },
    [ensureAudioGraph, getActiveMediaElement]
  );

  // Unlock AudioContext & start playback on first user gesture if autoplay was blocked
  useEffect(() => {
    if (!awaitingAutoplayUnlock) return;
    const unlock = (ev: Event) => {
      const target = ev.target as HTMLElement | null;
      if (target?.closest('[data-play-toggle="true"]')) {
        return;
      }
      if (!usingDirectAudioFallbackRef.current) {
        ensureAudioGraph();
      }
      const mediaEl = getActiveMediaElement();
      if (mediaEl && mediaEl.src) {
        void mediaEl
          .play()
          .then(() => {
            setIsPlaying(true);
            setAwaitingAutoplayUnlock(false);
            persistCurrentSession({
              currentTime: mediaEl.currentTime ?? 0,
              wasPlaying: true,
            });
          })
          .catch(() => {});
      }
    };
    window.addEventListener('pointerup', unlock);
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerup', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [awaitingAutoplayUnlock, ensureAudioGraph, getActiveMediaElement, persistCurrentSession]);

  // Attach FFT analyser on first interaction if autoplay succeeded automatically
  useEffect(() => {
    if (!isPlaying || analyser) return;
    const connectGraph = () => {
      ensureAudioGraph();
    };
    window.addEventListener('pointerup', connectGraph, { once: true });
    window.addEventListener('keydown', connectGraph, { once: true });
    return () => {
      window.removeEventListener('pointerup', connectGraph);
      window.removeEventListener('keydown', connectGraph);
    };
  }, [analyser, ensureAudioGraph, isPlaying]);

  const resetListenTracker = useCallback((trackId: string | undefined, startTime = 0) => {
    const prevPassId = listenTrackerRef.current.passId;
    listenTrackerRef.current = {
      trackId: trackId ?? '',
      passId: prevPassId + 1,
      accumulatedSec: 0,
      lastMediaTime: Math.max(0, startTime),
      counted: false,
    };
  }, []);

  const applyPlayerPlaysToPlaylist = useCallback(() => {
    setPlaylist((prev) => {
      let changed = false;
      const next = prev.map((tr) => {
        if (!isValidTrackStatId(tr.id)) return tr;
        const base = audiusBasePlaysRef.current.get(tr.id);
        const extra = playerPlaysCacheRef.current.get(tr.id) ?? 0;
        if (typeof base !== 'number' && extra <= 0) return tr;
        const total = (base ?? 0) + extra;
        if (tr.playCount === total) return tr;
        changed = true;
        return { ...tr, playCount: total };
      });
      if (changed) {
        playlistRef.current = next;
      }
      return changed ? next : prev;
    });
  }, []);

  const syncPlayerPlaysForTracks = useCallback(
    async (tracks: Track[]) => {
      const ids = tracks.map((tr) => tr.id).filter((id) => isValidTrackStatId(id));
      if (ids.length === 0) return;
      try {
        const fetched = await fetchTrackPlayerPlays(ids);
        for (const [id, count] of Object.entries(fetched)) {
          const prevCached = playerPlaysCacheRef.current.get(id) ?? 0;
          if (count > prevCached) {
            playerPlaysCacheRef.current.set(id, count);
          }
        }
        applyPlayerPlaysToPlaylist();
      } catch {
        // Ignore non-fatal stats sync errors
      }
    },
    [applyPlayerPlaysToPlaylist]
  );

  const recordAudiusTrackListen = useCallback(
    async (trackId: string) => {
      if (!isValidTrackStatId(trackId)) return;
      const prevCached = playerPlaysCacheRef.current.get(trackId) ?? 0;
      const optimistic = prevCached + 1;
      playerPlaysCacheRef.current.set(trackId, optimistic);
      applyPlayerPlaysToPlaylist();

      try {
        const confirmed = await incrementTrackPlayerPlay(trackId);
        if (typeof confirmed === 'number') {
          const currentBest = playerPlaysCacheRef.current.get(trackId) ?? 0;
          playerPlaysCacheRef.current.set(
            trackId,
            Math.max(confirmed, currentBest === optimistic ? confirmed : currentBest)
          );
          applyPlayerPlaysToPlaylist();
        } else if ((playerPlaysCacheRef.current.get(trackId) ?? 0) === optimistic) {
          playerPlaysCacheRef.current.set(trackId, prevCached);
          applyPlayerPlaysToPlaylist();
        }
      } catch {
        if ((playerPlaysCacheRef.current.get(trackId) ?? 0) === optimistic) {
          playerPlaysCacheRef.current.set(trackId, prevCached);
          applyPlayerPlaysToPlaylist();
        }
      }
    },
    [applyPlayerPlaysToPlaylist]
  );

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
        const { tracks: fetchedTracks, resolvedHandle } = await fetchAudiusProfileTracks(handle);
        revokeLocalObjectUrls();

        const shouldShuffleOnLaunch = Boolean(options?.isInitial);
        if (shouldShuffleOnLaunch) {
          playlistSortModeRef.current = null;
          setPlaylistSortMode(null);
        }

        const orderedTracks = shouldShuffleOnLaunch
          ? shuffleTracksArray(fetchedTracks)
          : fetchedTracks;

        orderedTracks.forEach((tr) => {
          if (isValidTrackStatId(tr.id) && typeof tr.playCount === 'number') {
            audiusBasePlaysRef.current.set(tr.id, tr.playCount);
          }
        });

        const mergedTracks = orderedTracks.map((tr) => {
          if (!isValidTrackStatId(tr.id)) return tr;
          const extra = playerPlaysCacheRef.current.get(tr.id) ?? 0;
          if (extra <= 0) return tr;
          return { ...tr, playCount: (tr.playCount ?? 0) + extra };
        });

        const activeSortMode = !shouldShuffleOnLaunch ? playlistSortModeRef.current : null;
        const tracks = activeSortMode
          ? sortTracksByMode(mergedTracks, activeSortMode)
          : mergedTracks;

        const { index, seekTime } = shouldShuffleOnLaunch
          ? { index: 0, seekTime: 0 }
          : resolveRestoreTarget(tracks, options?.restore);
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
        resetListenTracker(targetTrack?.id, seekTime);
        void syncPlayerPlaysForTracks(tracks);

        activeSessionRef.current = {
          sourceType: 'audius',
          audiusHandle: resolvedHandle,
        };
        initialRestoreConsumedRef.current = true;

        if (autoVisualPerTrack) {
          randomizeVisual();
        }

        if (targetTrack) {
          loadTrackIntoMediaElements(targetTrack, seekTime);
        }

        if (!options?.isInitial) {
          try {
            localStorage.setItem(STORAGE_MANUAL_AUDIUS_KEY, '1');
          } catch {
            // ignore
          }
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
          started = await startPlaybackSafe(!options.isInitial, targetTrack);
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
        const isBrowserOnline =
          typeof navigator === 'undefined' ? true : navigator.onLine;
        const fallbackStation = getDefaultFmStationsForLang(lang)[0];
        if (options?.isInitial && fallbackStation && isBrowserOnline) {
          const fallbackLabel = getFmStationLabel(fallbackStation, lang);
          let fallbackHost = 'RadioFM';
          try {
            fallbackHost = new URL(fallbackStation.url).hostname;
          } catch {
            // ignore
          }
          const fallbackUrlId = `url-${hashString(fallbackStation.url)}`;
          const radioTrack: Track = {
            id: `url-stream-${fallbackStation.url}`,
            title: fallbackLabel,
            artist: fallbackHost,
            cover: DEFAULT_COVER_IMAGE,
            src: fallbackStation.url,
            sourceName: 'RadioFM',
            mediaType: 'audio',
            isRadio: true,
          };
          revokeLocalObjectUrls();
          playlistSortModeRef.current = null;
          setPlaylistSortMode(null);
          playlistRef.current = [radioTrack];
          currentIndexRef.current = 0;
          initialRestoreConsumedRef.current = true;
          activeSessionRef.current = {
            sourceType: 'url',
            url: fallbackStation.url,
          };
          setPendingFolderRestore(null);
          setPlaylist([radioTrack]);
          setCurrentIndex(0);
          setCurrentTime(0);
          setDuration(0);
          setActiveFolderId(null);
          setActiveUrlId(fallbackUrlId);
          setLoadError(null);
          loadTrackIntoMediaElements(radioTrack, 0);
          if (options?.autoPlay) {
            const started = await startPlaybackSafe(false, radioTrack);
            if (!started) {
              setAwaitingAutoplayUnlock(true);
            }
          }
          trackEvent('source_radio_fallback', { handle, station: fallbackStation.key });
        } else if (options?.isInitial && !isBrowserOnline) {
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
      lang,
      persistCurrentSession,
      randomizeVisual,
      resetListenTracker,
      revokeLocalObjectUrls,
      saveProfileToHistory,
      showToast,
      startPlaybackSafe,
      syncPlayerPlaysForTracks,
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

        playlistSortModeRef.current = null;
        setPlaylistSortMode(null);
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
        if (targetTrack) {
          loadTrackIntoMediaElements(targetTrack, seekTime);
          if (shouldPlay) {
            started = await startPlaybackSafe(!options?.isInitial, targetTrack);
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
        persistFiles?: boolean;
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
        return relA.localeCompare(relB, undefined, { numeric: true, sensitivity: 'base' });
      });

      setIsParsingFiles(true);
      pendingSeekRef.current = null;
      try {
        const parsedTracks: Track[] = [];
        const newObjectUrls: string[] = [];

        for (let i = 0; i < sortedFiles.length; i++) {
          const file = sortedFiles[i];
          const isVideo =
            file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
          const isImage =
            file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
          const mediaType: MediaKind = isVideo ? 'video' : isImage ? 'image' : 'audio';

          const mediaUrl = URL.createObjectURL(file);
          newObjectUrls.push(mediaUrl);

          let title = file.name.replace(/\.[^/.]+$/, '');
          let artist = folderName;
          let cover = isImage ? mediaUrl : DEFAULT_COVER_IMAGE;

          if (mediaType === 'audio') {
            const tags = await parseAudioMetadata(file);
            if (tags.coverUrl) {
              newObjectUrls.push(tags.coverUrl);
              cover = tags.coverUrl;
            }
            if (tags.title) title = tags.title;
            if (tags.artist) artist = tags.artist;
          }

          parsedTracks.push({
            id: `local-${folderId}-${i}-${file.name}-${file.size}`,
            title,
            artist,
            cover,
            src: mediaUrl,
            durationHint: isImage ? IMAGE_SLIDE_DURATION_SEC : undefined,
            sourceName: `${t.folderPrefix}: ${folderName}`,
            mediaType,
            isObjectUrl: true,
          });
        }

        if (options?.saveHandle) {
          await saveDirectoryHandle(folderId, options.saveHandle);
        }
        if (options?.persistFiles !== false) {
          await saveFolderFiles(folderId, sortedFiles);
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
          void saveSavedFoldersMeta(next);
          return next;
        });

        const { index, seekTime } = resolveRestoreTarget(parsedTracks, options?.restore);
        const targetTrack = parsedTracks[index];

        playlistSortModeRef.current = null;
        setPlaylistSortMode(null);
        playlistRef.current = parsedTracks;
        currentIndexRef.current = index;
        setPendingFolderRestore(null);
        setPlaylist(parsedTracks);
        setCurrentIndex(index);
        setCurrentTime(seekTime);
        setDuration(targetTrack?.durationHint ?? 0);
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
        if (targetTrack) {
          loadTrackIntoMediaElements(targetTrack, seekTime);
          if (shouldPlay) {
            started = await startPlaybackSafe(!options?.isInitial, targetTrack);
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
          if (targetTrack?.mediaType === 'video') {
            showToast(studioT.videoLoadedToast(targetTrack.title), 'info');
          } else if (targetTrack?.mediaType === 'image') {
            showToast(studioT.imageLoadedToast(targetTrack.title), 'success');
          } else {
            showToast(
              options?.toastType === 'opened'
                ? t.folderOpenedToast(folderName)
                : t.folderLoadedToast(folderName, parsedTracks.length),
              'success'
            );
          }
        }
      } finally {
        setIsParsingFiles(false);
      }
    },
    [
      autoVisualPerTrack,
      loadTrackIntoMediaElements,
      persistCurrentSession,
      randomizeVisual,
      showToast,
      startPlaybackSafe,
      studioT,
      t,
    ]
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
        (f) =>
          f.type.startsWith('audio/') ||
          f.type.startsWith('video/') ||
          f.type.startsWith('image/') ||
          /\.(mp3|flac|wav|ogg|m4a|aac|mp4|webm|mov|m4v|jpg|jpeg|png|webp|gif)$/i.test(f.name)
      );

      if (files.length === 0) {
        showToast(t.noAudioInFolderToast, 'error');
        return;
      }

      const firstRel = files[0]?.webkitRelativePath;
      const folderName = firstRel
        ? firstRel.split('/')[0]
        : files.length === 1
        ? files[0].name.replace(/\.[^/.]+$/, '') || t.localFilesLabel
        : t.localFilesLabel;
      const identitySeed = firstRel
        ? `${folderName}-${files.length}`
        : `${folderName}-${files.map((f) => `${f.name}:${f.size}`).join('|')}`;
      const folderId = `folder-${hashString(identitySeed)}`;
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
        playlistSortModeRef.current = null;
        setPlaylistSortMode(null);
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
        if (targetTrack) {
          loadTrackIntoMediaElements(targetTrack, seekTime);
          started = await startPlaybackSafe(true, targetTrack);
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

      const idbFiles = await getFolderFiles(folder.id);
      if (idbFiles && idbFiles.length > 0) {
        await loadParsedAudioFiles(idbFiles, folder.id, folder.name, {
          restore: matchingPending,
          closeModal: true,
          autoPlay: true,
          toastType: 'opened',
          persistFiles: false,
        });
        return;
      }

      try {
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
      } catch {
        // Permission denied or handle revoked; fall through to reselect prompt
      }

      showToast(t.reselectFolderToast(folder.name), 'info');
      if (
        typeof window !== 'undefined' &&
        'showDirectoryPicker' in window &&
        window.self === window.top
      ) {
        void handleSelectDirectoryPicker();
      } else {
        reselectFolderInputRef.current?.click();
      }
    },
    [
      autoVisualPerTrack,
      handleSelectDirectoryPicker,
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
      mirrorRetriesRef.current = 0;
      try {
        const { tracks: rawTracks, label: rawLabel, normalizedUrl } =
          await loadTracksFromUrlSource(rawUrl);
        const matchedStation = findDefaultFmStationByUrl(normalizedUrl);
        const localizedStationName = matchedStation
          ? getFmStationLabel(matchedStation, lang)
          : null;
        const urlId = `url-${hashString(normalizedUrl)}`;
        const existingSavedEntry = savedUrlsRef.current.find(
          (u) => u.url === normalizedUrl || u.id === urlId
        );
        const hasSavedRadioLabel = Boolean(
          existingSavedEntry &&
            /^(?:RadioFM|РадиоФМ|РадіоФМ)(?:\s*:\s*|$)/i.test(existingSavedEntry.label.trim())
        );
        const tracks = localizedStationName
          ? rawTracks.map((tr) => ({
              ...tr,
              title: localizedStationName,
              sourceName: 'RadioFM',
              isRadio: true,
            }))
          : hasSavedRadioLabel
          ? rawTracks.map((tr) =>
              tr.mediaType === 'video' || tr.mediaType === 'image'
                ? tr
                : {
                    ...tr,
                    sourceName: 'RadioFM',
                    isRadio: true,
                  }
            )
          : rawTracks;
        const label = localizedStationName ? `${t.radioFmLabel}: ${localizedStationName}` : rawLabel;
        revokeLocalObjectUrls();

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

        playlistSortModeRef.current = null;
        setPlaylistSortMode(null);
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
        let autoRadioCarouselSec: number | null = null;
        const shouldPlay = options?.autoPlay ?? true;
        if (targetTrack) {
          autoRadioCarouselSec = syncRadioCarouselForTrack(targetTrack, {
            force: !options?.isInitial,
          });
          loadTrackIntoMediaElements(targetTrack, seekTime);
          if (shouldPlay) {
            started = await startPlaybackSafe(!options?.isInitial, targetTrack);
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
          if (autoRadioCarouselSec !== null) {
            showToast(studioT.carouselEnabledToast(autoRadioCarouselSec), 'info');
          }
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
      lang,
      loadTrackIntoMediaElements,
      persistCurrentSession,
      randomizeVisual,
      revokeLocalObjectUrls,
      showToast,
      startPlaybackSafe,
      studioT,
      syncRadioCarouselForTrack,
      t,
    ]
  );

  const handleCycleFmStation = useCallback(async (step: 1 | -1 = 1) => {
    const builtInStations = getDefaultFmStationsForLang(lang).map((station) => ({
      key: station.key,
      url: station.url,
      urlId: `url-${hashString(station.url)}`,
      label: getFmStationLabel(station, lang),
      isCustom: false,
    }));
    const builtInUrlSet = new Set(builtInStations.map((s) => s.url));

    const customStations = savedUrlsRef.current
      .filter((entry) => {
        if (!entry.url || findDefaultFmStationByUrl(entry.url) || builtInUrlSet.has(entry.url)) {
          return false;
        }
        return /^(?:RadioFM|РадиоФМ|РадіоФМ)(?:\s*:\s*|$)/i.test(entry.label.trim());
      })
      .map((entry) => {
        const strippedLabel = entry.label
          .replace(/^(?:RadioFM|РадиоФМ|РадіоФМ)\s*:\s*/i, '')
          .trim();
        const shortName =
          strippedLabel && !/^(?:RadioFM|РадиоФМ|РадіоФМ)$/i.test(strippedLabel)
            ? strippedLabel
            : extractShortRadioName(entry.url) || t.radioFmLabel;
        return {
          key: `custom-${entry.id}`,
          url: entry.url,
          urlId: entry.id,
          label: shortName,
          isCustom: true,
        };
      });

    const fmStations = [...customStations, ...builtInStations];
    if (lastFmLangRef.current !== lang) {
      lastFmIndexRef.current = -1;
      lastFmLangRef.current = lang;
    }

    const activeTrackNow = playlistRef.current[currentIndexRef.current];
    const activeUrlNow = activeUrlIdRef.current;
    const currentMatchedIdx = fmStations.findIndex(
      (s) =>
        (activeTrackNow?.src && s.url === activeTrackNow.src) ||
        (activeUrlNow && s.urlId === activeUrlNow)
    );
    const totalStations = fmStations.length;
    const nextIdx =
      currentMatchedIdx !== -1
        ? (currentMatchedIdx + step + totalStations) % totalStations
        : (lastFmIndexRef.current + step + totalStations) % totalStations;
    lastFmIndexRef.current = nextIdx;

    const station = fmStations[nextIdx];
    const stationLabel = station.label;
    const urlId = station.urlId;

    window.clearTimeout(fmFlyoutTimerRef.current);
    const flyId = ++fmFlyoutSeqRef.current;
    setFmFlyout({ id: flyId, label: stationLabel });
    fmFlyoutTimerRef.current = window.setTimeout(() => {
      setFmFlyout((prev) => (prev?.id === flyId ? null : prev));
    }, 2200);

    let host = 'radio';
    try {
      host = new URL(station.url).hostname;
    } catch {
      // ignore
    }

    let radioTrack: Track = {
      id: `url-stream-${station.url}`,
      title: stationLabel,
      artist: host,
      cover: DEFAULT_COVER_IMAGE,
      src: station.url,
      sourceName: 'RadioFM',
      mediaType: 'audio',
      isRadio: true,
    };

    if (station.isCustom && /\.(m3u8?|pls)(\?.*)?$/i.test(station.url)) {
      try {
        const parsed = await loadTracksFromUrlSource(station.url);
        if (parsed.tracks.length > 0) {
          radioTrack = {
            ...parsed.tracks[0],
            title: parsed.tracks[0].title || stationLabel,
            sourceName: 'RadioFM',
            isRadio: true,
          };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.urlErrorFallback;
        showToast(msg, 'error');
        return;
      }
    }

    revokeLocalObjectUrls();
    pendingSeekRef.current = null;
    mirrorRetriesRef.current = 0;

    if (!station.isCustom) {
      setSavedUrls((prev) => {
        if (prev.some((u) => u.url === station.url || u.id === urlId)) {
          return prev;
        }
        const next = [
          ...prev,
          {
            id: urlId,
            url: station.url,
            label: `${t.radioFmLabel}: ${stationLabel}`,
            addedAt: Date.now(),
          },
        ];
        try {
          localStorage.setItem(STORAGE_URLS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }

    playlistSortModeRef.current = null;
    setPlaylistSortMode(null);
    playlistRef.current = [radioTrack];
    currentIndexRef.current = 0;
    setPendingFolderRestore(null);
    setPlaylist([radioTrack]);
    setCurrentIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setActiveUrlId(urlId);
    setActiveFolderId(null);

    activeSessionRef.current = {
      sourceType: 'url',
      url: station.url,
    };
    initialRestoreConsumedRef.current = true;

    if (autoVisualPerTrack) {
      randomizeVisual();
    }

    syncRadioCarouselForTrack(radioTrack, { force: true });
    loadTrackIntoMediaElements(radioTrack, 0);
    const started = await startPlaybackSafe(true, radioTrack);
    if (!started) {
      setAwaitingAutoplayUnlock(true);
    }

    persistCurrentSession({
      sourceType: 'url',
      url: station.url,
      trackId: radioTrack.id,
      trackTitle: radioTrack.title,
      trackArtist: radioTrack.artist,
      trackIndex: 0,
      currentTime: 0,
      wasPlaying: started,
    });

    trackEvent('fm_station_switch', {
      station: station.key,
      index: nextIdx,
    });
  }, [
    autoVisualPerTrack,
    lang,
    loadTrackIntoMediaElements,
    persistCurrentSession,
    randomizeVisual,
    revokeLocalObjectUrls,
    showToast,
    startPlaybackSafe,
    syncRadioCarouselForTrack,
    t,
  ]);

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

          // Fallback to persisted local IndexedDB blobs (works across reloads, iframes & single-file picks)
          const cachedFiles = await getFolderFiles(folderId);
          if (cachedFiles && cachedFiles.length > 0) {
            await loadParsedAudioFiles(cachedFiles, folderId, folderName, {
              saveHandle: dirHandle ?? undefined,
              persistFiles: false,
              restore,
              closeModal: false,
              autoPlay: session.wasPlaying !== false,
              isInitial: true,
              toastType: 'opened',
            });
            return;
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

    const browserDefaultHandle = getDefaultAudiusHandleForBrowser();
    const useManualAudius = isManualAudiusSelection();
    const targetHandle =
      session?.sourceType === 'audius' && session.audiusHandle
        ? useManualAudius
          ? session.audiusHandle
          : browserDefaultHandle
        : currentHandle || browserDefaultHandle;
    const effectiveRestore =
      session?.sourceType === 'audius' &&
      session.audiusHandle &&
      session.audiusHandle.toLowerCase() !== targetHandle.toLowerCase()
        ? undefined
        : restore;

    void loadAudiusTracks(targetHandle, {
      autoPlay: session ? session.wasPlaying !== false : true,
      isInitial: true,
      restore: effectiveRestore,
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
        const browserDefaultHandle = getDefaultAudiusHandleForBrowser();
        const useManualAudius = isManualAudiusSelection();
        const targetHandle =
          session?.audiusHandle && useManualAudius
            ? session.audiusHandle
            : browserDefaultHandle;
        const effectiveRestore =
          session?.audiusHandle &&
          session.audiusHandle.toLowerCase() !== targetHandle.toLowerCase()
            ? undefined
            : restore;
        void loadAudiusTracks(targetHandle, {
          autoPlay: false,
          isInitial: true,
          restore: effectiveRestore,
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
        const deletedLower = target.id.toLowerCase();
        if (isDefaultAudiusHandle(target.id)) {
          const deleted = getDeletedDefaultAudiusHandles();
          deleted.add(deletedLower);
          setDeletedDefaultAudiusHandles(deleted);
        }
        const nextProfiles = savedProfiles.filter((p) => p.toLowerCase() !== deletedLower);
        setSavedProfiles(nextProfiles);
        try {
          localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(nextProfiles));
        } catch {
          // ignore
        }
        if (currentHandle.toLowerCase() === deletedLower) {
          const fallbackHandle = nextProfiles[0] ?? '';
          setCurrentHandle(fallbackHandle || getDefaultAudiusHandleForBrowser());
          try {
            if (fallbackHandle) {
              localStorage.setItem(STORAGE_HANDLE_KEY, fallbackHandle);
              localStorage.setItem(STORAGE_MANUAL_AUDIUS_KEY, '1');
            } else {
              localStorage.removeItem(STORAGE_HANDLE_KEY);
              localStorage.removeItem(STORAGE_MANUAL_AUDIUS_KEY);
            }
            localStorage.removeItem('yritmx_playback_session');
          } catch {
            // ignore
          }
        }
        if (cloudUserRef.current) {
          void deleteCloudSourceItem(
            cloudUserRef.current.uid,
            'audius',
            toAudiusDocId(target.id)
          ).catch(() => {});
        }
        showToast(t.profileRemovedToast(target.label), 'info');
      } else if (target.type === 'folder') {
        const deletedFolder = savedFoldersRef.current.find((f) => f.id === target.id);
        folderCacheRef.current.delete(target.id);
        void deleteDirectoryHandle(target.id);
        void deleteFolderFiles(target.id);
        setSavedFolders((prev) => {
          const next = prev.filter((f) => f.id !== target.id);
          try {
            localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          void saveSavedFoldersMeta(next);
          return next;
        });
        if (cloudUserRef.current) {
          void deleteCloudSourceItem(
            cloudUserRef.current.uid,
            'folder',
            toFolderDocId({ id: target.id, name: deletedFolder?.name || target.label })
          ).catch(() => {});
        }
        if (activeFolderId === target.id) setActiveFolderId(null);
        showToast(t.folderRemovedToast(target.label), 'info');
      } else if (target.type === 'url') {
        const deletedUrl = savedUrlsRef.current.find((u) => u.id === target.id);
        setSavedUrls((prev) => {
          const next = prev.filter((u) => u.id !== target.id);
          try {
            localStorage.setItem(STORAGE_URLS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        if (cloudUserRef.current && deletedUrl) {
          void deleteCloudSourceItem(
            cloudUserRef.current.uid,
            'url',
            toUrlDocId(deletedUrl)
          ).catch(() => {});
        }
        if (activeUrlId === target.id) setActiveUrlId(null);
        showToast(t.urlRemovedToast(target.label), 'info');
      }
    },
    [activeFolderId, activeUrlId, currentHandle, savedProfiles, showToast, t]
  );

  const selectTrack = useCallback(
    async (index: number, autoPlay = true, keepRecording = false) => {
      if (index < 0 || index >= playlist.length) return;
      if (!keepRecording && isRecordingRef.current && mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      const track = playlist[index];
      const sameSingleTrackLoop =
        playlist.length === 1 && index === currentIndexRef.current && isStudioModeRef.current;
      pendingSeekRef.current = null;
      resetListenTracker(track.id, 0);
      currentIndexRef.current = index;
      setCurrentIndex(index);
      setCurrentTime(0);
      setDuration(track.mediaType === 'image' ? IMAGE_SLIDE_DURATION_SEC : track.durationHint ?? 0);
      trackEvent('track_select', {
        track_title: track.title,
        artist: track.artist,
        index,
      });

      if (autoVisualPerTrack && !sameSingleTrackLoop) {
        randomizeVisual();
      }

      const autoRadioSec = syncRadioCarouselForTrack(track, { force: track.isRadio });
      loadTrackIntoMediaElements(track, 0);
      if (autoRadioSec !== null && !sameSingleTrackLoop) {
        showToast(studioT.carouselEnabledToast(autoRadioSec), 'info');
      }

      let started = false;
      if (autoPlay) {
        started = await startPlaybackSafe(true, track);
        if (!started) {
          showToast(t.pressPlayToast, 'info');
        } else if (track.mediaType === 'video' && !isStudioModeRef.current && !sameSingleTrackLoop) {
          showToast(studioT.videoLoadedToast(track.title), 'info');
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
      loadTrackIntoMediaElements,
      persistCurrentSession,
      playlist,
      randomizeVisual,
      resetListenTracker,
      showToast,
      startPlaybackSafe,
      studioT,
      syncRadioCarouselForTrack,
      t,
    ]
  );

  const stopStudioRecording = useCallback(() => {
    if (offlineAbortRef.current) {
      offlineAbortRef.current.abort();
      offlineAbortRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
    const activeEl = getActiveMediaElement();
    if (activeEl && !activeEl.paused) {
      activeEl.pause();
    }
    if (
      customStageMediaRef.current?.kind === 'video' &&
      customBgVideoRef.current &&
      !customBgVideoRef.current.paused
    ) {
      customBgVideoRef.current.pause();
    }
    if (stageBgAudioRef.current && !stageBgAudioRef.current.paused) {
      stageBgAudioRef.current.pause();
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsPlaying(false);
  }, [getActiveMediaElement]);

  const startLiveMediaRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    if (playlistRef.current.length === 0) {
      await handleTriggerDemo();
    }
    const canvas = masterCanvasRef.current as
      | (HTMLCanvasElement & { captureStream?: (frameRate?: number) => MediaStream })
      | null;
    if (!canvas || typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      showToast(studioT.recordUnsupportedToast, 'error');
      isRecordArmedRef.current = false;
      setIsRecordArmed(false);
      return;
    }

    const activeTrack = playlistRef.current[currentIndexRef.current] ?? null;
    const mediaEl = activeTrack?.mediaType === 'image' ? null : getActiveMediaElement(activeTrack);
    if (!mediaEl && activeTrack?.mediaType !== 'image') {
      showToast(studioT.recordErrorToast, 'error');
      return;
    }

    ensureAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch {
        // ignore resume error
      }
    }

    if (activeTrack?.mediaType === 'image') {
      imageElapsedRef.current = 0;
      setCurrentTime(0);
      setDuration(IMAGE_SLIDE_DURATION_SEC);
    } else if (mediaEl) {
      internalPauseIgnoreUntilRef.current = performance.now() + 250;
      mediaEl.pause();
      if (!mediaEl.src && activeTrack) {
        mediaEl.src = activeTrack.src;
      }
      try {
        mediaEl.currentTime = 0;
        setCurrentTime(0);
      } catch {
        // ignore non-seekable streams
      }
    }

    try {
      const recDims = getRecordingDimensions(recordAspect, recordQuality);
      if (canvas.width !== recDims.exportWidth || canvas.height !== recDims.exportHeight) {
        canvas.width = recDims.exportWidth;
        canvas.height = recDims.exportHeight;
        const c2d = canvas.getContext('2d');
        if (c2d) {
          c2d.setTransform(
            recDims.exportWidth / recDims.logicalWidth,
            0,
            0,
            recDims.exportHeight / recDims.logicalHeight,
            0,
            0
          );
        }
      }

      const canvasStream = canvas.captureStream(30);
      const audioTracks = streamDestRef.current?.stream.getAudioTracks() ?? [];
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);

      const mimeCandidates = [
        'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        'video/mp4',
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp8,opus',
        'video/webm',
      ];
      const chosenMime = mimeCandidates.find((mime) => MediaRecorder.isTypeSupported(mime));

      const recorder = new MediaRecorder(
        combinedStream,
        chosenMime
          ? {
              mimeType: chosenMime,
              videoBitsPerSecond: recDims.bitrate,
              audioBitsPerSecond: 192_000,
            }
          : {
              videoBitsPerSecond: recDims.bitrate,
              audioBitsPerSecond: 192_000,
            }
      );

      recordedChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        canvasStream.getTracks().forEach((tr) => tr.stop());
        const elapsedSec = Math.max(
          0.2,
          (performance.now() - recordingStartPerfRef.current) / 1000
        );
        const blobType = chosenMime || recorder.mimeType || 'video/mp4';
        const rawBlob = new Blob(recordedChunksRef.current, { type: blobType });
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        setIsRecording(false);

        if (rawBlob.size > 0) {
          const ext = blobType.includes('webm') ? 'webm' : 'mp4';
          void (async () => {
            const finalBlob =
              ext === 'mp4' ? await safeFixMp4(rawBlob, elapsedSec) : rawBlob;
            const url = URL.createObjectURL(finalBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `yritmx-space-studio.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.setTimeout(() => URL.revokeObjectURL(url), 4000);
            showToast(studioT.recordSavedToast, 'success');
            trackEvent('studio_mp4_exported', {
              mode: 'live',
              mime_type: blobType,
              bytes: finalBlob.size,
              studio_mode: isStudioModeRef.current,
              aspect: recordAspect,
              quality: recordQuality,
            });
          })();
        }
      };

      recorder.onerror = () => {
        canvasStream.getTracks().forEach((tr) => tr.stop());
        mediaRecorderRef.current = null;
        isRecordingRef.current = false;
        setIsRecording(false);
        showToast(studioT.recordErrorToast, 'error');
      };

      mediaRecorderRef.current = recorder;
      recordingStartPerfRef.current = performance.now();
      setRecordingElapsedSec(0);
      recordingStallCheckRef.current = { lastTime: -1, stagnantTicks: 0, recovering: false };
      isRecordingRef.current = true;
      setIsRecording(true);
      recorder.start(250);

      if (mediaEl) {
        await mediaEl.play();
      }
      if (
        customStageMediaRef.current?.kind === 'video' &&
        customBgVideoRef.current
      ) {
        try {
          customBgVideoRef.current.currentTime = 0;
        } catch {
          // ignore
        }
        void customBgVideoRef.current.play().catch(() => {});
      }
      if (
        stageAudioRef.current &&
        stageBgAudioRef.current &&
        (activeTrack?.mediaType === 'video' || activeTrack?.mediaType === 'image')
      ) {
        try {
          stageBgAudioRef.current.currentTime = 0;
        } catch {
          // ignore
        }
        void stageBgAudioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
      showToast(studioT.recordStartedToast, 'info');
      trackEvent('studio_mp4_record_start', {
        mode: 'live',
        media_type: activeTrack?.mediaType || 'audio',
        studio_mode: isStudioMode,
        aspect: recordAspect,
        quality: recordQuality,
      });
    } catch {
      mediaRecorderRef.current = null;
      isRecordingRef.current = false;
      setIsRecording(false);
      showToast(studioT.recordErrorToast, 'error');
    }
  }, [
    ensureAudioGraph,
    getActiveMediaElement,
    handleTriggerDemo,
    isStudioMode,
    recordAspect,
    recordQuality,
    showToast,
    studioT,
  ]);

  const startOfflineRenderExport = useCallback(async () => {
    if (isRecordingRef.current) return;
    if (playlistRef.current.length === 0) {
      await handleTriggerDemo();
    }
    const tracksSnapshot = playlistRef.current;
    if (tracksSnapshot.length === 0) {
      showToast(studioT.recordErrorToast, 'error');
      return;
    }

    const cap = await resolveOfflineVideoCapability(recordAspect, recordQuality);
    if (!cap.supported) {
      showToast(studioT.offlineUnsupportedFallbackToast, 'info');
      setRecordRenderMode('live');
      try {
        localStorage.setItem(STORAGE_RECORD_RENDER_MODE_KEY, 'live');
      } catch {
        // ignore
      }
      await startLiveMediaRecording();
      return;
    }

    const activeEl = getActiveMediaElement();
    if (activeEl && !activeEl.paused) {
      activeEl.pause();
    }
    setIsPlaying(false);

    const controller = new AbortController();
    offlineAbortRef.current = controller;
    isRecordingRef.current = true;
    setIsRecording(true);
    setOfflineExportState({ progress: 0, stage: 'preparing' });

    const isCleanBackdropNow =
      !cameraOverlayActiveRef.current &&
      customStageMedia?.displayMode === 'backdrop' &&
      customStageMedia.backdropOverlay === 'clean';
    const orbsSnap =
      !uiVisible &&
      showOrbs &&
      !isStudioModeRef.current &&
      !isCleanBackdropNow &&
      liveOrbsSnapshotRef.current.length > 0
        ? liveOrbsSnapshotRef.current
        : null;

    trackEvent('studio_mp4_record_start', {
      mode: 'offline',
      media_type: tracksSnapshot[currentIndexRef.current]?.mediaType || 'audio',
      studio_mode: isStudioModeRef.current,
      aspect: recordAspect,
      quality: recordQuality,
    });

    try {
      const currentMediaType = tracksSnapshot[currentIndexRef.current]?.mediaType;
      const isMainFullscreenMedia =
        currentMediaType === 'video' || currentMediaType === 'image';
      const result = await exportStudioVideoOffline({
        tracks: tracksSnapshot,
        startIndex: currentIndexRef.current,
        allowMultiSlide: !isShuffle && !isRepeat,
        imageSlideDurationSec: IMAGE_SLIDE_DURATION_SEC,
        aspect: recordAspect,
        quality: recordQuality,
        vizMode,
        paletteIndex,
        visualDna,
        isCarouselMode,
        carouselIntervalSec,
        mixEnabled,
        isZenMode: !uiVisible,
        studioActive: isStudioModeRef.current,
        layeredBg: mixEnabled && visualDna.mixLayers.length > 0,
        eqGains,
        volume,
        isMuted,
        studioFrameSnapshot: studioFrameStateRef.current,
        customStageMedia,
        stageAudio: isMainFullscreenMedia ? stageAudio : null,
        coverFrameMotion,
        coverRotationTarget,
        showCoverCaption,
        orbSnapshots: orbsSnap,
        orbViewportWidth: window.innerWidth,
        orbViewportHeight: window.innerHeight,
        previewCanvas: null,
        onProgress: (info) => {
          setOfflineExportState(info);
        },
        signal: controller.signal,
      });

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yritmx-space-studio.${result.fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);

      showToast(
        studioT.offlineSavedToast(`${result.width}×${result.height}`, result.fps),
        'success'
      );
      trackEvent('studio_mp4_exported', {
        mode: 'offline',
        mime_type: 'video/mp4',
        bytes: result.blob.size,
        studio_mode: isStudioModeRef.current,
        aspect: recordAspect,
        quality: recordQuality,
      });
    } catch (err) {
      if (isExportAbortError(err)) {
        showToast(studioT.offlineCancelledToast, 'info');
      } else if (err instanceof OfflineCorsAudioError) {
        showToast(studioT.offlineCorsFallbackToast, 'error');
      } else {
        console.error('[Offline Export Error]', err);
        showToast(studioT.recordErrorToast, 'error');
      }
    } finally {
      offlineAbortRef.current = null;
      isRecordingRef.current = false;
      setIsRecording(false);
      setOfflineExportState(null);
    }
  }, [
    carouselIntervalSec,
    coverFrameMotion,
    coverRotationTarget,
    customStageMedia,
    eqGains,
    getActiveMediaElement,
    handleTriggerDemo,
    isCarouselMode,
    isMuted,
    isRepeat,
    isShuffle,
    mixEnabled,
    paletteIndex,
    recordAspect,
    recordQuality,
    showCoverCaption,
    showOrbs,
    showToast,
    stageAudio,
    startLiveMediaRecording,
    studioT,
    uiVisible,
    visualDna,
    vizMode,
    volume,
  ]);

  const startStudioRecording = useCallback(async () => {
    if (recordRenderMode === 'offline') {
      await startOfflineRenderExport();
      return;
    }
    await startLiveMediaRecording();
  }, [recordRenderMode, startLiveMediaRecording, startOfflineRenderExport]);

  const togglePlay = useCallback(async () => {
    if (playlist.length === 0) {
      await handleTriggerDemo();
      return;
    }

    const mediaEl = getActiveMediaElement();
    if (currentTrack?.mediaType === 'image') {
      setIsPlaying((p) => !p);
      return;
    }
    if (!mediaEl) return;

    if (!usingDirectAudioFallbackRef.current) {
      ensureAudioGraph();
    }

    const ctxBlocked =
      !usingDirectAudioFallbackRef.current &&
      audioCtxRef.current != null &&
      audioCtxRef.current.state !== 'running';
    const mediaActuallyPausedOrBroken =
      mediaEl.paused ||
      Boolean(mediaEl.error) ||
      mediaEl.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;

    if (isPlaying && !mediaActuallyPausedOrBroken && !ctxBlocked) {
      playbackIntentRef.current = false;
      mediaEl.pause();
      setIsPlaying(false);
      persistCurrentSession({
        currentTime: mediaEl.currentTime,
        wasPlaying: false,
      });
      trackEvent('audio_pause', {
        track_title: currentTrack?.title,
        artist: currentTrack?.artist,
      });
    } else {
      playbackIntentRef.current = true;
      if (!mediaEl.src && currentTrack) {
        mediaEl.src = currentTrack.src;
      }
      const started = await recoverPlaybackFromBackground(true);
      if (started) {
        persistCurrentSession({
          currentTime: mediaEl.currentTime,
          wasPlaying: true,
        });
        trackEvent('audio_play', {
          track_title: currentTrack?.title,
          artist: currentTrack?.artist,
        });
      } else if (!usingDirectAudioFallbackRef.current) {
        showToast(t.streamFailedToast, 'error');
      }
    }
  }, [
    currentTrack,
    ensureAudioGraph,
    getActiveMediaElement,
    handleTriggerDemo,
    isPlaying,
    persistCurrentSession,
    playlist.length,
    recoverPlaybackFromBackground,
    showToast,
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

  // Recover AudioContext & stalled/suspended playback when mobile app returns from background/sleep
  useEffect(() => {
    const handleWake = () => {
      if (document.visibilityState === 'hidden') return;
      void recoverPlaybackFromBackground(false);
    };
    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('pageshow', handleWake);
    window.addEventListener('focus', handleWake);
    window.addEventListener('online', handleWake);
    return () => {
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('pageshow', handleWake);
      window.removeEventListener('focus', handleWake);
      window.removeEventListener('online', handleWake);
    };
  }, [recoverPlaybackFromBackground]);

  // Sync MediaSession metadata, playbackState, and lockscreen/headset hardware controls
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    if (!currentTrack) {
      try {
        ms.metadata = null;
      } catch {
        // ignore
      }
      return;
    }
    try {
      const artworkSrc = currentTrack.cover || DEFAULT_COVER_IMAGE;
      const resolvedArtworkSrc = artworkSrc.startsWith('/')
        ? `${window.location.origin}${artworkSrc}`
        : artworkSrc;
      ms.metadata = new MediaMetadata({
        title: coverDisplayTitle || currentTrack.title,
        artist: coverDisplayArtist || currentTrack.artist,
        album: currentTrack.isRadio ? t.radioFmLabel : currentTrack.sourceName,
        artwork: resolvedArtworkSrc ? [{ src: resolvedArtworkSrc }] : [],
      });
    } catch {
      // ignore if MediaMetadata is unavailable
    }
  }, [coverDisplayArtist, coverDisplayTitle, currentTrack, t.radioFmLabel]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // ignore
    }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // ignore unsupported MediaSession actions
      }
    };

    setHandler('play', () => {
      playbackIntentRef.current = true;
      void recoverPlaybackFromBackground(true);
    });
    setHandler('pause', () => {
      playbackIntentRef.current = false;
      const mediaEl = getActiveMediaElement();
      if (mediaEl && !mediaEl.paused) {
        mediaEl.pause();
      }
      setIsPlaying(false);
      persistCurrentSession({
        currentTime: mediaEl?.currentTime ?? 0,
        wasPlaying: false,
      });
    });
    setHandler('previoustrack', () => {
      prevTrack();
    });
    setHandler('nexttrack', () => {
      nextTrack(true);
    });

    return () => {
      setHandler('play', null);
      setHandler('pause', null);
      setHandler('previoustrack', null);
      setHandler('nexttrack', null);
    };
  }, [
    getActiveMediaElement,
    nextTrack,
    persistCurrentSession,
    prevTrack,
    recoverPlaybackFromBackground,
  ]);

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
        if (isRecordingRef.current) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        void togglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay]);

  // Photo slideshow 5-second auto-advance timer (works in both Studio preview and MP4 recording)
  useEffect(() => {
    if (currentTrack?.mediaType !== 'image' || !isPlaying) return;
    setDuration(IMAGE_SLIDE_DURATION_SEC);
    let lastTick = performance.now();

    const timerId = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTick) / 1000;
      lastTick = now;
      imageElapsedRef.current += dt;
      const clamped = Math.min(IMAGE_SLIDE_DURATION_SEC, imageElapsedRef.current);
      setCurrentTime(clamped);

      if (imageElapsedRef.current >= IMAGE_SLIDE_DURATION_SEC) {
        if (isRecordingRef.current) {
          const hasNextSlide =
            playlistRef.current.length > 1 &&
            !isShuffle &&
            !isRepeat &&
            currentIndexRef.current + 1 < playlistRef.current.length &&
            playlistRef.current.some(
              (item) => item.mediaType === 'image' || item.mediaType === 'video'
            );
          if (hasNextSlide) {
            window.clearInterval(timerId);
            void selectTrack(currentIndexRef.current + 1, true, true);
            return;
          }
          window.clearInterval(timerId);
          stopStudioRecording();
          return;
        }

        if (isRepeat || playlistRef.current.length <= 1) {
          imageElapsedRef.current = 0;
          setCurrentTime(0);
        } else {
          window.clearInterval(timerId);
          nextTrack(true);
        }
      }
    }, 50);

    return () => window.clearInterval(timerId);
  }, [
    currentTrack?.id,
    currentTrack?.mediaType,
    isPlaying,
    isRepeat,
    isShuffle,
    nextTrack,
    selectTrack,
    stopStudioRecording,
  ]);

  const handleSeek = (clientX: number, rect: DOMRect) => {
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (currentTrack?.mediaType === 'image') {
      const nextTime = ratio * IMAGE_SLIDE_DURATION_SEC;
      imageElapsedRef.current = nextTime;
      setCurrentTime(nextTime);
      return;
    }
    const mediaEl = getActiveMediaElement();
    if (!mediaEl || !Number.isFinite(mediaEl.duration) || mediaEl.duration <= 0) return;
    pendingSeekRef.current = null;
    mediaEl.currentTime = ratio * mediaEl.duration;
    setCurrentTime(mediaEl.currentTime);
    persistCurrentSession({ currentTime: mediaEl.currentTime });
    trackEvent('audio_seek', { progress_pct: Math.round(ratio * 100) });
  };

  const handleAudioTimeUpdate = (el: HTMLAudioElement) => {
    setCurrentTime(el.currentTime);
    if (Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    }
    const activeTrackNow = playlistRef.current[currentIndexRef.current];
    if (
      activeTrackNow &&
      isValidTrackStatId(activeTrackNow.id) &&
      el === getActiveMediaElement(activeTrackNow) &&
      !el.paused &&
      !el.ended
    ) {
      const tracker = listenTrackerRef.current;
      if (tracker.trackId !== activeTrackNow.id) {
        resetListenTracker(activeTrackNow.id, el.currentTime);
      } else {
        const delta = el.currentTime - tracker.lastMediaTime;
        if (delta > 0 && delta <= 2.5) {
          tracker.accumulatedSec += delta;
        } else if (tracker.counted && delta < -3 && el.currentTime < 5) {
          resetListenTracker(activeTrackNow.id, el.currentTime);
        }
        listenTrackerRef.current.lastMediaTime = el.currentTime;
        if (!listenTrackerRef.current.counted && listenTrackerRef.current.accumulatedSec > 15) {
          listenTrackerRef.current.counted = true;
          void recordAudiusTrackListen(activeTrackNow.id);
        }
      }
    }
    const now = Date.now();
    if (now - lastTimeFlushRef.current >= 2000) {
      lastTimeFlushRef.current = now;
      persistCurrentSession({ currentTime: el.currentTime });
    }
  };

  const markActiveUrlStreamAsRadio = () => {
    const idx = currentIndexRef.current;
    const activeTrackNow = playlistRef.current[idx];
    if (
      !activeTrackNow ||
      activeTrackNow.mediaType === 'video' ||
      activeTrackNow.mediaType === 'image'
    ) {
      return;
    }
    const radioTrack: Track = activeTrackNow.isRadio
      ? activeTrackNow
      : {
          ...activeTrackNow,
          sourceName: activeTrackNow.sourceName || 'RadioFM',
          isRadio: true,
        };
    if (!activeTrackNow.isRadio) {
      const nextList = playlistRef.current.map((tr, i) => (i === idx ? radioTrack : tr));
      playlistRef.current = nextList;
      setPlaylist(nextList);
    }
    syncRadioCarouselForTrack(radioTrack);
  };

  const handleAudioDurationChange = (el: HTMLAudioElement) => {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    } else if (
      el.duration === Infinity &&
      activeSessionRef.current?.sourceType === 'url'
    ) {
      markActiveUrlStreamAsRadio();
    }
  };

  const handleAudioLoadedMetadata = (el: HTMLAudioElement) => {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    } else if (
      el.duration === Infinity &&
      activeSessionRef.current?.sourceType === 'url'
    ) {
      markActiveUrlStreamAsRadio();
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
  };

  const handleAudioPause = (el: HTMLMediaElement) => {
    if (el !== getActiveMediaElement()) return;
    if (isRecordingRef.current && isPlayingRef.current && !el.ended) {
      window.setTimeout(() => {
        if (isRecordingRef.current && isPlayingRef.current && el.paused && !el.ended) {
          void el.play().catch(() => {});
        }
      }, 60);
      return;
    }
    if (
      performance.now() > internalPauseIgnoreUntilRef.current &&
      !el.ended &&
      el.paused &&
      isPlayingRef.current
    ) {
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = (el: HTMLAudioElement) => {
    // Guard against remote audio CDN connections truncating prematurely mid-track during recording
    if (
      isRecordingRef.current &&
      Number.isFinite(el.duration) &&
      el.duration > 10 &&
      el.currentTime < el.duration - 2.5 &&
      el.src
    ) {
      pendingSeekRef.current = { src: el.src, time: el.currentTime };
      el.load();
      void el.play().catch(() => {});
      return;
    }

    trackEvent('track_complete', {
      track_title: currentTrack?.title,
      repeat: isRepeat,
    });
    if (isRecordingRef.current) {
      if (isRepeat) {
        resetListenTracker(playlistRef.current[currentIndexRef.current]?.id, 0);
        el.currentTime = 0;
        void el.play().catch(() => {});
        return;
      }
      const hasLiveSession =
        cameraOverlayActiveRef.current ||
        customStageMediaRef.current?.kind === 'camera' ||
        micEnabledRef.current;
      if (hasLiveSession) {
        if (playlistRef.current.length > 1) {
          const nextIdx = (currentIndexRef.current + 1) % playlistRef.current.length;
          void selectTrack(nextIdx, true, true);
        }
        return;
      }
      stopStudioRecording();
      return;
    }
    if (isRepeat) {
      resetListenTracker(playlistRef.current[currentIndexRef.current]?.id, 0);
      el.currentTime = 0;
      void el.play().catch(() => {});
    } else {
      nextTrack(true);
    }
  };

  const handleAudioStreamError = (source: 'cors' | 'fallback', el: HTMLAudioElement) => {
    if (playlistRef.current.length === 0) return;
    if (!el.getAttribute('src')) return;
    if (source === 'cors' && usingDirectAudioFallbackRef.current) return;
    if (source === 'fallback' && !usingDirectAudioFallbackRef.current) return;

    const activeTrack = playlistRef.current[currentIndexRef.current];
    if (!activeTrack || activeTrack.mediaType === 'video' || activeTrack.mediaType === 'image') {
      return;
    }
    const trackKey = `${activeTrack.id}|${activeTrack.src}`;
    const isUrlOrRadio =
      Boolean(activeTrack.isRadio) || activeSessionRef.current?.sourceType === 'url';

    // 1) Upgrade plain http:// -> https:// on CORS element first (skip custom ports like :8000)
    if (
      source === 'cors' &&
      /^http:\/\//i.test(el.src) &&
      !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(el.src) &&
      !/^http:\/\/[^/]+:\d+/i.test(el.src) &&
      httpsUpgradeAttemptedKeyRef.current !== trackKey
    ) {
      httpsUpgradeAttemptedKeyRef.current = trackKey;
      el.src = el.src.replace(/^http:\/\//i, 'https://');
      el.load();
      if (playbackIntentRef.current || isPlayingRef.current) {
        void el.play().catch(() => {});
      }
      return;
    }

    // 2) Bridge via same-origin /api/radio-proxy so CORS, HTTP-only, UA-filtered, or geo-restricted streams play with WebAudio EQ + visualizer
    if (
      source === 'cors' &&
      isUrlOrRadio &&
      proxyAttemptedKeyRef.current !== trackKey
    ) {
      proxyAttemptedKeyRef.current = trackKey;
      el.src = `/api/radio-proxy?url=${encodeURIComponent(activeTrack.src)}`;
      el.load();
      if (playbackIntentRef.current || isPlayingRef.current) {
        void el
          .play()
          .then(() => {
            setIsPlaying(true);
            setAwaitingAutoplayUnlock(false);
          })
          .catch((playErr: unknown) => {
            setIsPlaying(false);
            if ((playErr as { name?: string } | null)?.name === 'NotAllowedError') {
              setAwaitingAutoplayUnlock(true);
            }
          });
      }
      return;
    }

    // 3) Fallback to non-CORS <audio> element (e.g. if backend proxy unavailable on static hosting)
    if (
      source === 'cors' &&
      isUrlOrRadio &&
      fallbackAudioRef.current &&
      fallbackAttemptedKeyRef.current !== trackKey
    ) {
      fallbackAttemptedKeyRef.current = trackKey;
      const fallbackEl = fallbackAudioRef.current;
      const resolvedSrc =
        /^http:\/\//i.test(activeTrack.src) &&
        !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(activeTrack.src) &&
        !/^http:\/\/[^/]+:\d+/i.test(activeTrack.src) &&
        typeof window !== 'undefined' &&
        window.location?.protocol === 'https:'
          ? activeTrack.src.replace(/^http:\/\//i, 'https://')
          : activeTrack.src;

      internalPauseIgnoreUntilRef.current = performance.now() + 250;
      el.pause();
      if (el.hasAttribute('src')) {
        el.removeAttribute('src');
        el.load();
      }

      usingDirectAudioFallbackRef.current = true;
      setUsingDirectAudioFallback(true);
      fallbackEl.volume = isMuted ? 0 : volume;
      fallbackEl.muted = isMuted;
      fallbackEl.src = resolvedSrc;
      fallbackEl.load();

      if (playbackIntentRef.current || isPlayingRef.current) {
        void fallbackEl
          .play()
          .then(() => {
            setIsPlaying(true);
            setAwaitingAutoplayUnlock(false);
          })
          .catch((playErr: unknown) => {
            setIsPlaying(false);
            if ((playErr as { name?: string } | null)?.name === 'NotAllowedError') {
              setAwaitingAutoplayUnlock(true);
            }
          });
      }
      return;
    }

    // 3) Auto-try next mirror in M3U/PLS radio playlists before failing
    const maxMirrorRetries = Math.min(playlistRef.current.length - 1, 5);
    if (isUrlOrRadio && playlistRef.current.length > 1 && mirrorRetriesRef.current < maxMirrorRetries) {
      mirrorRetriesRef.current += 1;
      const nextIdx = (currentIndexRef.current + 1) % playlistRef.current.length;
      void selectTrack(
        nextIdx,
        playbackIntentRef.current || isPlayingRef.current,
        isRecordingRef.current
      );
      return;
    }

    pendingSeekRef.current = null;
    playbackIntentRef.current = false;
    trackEvent('stream_error', { track_title: activeTrack.title });
    if (isRecordingRef.current) {
      const hasLiveSession =
        cameraOverlayActiveRef.current ||
        customStageMediaRef.current?.kind === 'camera' ||
        micEnabledRef.current;
      if (hasLiveSession) {
        showToast(t.streamErrorToast, 'error');
        if (playlistRef.current.length > 1) {
          const nextIdx = (currentIndexRef.current + 1) % playlistRef.current.length;
          void selectTrack(nextIdx, true, true);
        }
        return;
      }
      setIsPlaying(false);
      stopStudioRecording();
      showToast(t.streamErrorToast, 'error');
      return;
    }
    setIsPlaying(false);
    showToast(t.streamErrorToast, 'error');
  };

  // Auto-enter Floating Track Orbs mode after 10 seconds of inactivity while playing audio
  useEffect(() => {
    const anyModalOpen =
      isSourcesOpen ||
      isEqOpen ||
      isStageMediaOpen ||
      isMobileMenuOpen ||
      isMobilePlaylistOpen ||
      isInstallGuideOpen ||
      isInstallPromoOpen;

    if (
      !isPlaying ||
      !uiVisible ||
      anyModalOpen ||
      isStudioMode ||
      isRecordArmed ||
      isRecording ||
      currentTrack?.mediaType === 'video' ||
      currentTrack?.mediaType === 'image'
    ) {
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
    currentTrack?.mediaType,
    isEqOpen,
    isInstallGuideOpen,
    isInstallPromoOpen,
    isMobileMenuOpen,
    isMobilePlaylistOpen,
    isPlaying,
    isRecordArmed,
    isRecording,
    isSourcesOpen,
    isStageMediaOpen,
    isStudioMode,
    uiVisible,
  ]);

  // Never allow UI controls to remain hidden while Studio Mode, Record Armed, or Active Recording is engaged
  useEffect(() => {
    if ((isStudioMode || isRecordArmed || isRecording) && !uiVisible) {
      setUiVisible(true);
    }
  }, [isRecordArmed, isRecording, isStudioMode, uiVisible]);

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
    const restoreObj: RestoreOptions = {
      trackId,
      trackTitle,
      trackIndex,
      time: savedTime,
    };
    try {
      const dirHandle = await getDirectoryHandle(folderId);
      if (dirHandle) {
        const files = await readAudioFilesFromDirectoryHandle(dirHandle);
        if (files.length > 0) {
          await loadParsedAudioFiles(files, folderId, folderName, {
            saveHandle: dirHandle,
            restore: restoreObj,
            closeModal: true,
            autoPlay: true,
            toastType: 'opened',
          });
          return;
        }
      }
    } catch {
      // fall through to IndexedDB cached files check
    }

    const cachedFiles = await getFolderFiles(folderId);
    if (cachedFiles && cachedFiles.length > 0) {
      await loadParsedAudioFiles(cachedFiles, folderId, folderName, {
        persistFiles: false,
        restore: restoreObj,
        closeModal: true,
        autoPlay: true,
        toastType: 'opened',
      });
      return;
    }

    openSources('folder');
    showToast(t.reselectFolderToast(folderName), 'info');
  }, [loadParsedAudioFiles, openSources, pendingFolderRestore, showToast, t]);

  const mapAuthErrorMessage = useCallback(
    (err: unknown): { code: string; message: string } => {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        return {
          code,
          message:
            lang === 'ru'
              ? `Домен ${host || 'сайта'} не разрешён в Firebase Console → Authentication → Settings → Authorized domains`
              : `Domain ${host || 'host'} is not in Firebase Console → Authentication → Settings → Authorized domains`,
        };
      }
      if (code === 'auth/popup-blocked') {
        return {
          code,
          message:
            lang === 'ru'
              ? 'Окно входа Google заблокировано браузером или iframe. Разрешите всплывающие окна или откройте приложение в отдельной вкладке.'
              : 'Google sign-in popup was blocked by browser or iframe. Allow popups or open the app in a separate tab.',
        };
      }
      if (code === 'auth/operation-not-supported-in-this-environment') {
        return {
          code,
          message:
            lang === 'ru'
              ? 'Google-вход ограничен внутри встроенного окна (iframe). Откройте приложение в отдельной вкладке браузера или войдите по Email и паролю.'
              : 'Google sign-in is restricted inside this embedded frame. Open the app in a new browser tab or use Email & Password.',
        };
      }
      if (code === 'auth/operation-not-allowed') {
        return { code, message: cloudT.authProviderDisabledHint };
      }
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-login-credentials'
      ) {
        return { code, message: cloudT.authInvalidCredError };
      }
      if (code === 'auth/email-already-in-use') {
        return { code, message: cloudT.authEmailInUseError };
      }
      if (code === 'auth/weak-password') {
        return { code, message: cloudT.authWeakPasswordError };
      }
      return {
        code,
        message: code ? `${cloudT.cloudAuthErrorToast} (${code})` : cloudT.cloudAuthErrorToast,
      };
    },
    [cloudT, lang]
  );

  const handleSaveToCloud = useCallback(
    async (tab: SourceTab, userOverride?: CloudUserInfo | null) => {
      const user = userOverride ?? cloudUserRef.current;
      if (!user) return;
      setIsSavingToCloud(true);
      try {
        await saveCloudMediaSources(user.uid, {
          audiusProfiles: savedProfilesRef.current,
          activeHandle: currentHandleRef.current,
          urlEntries: savedUrlsRef.current,
          activeUrlId: activeUrlIdRef.current,
          folderEntries: savedFoldersRef.current,
        });
        trackEvent('cloud_save_sources', { tab });
        showToast(cloudT.cloudSavedToast, 'success');
      } catch {
        showToast(cloudT.cloudSyncErrorToast, 'error');
      } finally {
        setIsSavingToCloud(false);
      }
    },
    [cloudT, showToast]
  );

  const handleSignInGoogleCloud = useCallback(
    async (saveAfterTab?: SourceTab): Promise<{ ok: boolean; errorMsg?: string }> => {
      try {
        const user = await signInWithGoogleCloud();
        if (!user) {
          showToast(cloudT.cloudAuthErrorToast, 'error');
          return { ok: false, errorMsg: cloudT.cloudAuthErrorToast };
        }
        cloudUserRef.current = user;
        setCloudUser(user);
        await syncFromCloudForUser(user.uid);
        if (saveAfterTab) {
          await handleSaveToCloud(saveAfterTab, user);
        }
        return { ok: true };
      } catch (err) {
        const { code, message } = mapAuthErrorMessage(err);
        if (
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/cancelled-popup-request'
        ) {
          return { ok: false };
        }
        showToast(message, 'error');
        return { ok: false, errorMsg: message };
      }
    },
    [cloudT, handleSaveToCloud, mapAuthErrorMessage, showToast, syncFromCloudForUser]
  );

  const handleSignInEmailCloud = useCallback(
    async (
      email: string,
      password: string,
      mode: 'signin' | 'register',
      saveAfterTab?: SourceTab
    ): Promise<{ ok: boolean; errorMsg?: string }> => {
      try {
        const user =
          mode === 'register'
            ? await registerWithEmailCloud(email, password)
            : await signInWithEmailCloud(email, password);
        if (!user) {
          return { ok: false, errorMsg: cloudT.cloudAuthErrorToast };
        }
        cloudUserRef.current = user;
        setCloudUser(user);

        await syncFromCloudForUser(user.uid);
        if (saveAfterTab) {
          await handleSaveToCloud(saveAfterTab, user);
        }
        return { ok: true };
      } catch (err) {
        const { message } = mapAuthErrorMessage(err);
        return { ok: false, errorMsg: message };
      }
    },
    [cloudT, handleSaveToCloud, mapAuthErrorMessage, syncFromCloudForUser]
  );

  const handleResetPasswordCloud = useCallback(
    async (email: string): Promise<{ ok: boolean; errorMsg?: string }> => {
      try {
        await sendPasswordResetCloud(email);
        showToast(cloudT.authResetSentToast, 'success');
        return { ok: true };
      } catch (err) {
        const { message } = mapAuthErrorMessage(err);
        return { ok: false, errorMsg: message };
      }
    },
    [cloudT, mapAuthErrorMessage, showToast]
  );

  const handleSignOutCloud = useCallback(async () => {
    try {
      await signOutCloud();
      cloudUserRef.current = null;
      cloudSyncFetchedUidRef.current = null;
      setCloudUser(null);
      showToast(cloudT.cloudSignedOutToast, 'info');
    } catch {
      showToast(cloudT.cloudSyncErrorToast, 'error');
    }
  }, [cloudT, showToast]);

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

  const isVideoTrack = currentTrack?.mediaType === 'video';
  const isImageTrack = currentTrack?.mediaType === 'image';
  const isClassicVideoPlayer = isVideoTrack && !isStudioMode;

  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((tr) => tr.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
      cameraVideoRef.current.srcObject = null;
    }
    if (customBgVideoRef.current && customBgVideoRef.current.srcObject) {
      customBgVideoRef.current.srcObject = null;
    }
  }, []);

  const stopMicStream = useCallback(() => {
    if (micSourceRef.current) {
      try {
        micSourceRef.current.disconnect();
      } catch {
        // ignore disconnect errors
      }
      micSourceRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((tr) => tr.stop());
      micStreamRef.current = null;
    }
  }, []);

  const forceLiveModeIfNeeded = useCallback(() => {
    setRecordRenderMode((prev) => {
      if (prev === 'offline') {
        try {
          localStorage.setItem(STORAGE_RECORD_RENDER_MODE_KEY, 'live');
        } catch {
          // ignore
        }
        showToast(studioT.customMediaLiveRequiredToast, 'info');
        return 'live';
      }
      return prev;
    });
  }, [showToast, studioT.customMediaLiveRequiredToast]);

  const revokeStageMediaQueueUrls = useCallback((excludeSrc?: string) => {
    for (const item of stageMediaQueueRef.current) {
      if (item.src !== excludeSrc && item.src.startsWith('blob:')) {
        URL.revokeObjectURL(item.src);
      }
    }
    stageMediaQueueRef.current = [];
  }, []);

  const advanceStageMedia = useCallback((delta: number) => {
    const queue = stageMediaQueueRef.current;
    if (queue.length <= 1) return;
    const nextIdx = (stageMediaIndexRef.current + delta + queue.length) % queue.length;
    const nextItem = queue[nextIdx];
    if (!nextItem) return;
    stageMediaIndexRef.current = nextIdx;
    setStageMediaIndex(nextIdx);

    // Preload following photo in background so transitions have zero flicker
    const upcoming = queue[(nextIdx + 1) % queue.length];
    if (upcoming?.kind === 'image') {
      const preloadImg = new Image();
      preloadImg.src = upcoming.src;
    }

    setCustomStageMedia((prev) =>
      prev
        ? {
            ...prev,
            kind: nextItem.kind,
            src: nextItem.src,
            name: nextItem.name,
          }
        : prev
    );
  }, []);

  // Auto-advance multi-photo background slideshow every 5 seconds while playing or recording
  useEffect(() => {
    if (customStageMedia?.kind !== 'image' || stageMediaQueue.length <= 1) return;
    if (!isPlaying && !isRecording) return;

    const timerId = window.setTimeout(() => {
      advanceStageMedia(1);
    }, 5000);
    return () => window.clearTimeout(timerId);
  }, [advanceStageMedia, customStageMedia?.kind, customStageMedia?.src, isPlaying, isRecording, stageMediaQueue.length]);

  // Live recording watchdog: keeps elapsed timer accurate, prevents Android AudioContext/AudioFocus pauses, and recovers stalled remote streams
  useEffect(() => {
    if (!isRecording || offlineExportState) {
      setRecordingElapsedSec(0);
      return;
    }

    let tickCount = 0;
    const id = window.setInterval(() => {
      setRecordingElapsedSec(Math.max(0, (performance.now() - recordingStartPerfRef.current) / 1000));
      tickCount += 1;
      if (tickCount % 3 !== 0) return;

      if (audioCtxRef.current?.state === 'suspended') {
        void audioCtxRef.current.resume().catch(() => {});
      }

      if (
        customStageMediaRef.current?.kind === 'video' &&
        customBgVideoRef.current &&
        !customBgVideoRef.current.ended &&
        customBgVideoRef.current.paused
      ) {
        void customBgVideoRef.current.play().catch(() => {});
      }

      const activeTrackNow = playlistRef.current[currentIndexRef.current];
      if (
        stageAudioRef.current &&
        stageBgAudioRef.current &&
        stageBgAudioRef.current.paused &&
        (activeTrackNow?.mediaType === 'video' || activeTrackNow?.mediaType === 'image')
      ) {
        void stageBgAudioRef.current.play().catch(() => {});
      }

      if (!isPlayingRef.current) return;
      const activeTrack = playlistRef.current[currentIndexRef.current];
      if (!activeTrack || activeTrack.mediaType === 'image') return;
      const activeEl = getActiveMediaElement(activeTrack);
      if (!activeEl || activeEl.ended) return;

      if (activeEl.paused) {
        recordingStallCheckRef.current.stagnantTicks = 0;
        void activeEl.play().catch(() => {});
        return;
      }

      const cur = activeEl.currentTime;
      const prev = recordingStallCheckRef.current.lastTime;
      if (prev >= 0 && Math.abs(cur - prev) < 0.02) {
        recordingStallCheckRef.current.stagnantTicks += 1;
        if (
          recordingStallCheckRef.current.stagnantTicks >= 5 &&
          !recordingStallCheckRef.current.recovering &&
          activeEl.src
        ) {
          recordingStallCheckRef.current.recovering = true;
          recordingStallCheckRef.current.stagnantTicks = 0;
          const resumeAt = cur;
          pendingSeekRef.current = { src: activeEl.src, time: resumeAt };
          try {
            activeEl.load();
            void activeEl.play().catch(() => {});
          } finally {
            window.setTimeout(() => {
              recordingStallCheckRef.current.recovering = false;
            }, 3000);
          }
        }
      } else {
        recordingStallCheckRef.current.lastTime = cur;
        recordingStallCheckRef.current.stagnantTicks = 0;
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [getActiveMediaElement, isRecording, offlineExportState]);

  const handlePickStageMediaFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const activeTypeNow = playlistRef.current[currentIndexRef.current]?.mediaType;
      const isMainMediaTrack = activeTypeNow === 'video' || activeTypeNow === 'image';
      const allFiles = Array.from(fileList);

      const validFiles = allFiles.filter((file) => {
        const isVid =
          file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
        const isImg =
          file.type.startsWith('image/') ||
          /\.(jpg|jpeg|png|webp|gif|bmp|avif)$/i.test(file.name);
        return isVid || isImg;
      });

      const audioFiles = isMainMediaTrack
        ? allFiles.filter(
            (file) =>
              file.type.startsWith('audio/') ||
              /\.(mp3|wav|flac|ogg|m4a|aac|opus|wma)$/i.test(file.name)
          )
        : [];

      if (validFiles.length === 0 && audioFiles.length === 0) {
        showToast(
          isMainMediaTrack
            ? studioT.customMediaInvalidWithAudioToast
            : studioT.customMediaInvalidToast,
          'error'
        );
        return;
      }

      const pickedAudioFile = audioFiles[0];
      if (pickedAudioFile) {
        const prevAudioSrc = stageAudioRef.current?.src;
        if (prevAudioSrc?.startsWith('blob:')) {
          URL.revokeObjectURL(prevAudioSrc);
        }
        const cleanAudioName =
          pickedAudioFile.name.replace(/\.[^/.]+$/, '') || pickedAudioFile.name;
        const nextStageAudio: StageBgAudio = {
          src: URL.createObjectURL(pickedAudioFile),
          name: cleanAudioName,
          volume: stageAudioRef.current?.volume ?? 0.75,
          enabled: true,
        };
        ensureAudioGraph();
        stageAudioRef.current = nextStageAudio;
        setStageAudio(nextStageAudio);
        const stgEl = stageBgAudioRef.current;
        if (stgEl) {
          stgEl.removeAttribute('crossorigin');
          stgEl.preload = 'auto';
          stgEl.loop = true;
          stgEl.src = nextStageAudio.src;
          stgEl.load();
          if (isPlayingRef.current || isRecordingRef.current) {
            stgEl.muted = isMuted;
            void stgEl.play().catch(() => {
              stgEl.muted = true;
              void stgEl.play().catch(() => {});
            });
          }
        }
        trackEvent('stage_bg_audio_set', { name: cleanAudioName });
      }

      if (validFiles.length === 0) {
        if (pickedAudioFile) {
          const cleanAudioName =
            pickedAudioFile.name.replace(/\.[^/.]+$/, '') || pickedAudioFile.name;
          showToast(studioT.customMediaBgAudioToast(cleanAudioName), 'success');
        }
        return;
      }

      const keepCameraPip =
        !isMainMediaTrack &&
        (customStageMediaRef.current?.kind === 'camera' || cameraOverlayActiveRef.current);
      if (keepCameraPip) {
        cameraOverlayActiveRef.current = true;
        setCameraOverlayActive(true);
      } else if (
        isMainMediaTrack &&
        (customStageMediaRef.current?.kind === 'camera' || cameraOverlayActiveRef.current)
      ) {
        stopCameraStream();
        cameraOverlayActiveRef.current = false;
        setCameraOverlayActive(false);
      }

      const prevSrc = customStageMediaRef.current?.src;
      revokeStageMediaQueueUrls();
      if (prevSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(prevSrc);
      }

      const nextItems: StageMediaItem[] = validFiles.map((file) => {
        const isVid =
          file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
        const cleanName = file.name.replace(/\.[^/.]+$/, '') || file.name;
        return {
          kind: isVid ? 'video' : 'image',
          src: URL.createObjectURL(file),
          name: cleanName,
        };
      });

      stageMediaQueueRef.current = nextItems;
      stageMediaIndexRef.current = 0;
      setStageMediaQueue(nextItems);
      setStageMediaIndex(0);

      const first = nextItems[0];
      const displayMode: StageMediaDisplayMode = isMainMediaTrack
        ? 'frame'
        : keepCameraPip
        ? 'backdrop'
        : customStageMediaRef.current?.displayMode ?? 'frame';
      const frameMotion: FrameMotionMode =
        customStageMediaRef.current?.frameMotion ?? coverFrameMotionRef.current ?? 'static';
      const frameRotationTarget: FrameRotationTarget =
        customStageMediaRef.current?.frameRotationTarget ?? coverRotationTargetRef.current ?? 'none';
      const backdropOverlay: BackdropOverlayMode =
        customStageMediaRef.current?.backdropOverlay ?? 'visualizer';
      const hasAnyVideo = nextItems.some((item) => item.kind === 'video');
      const nextMedia: CustomStageMedia = {
        kind: first.kind,
        src: first.src,
        name: first.name,
        displayMode,
        frameMotion,
        frameRotationTarget,
        backdropOverlay,
        soundEnabled: hasAnyVideo ? true : customStageMediaRef.current?.soundEnabled ?? true,
        soundVolume: customStageMediaRef.current?.soundVolume ?? 0.8,
      };

      if (hasAnyVideo) {
        ensureAudioGraph();
      }
      if (first.kind === 'video') {
        const vid = customBgVideoRef.current;
        if (vid) {
          vid.removeAttribute('crossorigin');
          vid.preload = 'auto';
          vid.loop = nextItems.length <= 1;
          vid.src = first.src;
          vid.load();
          if (isPlayingRef.current || isRecordingRef.current) {
            vid.muted = isMuted;
            void vid.play().catch(() => {
              vid.muted = true;
              void vid.play().catch(() => {});
            });
          }
        }
      } else {
        const probe = new Image();
        probe.onerror = () => {
          showToast(studioT.customMediaImageDecodeErrorToast, 'error');
        };
        probe.src = first.src;
      }

      if (nextItems[1]?.kind === 'image') {
        const preloadImg = new Image();
        preloadImg.src = nextItems[1].src;
      }

      setCustomStageMedia(nextMedia);
      const useFrameStudio = isMainMediaTrack || keepCameraPip || displayMode === 'frame';
      isStudioModeRef.current = useFrameStudio;
      setIsStudioMode(useFrameStudio);
      showToast(
        nextItems.length > 1
          ? keepCameraPip
            ? studioT.customMediaMultiPipToast(nextItems.length)
            : studioT.customMediaMultiToast(nextItems.length)
          : keepCameraPip
          ? studioT.customMediaPipToast
          : first.kind === 'video'
          ? studioT.customMediaVideoToast(first.name)
          : studioT.customMediaImageToast(first.name),
        'success'
      );
      trackEvent('stage_media_set', {
        kind: nextMedia.kind,
        count: nextItems.length,
        mode: displayMode,
        pip_camera: keepCameraPip,
      });
    },
    [ensureAudioGraph, isMuted, revokeStageMediaQueueUrls, showToast, stopCameraStream, studioT]
  );

  const attachMicStreamToAudioGraph = useCallback(
    (audioStream: MediaStream) => {
      stopMicStream();
      ensureAudioGraph();
      micStreamRef.current = audioStream;

      const ctx = audioCtxRef.current;
      if (ctx) {
        if (!micGainRef.current) {
          const mg = ctx.createGain();
          mg.gain.value = micVolumeRef.current;
          if (analyserRef.current) mg.connect(analyserRef.current);
          if (recLimiterRef.current) {
            mg.connect(recLimiterRef.current);
          } else if (streamDestRef.current) {
            mg.connect(streamDestRef.current);
          }
          micGainRef.current = mg;
        }
        if (!micHighpassRef.current) {
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 75;
          hp.Q.value = 0.7;
          hp.connect(micGainRef.current);
          micHighpassRef.current = hp;
        }
        const mSrc = ctx.createMediaStreamSource(audioStream);
        mSrc.connect(micHighpassRef.current);
        micSourceRef.current = mSrc;
      }

      micEnabledRef.current = true;
      setMicEnabled(true);
    },
    [ensureAudioGraph, stopMicStream]
  );

  const getMicConstraints = useCallback(
    (useEchoFilter: boolean): MediaTrackConstraints => ({
      // Disabling echoCancellation/AGC by default keeps Android out of 16kHz VoIP call mode
      echoCancellation: useEchoFilter,
      noiseSuppression: useEchoFilter,
      autoGainControl: false,
      channelCount: { ideal: 1 },
    }),
    []
  );

  const bindCameraPreviewStream = useCallback(async (videoStream: MediaStream) => {
    cameraStreamRef.current = videoStream;
    const camEl = cameraVideoRef.current;
    if (camEl) {
      camEl.muted = true;
      camEl.playsInline = true;
      camEl.srcObject = videoStream;
      try {
        await camEl.play();
      } catch {
        // retry silently on next render effect if browser deferred
      }
    }
  }, []);

  const handleToggleCamera = useCallback(async () => {
    if (customStageMediaRef.current?.kind === 'camera' || cameraOverlayActiveRef.current) {
      stopCameraStream();
      if (cameraOverlayActiveRef.current) {
        cameraOverlayActiveRef.current = false;
        setCameraOverlayActive(false);
        const keepStudio =
          isRecordArmedRef.current ||
          customStageMediaRef.current?.displayMode === 'frame';
        isStudioModeRef.current = keepStudio;
        setIsStudioMode(keepStudio);
      } else {
        setCustomStageMedia(null);
        if (!isRecordArmedRef.current) {
          isStudioModeRef.current = false;
          setIsStudioMode(false);
        }
      }
      showToast(studioT.customMediaCameraStoppedToast, 'info');
      trackEvent('stage_camera_toggle', { enabled: false });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast(studioT.customMediaDeviceErrorToast, 'error');
      return;
    }

    const videoConstraints: MediaTrackConstraints = {
      facingMode: { ideal: cameraFacingRef.current },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };

    const wantMicWithCamera = !micEnabledRef.current;
    const micConstraints = getMicConstraints(micEchoFilterRef.current);

    try {
      let combinedStream: MediaStream;
      if (wantMicWithCamera) {
        try {
          // Request Camera video + Microphone audio together so the user can record live video with sound over the active track
          combinedStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: micConstraints,
          });
        } catch {
          combinedStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
          });
        }
      } else {
        combinedStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      }

      const videoTracks = combinedStream.getVideoTracks();
      const audioTracks = combinedStream.getAudioTracks();
      const videoOnlyStream = new MediaStream(videoTracks);

      stopCameraStream();
      await bindCameraPreviewStream(videoOnlyStream);

      let micJoinedNow = false;
      if (audioTracks.length > 0) {
        attachMicStreamToAudioGraph(new MediaStream(audioTracks));
        micJoinedNow = true;
      }

      const activeTrackType = playlistRef.current[currentIndexRef.current]?.mediaType;
      const isMainMediaTrack = activeTrackType === 'video' || activeTrackType === 'image';
      const existing = customStageMediaRef.current;
      const hasFileBackground = Boolean(
        !isMainMediaTrack &&
          existing &&
          (existing.kind === 'image' || existing.kind === 'video')
      );

      if (hasFileBackground && existing) {
        // Dual-video / reaction PiP mode: keep device file on full backdrop and render live Camera inside Studio frame
        cameraOverlayActiveRef.current = true;
        setCameraOverlayActive(true);
        setCustomStageMedia((prev) =>
          prev
            ? {
                ...prev,
                displayMode: 'backdrop',
              }
            : prev
        );
        isStudioModeRef.current = true;
        setIsStudioMode(true);
        forceLiveModeIfNeeded();
        showToast(studioT.customMediaPipToast, 'success');
        trackEvent('stage_camera_toggle', {
          enabled: true,
          pip: true,
          with_mic: micJoinedNow || micEnabledRef.current,
        });
        return;
      }

      cameraOverlayActiveRef.current = false;
      setCameraOverlayActive(false);

      const frameMotion: FrameMotionMode =
        existing?.frameMotion ?? coverFrameMotionRef.current ?? 'static';
      const frameRotationTarget: FrameRotationTarget =
        existing?.frameRotationTarget ?? coverRotationTargetRef.current ?? 'none';

      setCustomStageMedia({
        kind: 'camera',
        src: '',
        name: studioT.customMediaCameraActiveLabel,
        displayMode: 'frame',
        frameMotion,
        frameRotationTarget,
        backdropOverlay: existing?.backdropOverlay ?? 'visualizer',
        soundEnabled: false,
        soundVolume: existing?.soundVolume ?? 0.8,
      });

      isStudioModeRef.current = true;
      setIsStudioMode(true);

      forceLiveModeIfNeeded();
      const hasMicNow = micJoinedNow || micEnabledRef.current;
      showToast(
        hasMicNow
          ? studioT.customMediaCameraAndMicStartedToast
          : studioT.customMediaCameraStartedToast,
        'success'
      );
      trackEvent('stage_camera_toggle', { enabled: true, with_mic: hasMicNow });
    } catch {
      showToast(studioT.customMediaDeviceErrorToast, 'error');
    }
  }, [
    attachMicStreamToAudioGraph,
    bindCameraPreviewStream,
    forceLiveModeIfNeeded,
    getMicConstraints,
    showToast,
    stopCameraStream,
    studioT,
  ]);

  const handleFlipCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast(studioT.customMediaDeviceErrorToast, 'error');
      return;
    }

    const prevFacing = cameraFacingRef.current;
    const prevDeviceId = cameraStreamRef.current?.getVideoTracks()[0]?.getSettings?.().deviceId;
    const nextFacing = prevFacing === 'user' ? 'environment' : 'user';

    // Release active camera FIRST (Android Camera2 blocks opening rear camera while front camera is still live)
    stopCameraStream();
    await new Promise((resolve) => window.setTimeout(resolve, 120));

    const openVideoStream = async (): Promise<MediaStream> => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Retry without resolution constraints (some dual-lens mobile sensors reject HD constraints on rear lens)
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: nextFacing } },
            audio: false,
          });
        } catch {
          // Last fallback: pick next enumerated videoinput deviceId
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          const otherCam = videoInputs.find((d) => d.deviceId && d.deviceId !== prevDeviceId);
          if (otherCam) {
            return await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: otherCam.deviceId } },
              audio: false,
            });
          }
          throw new Error('No secondary camera available');
        }
      }
    };

    try {
      const stream = await openVideoStream();
      cameraFacingRef.current = nextFacing;
      await bindCameraPreviewStream(stream);
      trackEvent('stage_camera_flip', { facing: nextFacing });
    } catch {
      // Restore previous camera cleanly if device has only 1 lens or failed to switch
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: prevFacing } },
          audio: false,
        });
        await bindCameraPreviewStream(fallbackStream);
      } catch {
        if (cameraOverlayActiveRef.current) {
          cameraOverlayActiveRef.current = false;
          setCameraOverlayActive(false);
        } else {
          setCustomStageMedia(null);
        }
      }
      showToast(studioT.customMediaDeviceErrorToast, 'error');
    }
  }, [bindCameraPreviewStream, showToast, stopCameraStream, studioT.customMediaDeviceErrorToast]);

  const handleToggleMicrophone = useCallback(async () => {
    if (micEnabledRef.current) {
      stopMicStream();
      micEnabledRef.current = false;
      setMicEnabled(false);
      showToast(studioT.customMediaMicStoppedToast, 'info');
      trackEvent('stage_mic_toggle', { enabled: false });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast(studioT.customMediaDeviceErrorToast, 'error');
      return;
    }

    ensureAudioGraph();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getMicConstraints(micEchoFilterRef.current),
        video: false,
      });
      attachMicStreamToAudioGraph(stream);
      forceLiveModeIfNeeded();
      showToast(studioT.customMediaMicStartedToast, 'success');
      trackEvent('stage_mic_toggle', { enabled: true });
    } catch {
      showToast(studioT.customMediaDeviceErrorToast, 'error');
    }
  }, [
    attachMicStreamToAudioGraph,
    ensureAudioGraph,
    forceLiveModeIfNeeded,
    getMicConstraints,
    showToast,
    stopMicStream,
    studioT,
  ]);

  const handleToggleMicEchoFilter = useCallback(async () => {
    const nextFilter = !micEchoFilterRef.current;
    micEchoFilterRef.current = nextFilter;
    setMicEchoFilter(nextFilter);

    if (micEnabledRef.current && navigator.mediaDevices?.getUserMedia) {
      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          audio: getMicConstraints(nextFilter),
          video: false,
        });
        attachMicStreamToAudioGraph(nextStream);
      } catch {
        // keep existing mic stream if browser rejects constraint switch
      }
    }
  }, [attachMicStreamToAudioGraph, getMicConstraints]);

  const handleToggleFrameMotion = useCallback(() => {
    const current = customStageMediaRef.current;
    if (!current) {
      const nextMotion: FrameMotionMode =
        coverFrameMotionRef.current === 'floating' ? 'static' : 'floating';
      coverFrameMotionRef.current = nextMotion;
      setCoverFrameMotion(nextMotion);
      const activeType = playlistRef.current[currentIndexRef.current]?.mediaType;
      if (activeType !== 'video' && activeType !== 'image') {
        isStudioModeRef.current = true;
        setIsStudioMode(true);
      }
      showToast(
        nextMotion === 'floating'
          ? studioT.customMediaModeFloatingToast
          : studioT.customMediaModeFrameToast,
        'info'
      );
      trackEvent('stage_cover_mode', { motion: nextMotion });
      return;
    }
    const isMainMediaTrack =
      playlistRef.current[currentIndexRef.current]?.mediaType === 'video' ||
      playlistRef.current[currentIndexRef.current]?.mediaType === 'image';
    const isPip = !isMainMediaTrack && cameraOverlayActiveRef.current;
    const switchingFromBackdrop = !isPip && !isMainMediaTrack && current.displayMode === 'backdrop';
    const nextMotion: FrameMotionMode = switchingFromBackdrop
      ? current.frameMotion
      : current.frameMotion === 'floating'
      ? 'static'
      : 'floating';
    const nextDisplay: StageMediaDisplayMode = isMainMediaTrack
      ? 'frame'
      : isPip
      ? 'backdrop'
      : 'frame';
    setCustomStageMedia((prev) =>
      prev
        ? {
            ...prev,
            displayMode: nextDisplay,
            frameMotion: nextMotion,
          }
        : prev
    );
    isStudioModeRef.current = true;
    setIsStudioMode(true);
    showToast(
      nextMotion === 'floating'
        ? studioT.customMediaModeFloatingToast
        : studioT.customMediaModeFrameToast,
      'info'
    );
    trackEvent('stage_media_mode', { mode: nextDisplay, motion: nextMotion });
  }, [showToast, studioT]);

  const handleToggleFrameRotation = useCallback(() => {
    const current = customStageMediaRef.current;
    if (!current) {
      const turnOff = coverRotationTargetRef.current !== 'none';
      const nextTarget: FrameRotationTarget = turnOff ? 'none' : lastRotationTargetRef.current;
      coverRotationTargetRef.current = nextTarget;
      setCoverRotationTarget(nextTarget);
      const activeType = playlistRef.current[currentIndexRef.current]?.mediaType;
      if (activeType !== 'video' && activeType !== 'image') {
        isStudioModeRef.current = true;
        setIsStudioMode(true);
      }
      if (!turnOff) {
        showToast(studioT.customMediaModeRotatingToast, 'info');
      }
      trackEvent('stage_cover_rotation', { target: nextTarget });
      return;
    }
    const isMainMediaTrack =
      playlistRef.current[currentIndexRef.current]?.mediaType === 'video' ||
      playlistRef.current[currentIndexRef.current]?.mediaType === 'image';
    const isPip = !isMainMediaTrack && cameraOverlayActiveRef.current;
    const isFrameShown = isMainMediaTrack || isPip || current.displayMode === 'frame';
    const turnOff = isFrameShown && current.frameRotationTarget !== 'none';
    const nextTarget: FrameRotationTarget = turnOff ? 'none' : lastRotationTargetRef.current;
    const nextDisplay: StageMediaDisplayMode = isMainMediaTrack
      ? 'frame'
      : isPip
      ? 'backdrop'
      : 'frame';
    setCustomStageMedia((prev) =>
      prev
        ? {
            ...prev,
            displayMode: nextDisplay,
            frameRotationTarget: nextTarget,
          }
        : prev
    );
    isStudioModeRef.current = true;
    setIsStudioMode(true);
    if (!turnOff) {
      showToast(studioT.customMediaModeRotatingToast, 'info');
    }
    trackEvent('stage_media_rotation', { target: nextTarget });
  }, [showToast, studioT]);

  const handleSelectRotationTarget = useCallback(
    (target: Exclude<FrameRotationTarget, 'none'>) => {
      lastRotationTargetRef.current = target;
      const current = customStageMediaRef.current;
      if (!current) {
        coverRotationTargetRef.current = target;
        setCoverRotationTarget(target);
        const activeType = playlistRef.current[currentIndexRef.current]?.mediaType;
        if (activeType !== 'video' && activeType !== 'image') {
          isStudioModeRef.current = true;
          setIsStudioMode(true);
        }
        trackEvent('stage_cover_rotation', { target });
        return;
      }
      const isMainMediaTrack =
        playlistRef.current[currentIndexRef.current]?.mediaType === 'video' ||
        playlistRef.current[currentIndexRef.current]?.mediaType === 'image';
      const isPip = !isMainMediaTrack && cameraOverlayActiveRef.current;
      const nextDisplay: StageMediaDisplayMode = isMainMediaTrack
        ? 'frame'
        : isPip
        ? 'backdrop'
        : 'frame';
      setCustomStageMedia((prev) =>
        prev
          ? {
              ...prev,
              displayMode: nextDisplay,
              frameRotationTarget: target,
            }
          : prev
      );
      isStudioModeRef.current = true;
      setIsStudioMode(true);
      trackEvent('stage_media_rotation', { target });
    },
    []
  );

  const handleToggleCoverCaption = useCallback(() => {
    const next = !showCoverCaptionRef.current;
    showCoverCaptionRef.current = next;
    setShowCoverCaption(next);
    if (next) {
      const activeType = playlistRef.current[currentIndexRef.current]?.mediaType;
      if (activeType !== 'video' && activeType !== 'image') {
        isStudioModeRef.current = true;
        setIsStudioMode(true);
      }
    }
    showToast(
      next ? studioT.customMediaCaptionOnToast : studioT.customMediaCaptionOffToast,
      'info'
    );
    trackEvent('stage_cover_caption', { enabled: next });
  }, [showToast, studioT]);

  const handleActivateBackdrop = useCallback(() => {
    const activeType = playlistRef.current[currentIndexRef.current]?.mediaType;
    if (activeType === 'video' || activeType === 'image') return;
    const current = customStageMediaRef.current;
    if (!current) return;
    const isPip = cameraOverlayActiveRef.current;
    setCustomStageMedia((prev) =>
      prev
        ? {
            ...prev,
            displayMode: 'backdrop',
            frameRotationTarget: isPip ? prev.frameRotationTarget : 'none',
          }
        : prev
    );
    isStudioModeRef.current = isPip;
    setIsStudioMode(isPip);
    showToast(studioT.customMediaModeBackdropToast, 'info');
    trackEvent('stage_media_mode', {
      mode: 'backdrop',
      overlay: current.backdropOverlay,
    });
  }, [showToast, studioT]);

  const handleSelectBackdropOverlay = useCallback((overlay: BackdropOverlayMode) => {
    const activeType = playlistRef.current[currentIndexRef.current]?.mediaType;
    if (activeType === 'video' || activeType === 'image') return;
    const isPip = cameraOverlayActiveRef.current;
    setCustomStageMedia((prev) =>
      prev
        ? {
            ...prev,
            displayMode: 'backdrop',
            backdropOverlay: overlay,
            frameRotationTarget: isPip ? prev.frameRotationTarget : 'none',
          }
        : prev
    );
    isStudioModeRef.current = isPip;
    setIsStudioMode(isPip);
    if (overlay === 'clean') {
      liveOrbsSnapshotRef.current = [];
    }
    trackEvent('stage_media_backdrop_overlay', { overlay });
  }, []);

  const handleToggleStageMediaSound = useCallback(() => {
    const current = customStageMediaRef.current;
    if (!current || current.kind !== 'video') return;
    const nextEnabled = !current.soundEnabled;
    if (nextEnabled) {
      ensureAudioGraph();
    }
    setCustomStageMedia((prev) =>
      prev && prev.kind === 'video' ? { ...prev, soundEnabled: nextEnabled } : prev
    );
  }, [ensureAudioGraph]);

  const handleChangeStageMediaVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setCustomStageMedia((prev) => (prev ? { ...prev, soundVolume: clamped } : prev));
  }, []);

  const handleToggleStageAudio = useCallback(() => {
    const current = stageAudioRef.current;
    if (!current) return;
    const nextEnabled = !current.enabled;
    if (nextEnabled) {
      ensureAudioGraph();
    }
    setStageAudio((prev) => (prev ? { ...prev, enabled: nextEnabled } : prev));
  }, [ensureAudioGraph]);

  const handleChangeStageAudioVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setStageAudio((prev) => (prev ? { ...prev, volume: clamped } : prev));
  }, []);

  const handleRemoveStageAudio = useCallback(() => {
    const prevSrc = stageAudioRef.current?.src;
    if (prevSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(prevSrc);
    }
    stageAudioRef.current = null;
    setStageAudio(null);
  }, []);

  const handleRemoveFileMedia = useCallback(() => {
    const current = customStageMediaRef.current;
    if (!current) return;
    revokeStageMediaQueueUrls(current.src);
    setStageMediaQueue([]);
    stageMediaIndexRef.current = 0;
    setStageMediaIndex(0);
    if (current.src.startsWith('blob:')) {
      URL.revokeObjectURL(current.src);
    }
    if (cameraOverlayActiveRef.current) {
      cameraOverlayActiveRef.current = false;
      setCameraOverlayActive(false);
      setCustomStageMedia({
        kind: 'camera',
        src: '',
        name: studioT.customMediaCameraActiveLabel,
        displayMode: 'frame',
        frameMotion: current.frameMotion,
        frameRotationTarget: current.frameRotationTarget,
        backdropOverlay: 'visualizer',
        soundEnabled: false,
        soundVolume: current.soundVolume,
      });
      isStudioModeRef.current = true;
      setIsStudioMode(true);
      return;
    }
    setCustomStageMedia(null);
    if (!isRecordArmedRef.current) {
      isStudioModeRef.current = false;
      setIsStudioMode(false);
    }
  }, [revokeStageMediaQueueUrls, studioT.customMediaCameraActiveLabel]);

  const handleClearStageMedia = useCallback(() => {
    stopCameraStream();
    stopMicStream();
    setMicEnabled(false);
    cameraOverlayActiveRef.current = false;
    setCameraOverlayActive(false);
    const prevSrc = customStageMediaRef.current?.src;
    revokeStageMediaQueueUrls(prevSrc);
    setStageMediaQueue([]);
    stageMediaIndexRef.current = 0;
    setStageMediaIndex(0);
    if (prevSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(prevSrc);
    }
    const prevAudioSrc = stageAudioRef.current?.src;
    if (prevAudioSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(prevAudioSrc);
    }
    stageAudioRef.current = null;
    setStageAudio(null);
    setCustomStageMedia(null);
    if (!isRecordArmedRef.current) {
      isStudioModeRef.current = false;
      setIsStudioMode(false);
    }
    showToast(studioT.customMediaClearedToast, 'info');
    trackEvent('stage_media_clear');
  }, [revokeStageMediaQueueUrls, showToast, stopCameraStream, stopMicStream, studioT]);

  const isFloatingOrbsActive =
    !uiVisible &&
    showOrbs &&
    !isStudioMode &&
    !isRecordArmed &&
    !isRecording &&
    !isClassicVideoPlayer &&
    !isImageTrack &&
    !(
      !cameraOverlayActive &&
      customStageMedia?.displayMode === 'backdrop' &&
      customStageMedia.backdropOverlay === 'clean'
    );

  const canSwipeStageBackground =
    !isStudioMode &&
    !isRecordArmed &&
    !isRecording &&
    !isClassicVideoPlayer &&
    !isImageTrack &&
    !(
      !cameraOverlayActive &&
      customStageMedia?.displayMode === 'backdrop' &&
      customStageMedia.backdropOverlay === 'clean'
    ) &&
    (isFloatingOrbsActive || uiVisible);

  const handleStagePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!canSwipeStageBackground) return;
    if (
      isSourcesOpen ||
      isEqOpen ||
      isStageMediaOpen ||
      isMobileMenuOpen ||
      isMobilePlaylistOpen ||
      isHelpOpen ||
      isInstallGuideOpen ||
      isInstallPromoOpen
    ) {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'header, footer, button, a, input, select, textarea, [role="slider"], [data-no-zen-toggle="true"]'
      )
    ) {
      return;
    }
    window.clearTimeout(stageSwipeResetTimerRef.current);
    stageSwipeHandledRef.current = false;
    stageSwipeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      triggered: false,
    };
  };

  const didStageSwipeExceedThreshold = (dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    if (isFloatingOrbsActive) return dist >= 36;
    return (Math.abs(dx) >= 30 && Math.abs(dx) > Math.abs(dy) * 0.9) || dist >= 44;
  };

  const handleStagePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const start = stageSwipeStartRef.current;
    if (!start || start.pointerId !== e.pointerId || start.triggered) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (didStageSwipeExceedThreshold(dx, dy)) {
      start.triggered = true;
      stageSwipeHandledRef.current = true;
      randomizeVisual();
      trackEvent(isFloatingOrbsActive ? 'orbs_bg_swipe_theme' : 'cover_bg_swipe_theme');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // ignore
        }
      }
    }
  };

  const handleStagePointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const start = stageSwipeStartRef.current;
    if (start && start.pointerId === e.pointerId && !start.triggered) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (didStageSwipeExceedThreshold(dx, dy)) {
        stageSwipeHandledRef.current = true;
        randomizeVisual();
        trackEvent(isFloatingOrbsActive ? 'orbs_bg_swipe_theme' : 'cover_bg_swipe_theme');
      }
    }
    if (stageSwipeHandledRef.current) {
      window.clearTimeout(stageSwipeResetTimerRef.current);
      stageSwipeResetTimerRef.current = window.setTimeout(() => {
        stageSwipeHandledRef.current = false;
      }, 220);
    }
    stageSwipeStartRef.current = null;
  };

  const handleStagePointerCancel = () => {
    if (stageSwipeHandledRef.current) {
      window.clearTimeout(stageSwipeResetTimerRef.current);
      stageSwipeResetTimerRef.current = window.setTimeout(() => {
        stageSwipeHandledRef.current = false;
      }, 220);
    }
    stageSwipeStartRef.current = null;
  };

  const handleStageBackgroundClick = (e: MouseEvent<HTMLElement>) => {
    if (stageSwipeHandledRef.current) {
      stageSwipeHandledRef.current = false;
      return;
    }
    if (
      isRecording ||
      isRecordArmed ||
      isSourcesOpen ||
      isEqOpen ||
      isStageMediaOpen ||
      isMobileMenuOpen ||
      isMobilePlaylistOpen ||
      isHelpOpen ||
      isInstallGuideOpen ||
      isInstallPromoOpen ||
      isStudioMode
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

  const triggerCoverSwipe = useCallback(
    (direction: 'next' | 'prev') => {
      if (currentTrack?.isRadio && playlist.length <= 1) {
        void handleCycleFmStation(direction === 'next' ? 1 : -1);
      } else if (playlist.length > 0) {
        if (direction === 'next') {
          nextTrack(true);
        } else {
          const prevIdx = isShuffle
            ? Math.floor(Math.random() * playlist.length)
            : (currentIndex - 1 + playlist.length) % playlist.length;
          void selectTrack(prevIdx, true);
        }
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          // ignore
        }
      }
    },
    [currentIndex, currentTrack?.isRadio, handleCycleFmStation, isShuffle, nextTrack, playlist.length, selectTrack]
  );

  const handleCoverPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    window.clearTimeout(coverSwipeResetTimerRef.current);
    coverSwipeHandledRef.current = false;
    coverSwipeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      triggered: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if pointer capture is unsupported
    }
  };

  const handleCoverPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const start = coverSwipeStartRef.current;
    if (!start || start.pointerId !== e.pointerId || start.triggered) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) >= 28 && Math.abs(dx) > Math.abs(dy)) {
      start.triggered = true;
      coverSwipeHandledRef.current = true;
      triggerCoverSwipe(dx < 0 ? 'next' : 'prev');
    }
  };

  const handleCoverPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    const start = coverSwipeStartRef.current;
    if (start && start.pointerId === e.pointerId) {
      if (start.triggered) {
        // Ensure playback & AudioContext unlock inside trusted pointerup activation if pointermove was blocked by browser autoplay policy
        if (!isPlayingRef.current) {
          if (!usingDirectAudioFallbackRef.current) {
            ensureAudioGraph();
          }
          void startPlaybackSafe(true);
        }
      } else {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) >= 28 && Math.abs(dx) > Math.abs(dy)) {
          coverSwipeHandledRef.current = true;
          triggerCoverSwipe(dx < 0 ? 'next' : 'prev');
        }
      }
    }
    if (coverSwipeHandledRef.current) {
      window.clearTimeout(coverSwipeResetTimerRef.current);
      coverSwipeResetTimerRef.current = window.setTimeout(() => {
        coverSwipeHandledRef.current = false;
      }, 220);
    }
    coverSwipeStartRef.current = null;
  };

  const handleCoverPointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    const start = coverSwipeStartRef.current;
    if (start && start.pointerId === e.pointerId && !start.triggered) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) >= 28 && Math.abs(dx) > Math.abs(dy)) {
        coverSwipeHandledRef.current = true;
        triggerCoverSwipe(dx < 0 ? 'next' : 'prev');
      }
    }
    if (coverSwipeHandledRef.current) {
      window.clearTimeout(coverSwipeResetTimerRef.current);
      coverSwipeResetTimerRef.current = window.setTimeout(() => {
        coverSwipeHandledRef.current = false;
      }, 220);
    }
    coverSwipeStartRef.current = null;
  };

  const handleFmHoldStart = () => {
    window.clearTimeout(fmHoldTimerRef.current);
    fmHoldTriggeredRef.current = false;
    fmHoldTimerRef.current = window.setTimeout(() => {
      fmHoldTriggeredRef.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(16);
        } catch {
          // ignore
        }
      }
      openSources('url');
    }, 550);
  };

  const handleFmHoldCancel = () => {
    window.clearTimeout(fmHoldTimerRef.current);
  };

  const handleStageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      void handleSelectFolderInputFiles(e.dataTransfer.files);
    }
  };

  const handlePlayHoldStart = () => {
    window.clearTimeout(playHoldTimerRef.current);
    playHoldTriggeredRef.current = false;
    setIsHoldingPlay(true);
    playHoldTimerRef.current = window.setTimeout(() => {
      playHoldTriggeredRef.current = true;
      setIsHoldingPlay(false);
      if (isRecordingRef.current) return;

      const isMainMedia =
        currentTrack?.mediaType === 'video' || currentTrack?.mediaType === 'image';

      if (isRecordArmed) {
        isRecordArmedRef.current = false;
        setIsRecordArmed(false);
        setUiVisible(true);
        if (
          (isMainMedia && !customStageMediaRef.current && !cameraOverlayActiveRef.current) ||
          (!isMainMedia &&
            !cameraOverlayActiveRef.current &&
            customStageMediaRef.current?.displayMode !== 'frame')
        ) {
          isStudioModeRef.current = false;
          setIsStudioMode(false);
        }
        showToast(studioT.recordDisarmedToast, 'info');
        return;
      }

      setUiVisible(true);
      const hasFullscreenBackdropOnly = Boolean(
        !isMainMedia &&
          customStageMediaRef.current &&
          customStageMediaRef.current.displayMode === 'backdrop' &&
          !cameraOverlayActiveRef.current
      );
      if (isMainMedia && !isStudioMode) {
        isStudioModeRef.current = true;
        setIsStudioMode(true);
        showToast(studioT.studioActivatedToast, 'info');
      } else {
        if (!hasFullscreenBackdropOnly && !isStudioMode) {
          isStudioModeRef.current = true;
          setIsStudioMode(true);
        }
        showToast(studioT.recordArmedToast, 'info');
      }
      isRecordArmedRef.current = true;
      setIsRecordArmed(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(18);
        } catch {
          // ignore
        }
      }
    }, 600);
  };

  const handlePlayHoldCancel = () => {
    window.clearTimeout(playHoldTimerRef.current);
    setIsHoldingPlay(false);
  };

  const handlePlayButtonClick = () => {
    if (playHoldTriggeredRef.current) {
      playHoldTriggeredRef.current = false;
      return;
    }
    if (isRecording) {
      stopStudioRecording();
      return;
    }
    if (isRecordArmed) {
      void startStudioRecording();
      return;
    }
    void togglePlay();
  };

  return (
    <div
      data-app-version={APP_VERSION}
      onPointerDown={handleStagePointerDown}
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerCancel={handleStagePointerCancel}
      onClick={handleStageBackgroundClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleStageDrop}
      className={`min-h-[100dvh] bg-[#0a0a0c] text-gray-100 flex flex-col justify-between relative overflow-x-hidden ${
        isFloatingOrbsActive
          ? 'touch-none'
          : canSwipeStageBackground
          ? 'touch-pan-y'
          : ''
      }`}
    >
      {/* UNIFIED FULL-SCREEN REACTIVE CANVAS + STUDIO FRAME + MP4 CAPTURE */}
      <VisualizerCanvas
        canvasRef={masterCanvasRef}
        studioFrameRef={studioFrameStateRef}
        analyser={usingDirectAudioFallback ? null : analyser}
        isPlaying={isPlaying}
        vizMode={vizMode}
        paletteIndex={paletteIndex}
        visualDna={visualDna}
        isZenMode={!uiVisible}
        studioActive={isStudioMode}
        videoElement={videoRef.current}
        videoElementRef={videoRef}
        customStageMedia={customStageMedia}
        cameraOverlayActive={cameraOverlayActive}
        customBgVideoElement={customBgVideoRef.current}
        customBgVideoElementRef={customBgVideoRef}
        cameraVideoElement={cameraVideoRef.current}
        cameraVideoElementRef={cameraVideoRef}
        activeCoverSrc={currentTrack?.cover}
        activeMediaType={currentTrack?.mediaType}
        coverFrameMotion={coverFrameMotion}
        coverRotationTarget={coverRotationTarget}
        coverCaptionTitle={showCoverCaption ? coverDisplayTitle ?? null : null}
        coverCaptionArtist={showCoverCaption ? coverDisplayArtist ?? null : null}
        isRecordArmed={isRecordArmed}
        recordAspect={recordAspect}
        recordQuality={recordQuality}
        isRecording={isRecording}
        layeredBg={mixEnabled && visualDna.mixLayers.length > 0}
        liveOrbsSnapshotRef={liveOrbsSnapshotRef}
        onRandomizeStyle={() => randomizeVisual()}
        onStudioToast={(msg) => showToast(msg, 'info')}
      />

      {isRecordArmed && (
        <StudioRecordBar
          aspect={recordAspect}
          quality={recordQuality}
          renderMode={recordRenderMode}
          uiVisible={uiVisible}
          isRecording={isRecording}
          hasCustomMedia={
            Boolean(customStageMedia) ||
            cameraOverlayActive ||
            micEnabled ||
            Boolean((isVideoTrack || isImageTrack) && stageAudio) ||
            coverFrameMotion !== 'static' ||
            coverRotationTarget !== 'none' ||
            showCoverCaption
          }
          isLiveMediaActive={
            customStageMedia?.kind === 'camera' || cameraOverlayActive || micEnabled
          }
          onChangeAspect={(next) => {
            setRecordAspect(next);
            const dims = getRecordingDimensions(next, recordQuality);
            showToast(
              studioT.aspectChangedToast(next, `${dims.exportWidth}×${dims.exportHeight}`),
              'info'
            );
          }}
          onChangeQuality={(next) => {
            setRecordQuality(next);
            const dims = getRecordingDimensions(recordAspect, next);
            const pxText = next.replace('p', ' px');
            showToast(
              studioT.qualityChangedToast(pxText, `${dims.exportWidth}×${dims.exportHeight}`),
              'info'
            );
          }}
          onChangeRenderMode={(next) => {
            if (
              next === 'offline' &&
              (customStageMedia?.kind === 'camera' || cameraOverlayActive || micEnabled)
            ) {
              showToast(studioT.customMediaLiveRequiredToast, 'info');
              return;
            }
            setRecordRenderMode(next);
            try {
              localStorage.setItem(STORAGE_RECORD_RENDER_MODE_KEY, next);
            } catch {
              // ignore
            }
            showToast(
              next === 'offline' ? studioT.renderModeOfflineToast : studioT.renderModeLiveToast,
              'info'
            );
          }}
          onOpenCustomMedia={() => setIsStageMediaOpen(true)}
        />
      )}

      {/* LIVE STREAM RECORDING LOCK SCREEN + TOP PROGRESS BAR + STOP BUTTON */}
      {isRecording && !offlineExportState && (
        <>
          <div
            data-no-zen-toggle="true"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1.5px] cursor-not-allowed touch-none"
          />

          <div
            data-no-zen-toggle="true"
            role="status"
            aria-live="polite"
            className="fixed left-1/2 -translate-x-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[45] w-[min(calc(100vw-1.5rem),28rem)] rounded-2xl bg-[#101118]/92 backdrop-blur-xl border border-rose-400/40 shadow-2xl shadow-black/80 px-4 py-3 space-y-2 pointer-events-none"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-85" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {studioT.liveRecordingTitle}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs font-mono tabular-nums">
                <span className="text-rose-300 font-bold">
                  REC {formatTime(recordingElapsedSec)}
                </span>
                <span className="text-gray-300">
                  {formatTime(currentTime)}
                  {duration > 0 ? ` / ${formatTime(duration)}` : ''}
                </span>
                {duration > 0 && (
                  <span className="text-amber-300 font-semibold">
                    {Math.round(progressPercent)}%
                  </span>
                )}
              </div>
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                style={{ width: `${duration > 0 ? Math.max(2, progressPercent) : 100}%` }}
                className={`h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 transition-[width] duration-150 ${
                  duration > 0 ? '' : 'animate-pulse'
                }`}
              />
            </div>

            <p className="text-[11px] text-gray-300 truncate">
              {studioT.liveRecordingStreamHint}
            </p>
          </div>

          <div
            data-no-zen-toggle="true"
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 -translate-x-1/2 bottom-[max(0.85rem,env(safe-area-inset-bottom))] sm:bottom-5 z-[45]"
          >
            <button
              type="button"
              onClick={stopStudioRecording}
              aria-label={studioT.recordingStopAria}
              className="h-12 px-6 rounded-2xl bg-gradient-to-tr from-red-700 to-rose-500 hover:from-red-600 hover:to-rose-400 text-white font-bold text-sm flex items-center gap-2.5 shadow-2xl shadow-red-950/90 ring-2 ring-white/50 active:scale-95 transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current shrink-0" />
              <span>{studioT.liveRecordingStopBtn}</span>
            </button>
          </div>
        </>
      )}

      {offlineExportState && (
        <>
          <div
            data-no-zen-toggle="true"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1.5px] cursor-not-allowed touch-none"
          />

          <div
            data-no-zen-toggle="true"
            role="status"
            aria-live="polite"
            className="fixed left-1/2 -translate-x-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[45] w-[min(calc(100vw-1.5rem),28rem)] rounded-2xl bg-[#101118]/92 backdrop-blur-xl border border-emerald-400/40 shadow-2xl shadow-black/80 px-4 py-3 space-y-2 pointer-events-none"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-85" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {studioT.offlineExportTitle}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-emerald-300 shrink-0">
                {Math.round(offlineExportState.progress * 100)}%
              </span>
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.max(2, Math.round(offlineExportState.progress * 100))}%`,
                }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-400 transition-[width] duration-150"
              />
            </div>

            <p className="text-[11px] text-gray-300 truncate">
              {offlineExportState.stage === 'preparing'
                ? studioT.offlineStagePreparing
                : offlineExportState.stage === 'rendering'
                ? studioT.offlineStageRendering
                : studioT.offlineStageFinalizing}
            </p>
          </div>

          <div
            data-no-zen-toggle="true"
            className="fixed inset-0 z-[43] flex items-center justify-center px-6 pointer-events-none"
          >
            <div className="max-w-md px-6 py-4 rounded-3xl bg-[#0d1016]/70 backdrop-blur-md border border-emerald-400/25 shadow-2xl shadow-black/70 text-center">
              <p className="text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(16,185,129,0.35)]">
                {studioT.offlineWaitMessage}
              </p>
            </div>
          </div>

          <div
            data-no-zen-toggle="true"
            onClick={(e) => e.stopPropagation()}
            className="fixed left-1/2 -translate-x-1/2 bottom-[max(0.85rem,env(safe-area-inset-bottom))] sm:bottom-5 z-[45]"
          >
            <button
              type="button"
              onClick={() => offlineAbortRef.current?.abort()}
              className="h-12 px-6 rounded-2xl bg-[#161922]/90 hover:bg-rose-600/35 border border-white/25 hover:border-rose-400/60 text-white font-bold text-sm flex items-center gap-2 shadow-2xl shadow-black/80 ring-1 ring-white/15 active:scale-95 transition cursor-pointer"
            >
              <X className="w-4 h-4 shrink-0" />
              <span>{studioT.offlineCancelBtn}</span>
            </button>
          </div>
        </>
      )}

      {/* VIDEO ELEMENT (Fullscreen classic player by default; decoded off-opacity into Studio canvas when active) */}
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        playsInline
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setCurrentTime(el.currentTime);
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setDuration(el.duration);
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
            const targetTime = Math.max(0, Math.min(pending.time, el.duration || pending.time));
            if (targetTime > 0) {
              try {
                el.currentTime = targetTime;
                setCurrentTime(targetTime);
              } catch {
                // ignore
              }
            }
          }
        }}
        onPause={(e) => handleAudioPause(e.currentTarget)}
        onEnded={() => {
          if (isRecordingRef.current) {
            const hasNextSlide =
              playlistRef.current.length > 1 &&
              !isShuffle &&
              !isRepeat &&
              currentIndexRef.current + 1 < playlistRef.current.length &&
              playlistRef.current.some(
                (item) => item.mediaType === 'image' || item.mediaType === 'video'
              );
            if (hasNextSlide) {
              void selectTrack(currentIndexRef.current + 1, true, true);
              return;
            }
            stopStudioRecording();
            return;
          }
          if (isRepeat && videoRef.current) {
            videoRef.current.currentTime = 0;
            void videoRef.current.play();
          } else {
            nextTrack(true);
          }
        }}
        onError={() => {
          if (!isVideoTrack) return;
          setIsPlaying(false);
          if (isRecordingRef.current) {
            stopStudioRecording();
          }
          showToast(t.streamErrorToast, 'error');
        }}
        className={
          isClassicVideoPlayer
            ? 'fixed inset-0 z-[5] w-full h-full object-contain bg-black cursor-pointer'
            : 'fixed top-0 left-0 w-10 h-10 opacity-[0.01] pointer-events-none'
        }
      />

      {/* DECOUPLED CUSTOM PHOTO/VIDEO STAGE ELEMENTS */}
      <video
        ref={customBgVideoRef}
        playsInline
        preload="auto"
        onLoadedData={(e) => {
          const el = e.currentTarget;
          if (!isPlayingRef.current && !isRecordingRef.current && el.paused && el.currentTime < 0.01) {
            try {
              el.currentTime = 0.01;
            } catch {
              // ignore seek on load
            }
          }
        }}
        onEnded={() => {
          if (stageMediaQueueRef.current.length > 1) {
            advanceStageMedia(1);
          }
        }}
        onError={() => {
          if (customStageMediaRef.current?.kind === 'video') {
            showToast(studioT.customMediaVideoDecodeErrorToast, 'error');
          }
        }}
        className="fixed top-0 left-0 w-10 h-10 opacity-[0.01] pointer-events-none z-[1]"
      />
      <audio
        ref={stageBgAudioRef}
        loop
        preload="auto"
        playsInline
        onError={() => {
          if (stageAudioRef.current) {
            showToast(t.streamErrorToast, 'error');
          }
        }}
        className="hidden"
      />
      <video
        ref={cameraVideoRef}
        autoPlay
        muted
        playsInline
        className="fixed top-0 left-0 w-10 h-10 opacity-[0.01] pointer-events-none z-[1]"
      />
      <input
        ref={customBgInputRef}
        type="file"
        multiple
        accept={
          isVideoTrack || isImageTrack
            ? 'image/*,video/*,audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac'
            : 'image/*,video/*'
        }
        className="hidden"
        onChange={(e) => {
          handlePickStageMediaFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={(el) => {
          reselectFolderInputRef.current = el;
          if (el) {
            el.webkitdirectory = true;
            el.setAttribute('webkitdirectory', '');
            el.setAttribute('directory', '');
          }
        }}
        type="file"
        multiple
        accept="audio/*,video/mp4,video/webm,video/quicktime,image/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.mp4,.webm,.mov,.m4v,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          void handleSelectFolderInputFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* ZEN MODE: FLOATING CIRCULAR TRACK ORBS (AUDIO MODE ONLY; hidden in Record Armed/Active or Clean Fullscreen backdrop) */}
      {isFloatingOrbsActive && (
        <FloatingTrackOrbs
          tracks={playlist}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          analyser={analyser}
          showCaptions={showOrbCaptions}
          isLayeredBackground={mixEnabled && visualDna.mixLayers.length > 0}
          snapshotRef={liveOrbsSnapshotRef}
          radioNowPlaying={currentTrack?.isRadio ? radioNowPlaying : null}
          showRadioNowPlaying={isShowingRadioNowPlaying}
          onSelectTrack={(idx) => void selectTrack(idx, true)}
          onTogglePlay={() => void togglePlay()}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      <div
        className={`fixed right-4 z-[80] flex flex-col gap-2 max-w-[calc(100vw-2rem)] sm:max-w-md pointer-events-none transition-[top] duration-200 ${
          isRecording
            ? 'top-[136px] sm:top-[140px]'
            : isRecordArmed
            ? uiVisible
              ? 'top-[122px] sm:top-[128px]'
              : 'top-[66px]'
            : uiVisible
            ? 'top-20'
            : 'top-4'
        }`}
      >
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
                viewBox="0 0 1723.25 546.98"
                shapeRendering="geometricPrecision"
                aria-hidden="true"
                className="h-6 sm:h-7 w-auto block"
              >
                <path
                  fill="lime"
                  fillRule="nonzero"
                  d="M-0 128.11l80.31 0 100.58 152.25 69.75 -152.25 80.12 0 -254.26 417.61 -17.82 1.26 90.38 -200.71 -149.05 -218.16zm1404.89 0l90.99 0 56.08 97.2 67.03 -97.2 89.72 0 -119.51 167.47 134.05 251.06 -14.71 0.31 -151.34 -208.95 -73.75 102.15 -89.72 0 118.41 -164.15 -107.24 -147.89z"
                />
                <path
                  fill="#EDEDED"
                  fillRule="nonzero"
                  d="M357.49 128.11l67.58 0 0 39.67c7.25,-15.48 16.85,-27.23 28.79,-35.26 12.05,-8.03 25.17,-12.05 39.38,-12.05 10.09,0 20.67,2.64 31.73,8.03l-24.29 67.58c-9.11,-4.6 -16.65,-6.86 -22.53,-6.86 -11.95,0 -22.13,7.45 -30.36,22.34 -8.33,14.88 -12.44,44.07 -12.44,87.56l0.3 15.18 0 125.86 -78.16 0 0 -312.04zm237.22 -128.11c13.71,0 25.47,5 35.26,14.89 9.89,9.9 14.79,21.84 14.79,35.95 0,13.91 -4.9,25.76 -14.6,35.55 -9.7,9.8 -21.35,14.69 -34.97,14.69 -13.9,0 -25.76,-5 -35.55,-14.99 -9.89,-9.99 -14.79,-22.13 -14.79,-36.43 0,-13.72 4.9,-25.37 14.6,-35.06 9.7,-9.7 21.45,-14.6 35.26,-14.6zm-39.28 128.11l78.16 0 0 312.04 -78.16 0 0 -312.04zm158.47 -115.18l78.16 0 0 115.18 46.43 0 0 67.58 -46.43 0 0 244.46 -78.16 0 0 -244.46 -39.96 0 0 -67.58 39.96 0 0 -115.18zm166.21 115.18l78.16 0 0 36.43c13.42,-14.79 28.3,-25.85 44.76,-33.1 16.35,-7.35 34.27,-10.97 53.67,-10.97 19.5,0 37.22,4.8 52.89,14.4 15.77,9.6 28.41,23.7 38.01,42.12 12.44,-18.41 27.71,-32.52 45.84,-42.12 18.12,-9.59 38,-14.4 59.45,-14.4 22.23,0 41.83,5.19 58.67,15.48 16.94,10.28 28.99,23.8 36.43,40.35 7.34,16.64 11.07,43.68 11.07,81.1l0 182.76 -78.16 0 0 -157.69c0,-35.26 -4.41,-59.16 -13.32,-71.59 -8.91,-12.44 -22.34,-18.71 -40.06,-18.71 -13.61,0 -25.76,3.82 -36.43,11.46 -10.77,7.54 -18.8,18.12 -23.99,31.53 -5.19,13.42 -7.84,34.97 -7.84,64.74l0 140.25 -78.16 0 0 -150.54c0,-27.81 -2.05,-47.99 -6.27,-60.43 -4.12,-12.54 -10.38,-21.75 -18.61,-27.92 -8.33,-6.07 -18.41,-9.11 -30.16,-9.11 -13.13,0 -25.08,3.82 -35.75,11.56 -10.77,7.73 -18.71,18.51 -24.09,32.41 -5.29,13.91 -7.93,35.85 -7.93,65.72l0 138.3 -78.16 0 0 -312.04z"
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
              onClick={() => setIsStageMediaOpen(true)}
              aria-pressed={
                Boolean(customStageMedia) ||
                cameraOverlayActive ||
                Boolean((isVideoTrack || isImageTrack) && stageAudio) ||
                coverFrameMotion !== 'static' ||
                coverRotationTarget !== 'none' ||
                showCoverCaption
              }
              title={studioT.customMediaTitle}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                customStageMedia ||
                cameraOverlayActive ||
                ((isVideoTrack || isImageTrack) && stageAudio) ||
                coverFrameMotion !== 'static' ||
                coverRotationTarget !== 'none' ||
                showCoverCaption
                  ? 'bg-fuchsia-600/25 text-fuchsia-100 border-fuchsia-400/50 shadow-sm shadow-fuchsia-950/40'
                  : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ImagePlus className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>
                {customStageMedia ||
                cameraOverlayActive ||
                ((isVideoTrack || isImageTrack) && stageAudio)
                  ? studioT.customMediaActiveBtn
                  : studioT.customMediaBtn}
              </span>
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
              setIsHelpOpen(true);
              trackEvent('modal_open', { modal: 'help' });
            }}
            aria-label={helpT.helpBtnLabel}
            title={helpT.helpBtnLabel}
            className="p-2.5 rounded-xl glass text-gray-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

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
      <main
        className={`relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-3 lg:px-6 lg:py-4 [@media(max-height:540px)_and_(orientation:landscape)]:py-1.5 grid grid-cols-1 md:grid-cols-12 landscape:grid-cols-12 gap-4 lg:gap-6 items-center select-none ${
          isStudioMode || isClassicVideoPlayer || isImageTrack || isRecordArmed
            ? 'pointer-events-none opacity-0'
            : 'cursor-pointer'
        }`}
      >
        {/* LEFT/CENTER: CLICKABLE ALBUM ART (Hidden when Zen Floating Orbs, Studio Mode, Fullscreen Media, or Armed Recording take over) */}
        <section
          className={`md:col-span-6 lg:col-span-7 landscape:col-span-6 lg:landscape:col-span-7 flex flex-col items-center justify-center text-center py-2 lg:py-4 [@media(max-height:540px)_and_(orientation:landscape)]:py-0 transition-all duration-300 ${
            uiVisible &&
            !isStudioMode &&
            !isClassicVideoPlayer &&
            !isImageTrack &&
            !isRecordArmed &&
            !(
              customStageMedia &&
              !isVideoTrack &&
              !isImageTrack &&
              (cameraOverlayActive || customStageMedia.displayMode === 'backdrop')
            )
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-50 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onPointerDown={handleCoverPointerDown}
            onPointerMove={handleCoverPointerMove}
            onPointerUp={handleCoverPointerUp}
            onPointerCancel={handleCoverPointerCancel}
            onClick={() => {
              if (coverSwipeHandledRef.current) {
                coverSwipeHandledRef.current = false;
                return;
              }
              openSources(!isOnline && playlist.length === 0 ? 'folder' : 'audius');
            }}
            aria-label={t.coverAriaLabel}
            className="relative group w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 [@media(max-height:540px)_and_(orientation:landscape)]:w-36 [@media(max-height:540px)_and_(orientation:landscape)]:h-36 [@media(min-height:541px)_and_(max-height:700px)_and_(orientation:landscape)]:w-48 [@media(min-height:541px)_and_(max-height:700px)_and_(orientation:landscape)]:h-48 rounded-3xl overflow-hidden glass shadow-2xl shadow-purple-950/50 border border-white/10 transition-transform duration-300 hover:scale-[1.02] cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 touch-none select-none"
          >
            <img
              src={currentTrack?.cover || DEFAULT_COVER_IMAGE}
              alt={currentTrack?.title || 'YRitmX'}
              draggable={false}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = '1';
                  img.src = DEFAULT_COVER_IMAGE;
                }
              }}
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {typeof currentTrack?.playCount === 'number' && (
              <div
                title={currentTrack.playCount.toLocaleString()}
                className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[11px] font-mono tabular-nums text-gray-200/90 flex items-center gap-1 pointer-events-none"
              >
                <Play className="w-2.5 h-2.5 fill-current text-purple-300/90" />
                <span>{formatPlayCount(currentTrack.playCount)}</span>
              </div>
            )}

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/55 backdrop-blur-md text-[11px] font-medium text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
              {t.changeSourceBadge}
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-[11px] font-medium text-purple-300 mb-1 truncate">
                {(currentTrack?.isRadio ? t.radioFmLabel : currentTrack?.sourceName) ||
                  (pendingFolderRestore
                    ? `${t.folderPrefix}: ${pendingFolderRestore.folderName}`
                    : !isOnline
                    ? t.offlineCoverSubtitle
                    : `Audius: @${currentHandle}`)}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {coverDisplayTitle ||
                  pendingFolderRestore?.trackTitle ||
                  (isLoadingTracks
                    ? t.loadingRitmXoid
                    : !isOnline
                    ? t.chooseDeviceFolderBtn
                    : t.chooseTrack)}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 truncate">
                {coverDisplayArtist ||
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
          <div className="hidden lg:flex flex-col items-center gap-2 mt-4 xl:mt-6 [@media(max-height:660px)]:mt-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div
                data-no-zen-toggle="true"
                className="glass px-3 py-2 rounded-xl flex items-center gap-2 cursor-default"
              >
                <label htmlFor="desktop-viz-select" className="text-xs text-gray-400 whitespace-nowrap">
                  {t.visualLabel}
                </label>
                <select
                  id="desktop-viz-select"
                  value={isCarouselMode ? VIZ_CAROUSEL_MODE_ID : vizMode}
                  onChange={(e) => handleSelectVizModeOrCarousel(parseInt(e.target.value, 10))}
                  className="bg-transparent text-xs text-purple-300 font-semibold focus:outline-none cursor-pointer max-w-[190px]"
                >
                  <option value={VIZ_CAROUSEL_MODE_ID} className="bg-gray-900 text-purple-300 font-semibold">
                    {studioT.carouselModeLabel}
                  </option>
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

            {isCarouselMode && (
              <div
                data-no-zen-toggle="true"
                role="group"
                aria-label={studioT.carouselIntervalAria}
                className="flex flex-wrap items-center justify-center gap-1.5"
              >
                {CAROUSEL_INTERVAL_OPTIONS.map((sec) => {
                  const active = carouselIntervalSec === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleChangeCarouselInterval(sec)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold tabular-nums transition cursor-pointer ${
                        active
                          ? 'bg-purple-600/35 border-purple-400 text-white shadow-sm shadow-purple-950/40'
                          : 'glass border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {studioT.carouselSecondsBtn(sec)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: DESKTOP & LANDSCAPE PLAYLIST PANEL */}
        {uiVisible && (
          <section
            data-no-zen-toggle="true"
            className="hidden md:flex landscape:flex md:col-span-6 lg:col-span-5 landscape:col-span-6 lg:landscape:col-span-5 flex-col glass rounded-3xl p-4 sm:p-5 h-[360px] lg:h-[400px] xl:h-[450px] max-h-[58vh] [@media(max-height:540px)_and_(orientation:landscape)]:h-[205px] [@media(max-height:540px)_and_(orientation:landscape)]:p-3 border border-white/10 cursor-default"
          >
            <div className="flex flex-col gap-2 pb-2.5 sm:pb-3 border-b border-white/10 mb-2.5 sm:mb-3 [@media(max-height:540px)_and_(orientation:landscape)]:pb-1.5 [@media(max-height:540px)_and_(orientation:landscape)]:mb-1.5 [@media(max-height:540px)_and_(orientation:landscape)]:gap-1">
              <div className="flex items-center justify-between gap-2">
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
              {canSortPlaylist && (
                <div className="flex items-center justify-end">
                  <PlaylistSortControls
                    sortMode={playlistSortMode}
                    onToggleSort={handleTogglePlaylistSort}
                    showDateAndPopular={hasSortableStats}
                  />
                </div>
              )}
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
                if (currentTrack?.mediaType === 'image') {
                  if (e.key === 'ArrowRight') {
                    const nextTime = Math.min(IMAGE_SLIDE_DURATION_SEC, imageElapsedRef.current + 1);
                    imageElapsedRef.current = nextTime;
                    setCurrentTime(nextTime);
                  } else if (e.key === 'ArrowLeft') {
                    const nextTime = Math.max(0, imageElapsedRef.current - 1);
                    imageElapsedRef.current = nextTime;
                    setCurrentTime(nextTime);
                  }
                  return;
                }
                const mediaEl = getActiveMediaElement();
                if (!mediaEl || !duration) return;
                if (e.key === 'ArrowRight') {
                  pendingSeekRef.current = null;
                  mediaEl.currentTime = Math.min(duration, mediaEl.currentTime + 5);
                  setCurrentTime(mediaEl.currentTime);
                  persistCurrentSession({ currentTime: mediaEl.currentTime });
                } else if (e.key === 'ArrowLeft') {
                  pendingSeekRef.current = null;
                  mediaEl.currentTime = Math.max(0, mediaEl.currentTime - 5);
                  setCurrentTime(mediaEl.currentTime);
                  persistCurrentSession({ currentTime: mediaEl.currentTime });
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
            <div className="flex items-center gap-2 relative">
              {fmFlyout && (
                <div
                  key={fmFlyout.id}
                  aria-live="polite"
                  className="pointer-events-none absolute -top-11 left-0 z-30 whitespace-nowrap px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/35 via-fuchsia-500/30 to-purple-500/35 border border-cyan-300/50 backdrop-blur-md text-xs font-bold tracking-wide text-white shadow-lg shadow-cyan-950/50 animate-fm-fly-dissolve"
                >
                  {fmFlyout.label}
                </div>
              )}
              <button
                type="button"
                onPointerDown={handleFmHoldStart}
                onPointerUp={handleFmHoldCancel}
                onPointerLeave={handleFmHoldCancel}
                onPointerCancel={handleFmHoldCancel}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => {
                  if (fmHoldTriggeredRef.current) {
                    fmHoldTriggeredRef.current = false;
                    return;
                  }
                  void handleCycleFmStation(1);
                }}
                aria-label="FM"
                className={`relative overflow-hidden h-10 px-3 rounded-xl border flex items-center justify-center cursor-pointer select-none touch-manipulation transition-transform active:scale-95 animate-fm-btn-glow ${
                  currentTrack?.isRadio
                    ? 'bg-gradient-to-tr from-cyan-500/30 via-purple-500/30 to-fuchsia-500/30 text-white'
                    : 'bg-gradient-to-tr from-cyan-500/15 via-purple-500/20 to-fuchsia-500/20 text-cyan-100 hover:text-white'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-fm-btn-shimmer"
                />
                <span className="relative z-10 text-xs font-extrabold tracking-widest bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                  FM
                </span>
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
                onPointerDown={handlePlayHoldStart}
                onPointerUp={handlePlayHoldCancel}
                onPointerLeave={handlePlayHoldCancel}
                onPointerCancel={handlePlayHoldCancel}
                onClick={handlePlayButtonClick}
                title={studioT.holdPlayHintTitle}
                aria-label={
                  isRecording
                    ? studioT.recordingStopAria
                    : isRecordArmed
                    ? studioT.recordPlayAria
                    : isPlaying
                    ? t.pauseLabel
                    : t.playLabel
                }
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300 cursor-pointer select-none touch-none ${
                  isRecording
                    ? 'bg-gradient-to-tr from-red-700 to-rose-500 shadow-red-900/70 ring-2 ring-red-300/80 scale-105'
                    : isRecordArmed
                    ? 'bg-gradient-to-tr from-red-600 to-rose-500 shadow-red-900/60 ring-2 ring-white/40 hover:scale-105'
                    : isHoldingPlay
                    ? 'bg-gradient-to-tr from-rose-600 to-purple-600 shadow-rose-900/60 ring-2 ring-rose-400/70 scale-95'
                    : 'bg-gradient-to-tr from-purple-600 to-pink-500 shadow-purple-900/50 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <Square className="w-5 h-5 fill-current" />
                ) : isRecordArmed ? (
                  <>
                    <Video className="w-5 h-5" />
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white"
                    />
                  </>
                ) : isPlaying ? (
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

      {/* HIDDEN HTML5 AUDIO ELEMENT (CORS / WebAudio EQ + Spectrum) */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onPlaying={() => {
          mirrorRetriesRef.current = 0;
          setIsPlaying(true);
          setAwaitingAutoplayUnlock(false);
        }}
        onTimeUpdate={(e) => handleAudioTimeUpdate(e.currentTarget)}
        onDurationChange={(e) => handleAudioDurationChange(e.currentTarget)}
        onLoadedMetadata={(e) => handleAudioLoadedMetadata(e.currentTarget)}
        onPause={(e) => handleAudioPause(e.currentTarget)}
        onEnded={(e) => handleAudioEnded(e.currentTarget)}
        onError={(e) => handleAudioStreamError('cors', e.currentTarget)}
      />

      {/* FALLBACK DIRECT HTML5 AUDIO ELEMENT (for radio/URL streams rejected by CORS) */}
      <audio
        ref={fallbackAudioRef}
        onPlaying={() => {
          mirrorRetriesRef.current = 0;
          setIsPlaying(true);
          setAwaitingAutoplayUnlock(false);
        }}
        onTimeUpdate={(e) => handleAudioTimeUpdate(e.currentTarget)}
        onDurationChange={(e) => handleAudioDurationChange(e.currentTarget)}
        onLoadedMetadata={(e) => handleAudioLoadedMetadata(e.currentTarget)}
        onPause={(e) => handleAudioPause(e.currentTarget)}
        onEnded={(e) => handleAudioEnded(e.currentTarget)}
        onError={(e) => handleAudioStreamError('fallback', e.currentTarget)}
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
        cloudUser={cloudUser}
        isSavingToCloud={isSavingToCloud}
        onSaveToCloud={(tab) => void handleSaveToCloud(tab)}
        onSignInGoogleCloud={handleSignInGoogleCloud}
        onSignInEmailCloud={handleSignInEmailCloud}
        onResetPasswordCloud={handleResetPasswordCloud}
        onSignOutCloud={() => void handleSignOutCloud()}
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
        isCarouselMode={isCarouselMode}
        carouselIntervalSec={carouselIntervalSec}
        paletteIndex={paletteIndex}
        autoVisualPerTrack={autoVisualPerTrack}
        mixEnabled={mixEnabled}
        showOrbs={showOrbs}
        showOrbCaptions={showOrbCaptions}
        hasCustomStageMedia={
          Boolean(customStageMedia) ||
          cameraOverlayActive ||
          Boolean((isVideoTrack || isImageTrack) && stageAudio)
        }
        isAppInstalled={isInstalled}
        isFullscreen={isNativeFullscreen}
        onChangeVizMode={handleSelectVizModeOrCarousel}
        onChangeCarouselInterval={handleChangeCarouselInterval}
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
        onOpenStageMedia={() => setIsStageMediaOpen(true)}
        onOpenSources={(tab) => openSources(tab)}
        onOpenEqualizer={() => {
          setIsEqOpen(true);
          trackEvent('modal_open', { modal: 'equalizer' });
        }}
        onOpenHelp={() => {
          setIsHelpOpen(true);
          trackEvent('modal_open', { modal: 'help' });
        }}
        onToggleUI={() => {
          setUiVisible(false);
          trackEvent('zen_mode_toggle', { zen_enabled: true, trigger: 'menu' });
        }}
        onToggleFullscreen={() => void handleToggleFullscreen()}
        onInstallApp={() => void handleInstallApp()}
      />

      <StageMediaModal
        isOpen={isStageMediaOpen}
        isVideoTrack={isVideoTrack}
        isFullscreenTrack={isVideoTrack || isImageTrack}
        customMedia={customStageMedia}
        stageAudio={isVideoTrack || isImageTrack ? stageAudio : null}
        activeTrackTitle={currentTrack?.title}
        activeTrackArtist={currentTrack?.artist}
        activeTrackCover={currentTrack?.cover}
        coverFrameMotion={coverFrameMotion}
        coverRotationTarget={coverRotationTarget}
        showCoverCaption={showCoverCaption}
        fileQueueCount={stageMediaQueue.length}
        fileQueueIndex={stageMediaIndex}
        cameraOverlayActive={cameraOverlayActive}
        trackVolume={volume}
        isTrackMuted={isMuted}
        micEnabled={micEnabled}
        micVolume={micVolume}
        micEchoFilter={micEchoFilter}
        onClose={() => setIsStageMediaOpen(false)}
        onTriggerPickFile={() => customBgInputRef.current?.click()}
        onPrevFileItem={() => advanceStageMedia(-1)}
        onNextFileItem={() => advanceStageMedia(1)}
        onToggleCamera={() => void handleToggleCamera()}
        onFlipCamera={() => void handleFlipCamera()}
        onToggleMic={() => void handleToggleMicrophone()}
        onToggleMicEchoFilter={() => void handleToggleMicEchoFilter()}
        onToggleFrameMotion={handleToggleFrameMotion}
        onToggleFrameRotation={handleToggleFrameRotation}
        onSelectRotationTarget={handleSelectRotationTarget}
        onToggleCoverCaption={handleToggleCoverCaption}
        onActivateBackdrop={handleActivateBackdrop}
        onSelectBackdropOverlay={handleSelectBackdropOverlay}
        onChangeTrackVolume={(nextVol) => {
          const clamped = Math.max(0, Math.min(1, nextVol));
          setVolume(clamped);
          if (clamped > 0 && isMuted) setIsMuted(false);
        }}
        onToggleSound={handleToggleStageMediaSound}
        onChangeSoundVolume={handleChangeStageMediaVolume}
        onToggleStageAudio={handleToggleStageAudio}
        onChangeStageAudioVolume={handleChangeStageAudioVolume}
        onRemoveStageAudio={handleRemoveStageAudio}
        onChangeMicVolume={(vol) => setMicVolume(Math.max(0, Math.min(1.5, vol)))}
        onRemoveFileMedia={handleRemoveFileMedia}
        onClearMedia={handleClearStageMedia}
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
        canSort={canSortPlaylist}
        showDateAndPopularSort={hasSortableStats}
        sortMode={playlistSortMode}
        onToggleSort={handleTogglePlaylistSort}
        onSelectTrack={(idx) => void selectTrack(idx, true)}
        onTriggerDemo={() => void handleTriggerDemo()}
        onOpenFolderSource={() => openSources('folder')}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
