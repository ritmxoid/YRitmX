import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {I18nProvider} from './i18n/I18nContext.tsx';
import './index.css';

const hadController =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  Boolean(navigator.serviceWorker.controller);

let isRefreshing = false;

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || isRefreshing) return;
    isRefreshing = true;
    window.location.reload();
  });
}

registerSW({
  immediate: true,
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
  <I18nProvider>
    <App />
  </I18nProvider>
);
