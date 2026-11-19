import { MutableRefObject, PointerEvent as ReactPointerEvent, RefObject, useEffect, useRef } from 'react';
import { getRecordingDimensions } from '../constants/recording';
import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { useI18n } from '../i18n/I18nContext';
import { getStudioMessages } from '../i18n/studioMessages';
import {
  CustomStageMedia,
  FrameMotionMode,
  FrameRotationTarget,
  MediaKind,
  RecordAspectRatio,
  RecordQualityPreset,
  VisualDNA,
} from '../types/audio';
import { createOrbFxState } from '../utils/orbEffectsRenderer';
import {
  createInitialStudioFrame,
  getStudioShapeRadii,
  hitTestStudioFrame,
  LiveOrbSnapshot,
  pickNextStudioFxMode,
  pickNextStudioShape,
  StudioFrameState,
  StudioHitTarget,
} from '../utils/studioFrameRenderer';
import {
  createVisualizerSimState,
  fillIdleSpectrum,
  stepAndRenderVisualizerFrame,
} from '../utils/visualizerEngine';

interface VisualizerCanvasProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  vizMode: number;
  paletteIndex: number;
  visualDna: VisualDNA;
  isZenMode: boolean;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  studioFrameRef?: MutableRefObject<StudioFrameState | null>;
  studioActive?: boolean;
  videoElement?: HTMLVideoElement | null;
  videoElementRef?: RefObject<HTMLVideoElement | null>;
  customStageMedia?: CustomStageMedia | null;
  cameraOverlayActive?: boolean;
  customBgVideoElement?: HTMLVideoElement | null;
  customBgVideoElementRef?: RefObject<HTMLVideoElement | null>;
  cameraVideoElement?: HTMLVideoElement | null;
  cameraVideoElementRef?: RefObject<HTMLVideoElement | null>;
  activeCoverSrc?: string;
  activeMediaType?: MediaKind;
  coverFrameMotion?: FrameMotionMode;
  coverRotationTarget?: FrameRotationTarget;
  coverCaptionTitle?: string | null;
  coverCaptionArtist?: string | null;
  isRecordArmed?: boolean;
  recordAspect?: RecordAspectRatio;
  recordQuality?: RecordQualityPreset;
  isRecording?: boolean;
  layeredBg?: boolean;
  liveOrbsSnapshotRef?: MutableRefObject<LiveOrbSnapshot[]>;
  onRandomizeStyle?: () => void;
  onStudioToast?: (msg: string) => void;
}

