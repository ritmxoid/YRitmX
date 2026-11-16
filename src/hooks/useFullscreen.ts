import { useCallback, useEffect, useRef, useState } from 'react';

interface FullscreenDoc extends Document {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface FullscreenEl extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as FullscreenDoc;
  return doc.fullscreenElement || doc.webkitFullscreenElement || null;
}

function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(getFullscreenElement()));
  const [isStandaloneDisplay, setIsStandaloneDisplay] = useState<boolean>(() => isRunningStandalone());
  const userDismissedRef = useRef(false);

  const canFullscreen =
    typeof document !== 'undefined' &&
    Boolean(
      document.fullscreenEnabled ||
        (document as FullscreenDoc).webkitFullscreenEnabled ||
        (document.documentElement as FullscreenEl).requestFullscreen ||
        (document.documentElement as FullscreenEl).webkitRequestFullscreen
    );

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    if (typeof document === 'undefined') return false;
    if (getFullscreenElement()) {
      setIsFullscreen(true);
      return true;
    }

    const rootEl = document.documentElement as FullscreenEl;
    try {
      if (rootEl.requestFullscreen) {
        try {
          await rootEl.requestFullscreen({ navigationUI: 'hide' });
        } catch {
          await rootEl.requestFullscreen();
        }
        userDismissedRef.current = false;
        setIsFullscreen(true);
        return true;
      }
      if (rootEl.webkitRequestFullscreen) {
        await rootEl.webkitRequestFullscreen();
        userDismissedRef.current = false;
        setIsFullscreen(true);
        return true;
      }
    } catch {
      // Browsers block requestFullscreen without a user gesture or inside restricted iframes
    }
    return false;
  }, []);

  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (typeof document === 'undefined') return;
    userDismissedRef.current = true;
    const doc = document as FullscreenDoc;
    try {
      if (doc.fullscreenElement && doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // ignore exit errors
    }
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(async (): Promise<'entered' | 'exited' | 'ios-guide' | 'unsupported'> => {
    if (getFullscreenElement()) {
      await exitFullscreen();
      return 'exited';
    }
    if (isIOS && !isRunningStandalone()) {
      return 'ios-guide';
    }
    const ok = await enterFullscreen();
    return ok ? 'entered' : 'unsupported';
  }, [enterFullscreen, exitFullscreen, isIOS]);

  // Sync fullscreen & standalone display-mode changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      const active = Boolean(getFullscreenElement());
      setIsFullscreen(active);
      if (!active) {
        // User exited via Esc or system gesture — respect their choice
        userDismissedRef.current = true;
      }
    };

    const standaloneMq = window.matchMedia('(display-mode: standalone)');
    const fullscreenMq = window.matchMedia('(display-mode: fullscreen)');
    const handleDisplayChange = () => {
      setIsStandaloneDisplay(isRunningStandalone());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    standaloneMq.addEventListener?.('change', handleDisplayChange);
    fullscreenMq.addEventListener?.('change', handleDisplayChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      standaloneMq.removeEventListener?.('change', handleDisplayChange);
      fullscreenMq.removeEventListener?.('change', handleDisplayChange);
    };
  }, []);

  // Try fullscreen immediately when opened in browser, and on first user gesture if blocked by browser policy
  useEffect(() => {
    if (isStandaloneDisplay || isIOS) return;

    // Best-effort attempt on mount (succeeds in permissive WebViews/kiosk browsers)
    void enterFullscreen();

    const handleFirstGesture = (e: Event) => {
      if (userDismissedRef.current || getFullscreenElement() || isRunningStandalone()) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      void enterFullscreen();
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [enterFullscreen, isIOS, isStandaloneDisplay]);

  return {
    isFullscreen: isFullscreen || isStandaloneDisplay,
    isNativeFullscreen: isFullscreen,
    isStandaloneDisplay,
    canFullscreen,
    isIOS,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
