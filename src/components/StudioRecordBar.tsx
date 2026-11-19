import { Film, ImagePlus, Radio } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getRecordingDimensions,
  RECORD_ASPECT_OPTIONS,
  RECORD_QUALITY_OPTIONS,
} from '../constants/recording';
import { useI18n } from '../i18n/I18nContext';
import { getStudioMessages } from '../i18n/studioMessages';
import {
  RecordAspectRatio,
  RecordQualityPreset,
  RecordRenderMode,
} from '../types/audio';

interface StudioRecordBarProps {
  aspect: RecordAspectRatio;
  quality: RecordQualityPreset;
  renderMode: RecordRenderMode;
  uiVisible: boolean;
  isRecording: boolean;
  hasCustomMedia?: boolean;
  isLiveMediaActive?: boolean;
  onChangeAspect: (next: RecordAspectRatio) => void;
  onChangeQuality: (next: RecordQualityPreset) => void;
  onChangeRenderMode: (next: RecordRenderMode) => void;
  onOpenCustomMedia?: () => void;
}

function AspectGlyph({ ratio }: { ratio: RecordAspectRatio }) {
  if (ratio === '9:16') {
    return (
      <span
        aria-hidden="true"
        className="inline-block w-2.5 h-4 rounded-[2px] border-[1.5px] border-current shrink-0"
      />
    );
  }
  if (ratio === '1:1') {
    return (
      <span
        aria-hidden="true"
        className="inline-block w-3.5 h-3.5 rounded-[2px] border-[1.5px] border-current shrink-0"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-block w-4 h-2.5 rounded-[2px] border-[1.5px] border-current shrink-0"
    />
  );
}

export function StudioRecordBar({
  aspect,
  quality,
  renderMode,
  uiVisible,
  isRecording,
  hasCustomMedia = false,
  isLiveMediaActive = false,
  onChangeAspect,
  onChangeQuality,
  onChangeRenderMode,
  onOpenCustomMedia,
}: StudioRecordBarProps) {
  const { lang } = useI18n();
  const studioT = getStudioMessages(lang);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({
    top: 108,
    left: 16,
  });
  const barRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const updateDropdownPosition = useCallback(() => {
    const btn = menuTriggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = 212;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
    const idealLeft = rect.left + rect.width / 2 - menuWidth / 2;
    const clampedLeft = Math.max(8, Math.min(vw - menuWidth - 8, idealLeft));
    setDropdownPos({
      top: Math.round(rect.bottom + 8),
      left: Math.round(clampedLeft),
    });
  }, []);

  useEffect(() => {
    if (isRecording) {
      setIsQualityOpen(false);
    }
  }, [isRecording]);

  useEffect(() => {
    if (!isQualityOpen) return;
    updateDropdownPosition();

    const handlePointerDown = (ev: PointerEvent) => {
      const target = ev.target as Node;
      if (
        menuTriggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsQualityOpen(false);
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsQualityOpen(false);
      }
    };

    const barEl = barRef.current;
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateDropdownPosition);
    barEl?.addEventListener('scroll', updateDropdownPosition);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateDropdownPosition);
      barEl?.removeEventListener('scroll', updateDropdownPosition);
    };
  }, [isQualityOpen, uiVisible, updateDropdownPosition]);

  const activeQuality =
    RECORD_QUALITY_OPTIONS.find((q) => q.id === quality) ?? RECORD_QUALITY_OPTIONS[1];

  const qualityLabelMap: Record<RecordQualityPreset, string> = {
    '480p': studioT.qualityMinLabel,
    '720p': studioT.qualityMedLabel,
    '1080p': studioT.qualityMaxLabel,
  };

  return (
    <div
      ref={barRef}
      data-no-zen-toggle="true"
      onClick={(e) => e.stopPropagation()}
      className={`fixed left-1/2 -translate-x-1/2 z-30 flex flex-nowrap items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-2xl bg-[#0e0f14]/88 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/70 max-w-[calc(100vw-0.75rem)] overflow-x-auto hide-scrollbar transition-all duration-300 ${
        uiVisible ? 'top-[68px] sm:top-[72px]' : 'top-3'
      }`}
    >
      {/* 1. Orientation Icons ONLY (no labels) */}
      <div
        role="group"
        aria-label={studioT.orientationAria}
        className="flex items-center gap-0.5 sm:gap-1 shrink-0"
      >
        {RECORD_ASPECT_OPTIONS.map((ratio) => {
          const isActive = aspect === ratio;
          return (
            <button
              key={ratio}
              type="button"
              disabled={isRecording}
              aria-label={ratio}
              title={ratio}
              aria-pressed={isActive}
              onClick={() => onChangeAspect(ratio)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                isActive
                  ? 'bg-rose-500/25 text-white border border-rose-400/55 shadow-sm shadow-rose-950/50'
                  : 'text-gray-300 border border-transparent hover:text-white hover:bg-white/10'
              } ${isRecording ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <AspectGlyph ratio={ratio} />
            </button>
          );
        })}
      </div>

      <div aria-hidden="true" className="w-px h-4 bg-white/15 shrink-0" />

      {/* 2. Resolution number ONLY (dropdown rendered via Portal outside overflow-x-auto) */}
      <div className="relative shrink-0">
        <button
          ref={menuTriggerRef}
          type="button"
          disabled={isRecording}
          aria-haspopup="listbox"
          aria-expanded={isQualityOpen}
          aria-label={studioT.qualityBtnAria}
          title={studioT.qualityBtnAria}
          onClick={() => {
            if (!isQualityOpen) updateDropdownPosition();
            setIsQualityOpen((v) => !v);
          }}
          className={`px-2 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold font-mono tabular-nums flex items-center justify-center whitespace-nowrap border transition ${
            isQualityOpen
              ? 'bg-purple-500/25 text-white border-purple-400/50'
              : 'bg-white/5 text-gray-100 border-white/10 hover:bg-white/10'
          } ${isRecording ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {activeQuality.id.replace('p', '')}
        </button>

        {isQualityOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={dropdownRef}
              role="listbox"
              data-no-zen-toggle="true"
              aria-label={studioT.qualityBtnAria}
              onClick={(e) => e.stopPropagation()}
              style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
              className="fixed w-[212px] rounded-2xl bg-[#12131a]/95 backdrop-blur-xl border border-white/15 p-1.5 shadow-2xl shadow-black/80 space-y-1 z-50"
            >
              {RECORD_QUALITY_OPTIONS.map((opt) => {
                const selected = opt.id === quality;
                const dims = getRecordingDimensions(aspect, opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChangeQuality(opt.id);
                      setIsQualityOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      selected
                        ? 'bg-purple-500/25 text-white border border-purple-400/45'
                        : 'text-gray-300 border border-transparent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold whitespace-nowrap">
                      {qualityLabelMap[opt.id]} ·{' '}
                      <span className="font-mono tabular-nums">{opt.id.replace('p', '')}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono tabular-nums whitespace-nowrap">
                      {dims.exportWidth}×{dims.exportHeight}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body
          )}
      </div>

      {/* 3. Мой фон */}
      {onOpenCustomMedia && (
        <>
          <div aria-hidden="true" className="w-px h-4 bg-white/15 shrink-0" />
          <button
            type="button"
            disabled={isRecording}
            aria-pressed={hasCustomMedia}
            title={studioT.customMediaTitle}
            onClick={onOpenCustomMedia}
            className={`px-2 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 border transition ${
              hasCustomMedia
                ? 'bg-fuchsia-500/25 text-white border-fuchsia-400/55 shadow-sm shadow-fuchsia-950/40'
                : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10'
            } ${isRecording ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <ImagePlus className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
            <span>
              {hasCustomMedia ? studioT.customMediaActiveBtn : studioT.customMediaBtn}
            </span>
          </button>
        </>
      )}

      <div aria-hidden="true" className="w-px h-4 bg-white/15 shrink-0" />

      {/* 4. Быстро / Качественно toggle */}
      <div
        role="group"
        aria-label={studioT.renderModeAria}
        className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10 shrink-0"
      >
        <button
          type="button"
          disabled={isRecording}
          aria-pressed={renderMode === 'live'}
          title={studioT.renderModeLiveTitle}
          onClick={() => onChangeRenderMode('live')}
          className={`px-1.5 sm:px-2 py-1 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition ${
            renderMode === 'live'
              ? 'bg-sky-500/25 text-white border border-sky-400/50'
              : 'text-gray-300 border border-transparent hover:text-white hover:bg-white/10'
          } ${isRecording ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Radio className="w-3 h-3 text-sky-300 shrink-0 hidden sm:inline" />
          <span>{studioT.renderModeLiveLabel}</span>
        </button>

        <button
          type="button"
          disabled={isRecording || isLiveMediaActive}
          aria-pressed={renderMode === 'offline'}
          title={
            isLiveMediaActive ? studioT.customMediaLiveRequiredToast : studioT.renderModeOfflineTitle
          }
          onClick={() => onChangeRenderMode('offline')}
          className={`px-1.5 sm:px-2 py-1 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition ${
            renderMode === 'offline'
              ? 'bg-emerald-500/25 text-white border border-emerald-400/55 shadow-sm shadow-emerald-950/50'
              : 'text-gray-300 border border-transparent hover:text-white hover:bg-white/10'
          } ${isRecording || isLiveMediaActive ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Film className="w-3 h-3 text-emerald-300 shrink-0 hidden sm:inline" />
          <span>{studioT.renderModeOfflineLabel}</span>
        </button>
      </div>
    </div>
  );
}

