import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@/stores/themeStore';
import './index.css';
import App from './App.tsx';

// Apply stored theme before first paint to avoid flash
initTheme();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL })
      .catch((error) => console.warn('No se pudo registrar el modo instalable de AdoptaME.', error));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
