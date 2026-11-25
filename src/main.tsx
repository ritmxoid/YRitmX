import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import App from './App.tsx';
import {I18nProvider} from './i18n/I18nContext.tsx';
import './index.css';

registerSW({
  immediate: true,
  onNeedRefresh() {
    // Do not interrupt active audio/video playback with a forced reload;
    // the waiting Service Worker will activate cleanly on next launch/refresh.
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    window.setInterval(() => {
      void registration.update();
    }, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void registration.update();
      }
    });
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ErrorBoundary>
);
