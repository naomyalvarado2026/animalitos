import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initTheme } from '@/stores/themeStore';
import './index.css';
import App from './App.tsx';

// Apply stored theme before first paint to avoid flash
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
