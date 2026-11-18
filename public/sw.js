const CACHE_NAME = 'adoptame-shell-__PWA_CACHE_VERSION__';
const RUNTIME_CACHE_NAME = `${CACHE_NAME}-runtime`;
const SCOPE_URL = new URL('./', self.registration.scope);
const SHELL_URL = new URL('index.html', SCOPE_URL).toString();
const OFFLINE_URL = new URL('offline.html', SCOPE_URL).toString();
const PUBLIC_ROUTES_URL = new URL('public-routes.json', SCOPE_URL).toString();
const ROUTE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const ASSET_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const ASSET_CACHE_MAX_ENTRIES = 80;

function normalizePublicPath(pathname) {
  const scopePath = new URL(SCOPE_URL).pathname;
  if (!pathname.startsWith(scopePath)) return null;
  const relativePath = pathname.slice(scopePath.length).replace(/^\/+|\/+$/g, '');
  return relativePath ? `/${relativePath}` : '/';
}

function cacheWithTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('x-adoptame-cached-at', String(Date.now()));
  return new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function getFreshCachedRoute(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (!cached) return null;
  const cachedAt = Number(cached.headers.get('x-adoptame-cached-at'));
  if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > ROUTE_CACHE_MAX_AGE_MS) {
    await cache.delete(request);
    return null;
  }
  return cached;
}

async function getFreshRuntimeAsset(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE_NAME);
    const cached = await cache.match(request);
    if (!cached) return null;
    const cachedAt = Number(cached.headers.get('x-adoptame-cached-at'));
    if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > ASSET_CACHE_MAX_AGE_MS) {
      await cache.delete(request);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

async function putBoundedRuntimeAsset(request, response) {
  try {
    const cache = await caches.open(RUNTIME_CACHE_NAME);
    const keys = await cache.keys();
    const now = Date.now();
    for (const key of keys) {
      const cached = await cache.match(key);
      const cachedAt = Number(cached?.headers.get('x-adoptame-cached-at'));
      if (!Number.isFinite(cachedAt) || now - cachedAt > ASSET_CACHE_MAX_AGE_MS) await cache.delete(key);
    }
    await cache.put(request, cacheWithTimestamp(response));
    const remaining = await cache.keys();
    if (remaining.length > ASSET_CACHE_MAX_ENTRIES) {
      const entries = await Promise.all(remaining.map(async (key) => {
        const cached = await cache.match(key);
        return { key, cachedAt: Number(cached?.headers.get('x-adoptame-cached-at')) || 0 };
      }));
      entries.sort((a, b) => a.cachedAt - b.cachedAt);
      await Promise.all(entries.slice(0, remaining.length - ASSET_CACHE_MAX_ENTRIES).map(({ key }) => cache.delete(key)));
    }
  } catch {
    // Storage quota or Cache API errors must not break a successful network response.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(SHELL_URL, { cache: 'reload' });
    if (!response.ok) throw new Error('Could not cache the app shell.');
    await cache.put(SHELL_URL, response);

    const manifestUrl = new URL('pwa-precache.json', SCOPE_URL);
    const manifestResponse = await fetch(manifestUrl.toString(), { cache: 'reload' });
    if (!manifestResponse.ok) throw new Error('Could not load the offline resource manifest.');
    const manifest = await manifestResponse.json();
    const publicRoutesResponse = await fetch(PUBLIC_ROUTES_URL, { cache: 'reload' });
    if (!publicRoutesResponse.ok) throw new Error('Could not load public route allowlist.');
    const publicRoutePaths = await publicRoutesResponse.json();
    if (!Array.isArray(publicRoutePaths) || !publicRoutePaths.every((route) => typeof route === 'string' && route.startsWith('/'))) {
      throw new Error('Public route allowlist has an invalid format.');
    }
    await cache.put(PUBLIC_ROUTES_URL, new Response(JSON.stringify(publicRoutePaths), { headers: { 'Content-Type': 'application/json' } }));
    const required = Array.isArray(manifest.required) ? manifest.required : [];
    const optional = Array.isArray(manifest.optional) ? manifest.optional : [];
    const concurrency = 5;
    const cacheBatch = async (items, isRequired) => {
      const urls = items.map((item) => new URL(item, SCOPE_URL));
      if (urls.some((url) => url.origin !== self.location.origin)) throw new Error('Offline resource manifest contains a cross-origin URL.');
      for (let index = 0; index < urls.length; index += concurrency) {
        await Promise.all(urls.slice(index, index + concurrency).map(async (url) => {
          try {
            const asset = await fetch(url.toString(), { cache: 'reload' });
            if (!asset.ok) throw new Error(`Could not cache ${url.pathname}.`);
            await cache.put(url.toString(), asset);
          } catch (error) {
            if (isRequired) throw error;
            // Optional portraits can be downloaded when the person opens their profile.
          }
        }));
      }
    };

    await cacheBatch(required, true);
    await cacheBatch(optional, false);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('adoptame-shell-') && key !== CACHE_NAME && key !== RUNTIME_CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).then(async (response) => {
      // Never persist OAuth codes, app flags, search filters, or form values from a URL.
      // Cache only allowlisted public pages, never as the app shell.
      const publicPath = normalizePublicPath(url.pathname);
      if (response.ok && url.search === '' && publicPath) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedRoutes = await cache.match(PUBLIC_ROUTES_URL);
          const allowedRoutes = cachedRoutes ? await cachedRoutes.json() : [];
          if (!allowedRoutes.includes(publicPath)) return response;
          await cache.put(request, cacheWithTimestamp(response));
        } catch {
          // A quota or cache failure must never turn a successful online visit into an error.
        }
      }
      return response;
    }).catch(async () => {
      const publicPath = normalizePublicPath(url.pathname);
      const cache = await caches.open(CACHE_NAME);
      const cachedRoutes = await cache.match(PUBLIC_ROUTES_URL);
      const allowedRoutes = cachedRoutes ? await cachedRoutes.json() : [];
      const cachedPage = url.search === '' && publicPath && allowedRoutes.includes(publicPath)
        ? await getFreshCachedRoute(request)
        : null;
      if (cachedPage) return cachedPage;
      const cachedShell = await cache.match(SHELL_URL);
      if (cachedShell) return cachedShell;
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }));
    return;
  }

  if (url.search || !normalizePublicPath(url.pathname)) return;
  const isHashedBuildAsset = url.pathname.includes('/assets/');
  const isCacheablePublicAsset = url.pathname.includes('/brand/') || url.pathname.includes('/images/') || url.pathname.endsWith('.webmanifest') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg');
  if (isHashedBuildAsset || isCacheablePublicAsset) {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok) await putBoundedRuntimeAsset(request, response.clone());
      return response;
    }).catch(async () => {
      const cached = await getFreshRuntimeAsset(request);
      if (cached) return cached;
      try {
        return (await (await caches.open(CACHE_NAME)).match(request)) || Response.error();
      } catch {
        return Response.error();
      }
    }));
  }
});

