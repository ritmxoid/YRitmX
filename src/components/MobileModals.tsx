import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Disc3,
  Download,
  Eye,
  FolderOpen,
  Globe,
  HelpCircle,
  ImagePlus,
  Layers,
  ListMusic,
  Maximize2,
  Minimize2,
  Share,
  Sliders,
  Smartphone,
  Sparkles,
  Type,
  X,
} from 'lucide-react';
import {
  CAROUSEL_INTERVAL_OPTIONS,
  PALETTES,
  VIZ_CAROUSEL_MODE_ID,
  VIZ_MODES,
} from '../constants/visualizer';
import { useI18n } from '../i18n/I18nContext';
import { getHelpMessages } from '../i18n/helpMessages';
import { getStudioMessages } from '../i18n/studioMessages';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import { PlaylistSortField, PlaylistSortMode, SourceTab, Track } from '../types/audio';
import { PlaylistItems } from './PlaylistItems';
import { PlaylistSortControls } from './PlaylistSortControls';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  vizMode: number;
  isCarouselMode: boolean;
  carouselIntervalSec: number;
  paletteIndex: number;
  autoVisualPerTrack: boolean;
  mixEnabled: boolean;
  showOrbs: boolean;
  showOrbCaptions: boolean;
  hasCustomStageMedia?: boolean;
  isAppInstalled: boolean;
  isFullscreen: boolean;
  onChangeVizMode: (val: number) => void;
  onChangeCarouselInterval: (sec: number) => void;
  onChangePalette: (val: number) => void;
  onToggleAutoVisual: () => void;
  onToggleMix: () => void;
  onToggleOrbs: () => void;
  onToggleOrbCaptions: () => void;
  onOpenStageMedia?: () => void;
  onOpenSources: (tab: SourceTab) => void;
  onOpenEqualizer: () => void;
  onOpenHelp?: () => void;
  onToggleUI: () => void;
  onToggleFullscreen: () => void;
  onInstallApp: () => void;
}

