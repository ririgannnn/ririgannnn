import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// PWA — auto-update service worker
registerSW({
  onNeedRefresh() {
    if (confirm('有新版本可用，是否立即更新？')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use.');
  },
});
