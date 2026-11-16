type AnalyticsParamValue = string | number | boolean | undefined;
export type AnalyticsParams = Record<string, AnalyticsParamValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: AnalyticsParams): void {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) {
          cleanParams[k] = v;
        }
      }
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, cleanParams);
    } else {
      window.dataLayer.push({
        event: eventName,
        ...cleanParams,
      });
    }
  } catch {
    // Never break app flow if analytics is blocked
  }
}
