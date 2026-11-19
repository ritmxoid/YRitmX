import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Disc3,
  EyeOff,
  Film,
  Image as ImageIcon,
  ImagePlus,
  Lock,
  Maximize,
  Mic,
  MicOff,
  Move,
  Music,
  RefreshCw,
  RotateCw,
  Sparkles,
  SwitchCamera,
  Trash2,
  Type,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { useI18n } from '../i18n/I18nContext';
import { getStudioMessages } from '../i18n/studioMessages';
import {
  BackdropOverlayMode,
  CustomStageMedia,
  FrameMotionMode,
  FrameRotationTarget,
  StageBgAudio,
} from '../types/audio';

interface StageMediaModalProps {
  isOpen: boolean;
  isVideoTrack?: boolean;
  isFullscreenTrack?: boolean;
  customMedia: CustomStageMedia | null;
  stageAudio?: StageBgAudio | null;
  activeTrackTitle?: string;
  activeTrackArtist?: string;
  activeTrackCover?: string;
  coverFrameMotion: FrameMotionMode;
  coverRotationTarget: FrameRotationTarget;
  showCoverCaption: boolean;
  fileQueueCount: number;
  fileQueueIndex: number;
  cameraOverlayActive: boolean;
  trackVolume: number;
  isTrackMuted: boolean;
  micEnabled: boolean;
  micVolume: number;
  micEchoFilter: boolean;
  onClose: () => void;
  onTriggerPickFile: () => void;
  onPrevFileItem: () => void;
  onNextFileItem: () => void;
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onToggleMic: () => void;
  onToggleMicEchoFilter: () => void;
  onToggleFrameMotion: () => void;
  onToggleFrameRotation: () => void;
  onSelectRotationTarget: (target: Exclude<FrameRotationTarget, 'none'>) => void;
  onToggleCoverCaption: () => void;
  onActivateBackdrop: () => void;
  onSelectBackdropOverlay: (overlay: BackdropOverlayMode) => void;
  onChangeTrackVolume: (vol: number) => void;
  onToggleSound: () => void;
  onChangeSoundVolume: (vol: number) => void;
  onToggleStageAudio?: () => void;
  onChangeStageAudioVolume?: (vol: number) => void;
  onRemoveStageAudio?: () => void;
  onChangeMicVolume: (vol: number) => void;
  onRemoveFileMedia: () => void;
  onClearMedia: () => void;
}