export function MobileMenuModal({
  isOpen,
  onClose,
  vizMode,
  isCarouselMode,
  carouselIntervalSec,
  paletteIndex,
  autoVisualPerTrack,
  mixEnabled,
  showOrbs,
  showOrbCaptions,
  hasCustomStageMedia = false,
  isAppInstalled,
  isFullscreen,
  onChangeVizMode,
  onChangeCarouselInterval,
  onChangePalette,
  onToggleAutoVisual,
  onToggleMix,
  onToggleOrbs,
  onToggleOrbCaptions,
  onOpenStageMedia,
  onOpenSources,
  onOpenEqualizer,
  onOpenHelp,
  onToggleUI,
  onToggleFullscreen,
  onInstallApp,
}: MobileMenuModalProps) {
  const { t, lang, setLang } = useI18n();
  const studioT = getStudioMessages(lang);
  const helpT = getHelpMessages(lang);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsLangOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLangOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isLangOpen]);

  if (!isOpen) return null;

  const currentLangOption =
    SUPPORTED_LANGUAGES.find((item) => item.code === lang) ?? SUPPORTED_LANGUAGES[0];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/75 backdrop-blur-md sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.menuHeader}
      onClick={onClose}
    >
      <div
        className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border-t sm:border border-white/10 max-h-[88vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10 mb-4">
          <h3 className="font-bold text-base flex items-center gap-2 text-white min-w-0">
            <Sliders className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">{t.menuHeader}</span>
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <div ref={langMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen((prev) => !prev)}
                aria-expanded={isLangOpen}
                aria-haspopup="listbox"
                aria-label={currentLangOption.label}
                title={currentLangOption.label}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  isLangOpen
                    ? 'bg-purple-600/30 border-purple-400/50 text-white'
                    : 'bg-white/5 border-white/10 text-gray-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {currentLangOption.short}
              </button>

              {isLangOpen && (
                <div
                  role="listbox"
                  aria-label={currentLangOption.label}
                  className="absolute end-0 top-full mt-1.5 z-50 w-56 p-1.5 rounded-2xl bg-[#101018]/95 backdrop-blur-xl border border-white/15 shadow-2xl grid grid-cols-3 gap-1"
                >
                  {SUPPORTED_LANGUAGES.map((item) => {
                    const active = item.code === lang;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setLang(item.code);
                          setIsLangOpen(false);
                        }}
                        title={item.label}
                        className={`px-2 py-1.5 rounded-lg text-left transition cursor-pointer flex flex-col ${
                          active
                            ? 'bg-purple-600/35 text-white border border-purple-400/50'
                            : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <span className="text-xs font-bold leading-tight">{item.short}</span>
                        <span className="text-[9px] text-gray-400 truncate leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeMenuLabel}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSources('audius');
              }}
              className="py-2.5 px-2 rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{t.tabAudius}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSources('folder');
              }}
              className="py-2.5 px-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.shortFolder}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSources('url');
              }}
              className="py-2.5 px-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL</span>
            </button>
          </div>

          <div>
            <label htmlFor="mobile-viz-select" className="text-xs text-gray-400 block mb-1.5">
              {t.vizModeField}
            </label>
            <select
              id="mobile-viz-select"
              value={isCarouselMode ? VIZ_CAROUSEL_MODE_ID : vizMode}
              onChange={(e) => onChangeVizMode(parseInt(e.target.value, 10))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value={VIZ_CAROUSEL_MODE_ID} className="bg-gray-900 text-purple-300 font-semibold">
                {studioT.carouselModeLabel}
              </option>
              {VIZ_MODES.map((m, idx) => (
                <option key={m.id} value={m.id} className="bg-gray-900 text-gray-100">
                  {t.vizModes[idx] ?? m.label}
                </option>
              ))}
            </select>
            {isCarouselMode && (
              <div
                role="group"
                aria-label={studioT.carouselIntervalAria}
                className="grid grid-cols-6 gap-1.5 mt-2"
              >
                {CAROUSEL_INTERVAL_OPTIONS.map((sec) => {
                  const active = carouselIntervalSec === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChangeCarouselInterval(sec)}
                      className={`py-1.5 px-1 rounded-lg border text-[11px] font-semibold tabular-nums transition cursor-pointer ${
                        active
                          ? 'bg-purple-600/35 border-purple-400 text-white shadow-sm shadow-purple-950/40'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {studioT.carouselSecondsBtn(sec)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="mobile-palette-select" className="text-xs text-gray-400 block mb-1.5">
              {t.paletteField}
            </label>
            <select
              id="mobile-palette-select"
              value={paletteIndex}
              onChange={(e) => onChangePalette(parseInt(e.target.value, 10))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
            >
              {PALETTES.map((p, idx) => (
                <option key={p.id} value={p.id} className="bg-gray-900 text-gray-100">
                  {t.palettes[idx] ?? p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEqualizer();
              }}
              className="py-2.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer min-w-0"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{t.eqLabel}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMix}
              className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                mixEnabled
                  ? 'bg-sky-600/25 border-sky-500/40 text-sky-200'
                  : 'bg-white/5 border-white/10 text-gray-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.shortMix}</span>
            </button>
            <button
              type="button"
              onClick={onToggleAutoVisual}
              className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                autoVisualPerTrack
                  ? 'bg-purple-600/25 border-purple-500/40 text-purple-200'
                  : 'bg-white/5 border-white/10 text-gray-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.shortAuto}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleOrbs}
              title={t.orbsBtnTitle}
              aria-pressed={showOrbs}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                showOrbs
                  ? 'bg-emerald-600/25 border-emerald-400/45 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Disc3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.orbsBtn}</span>
            </button>
            <button
              type="button"
              onClick={onToggleOrbCaptions}
              title={t.captionBtnTitle}
              aria-pressed={showOrbCaptions}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                showOrbCaptions
                  ? 'bg-fuchsia-600/25 border-fuchsia-400/45 text-fuchsia-200'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Type className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.captionBtn}</span>
            </button>
          </div>

          {onOpenStageMedia && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStageMedia();
              }}
              aria-pressed={hasCustomStageMedia}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                hasCustomStageMedia
                  ? 'bg-fuchsia-600/25 border-fuchsia-400/50 text-fuchsia-100'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
              }`}
            >
              <ImagePlus className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
              <span className="truncate">
                {hasCustomStageMedia ? studioT.customMediaActiveBtn : studioT.customMediaBtn}
              </span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleUI();
              }}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.zenModeBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleFullscreen();
              }}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                isFullscreen
                  ? 'bg-purple-600/25 border-purple-500/45 text-purple-200'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">
                {isFullscreen ? t.fullscreenExitShortBtn : t.fullscreenShortBtn}
              </span>
            </button>
          </div>

          {onOpenHelp && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHelp();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <HelpCircle className="w-4 h-4 text-purple-300 shrink-0" />
              <span className="truncate">{helpT.helpMenuBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onInstallApp();
            }}
            className={`w-full py-3 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              isAppInstalled
                ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-300'
                : 'bg-gradient-to-r from-purple-600/30 via-fuchsia-600/25 to-sky-600/30 border-purple-400/40 text-white hover:from-purple-600/40 hover:to-sky-600/40'
            }`}
          >
            {isAppInstalled ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.appInstalledBtn}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-purple-300" />
                <span>{t.installAppBtn}</span>
              </>
            )}
          </button>

          <div className="pt-0.5 text-center">
            <a
              href="https://ritmxoid.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium text-gray-400 hover:text-purple-300 transition py-1 px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              ...by RitmXoid
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export function PWAInstallGuideModal({
  isOpen,
  isIOS,
  onClose,
}: PWAInstallGuideModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.installModalTitle}
      onClick={onClose}
    >
      <div
        className="glass-modal w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h3 className="font-bold text-base flex items-center gap-2 text-white">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span>{t.installModalTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeWindowLabel}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-gray-200 leading-relaxed">
            <p className="text-gray-300">{t.iosInstallIntro}</p>
            <ol className="space-y-2 text-gray-200 list-decimal list-inside">
              <li className="flex items-start gap-2">
                <span>1.</span>
                <span className="flex items-center gap-1 flex-wrap">
                  {t.iosInstallStep1Start}{' '}
                  <strong className="text-white inline-flex items-center gap-1">
                    <Share className="w-3.5 h-3.5 text-sky-400" /> {t.iosShareWord}
                  </strong>
                  .
                </span>
              </li>
              <li>2. {t.iosInstallStep2}</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-gray-200 leading-relaxed">
            <p className="text-gray-300">{t.otherInstallIntro}</p>
            <ol className="space-y-2 text-gray-200">
              <li>{t.otherInstallStep1}</li>
              <li>
                {t.otherInstallStep2Start}{' '}
                <strong className="text-white">{t.otherInstallOpt1}</strong> /{' '}
                <strong className="text-white">{t.otherInstallOpt2}</strong>.
              </li>
            </ol>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/45 border border-purple-500/40 text-xs font-semibold text-white transition cursor-pointer"
        >
          {t.gotItBtn}
        </button>
      </div>
    </div>
  );
}

interface FirstLaunchInstallModalProps {
  isOpen: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export function FirstLaunchInstallModal({
  isOpen,
  onInstall,
  onDismiss,
}: FirstLaunchInstallModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-launch-install-text"
      onClick={onDismiss}
    >
      <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        {/* Mystical ambient aura */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-purple-600/35 via-fuchsia-500/20 to-sky-500/35 blur-2xl animate-mystic-aura"
        />

        <div className="relative glass-modal rounded-3xl p-6 sm:p-7 border border-purple-400/35 animate-mystic-pulse overflow-hidden text-center">
          {/* Shimmering diagonal sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          >
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-mystic-shimmer" />
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label={t.closeWindowLabel}
            className="absolute top-3.5 right-3.5 z-10 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 mb-4 rounded-2xl bg-[#090D0B] border border-lime-400/30 ring-1 ring-purple-400/25 flex items-center justify-center shadow-lg shadow-purple-950/60 overflow-hidden">
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

            <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-purple-300/90 mb-2">
              YRitmX
            </div>

            <p
              id="first-launch-install-text"
              className="text-sm sm:text-base font-medium text-gray-100 leading-relaxed mb-6"
            >
              {t.installPromoText}
            </p>

            <button
              type="button"
              onClick={onInstall}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-sky-500 hover:from-purple-500 hover:via-fuchsia-500 hover:to-sky-400 text-white text-sm font-semibold shadow-lg shadow-purple-900/50 border border-white/20 flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.installBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MobilePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  filteredTracks: Track[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentTrackId: string | undefined;
  isPlaying: boolean;
  isLoading: boolean;
  isOffline?: boolean;
  errorMessage: string | null;
  canSort?: boolean;
  showDateAndPopularSort?: boolean;
  sortMode?: PlaylistSortMode | null;
  onToggleSort?: (field: PlaylistSortField) => void;
  onSelectTrack: (idx: number) => void;
  onTriggerDemo: () => void;
  onOpenFolderSource?: () => void;
}

export function MobilePlaylistModal({
  isOpen,
  onClose,
  tracks,
  filteredTracks,
  searchQuery,
  onSearchChange,
  currentTrackId,
  isPlaying,
  isLoading,
  isOffline = false,
  errorMessage,
  canSort = false,
  showDateAndPopularSort = true,
  sortMode = null,
  onToggleSort,
  onSelectTrack,
  onTriggerDemo,
  onOpenFolderSource,
}: MobilePlaylistModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/75 backdrop-blur-md sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.playlistTitle}
      onClick={onClose}
    >
      <div
        className="glass-modal w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border-t sm:border border-white/10 h-[78vh] max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <h3 className="font-bold text-base flex items-center gap-2 text-white">
            <ListMusic className="w-4 h-4 text-purple-400" />
            <span>
              {t.playlistTitle} (<span className="font-mono tabular-nums">{tracks.length}</span>)
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closePlaylistLabel}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
          {canSort && onToggleSort && (
            <PlaylistSortControls
              sortMode={sortMode}
              onToggleSort={onToggleSort}
              showDateAndPopular={showDateAndPopularSort}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
          <PlaylistItems
            tracks={tracks}
            filteredTracks={filteredTracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            isLoading={isLoading}
            isOffline={isOffline}
            errorMessage={errorMessage}
            onSelectTrack={(idx) => {
              onSelectTrack(idx);
              onClose();
            }}
            onTriggerDemo={() => {
              onTriggerDemo();
              onClose();
            }}
            onOpenFolderSource={
              onOpenFolderSource
                ? () => {
                    onClose();
                    onOpenFolderSource();
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
