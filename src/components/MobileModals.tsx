import {
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  FolderOpen,
  Globe,
  Layers,
  ListMusic,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share,
  Sliders,
  Smartphone,
  Sparkles,
  Type,
  X,
} from 'lucide-react';
import { PALETTES, VIZ_MODES } from '../constants/visualizer';
import { useI18n } from '../i18n/I18nContext';
import { SourceTab, Track } from '../types/audio';
import { PlaylistItems } from './PlaylistItems';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  vizMode: number;
  paletteIndex: number;
  autoVisualPerTrack: boolean;
  mixEnabled: boolean;
  showOrbCaptions: boolean;
  isAppInstalled: boolean;
  isFullscreen: boolean;
  onChangeVizMode: (val: number) => void;
  onChangePalette: (val: number) => void;
  onToggleAutoVisual: () => void;
  onToggleMix: () => void;
  onToggleOrbCaptions: () => void;
  onRandomizeVisual: () => void;
  onOpenSources: (tab: SourceTab) => void;
  onOpenEqualizer: () => void;
  onToggleUI: () => void;
  onToggleFullscreen: () => void;
  onInstallApp: () => void;
}

export function MobileMenuModal({
  isOpen,
  onClose,
  vizMode,
  paletteIndex,
  autoVisualPerTrack,
  mixEnabled,
  showOrbCaptions,
  isAppInstalled,
  isFullscreen,
  onChangeVizMode,
  onChangePalette,
  onToggleAutoVisual,
  onToggleMix,
  onToggleOrbCaptions,
  onRandomizeVisual,
  onOpenSources,
  onOpenEqualizer,
  onToggleUI,
  onToggleFullscreen,
  onInstallApp,
}: MobileMenuModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

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
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <h3 className="font-bold text-base flex items-center gap-2 text-white">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>{t.menuHeader}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeMenuLabel}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="mobile-viz-select" className="text-xs text-gray-400 block mb-1.5">
              {t.vizModeField}
            </label>
            <select
              id="mobile-viz-select"
              value={vizMode}
              onChange={(e) => onChangeVizMode(parseInt(e.target.value, 10))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
            >
              {VIZ_MODES.map((m, idx) => (
                <option key={m.id} value={m.id} className="bg-gray-900 text-gray-100">
                  {t.vizModes[idx] ?? m.label}
                </option>
              ))}
            </select>
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
              onClick={onRandomizeVisual}
              className="py-2.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.shortLook}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMix}
              className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                mixEnabled
                  ? 'bg-sky-600/25 border-sky-500/40 text-sky-200'
                  : 'bg-white/5 border-white/10 text-gray-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.shortMix}</span>
            </button>
            <button
              type="button"
              onClick={onToggleAutoVisual}
              className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer ${
                autoVisualPerTrack
                  ? 'bg-purple-600/25 border-purple-500/40 text-purple-200'
                  : 'bg-white/5 border-white/10 text-gray-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.shortAuto}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEqualizer();
              }}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.eqLabel}</span>
            </button>
            <button
              type="button"
              onClick={onToggleOrbCaptions}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                showOrbCaptions
                  ? 'bg-fuchsia-600/25 border-fuchsia-400/45 text-fuchsia-200'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{t.captionBtn}</span>
            </button>
          </div>

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

        <div className="mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />
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
