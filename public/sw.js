const CACHE_NAME = 'adoptame-shell-__PWA_CACHE_VERSION__';
const SCOPE_URL = new URL('./', self.registration.scope);
const SHELL_URL = new URL('index.html', SCOPE_URL).toString();

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(SHELL_URL, { cache: 'reload' });
    if (response.ok) {
      await cache.put(SHELL_URL, response);
      try {
        const manifestUrl = new URL('pwa-precache.json', SCOPE_URL);
        const manifestResponse = await fetch(manifestUrl.toString(), { cache: 'reload' });
        if (manifestResponse.ok) {
          const assets = await manifestResponse.json();
          const urls = assets.map((asset) => new URL(asset, SCOPE_URL)).filter((url) => url.origin === self.location.origin);
          const concurrency = 5;
          for (let index = 0; index < urls.length; index += concurrency) {
            await Promise.all(urls.slice(index, index + concurrency).map(async (url) => {
              try {
                const asset = await fetch(url.toString(), { cache: 'reload' });
                if (asset.ok) await cache.put(url.toString(), asset);
              } catch {
                // Un recurso secundario no impide abrir la app ni consultar otros recursos guardados.
              }
            }));
          }
        }
      } catch {
        // Mantiene la instalación básica si falla la precarga extendida.
      }
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('adoptame-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(SHELL_URL, response.clone());
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(SHELL_URL);
      return cached || Response.error();
    }));
    return;
  }

  const isHashedBuildAsset = url.pathname.includes('/assets/');
  const isCacheablePublicAsset = url.pathname.includes('/brand/') || url.pathname.includes('/images/') || url.pathname.endsWith('.webmanifest') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg');
  if (isHashedBuildAsset) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })));
  } else if (isCacheablePublicAsset) {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      return cached || Response.error();
    }));
  }
});
