import { useEffect, useState } from 'react';

const PROBE_TIMEOUT_MS = 4000;
const RECHECK_INTERVAL_MS = 45000;

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    let disposed = false;
    let activeProbe: AbortController | null = null;

    const checkConnection = async () => {
      if (!navigator.onLine) {
        setOnline(false);
        return;
      }

      activeProbe?.abort();
      const controller = new AbortController();
      activeProbe = controller;
      const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

      try {
        const probeUrl = new URL(`${import.meta.env.BASE_URL}favicon.svg`, window.location.origin);
        const response = await fetch(probeUrl, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
        if (!disposed) setOnline(response.ok);
      } catch {
        if (!disposed) setOnline(false);
      } finally {
        window.clearTimeout(timeout);
        if (activeProbe === controller) activeProbe = null;
      }
    };

    const onOffline = () => {
      activeProbe?.abort();
      setOnline(false);
    };
    const onOnline = () => { void checkConnection(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkConnection();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('adoptame:network-restored', onOnline);
    window.addEventListener('adoptame:network-lost', onOffline);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void checkConnection();
    }, RECHECK_INTERVAL_MS);
    void checkConnection();

    return () => {
      disposed = true;
      activeProbe?.abort();
      window.clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('adoptame:network-restored', onOnline);
      window.removeEventListener('adoptame:network-lost', onOffline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return online;
}
