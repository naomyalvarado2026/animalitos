const CACHE_NAME = 'adoptame-shell-v1';
const SCOPE_URL = new URL('./', self.registration.scope);
const SHELL_URL = new URL('index.html', SCOPE_URL).toString();

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(SHELL_URL, { cache: 'reload' });
    if (response.ok) {
      const html = await response.clone().text();
      await cache.put(SHELL_URL, response);
      const matches = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))[^"']*["']/g)];
      const assets = matches.map((match) => new URL(match[1], SCOPE_URL)).filter((url) => url.origin === self.location.origin);
      await Promise.all(assets.map(async (url) => {
        try {
          const asset = await fetch(url.toString());
          if (asset.ok) await cache.put(url.toString(), asset);
        } catch {
          // La instalación sigue aunque un recurso secundario falle.
        }
      }));
    }
    await self.skipWaiting();
  })());
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

  if (url.pathname.includes('/assets/') || url.pathname.includes('/brand/') || url.pathname.includes('/images/') || url.pathname.endsWith('.webmanifest') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg')) {
    event.respondWith(caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }));
  }
});