export function StageMediaModal({
  isOpen,
  isVideoTrack = false,
  isFullscreenTrack = false,
  customMedia,
  stageAudio = null,
  activeTrackTitle,
  activeTrackArtist,
  activeTrackCover,
  coverFrameMotion,
  coverRotationTarget,
  showCoverCaption,
  fileQueueCount,
  fileQueueIndex,
  cameraOverlayActive,
  trackVolume,
  isTrackMuted,
  micEnabled,
  micVolume,
  micEchoFilter,
  onClose,
  onTriggerPickFile,
  onPrevFileItem,
  onNextFileItem,
  onToggleCamera,
  onFlipCamera,
  onToggleMic,
  onToggleMicEchoFilter,
  onToggleFrameMotion,
  onToggleFrameRotation,
  onSelectRotationTarget,
  onToggleCoverCaption,
  onActivateBackdrop,
  onSelectBackdropOverlay,
  onChangeTrackVolume,
  onToggleSound,
  onChangeSoundVolume,
  onToggleStageAudio,
  onChangeStageAudioVolume,
  onRemoveStageAudio,
  onChangeMicVolume,
  onRemoveFileMedia,
  onClearMedia,
}: StageMediaModalProps) {
  const { lang } = useI18n();
  const studioT = getStudioMessages(lang);

  if (!isOpen) return null;

  const ownsFullscreenBackdrop = isVideoTrack || isFullscreenTrack;
  const isCameraActive = customMedia?.kind === 'camera' || cameraOverlayActive;
  const isFileActive = customMedia?.kind === 'image' || customMedia?.kind === 'video';
  const effectiveTrackVol = isTrackMuted ? 0 : trackVolume;

  const hasFrameActive = customMedia
    ? ownsFullscreenBackdrop
      ? true
      : Boolean(cameraOverlayActive || customMedia.displayMode === 'frame')
    : true;
  const hasBackdropActive = Boolean(
    !ownsFullscreenBackdrop &&
      customMedia &&
      (cameraOverlayActive || customMedia.displayMode === 'backdrop')
  );
  const isFloating = customMedia
    ? customMedia.frameMotion === 'floating'
    : coverFrameMotion === 'floating';
  const rotationTarget = customMedia
    ? customMedia.frameRotationTarget
    : coverRotationTarget;
  const isRotationActive = hasFrameActive && rotationTarget !== 'none';
  const backdropOverlay = customMedia?.backdropOverlay ?? 'visualizer';

  const frameLabel = isFloating
    ? studioT.customMediaMotionFloating
    : studioT.customMediaMotionStatic;

  const rotationDetailLabel =
    rotationTarget === 'frame-only'
      ? studioT.customMediaRotateFrameOnly
      : rotationTarget === 'media-only'
      ? studioT.customMediaRotateMediaOnly
      : rotationTarget === 'both'
      ? studioT.customMediaRotateBoth
      : '';

  const backdropDetailLabel =
    backdropOverlay === 'clean'
      ? studioT.customMediaBackdropClean
      : backdropOverlay === 'orb-only'
      ? studioT.customMediaBackdropOrbOnly
      : studioT.customMediaBackdropWithAnim;

  const activeModeSummary = !customMedia
    ? [
        frameLabel,
        rotationDetailLabel,
        !ownsFullscreenBackdrop && showCoverCaption ? studioT.customMediaCaptionBtn : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : cameraOverlayActive && !ownsFullscreenBackdrop
    ? `${studioT.customMediaModeBackdrop} (${backdropDetailLabel}) + ${studioT.customMediaTabCamera}`
    : hasBackdropActive
    ? `${studioT.customMediaModeBackdrop} · ${backdropDetailLabel}`
    : rotationDetailLabel
    ? `${frameLabel} · ${rotationDetailLabel}`
    : frameLabel;

  return (
    <div
      data-no-zen-toggle="true"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/75 backdrop-blur-md sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={studioT.customMediaTitle}
      onClick={onClose}
    >
      <div
        className="glass-modal w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border-t sm:border border-white/15 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="font-bold text-base flex items-center gap-2 text-white">
            <ImagePlus className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{studioT.customMediaTitle}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={studioT.offlineCancelBtn}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 source buttons in a row: Photo/Video (or Media) | Camera | Microphone */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-pressed={isFileActive || Boolean(ownsFullscreenBackdrop && stageAudio)}
            onClick={onTriggerPickFile}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isFileActive || (ownsFullscreenBackdrop && stageAudio)
                ? 'bg-purple-600/30 border-purple-400/60 text-white shadow-sm shadow-purple-950/40'
                : 'bg-white/5 border-white/15 text-gray-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ImagePlus className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="truncate">
              {ownsFullscreenBackdrop ? studioT.customMediaTabMedia : studioT.customMediaTabFile}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={isCameraActive}
            onClick={onToggleCamera}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isCameraActive
                ? 'bg-rose-600/30 border-rose-400/65 text-white shadow-sm shadow-rose-950/40'
                : 'bg-white/5 border-white/15 text-gray-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="truncate">{studioT.customMediaTabCamera}</span>
          </button>

          <button
            type="button"
            aria-pressed={micEnabled}
            onClick={onToggleMic}
            className={`min-h-[44px] py-2.5 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              micEnabled
                ? 'bg-emerald-600/30 border-emerald-400/65 text-white shadow-sm shadow-emerald-950/40'
                : 'bg-white/5 border-white/15 text-gray-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            {micEnabled ? (
              <Mic className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
            <span className="truncate">{studioT.customMediaTabMic}</span>
          </button>
        </div>

        {!customMedia && !micEnabled && !stageAudio && (
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {studioT.customMediaEmptyHint}
          </p>
        )}

        {/* Active track preview when no custom overlay/backdrop is loaded */}
        {!customMedia && (
          <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              {isVideoTrack ? (
                <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-400/35 flex items-center justify-center text-sky-300 shrink-0">
                  <Film className="w-4 h-4" />
                </div>
              ) : (
                <img
                  src={activeTrackCover || DEFAULT_COVER_IMAGE}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover border border-white/15 shrink-0 bg-black/40"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {activeTrackTitle
                    ? activeTrackArtist
                      ? `${activeTrackTitle} — ${activeTrackArtist}`
                      : activeTrackTitle
                    : studioT.customMediaCoverDefaultLabel}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{activeModeSummary}</p>
              </div>
            </div>
            {isVideoTrack ? (
              <Film className="w-4 h-4 text-sky-300 shrink-0" />
            ) : (
              <Disc3 className="w-4 h-4 text-purple-300 shrink-0" />
            )}
          </div>
        )}

        {/* Active source preview badge(s) */}
        {customMedia && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-400/35 flex items-center justify-center text-purple-300 shrink-0">
                  {customMedia.kind === 'camera' ? (
                    <Camera className="w-4 h-4 text-rose-300" />
                  ) : customMedia.kind === 'video' ? (
                    <Film className="w-4 h-4" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    {customMedia.kind === 'camera'
                      ? studioT.customMediaCameraActiveLabel
                      : customMedia.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{activeModeSummary}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {customMedia.kind !== 'camera' && fileQueueCount > 1 && (
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-1 py-0.5">
                    <button
                      type="button"
                      onClick={onPrevFileItem}
                      aria-label={studioT.customMediaPrevItemAria}
                      className="p-1 rounded text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono tabular-nums text-gray-200 px-0.5">
                      {fileQueueIndex + 1}/{fileQueueCount}
                    </span>
                    <button
                      type="button"
                      onClick={onNextFileItem}
                      aria-label={studioT.customMediaNextItemAria}
                      className="p-1 rounded text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {customMedia.kind === 'camera' ? (
                  <button
                    type="button"
                    onClick={onFlipCamera}
                    title={studioT.customMediaFlipCameraBtn}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-semibold text-white flex items-center gap-1 shrink-0 transition cursor-pointer"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                    <span className="whitespace-nowrap">{studioT.customMediaFlipCameraBtn}</span>
                  </button>
                ) : cameraOverlayActive ? (
                  <button
                    type="button"
                    onClick={onRemoveFileMedia}
                    aria-label={studioT.customMediaClearBtn}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-200 transition cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
            </div>

            {cameraOverlayActive && (
              <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-400/25">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Camera className="w-4 h-4 text-rose-300 shrink-0" />
                  <p className="text-[11px] text-rose-100 leading-snug">
                    {studioT.customMediaPipHint}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={onFlipCamera}
                    title={studioT.customMediaFlipCameraBtn}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white transition cursor-pointer"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                  <button
                    type="button"
                    onClick={onToggleCamera}
                    aria-label={studioT.customMediaCameraStoppedToast}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/25 text-gray-300 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active 3rd background audio track badge */}
        {stageAudio && (
          <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/25">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {stageAudio.name}
                </p>
                <p className="text-[11px] text-amber-200/80 truncate">
                  {studioT.customMediaBgAudioLabel}
                </p>
              </div>
            </div>
            {onRemoveStageAudio && (
              <button
                type="button"
                onClick={onRemoveStageAudio}
                aria-label={studioT.customMediaClearBtn}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-200 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Primary 3 mode buttons + contextual sub-rows (also available for active track cover) */}
        <div className="space-y-2.5">
          <span className="text-xs font-medium text-gray-400 block">
            {studioT.customMediaModeLabel}
          </span>

          <div className={`grid gap-2 ${ownsFullscreenBackdrop ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {/* 1. Static <-> Floating Frame Toggle */}
            <button
              type="button"
              aria-pressed={hasFrameActive}
              onClick={onToggleFrameMotion}
              className={`min-h-[44px] py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                hasFrameActive
                  ? isFloating
                    ? 'bg-fuchsia-600/30 border-fuchsia-400/60 text-white shadow-sm shadow-fuchsia-950/40'
                    : 'bg-purple-600/30 border-purple-400/60 text-white shadow-sm shadow-purple-950/40'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isFloating ? (
                <Move className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="leading-tight text-center">{frameLabel}</span>
            </button>

            {/* 2. Rotating Frame -> opens 3 nested rotation target buttons */}
            <button
              type="button"
              aria-pressed={isRotationActive}
              onClick={onToggleFrameRotation}
              className={`min-h-[44px] py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                isRotationActive
                  ? 'bg-amber-600/30 border-amber-400/60 text-white shadow-sm shadow-amber-950/40'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight text-center">
                {studioT.customMediaMotionRotating}
              </span>
            </button>

            {/* 3. Fullscreen (for audio custom media) OR Caption toggle (for active track cover) */}
            {!ownsFullscreenBackdrop &&
              (customMedia ? (
                <button
                  type="button"
                  aria-pressed={hasBackdropActive}
                  onClick={onActivateBackdrop}
                  className={`min-h-[44px] py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    hasBackdropActive
                      ? 'bg-sky-600/30 border-sky-400/60 text-white shadow-sm shadow-sky-950/40'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Maximize className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-tight text-center">
                    {studioT.customMediaModeBackdrop}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  aria-pressed={showCoverCaption}
                  onClick={onToggleCoverCaption}
                  className={`min-h-[44px] py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    showCoverCaption
                      ? 'bg-sky-600/30 border-sky-400/60 text-white shadow-sm shadow-sky-950/40'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Type className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-tight text-center">
                    {studioT.customMediaCaptionBtn}
                  </span>
                </button>
              ))}
          </div>

          {/* Sub-row 1: Rotation target options (when Rotating Frame is ON) */}
          {isRotationActive && (
            <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-400/25 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                aria-pressed={rotationTarget === 'frame-only'}
                onClick={() => onSelectRotationTarget('frame-only')}
                className={`min-h-[38px] py-1.5 px-2 rounded-xl border text-[11px] font-semibold text-center leading-tight transition cursor-pointer ${
                  rotationTarget === 'frame-only'
                    ? 'bg-amber-500/35 border-amber-300/70 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {studioT.customMediaRotateFrameOnly}
              </button>

              <button
                type="button"
                aria-pressed={rotationTarget === 'both'}
                onClick={() => onSelectRotationTarget('both')}
                className={`min-h-[38px] py-1.5 px-2 rounded-xl border text-[11px] font-semibold text-center leading-tight transition cursor-pointer ${
                  rotationTarget === 'both'
                    ? 'bg-amber-500/35 border-amber-300/70 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {studioT.customMediaRotateBoth}
              </button>

              <button
                type="button"
                aria-pressed={rotationTarget === 'media-only'}
                onClick={() => onSelectRotationTarget('media-only')}
                className={`min-h-[38px] py-1.5 px-2 rounded-xl border text-[11px] font-semibold text-center leading-tight transition cursor-pointer ${
                  rotationTarget === 'media-only'
                    ? 'bg-amber-500/35 border-amber-300/70 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {studioT.customMediaRotateMediaOnly}
              </button>
            </div>
          )}

          {/* Sub-row 2: Fullscreen overlay options (when Fullscreen is active for audio tracks) */}
          {customMedia && !ownsFullscreenBackdrop && hasBackdropActive && (
            <div className="p-2 rounded-2xl bg-sky-500/10 border border-sky-400/25 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                aria-pressed={backdropOverlay === 'visualizer'}
                onClick={() => onSelectBackdropOverlay('visualizer')}
                className={`min-h-[38px] py-1.5 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 text-center leading-tight transition cursor-pointer ${
                  backdropOverlay === 'visualizer'
                    ? 'bg-sky-500/35 border-sky-300/70 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{studioT.customMediaBackdropWithAnim}</span>
              </button>

              <button
                type="button"
                aria-pressed={backdropOverlay === 'orb-only'}
                onClick={() => onSelectBackdropOverlay('orb-only')}
                className={`min-h-[38px] py-1.5 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 text-center leading-tight transition cursor-pointer ${
                  backdropOverlay === 'orb-only'
                    ? 'bg-sky-500/35 border-sky-300/70 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Disc3 className="w-3 h-3 shrink-0" />
                <span>{studioT.customMediaBackdropOrbOnly}</span>
              </button>

              <button
                type="button"
                aria-pressed={backdropOverlay === 'clean'}
                onClick={() => onSelectBackdropOverlay('clean')}
                className={`min-h-[38px] py-1.5 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 text-center leading-tight transition cursor-pointer ${
                  backdropOverlay === 'clean'
                    ? 'bg-sky-500/35 border-sky-300/70 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <EyeOff className="w-3 h-3 shrink-0" />
                <span>{studioT.customMediaBackdropClean}</span>
              </button>
            </div>
          )}
        </div>

        {/* Audio Mixer: Audio/video track volume + overlay video sound + 3rd background audio + optional mic volume */}
        <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
          {/* Audio / primary video track volume */}
          {(!ownsFullscreenBackdrop || isVideoTrack) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                  <span>{studioT.customMediaTrackVolumeLabel}</span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-gray-200">
                  {Math.round(effectiveTrackVol * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={effectiveTrackVol}
                aria-label={studioT.customMediaTrackVolumeLabel}
                onChange={(e) => onChangeTrackVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/15 rounded-full cursor-pointer"
              />
            </div>
          )}

          {/* Video sound controls */}
          {customMedia?.kind === 'video' && (
            <div className="pt-2.5 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-300">
                  {studioT.customMediaSoundLabel}
                </span>
                <button
                  type="button"
                  aria-pressed={customMedia.soundEnabled}
                  onClick={onToggleSound}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    customMedia.soundEnabled
                      ? 'bg-emerald-600/25 border-emerald-400/50 text-emerald-200'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {customMedia.soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="whitespace-nowrap">
                    {customMedia.soundEnabled
                      ? studioT.customMediaSoundOn
                      : studioT.customMediaSoundOff}
                  </span>
                </button>
              </div>

              {customMedia.soundEnabled && (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {studioT.customMediaVolumeLabel}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={customMedia.soundVolume}
                    aria-label={studioT.customMediaVolumeLabel}
                    onChange={(e) => onChangeSoundVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-white/15 rounded-full cursor-pointer"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-gray-200 w-9 text-right">
                    {Math.round(customMedia.soundVolume * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3rd background audio track controls */}
          {stageAudio && (
            <div
              className={`${
                !ownsFullscreenBackdrop || isVideoTrack || customMedia?.kind === 'video'
                  ? 'pt-2.5 border-t border-white/10'
                  : ''
              } space-y-2.5`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-amber-200 flex items-center gap-1.5 min-w-0">
                  <Music className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  <span className="truncate">{studioT.customMediaBgAudioVolumeLabel}</span>
                </span>
                {onToggleStageAudio && (
                  <button
                    type="button"
                    aria-pressed={stageAudio.enabled}
                    onClick={onToggleStageAudio}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      stageAudio.enabled
                        ? 'bg-amber-600/25 border-amber-400/50 text-amber-100'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {stageAudio.enabled ? (
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="whitespace-nowrap">
                      {stageAudio.enabled
                        ? studioT.customMediaSoundOn
                        : studioT.customMediaSoundOff}
                    </span>
                  </button>
                )}
              </div>

              {stageAudio.enabled && onChangeStageAudioVolume && (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={stageAudio.volume}
                    aria-label={studioT.customMediaBgAudioVolumeLabel}
                    onChange={(e) => onChangeStageAudioVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-white/15 rounded-full cursor-pointer"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-amber-200 w-9 text-right">
                    {Math.round(stageAudio.volume * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Microphone volume & echo filter toggle */}
          {micEnabled && (
            <div className="pt-2.5 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-emerald-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 shrink-0" />
                  <span>{studioT.customMediaMicVolumeLabel}</span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-emerald-200">
                  {Math.round(micVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={micVolume}
                aria-label={studioT.customMediaMicVolumeLabel}
                onChange={(e) => onChangeMicVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/15 rounded-full cursor-pointer"
              />
              <button
                type="button"
                aria-pressed={micEchoFilter}
                onClick={onToggleMicEchoFilter}
                className={`w-full py-2 px-3 rounded-xl border text-[11px] font-medium flex items-center justify-between gap-2 transition cursor-pointer ${
                  micEchoFilter
                    ? 'bg-emerald-600/20 border-emerald-400/45 text-emerald-100'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="text-left leading-snug">{studioT.customMediaMicEchoFilterLabel}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                    micEchoFilter ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {micEchoFilter ? studioT.customMediaSoundOn : studioT.customMediaSoundOff}
                </span>
              </button>
              <p className="text-[11px] text-gray-400 leading-snug">
                {studioT.customMediaMicActiveHint}
              </p>
            </div>
          )}
        </div>

        {(customMedia || micEnabled || stageAudio) && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onTriggerPickFile}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-gray-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0 text-purple-300" />
              <span className="whitespace-nowrap">{studioT.customMediaReplaceBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClearMedia();
                onClose();
              }}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-400/35 text-xs font-semibold text-rose-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{studioT.customMediaClearBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
