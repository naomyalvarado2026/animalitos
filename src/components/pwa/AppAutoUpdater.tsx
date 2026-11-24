import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const AUTO_UPDATED_FLAG = 'adoptame_auto_updated';
const LAST_RELOAD_KEY = 'adoptame_last_auto_reload';
const RELOAD_COOLDOWN_MS = 60_000;

function isUserEditingOrDialogOpen(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.querySelector('dialog[open]')) return true;

  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.isContentEditable) return true;

  const isField = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT';
  return isField && Boolean(active.closest('form'));
}

export function AppAutoUpdater() {
  const queryClient = useQueryClient();
  const shouldReloadRef = useRef(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTO_UPDATED_FLAG) === '1') {
        sessionStorage.removeItem(AUTO_UPDATED_FLAG);
        toast.success('AdoptaME se actualizó a la última versión.');
      }
    } catch {
      // Ignora restricciones de sessionStorage.
    }
  }, []);

  useEffect(() => {
    const syncDataOnReconnect = () => {
      void queryClient.invalidateQueries();
    };

    window.addEventListener('online', syncDataOnReconnect);
    window.addEventListener('adoptame:network-restored', syncDataOnReconnect);
    return () => {
      window.removeEventListener('online', syncDataOnReconnect);
      window.removeEventListener('adoptame:network-restored', syncDataOnReconnect);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let disposed = false;
    let observedRegistration: ServiceWorkerRegistration | null = null;
    let trackedWorker: ServiceWorker | null = null;

    const applyUpdate = (waitingWorker: ServiceWorker) => {
      const now = Date.now();
      let lastReload = 0;
      try {
        lastReload = Number(sessionStorage.getItem(LAST_RELOAD_KEY) ?? 0);
      } catch {
        lastReload = 0;
      }

      if (!isUserEditingOrDialogOpen() && now - lastReload > RELOAD_COOLDOWN_MS) {
        try {
          sessionStorage.setItem(LAST_RELOAD_KEY, String(now));
          sessionStorage.setItem(AUTO_UPDATED_FLAG, '1');
        } catch {
          // Ignora errores de almacenamiento.
        }
        shouldReloadRef.current = true;
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        return;
      }

      if (promptedRef.current) return;
      promptedRef.current = true;
      toast('Hay una actualización lista de AdoptaME', {
        description: 'Aplica la nueva versión cuando termines tu formulario.',
        duration: 12_000,
        action: {
          label: 'Actualizar ahora',
          onClick: () => {
            try {
              sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
              sessionStorage.setItem(AUTO_UPDATED_FLAG, '1');
            } catch {
              // Ignora errores de almacenamiento.
            }
            shouldReloadRef.current = true;
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          },
        },
      });
    };

    const checkForUpdates = async () => {
      if (disposed || !navigator.onLine) return;
      try {
        const registration = observedRegistration ?? (await navigator.serviceWorker.ready);
        if (disposed) return;
        observedRegistration = registration;
        await registration.update();
        if (registration.waiting) {
          applyUpdate(registration.waiting);
        }
      } catch {
        // Silencioso sin conexión o durante actualización en curso.
      }
    };

    const onWorkerStateChange = () => {
      if (!disposed && trackedWorker?.state === 'installed' && navigator.serviceWorker.controller) {
        applyUpdate(trackedWorker);
      }
    };

    const onUpdateFound = () => {
      const installing = observedRegistration?.installing;
      if (!installing) return;
      trackedWorker?.removeEventListener('statechange', onWorkerStateChange);
      trackedWorker = installing;
      installing.addEventListener('statechange', onWorkerStateChange);
    };

    const onControllerChange = () => {
      if (shouldReloadRef.current) {
        window.location.reload();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates();
      }
    };

    void navigator.serviceWorker.ready.then((registration) => {
      if (disposed) return;
      observedRegistration = registration;
      if (registration.waiting) {
        applyUpdate(registration.waiting);
      }
      registration.addEventListener('updatefound', onUpdateFound);
      void checkForUpdates();
    });

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    window.addEventListener('online', checkForUpdates);
    window.addEventListener('adoptame:network-restored', checkForUpdates);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      trackedWorker?.removeEventListener('statechange', onWorkerStateChange);
      observedRegistration?.removeEventListener('updatefound', onUpdateFound);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('online', checkForUpdates);
      window.removeEventListener('adoptame:network-restored', checkForUpdates);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}
