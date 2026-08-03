import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// ===== CRITICAL: Unregister ALL Service Workers =====
// The old autoUpdate SW was causing mobile white screen:
// SW detects new version → calls confirm() → page freezes on mobile
// This code runs BEFORE React mounts to ensure no SW interferes.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      console.log(`[SW] Found ${registrations.length} old service worker(s), unregistering...`);
      registrations.forEach((reg) => {
        reg.unregister().then((success) => {
          console.log('[SW] Unregistered:', success);
        });
      });
    }
  }).catch((err) => {
    console.warn('[SW] Failed to unregister:', err);
  });

  // Prevent any future SW registration
  const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
  navigator.serviceWorker.register = (() => {
    console.warn('[SW] Service worker registration blocked (removed PWA)');
    return Promise.reject(new Error('PWA disabled'));
  }) as typeof originalRegister;
}

// Clear all SW caches
if ('caches' in window) {
  caches.keys().then((names) => {
    if (names.length > 0) {
      console.log(`[Cache] Clearing ${names.length} cache(s)...`);
      names.forEach((name) => caches.delete(name));
    }
  }).catch(() => {});
}

// ===== Global error handlers — prevent white screen from unhandled errors =====
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[Unhandled Rejection]', event.reason);
  // Prevent the rejection from crashing the page
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('[Global Error]', event.error || event.message);
  // Don't prevent default for syntax errors — only for runtime errors in async code
  if (event.error && event.error.stack) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