export function VisualizerCanvas({
  analyser,
  isPlaying,
  vizMode,
  paletteIndex,
  visualDna,
  isZenMode,
  canvasRef: externalCanvasRef,
  studioFrameRef: externalStudioFrameRef,
  studioActive = false,
  videoElement = null,
  videoElementRef,
  customStageMedia = null,
  cameraOverlayActive = false,
  customBgVideoElement = null,
  customBgVideoElementRef,
  cameraVideoElement = null,
  cameraVideoElementRef,
  activeCoverSrc,
  activeMediaType,
  coverFrameMotion = 'static',
  coverRotationTarget = 'none',
  coverCaptionTitle = null,
  coverCaptionArtist = null,
  isRecordArmed = false,
  recordAspect = '9:16',
  recordQuality = '720p',
  isRecording = false,
  layeredBg = false,
  liveOrbsSnapshotRef,
  onRandomizeStyle,
  onStudioToast,
}: VisualizerCanvasProps) {
  const { lang } = useI18n();
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioFrameRef = useRef<StudioFrameState | null>(null);
  const prevStudioActiveRef = useRef(false);
  const coverCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const logicalSizeRef = useRef<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600,
  });
  const resizeFnRef = useRef<(() => void) | null>(null);
  const gestureRef = useRef<{
    pointerId: number | null;
    target: StudioHitTarget | 'bg' | null;
    startX: number;
    startY: number;
    startCx: number;
    startCy: number;
    startScaleX: number;
    startScaleY: number;
    startRotation: number;
    startAngle: number;
    startDistFromCenter: number;
    movedDist: number;
    longPressTimer: number;
    longPressFired: boolean;
  }>({
    pointerId: null,
    target: null,
    startX: 0,
    startY: 0,
    startCx: 0,
    startCy: 0,
    startScaleX: 1,
    startScaleY: 1,
    startRotation: 0,
    startAngle: 0,
    startDistFromCenter: 1,
    movedDist: 0,
    longPressTimer: 0,
    longPressFired: false,
  });

  const stateRef = useRef({
    analyser,
    isPlaying,
    vizMode,
    paletteIndex,
    visualDna,
    isZenMode,
    studioActive,
    videoElement,
    videoElementRef,
    customStageMedia,
    cameraOverlayActive,
    customBgVideoElement,
    customBgVideoElementRef,
    cameraVideoElement,
    cameraVideoElementRef,
    activeCoverSrc,
    activeMediaType,
    coverFrameMotion,
    coverRotationTarget,
    coverCaptionTitle,
    coverCaptionArtist,
    isRecordArmed,
    recordAspect,
    recordQuality,
    isRecording,
    layeredBg,
    liveOrbsSnapshotRef,
    onRandomizeStyle,
    onStudioToast,
    lang,
  });

  stateRef.current = {
    analyser,
    isPlaying,
    vizMode,
    paletteIndex,
    visualDna,
    isZenMode,
    studioActive,
    videoElement,
    videoElementRef,
    customStageMedia,
    cameraOverlayActive,
    customBgVideoElement,
    customBgVideoElementRef,
    cameraVideoElement,
    cameraVideoElementRef,
    activeCoverSrc,
    activeMediaType,
    coverFrameMotion,
    coverRotationTarget,
    coverCaptionTitle,
    coverCaptionArtist,
    isRecordArmed,
    recordAspect,
    recordQuality,
    isRecording,
    layeredBg,
    liveOrbsSnapshotRef,
    onRandomizeStyle,
    onStudioToast,
    lang,
  };

  useEffect(() => {
    if (studioActive && !prevStudioActiveRef.current) {
      const dims = stateRef.current.isRecordArmed
        ? getRecordingDimensions(stateRef.current.recordAspect, stateRef.current.recordQuality)
        : null;
      const initW = dims ? dims.logicalWidth : window.innerWidth || 800;
      const initH = dims ? dims.logicalHeight : window.innerHeight || 600;
      const nextFrame = createInitialStudioFrame(initW, initH);
      studioFrameRef.current = nextFrame;
      if (externalStudioFrameRef) {
        externalStudioFrameRef.current = nextFrame;
      }
    } else if (!studioActive && prevStudioActiveRef.current && studioFrameRef.current) {
      studioFrameRef.current.editMode = false;
    }
    prevStudioActiveRef.current = studioActive;
  }, [externalStudioFrameRef, studioActive]);

  useEffect(() => {
    resizeFnRef.current?.();
  }, [isRecordArmed, recordAspect, recordQuality, isZenMode]);

  const setCanvasElement = (el: HTMLCanvasElement | null) => {
    internalCanvasRef.current = el;
    if (externalCanvasRef) {
      externalCanvasRef.current = el;
    }
  };

  useEffect(() => {
    const canvas = internalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fetchedBlobUrls = new Set<string>();

    const getCorsSafeImage = (src: string): { img: HTMLImageElement; ok: boolean } | null => {
      const targetSrc = src || DEFAULT_COVER_IMAGE;
      let existing = coverCacheRef.current.get(targetSrc);
      if (!existing) {
        const img = new Image();
        const isLocal = targetSrc.startsWith('blob:') || targetSrc.startsWith('data:');
        if (!isLocal) {
          img.crossOrigin = 'anonymous';
          img.referrerPolicy = 'no-referrer';
        }
        img.onerror = () => {
          if (!isLocal && img.dataset.corsRetried !== '1') {
            img.dataset.corsRetried = '1';
            void fetch(targetSrc, {
              mode: 'cors',
              referrerPolicy: 'no-referrer',
              cache: 'reload',
            })
              .then((res) => {
                if (!res.ok) throw new Error('HTTP error');
                return res.blob();
              })
              .then((blob) => {
                const objUrl = URL.createObjectURL(blob);
                fetchedBlobUrls.add(objUrl);
                img.removeAttribute('crossorigin');
                img.src = objUrl;
              })
              .catch(() => {
                img.dataset.failed = '1';
              });
            return;
          }
          img.dataset.failed = '1';
        };
        img.src = targetSrc;
        coverCacheRef.current.set(targetSrc, img);
        existing = img;
      }
      if (existing.dataset.failed === '1' && targetSrc !== DEFAULT_COVER_IMAGE) {
        return getCorsSafeImage(DEFAULT_COVER_IMAGE);
      }
      const ok = Boolean(
        existing.complete && existing.naturalWidth > 0 && existing.dataset.failed !== '1'
      );
      return { img: existing, ok };
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const sim = createVisualizerSimState(width, height);

    const resize = () => {
      const prevW = logicalSizeRef.current.w || window.innerWidth || 800;
      const prevH = logicalSizeRef.current.h || window.innerHeight || 600;
      const {
        isRecordArmed: armedNow,
        recordAspect: aspectNow,
        recordQuality: qualityNow,
        isZenMode: zenNow,
      } = stateRef.current;

      if (armedNow) {
        const dims = getRecordingDimensions(aspectNow, qualityNow);
        width = dims.logicalWidth;
        height = dims.logicalHeight;
        logicalSizeRef.current = { w: width, h: height };
        canvas.width = dims.exportWidth;
        canvas.height = dims.exportHeight;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const padTop = zenNow ? 58 : vw >= 640 ? 124 : 114;
        const padBottom = zenNow ? 20 : vw >= 640 ? 108 : 104;
        const availW = Math.max(180, vw - 24);
        const availH = Math.max(180, vh - padTop - padBottom);
        const aspectRatio = dims.exportWidth / dims.exportHeight;
        let cssW = availW;
        let cssH = availW / aspectRatio;
        if (cssH > availH) {
          cssH = availH;
          cssW = availH * aspectRatio;
        }
        canvas.style.width = `${Math.round(cssW)}px`;
        canvas.style.height = `${Math.round(cssH)}px`;

        const scaleX = dims.exportWidth / width;
        const scaleY = dims.exportHeight / height;
        ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      } else {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        logicalSizeRef.current = { w: width, h: height };
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      if (prevW !== width || prevH !== height) {
        const isDesktopNow = width >= 1024;
        sim.anchorX = armedNow || zenNow || !isDesktopNow ? width * 0.5 : width * 0.34;
        sim.anchorY = armedNow || zenNow || !isDesktopNow ? height * 0.49 : height * 0.47;
      }

      if (studioFrameRef.current && (prevW !== width || prevH !== height)) {
        const frame = studioFrameRef.current;
        const relX = frame.cx / Math.max(1, prevW);
        const relY = frame.cy / Math.max(1, prevH);
        const minDimNext = Math.max(260, Math.min(width, height));
        frame.baseSize = Math.round(Math.max(156, Math.min(340, minDimNext * 0.44)));
        frame.cx = Math.max(60, Math.min(width - 60, relX * width));
        frame.cy = Math.max(72, Math.min(height - 76, relY * height));
      }
    };

    resizeFnRef.current = resize;
    resize();
    window.addEventListener('resize', resize);

    let lastMs = performance.now();

    const render = () => {
      animationId = requestAnimationFrame(render);
      const nowMs = performance.now();
      const dtSec = Math.max(1 / 120, Math.min(1 / 15, (nowMs - lastMs) * 0.001));
      lastMs = nowMs;
      const nowSec = nowMs * 0.001;

      const {
        analyser: activeAnalyser,
        isPlaying: playing,
        vizMode: primaryMode,
        paletteIndex: pIdx,
        visualDna: dna,
        isZenMode: zen,
        studioActive: inStudio,
        videoElement: vidElProp,
        videoElementRef: vidElRef,
        customStageMedia: customMediaNow,
        cameraOverlayActive: camPipNow,
        customBgVideoElement: customVidElProp,
        customBgVideoElementRef: customVidElRef,
        cameraVideoElement: camVidElProp,
        cameraVideoElementRef: camVidElRef,
        activeCoverSrc: coverSrcNow,
        activeMediaType: mediaTypeNow,
        coverFrameMotion: coverMotionNow,
        coverRotationTarget: coverRotationNow,
        coverCaptionTitle: captionTitleNow,
        coverCaptionArtist: captionArtistNow,
        isRecordArmed: armedNow,
        recordAspect: aspectNow,
        recordQuality: qualityNow,
        isRecording: recordingNow,
        layeredBg: layeredNow,
        liveOrbsSnapshotRef: orbsSnapRef,
      } = stateRef.current;

      const vidEl = vidElRef?.current ?? vidElProp;
      const customVidEl = customVidElRef?.current ?? customVidElProp;
      const camVidEl = camVidElRef?.current ?? camVidElProp;

      if (armedNow) {
        const expectedDims = getRecordingDimensions(aspectNow, qualityNow);
        if (
          canvas.width !== expectedDims.exportWidth ||
          canvas.height !== expectedDims.exportHeight
        ) {
          resize();
        }
      }

      if (activeAnalyser && playing) {
        activeAnalyser.getByteFrequencyData(sim.freqData);
        activeAnalyser.getByteTimeDomainData(sim.timeData);
      } else {
        fillIdleSpectrum(
          sim.freqData,
          sim.timeData,
          nowSec,
          dna.dynamics,
          dna.seed,
          prefersReducedMotion
        );
      }

      const wantsOrbOnlyBackdrop =
        Boolean(customMediaNow) &&
        customMediaNow?.displayMode === 'backdrop' &&
        customMediaNow?.backdropOverlay === 'orb-only';

      if ((inStudio || armedNow || recordingNow || wantsOrbOnlyBackdrop) && !studioFrameRef.current) {
        const nextFrame = createInitialStudioFrame(width, height);
        studioFrameRef.current = nextFrame;
        if (externalStudioFrameRef) {
          externalStudioFrameRef.current = nextFrame;
        }
      }

      const activeFrame = studioFrameRef.current;
      if (externalStudioFrameRef) {
        externalStudioFrameRef.current = activeFrame;
      }

      const isVideoTrackNow = mediaTypeNow === 'video';
      const isImageTrackNow = mediaTypeNow === 'image';
      const isMainMediaTrackNow = isVideoTrackNow || isImageTrackNow;

      const hasLiveTrackVideo =
        (inStudio || armedNow || recordingNow) &&
        isVideoTrackNow &&
        Boolean(vidEl && vidEl.readyState >= 2 && vidEl.videoWidth > 0);
      const imgResolved = !isVideoTrackNow
        ? getCorsSafeImage(coverSrcNow || DEFAULT_COVER_IMAGE)
        : null;
      const hasLoadedImg = Boolean(imgResolved?.ok && imgResolved.img);

      let mediaSource: CanvasImageSource | null = isMainMediaTrackNow
        ? null
        : hasLoadedImg
        ? imgResolved!.img
        : null;
      let mediaWidth = isMainMediaTrackNow
        ? 0
        : hasLoadedImg
        ? imgResolved!.img.naturalWidth
        : 0;
      let mediaHeight = isMainMediaTrackNow
        ? 0
        : hasLoadedImg
        ? imgResolved!.img.naturalHeight
        : 0;

      let backdropSource: CanvasImageSource | null = null;
      let backdropWidth = 0;
      let backdropHeight = 0;
      let skipFallbackCenterOrb = isMainMediaTrackNow;

      if (hasLiveTrackVideo && vidEl) {
        backdropSource = vidEl;
        backdropWidth = vidEl.videoWidth;
        backdropHeight = vidEl.videoHeight;
      } else if (isImageTrackNow && hasLoadedImg && imgResolved?.img) {
        backdropSource = imgResolved.img;
        backdropWidth = imgResolved.img.naturalWidth;
        backdropHeight = imgResolved.img.naturalHeight;
      }

      const customApplies = Boolean(customMediaNow) || camPipNow;

      if (isMainMediaTrackNow) {
        if (customApplies) {
          let overlaySrc: CanvasImageSource | null = null;
          let overlayW = 0;
          let overlayH = 0;

          if (camPipNow || customMediaNow?.kind === 'camera') {
            const activeCamEl = camVidEl || customVidEl;
            if (activeCamEl && activeCamEl.readyState >= 2 && activeCamEl.videoWidth > 0) {
              overlaySrc = activeCamEl;
              overlayW = activeCamEl.videoWidth;
              overlayH = activeCamEl.videoHeight;
            }
          } else if (customMediaNow?.kind === 'video') {
            if (customVidEl && customVidEl.readyState >= 2 && customVidEl.videoWidth > 0) {
              overlaySrc = customVidEl;
              overlayW = customVidEl.videoWidth;
              overlayH = customVidEl.videoHeight;
            }
          } else if (customMediaNow?.src) {
            const customImgResolved = getCorsSafeImage(customMediaNow.src);
            if (customImgResolved?.ok && customImgResolved.img) {
              overlaySrc = customImgResolved.img;
              overlayW = customImgResolved.img.naturalWidth;
              overlayH = customImgResolved.img.naturalHeight;
            }
          }

          mediaSource = overlaySrc;
          mediaWidth = overlayW;
          mediaHeight = overlayH;
        }
      } else if (customApplies && customMediaNow) {
        let customSrc: CanvasImageSource | null = null;
        let customW = 0;
        let customH = 0;

        if (customMediaNow.kind === 'video' || customMediaNow.kind === 'camera') {
          const activeVidEl =
            customMediaNow.kind === 'camera' ? camVidEl || customVidEl : customVidEl;
          if (activeVidEl && activeVidEl.readyState >= 2 && activeVidEl.videoWidth > 0) {
            customSrc = activeVidEl;
            customW = activeVidEl.videoWidth;
            customH = activeVidEl.videoHeight;
          }
        } else {
          const customImgResolved = getCorsSafeImage(customMediaNow.src);
          if (customImgResolved?.ok && customImgResolved.img) {
            customSrc = customImgResolved.img;
            customW = customImgResolved.img.naturalWidth;
            customH = customImgResolved.img.naturalHeight;
          }
        }

        if (camPipNow) {
          // Dual-video / reaction PiP mode: device video/photo on full backdrop, live camera inside studio frame
          if (customSrc && customW > 0 && customH > 0) {
            backdropSource = customSrc;
            backdropWidth = customW;
            backdropHeight = customH;
          }
          if (camVidEl && camVidEl.readyState >= 2 && camVidEl.videoWidth > 0) {
            mediaSource = camVidEl;
            mediaWidth = camVidEl.videoWidth;
            mediaHeight = camVidEl.videoHeight;
          } else {
            mediaSource = null;
            mediaWidth = 0;
            mediaHeight = 0;
          }
        } else if (customMediaNow.displayMode === 'frame') {
          if (customSrc && customW > 0 && customH > 0) {
            mediaSource = customSrc;
            mediaWidth = customW;
            mediaHeight = customH;
          } else {
            // Do not fall back to the audio track's cover while custom video/photo/camera frame loads
            mediaSource = null;
            mediaWidth = 0;
            mediaHeight = 0;
          }
        } else if (customSrc && customW > 0 && customH > 0) {
          backdropSource = customSrc;
          backdropWidth = customW;
          backdropHeight = customH;
          skipFallbackCenterOrb = customMediaNow.backdropOverlay !== 'orb-only';
        }
      } else if (customApplies && camPipNow) {
        if (camVidEl && camVidEl.readyState >= 2 && camVidEl.videoWidth > 0) {
          mediaSource = camVidEl;
          mediaWidth = camVidEl.videoWidth;
          mediaHeight = camVidEl.videoHeight;
        } else {
          mediaSource = null;
          mediaWidth = 0;
          mediaHeight = 0;
        }
      }

      const isEditingStudioFrame =
        Boolean(activeFrame?.editMode) || gestureRef.current.pointerId !== null;
      const frameApplies = isMainMediaTrackNow
        ? customApplies
        : customApplies && (camPipNow || customMediaNow?.displayMode === 'frame');
      const backdropApplies = isMainMediaTrackNow
        ? isMainMediaTrackNow
        : customApplies && Boolean(customMediaNow) && (camPipNow || customMediaNow?.displayMode === 'backdrop');
      const cleanBackdropNow = isMainMediaTrackNow
        ? true
        : backdropApplies && !camPipNow && customMediaNow?.backdropOverlay === 'clean';
      const showCoverCaptionNow =
        !frameApplies &&
        !cleanBackdropNow &&
        !isMainMediaTrackNow;

      const effectiveStudioActive = isMainMediaTrackNow ? frameApplies : inStudio;

      stepAndRenderVisualizerFrame({
        ctx,
        sim,
        width,
        height,
        nowSec,
        dtSec,
        isPlaying: playing,
        vizMode: primaryMode,
        paletteIndex: pIdx,
        visualDna: dna,
        isZenMode: zen,
        isRecordArmed: armedNow,
        isRecording: recordingNow,
        studioActive: effectiveStudioActive,
        layeredBg: layeredNow,
        prefersReducedMotion,
        studioFrame: activeFrame,
        frameMotion: frameApplies ? customMediaNow?.frameMotion ?? 'static' : coverMotionNow,
        frameRotationTarget: frameApplies
          ? customMediaNow?.frameRotationTarget ?? 'none'
          : coverRotationNow,
        isEditingStudioFrame,
        mediaSource,
        mediaWidth,
        mediaHeight,
        coverCaptionTitle: showCoverCaptionNow ? captionTitleNow : null,
        coverCaptionArtist: showCoverCaptionNow ? captionArtistNow : null,
        backdropSource,
        backdropWidth,
        backdropHeight,
        backdropOverlay: isMainMediaTrackNow
          ? 'clean'
          : backdropApplies
          ? customMediaNow?.backdropOverlay ?? 'visualizer'
          : undefined,
        skipFallbackCenterOrb,
        showStudioOverlay: Boolean(effectiveStudioActive && activeFrame?.editMode && !recordingNow),
        orbSnapshots: orbsSnapRef?.current ?? null,
        orbViewportWidth: window.innerWidth || width,
        orbViewportHeight: window.innerHeight || height,
        resolveOrbImage: getCorsSafeImage,
        advanceOrbPhysics: false,
      });
    };

    animationId = requestAnimationFrame(render);

    return () => {
      resizeFnRef.current = null;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      for (const blobUrl of fetchedBlobUrls) {
        URL.revokeObjectURL(blobUrl);
      }
      fetchedBlobUrls.clear();
      coverCacheRef.current.clear();
    };
  }, [externalStudioFrameRef]);

  const toLogicalCoords = (clientX: number, clientY: number, rect: DOMRect) => {
    const logicalW = logicalSizeRef.current.w || rect.width || window.innerWidth || 800;
    const logicalH = logicalSizeRef.current.h || rect.height || window.innerHeight || 600;
    const scaleX = logicalW / Math.max(1, rect.width);
    const scaleY = logicalH / Math.max(1, rect.height);
    return {
      px: (clientX - rect.left) * scaleX,
      py: (clientY - rect.top) * scaleY,
      logicalW,
      logicalH,
    };
  };

  const clearLongPress = () => {
    if (gestureRef.current.longPressTimer) {
      window.clearTimeout(gestureRef.current.longPressTimer);
      gestureRef.current.longPressTimer = 0;
    }
  };

  const isStudioFrameInteractable = () => {
    const s = stateRef.current;
    if (s.activeMediaType === 'video' || s.activeMediaType === 'image') {
      return Boolean(s.customStageMedia || s.cameraOverlayActive);
    }
    return s.studioActive;
  };

  const handleCanvasPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canStudio = isStudioFrameInteractable();
    const canRecordTap = stateRef.current.isRecordArmed && !stateRef.current.isRecording;
    if (!canStudio && !canRecordTap) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const frame = studioFrameRef.current;
    if (canStudio && !frame) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const { px, py } = toLogicalCoords(e.clientX, e.clientY, rect);
    const hit = canStudio && frame ? hitTestStudioFrame(px, py, frame) : null;

    clearLongPress();
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const g = gestureRef.current;
    g.pointerId = e.pointerId;
    g.target = hit ?? 'bg';
    g.startX = px;
    g.startY = py;
    g.startCx = frame?.cx ?? px;
    g.startCy = frame?.cy ?? py;
    g.startScaleX = frame?.scaleX ?? 1;
    g.startScaleY = frame?.scaleY ?? 1;
    g.startRotation = frame?.rotation ?? 0;
    g.startAngle = frame ? Math.atan2(py - frame.cy, px - frame.cx) : 0;
    g.startDistFromCenter = frame ? Math.max(24, Math.hypot(px - frame.cx, py - frame.cy)) : 1;
    g.movedDist = 0;
    g.longPressFired = false;

    if (canStudio && frame && hit === 'body') {
      g.longPressTimer = window.setTimeout(() => {
        if (gestureRef.current.pointerId !== e.pointerId || gestureRef.current.movedDist > 9) {
          return;
        }
        gestureRef.current.longPressFired = true;
        frame.editMode = !frame.editMode;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(16);
          } catch {
            // ignore vibration restrictions
          }
        }
        const msg = getStudioMessages(stateRef.current.lang);
        stateRef.current.onStudioToast?.(
          frame.editMode ? msg.studioDeformOnToast : msg.studioDeformOffToast
        );
      }, 600);
    }
  };

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const g = gestureRef.current;
    const canStudio = isStudioFrameInteractable();
    const canRecordTap = stateRef.current.isRecordArmed && !stateRef.current.isRecording;
    if ((!canStudio && !canRecordTap) || g.pointerId !== e.pointerId) return;

    const frame = studioFrameRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const { px, py, logicalW, logicalH } = toLogicalCoords(e.clientX, e.clientY, rect);
    const dx = px - g.startX;
    const dy = py - g.startY;
    g.movedDist = Math.max(g.movedDist, Math.hypot(dx, dy));

    if (g.movedDist > 9) {
      clearLongPress();
    }

    if (!canStudio || !frame || g.target === 'bg') return;

    if (g.target === 'body') {
      if (!g.longPressFired && g.movedDist > 6) {
        frame.cx = Math.max(40, Math.min(logicalW - 40, g.startCx + dx));
        frame.cy = Math.max(68, Math.min(logicalH - 76, g.startCy + dy));
      }
      return;
    }

    if (g.target === 'rotate') {
      const curAngle = Math.atan2(py - frame.cy, px - frame.cx);
      frame.rotation = g.startRotation + (curAngle - g.startAngle);
      return;
    }

    if (
      g.target === 'corner_tl' ||
      g.target === 'corner_tr' ||
      g.target === 'corner_br' ||
      g.target === 'corner_bl'
    ) {
      const curDist = Math.max(24, Math.hypot(px - frame.cx, py - frame.cy));
      const ratio = curDist / g.startDistFromCenter;
      frame.scaleX = Math.max(0.28, Math.min(2.6, g.startScaleX * ratio));
      frame.scaleY = Math.max(0.28, Math.min(2.6, g.startScaleY * ratio));
      return;
    }

    if (g.target === 'edge_l' || g.target === 'edge_r') {
      const cos = Math.cos(-frame.rotation);
      const sin = Math.sin(-frame.rotation);
      const lx = (px - frame.cx) * cos - (py - frame.cy) * sin;
      const baseRx = getStudioShapeRadii(frame.shape, frame.baseSize, 1, 1).rx;
      frame.scaleX = Math.max(0.28, Math.min(2.8, Math.abs(lx) / Math.max(20, baseRx)));
      return;
    }

    if (g.target === 'edge_t' || g.target === 'edge_b') {
      const cos = Math.cos(-frame.rotation);
      const sin = Math.sin(-frame.rotation);
      const ly = (px - frame.cx) * sin + (py - frame.cy) * cos;
      const baseRy = getStudioShapeRadii(frame.shape, frame.baseSize, 1, 1).ry;
      frame.scaleY = Math.max(0.28, Math.min(2.8, Math.abs(ly) / Math.max(20, baseRy)));
    }
  };

  const finishCanvasGesture = (e: ReactPointerEvent<HTMLCanvasElement>, cancelled: boolean) => {
    const g = gestureRef.current;
    if (g.pointerId !== e.pointerId) return;
    clearLongPress();
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore if capture already released
    }

    const frame = studioFrameRef.current;
    const canStudio = isStudioFrameInteractable();
    const canRecordTap = stateRef.current.isRecordArmed && !stateRef.current.isRecording;
    if (!cancelled && (canStudio || canRecordTap)) {
      if (!g.longPressFired && g.movedDist <= 9) {
        if (canStudio && frame && g.target === 'body') {
          frame.shape = pickNextStudioShape(frame.shape);
          frame.scaleX = 1;
          frame.scaleY = 1;
        } else if (g.target === 'bg') {
          if ((canStudio || canRecordTap) && frame) {
            frame.editMode = false;
            frame.fxMode = pickNextStudioFxMode(frame.fxMode);
            frame.fxState = createOrbFxState();
          }
          stateRef.current.onRandomizeStyle?.();
        }
      } else if (canStudio && frame && g.target === 'body' && g.movedDist > 9) {
        const rect = e.currentTarget.getBoundingClientRect();
        const { px, py } = toLogicalCoords(e.clientX, e.clientY, rect);
        const vxKick = ((px - g.startX) / 140) * 0.65;
        const vyKick = ((py - g.startY) / 140) * 0.65;
        if (Math.hypot(vxKick, vyKick) > 0.08) {
          frame.vx = Math.max(-1.2, Math.min(1.2, vxKick));
          frame.vy = Math.max(-1.2, Math.min(1.2, vyKick));
        }
      }
    }

    g.pointerId = null;
    g.target = null;
  };

  const isMainMediaProp = activeMediaType === 'video' || activeMediaType === 'image';
  const hasOverlayFrame = Boolean(customStageMedia || cameraOverlayActive);
  const canInteractFrame = isMainMediaProp ? hasOverlayFrame : studioActive;
  const canInteractCanvas = canInteractFrame || (isRecordArmed && !isRecording);

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${
        studioActive || isRecordArmed || canInteractFrame ? 'z-10' : 'z-0'
      } ${
        isRecordArmed
          ? `flex items-center justify-center bg-[#050508] px-3 ${
              isZenMode ? 'pt-[58px] pb-5' : 'pt-[114px] sm:pt-[124px] pb-[104px] sm:pb-[108px]'
            }`
          : ''
      }`}
    >
      <canvas
        ref={setCanvasElement}
        aria-hidden="true"
        onPointerDown={canInteractCanvas ? handleCanvasPointerDown : undefined}
        onPointerMove={canInteractCanvas ? handleCanvasPointerMove : undefined}
        onPointerUp={canInteractCanvas ? (e) => finishCanvasGesture(e, false) : undefined}
        onPointerCancel={canInteractCanvas ? (e) => finishCanvasGesture(e, true) : undefined}
        className={`${
          isRecordArmed
            ? 'rounded-xl ring-1 ring-white/20 shadow-[0_0_50px_rgba(0,0,0,0.88)]'
            : 'fixed inset-0 w-full h-full'
        } ${
          canInteractFrame
            ? 'pointer-events-auto touch-none cursor-grab active:cursor-grabbing'
            : canInteractCanvas
            ? 'pointer-events-auto touch-none cursor-pointer'
            : 'pointer-events-none'
        }`}
      />
    </div>
  );
}
