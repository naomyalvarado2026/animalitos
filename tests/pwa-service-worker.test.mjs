import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const scopeUrl = 'https://adoptame.example/animalitos/';
const routeUrl = `${scopeUrl}adopta/blanquita/`;
const routeCacheKey = new URL(routeUrl).toString();
const routeListUrl = new URL('public-routes.json', scopeUrl).toString();
const shellUrl = new URL('index.html', scopeUrl).toString();
const offlineUrl = new URL('offline.html', scopeUrl).toString();

function cacheKey(request) {
  return typeof request === 'string' ? request : request.url;
}

function createServiceWorker({ entries = [], fetchImpl = async () => { throw new Error('offline'); } } = {}) {
  const listeners = new Map();
  const stored = new Map(entries);
  const cache = {
    match: async (request) => stored.get(cacheKey(request)) ?? null,
    put: async (request, response) => { stored.set(cacheKey(request), response); },
    delete: async (request) => stored.delete(cacheKey(request)),
    keys: async () => [...stored.keys()].map((url) => ({ url })),
  };
  const cacheStorage = {
    open: async () => cache,
    keys: async () => ['adoptame-shell-test'],
    match: async (request) => cache.match(request),
  };
  const self = {
    location: new URL(scopeUrl),
    registration: { scope: scopeUrl },
    addEventListener: (name, listener) => listeners.set(name, listener),
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
  };
  const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
    .replace('__PWA_CACHE_VERSION__', 'test');
  vm.runInNewContext(source, {
    self,
    caches: cacheStorage,
    fetch: fetchImpl,
    URL,
    Headers,
    Response,
    Date,
    Promise,
    Error,
  });

  return {
    cache,
    handleFetch: async (url) => {
      let responsePromise;
      listeners.get('fetch')({
        request: { method: 'GET', mode: 'navigate', url },
        respondWith: (promise) => { responsePromise = Promise.resolve(promise); },
      });
      assert.ok(responsePromise, 'navigation should be handled by the service worker');
      return responsePromise;
    },
  };
}

function routeListResponse(routes = ['/adopta/blanquita']) {
  return new Response(JSON.stringify(routes), { headers: { 'Content-Type': 'application/json' } });
}

function cachedPageResponse(body, ageMs = 0) {
  const headers = new Headers({ 'x-adoptame-cached-at': String(Date.now() - ageMs) });
  return new Response(body, { headers });
}

test('abre una ruta pública reciente guardada cuando no hay red', async () => {
  const { handleFetch } = createServiceWorker({ entries: [
    [routeListUrl, routeListResponse()],
    [routeCacheKey, cachedPageResponse('perfil de Blanquita')],
  ] });

  const response = await handleFetch(routeUrl);

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'perfil de Blanquita');
});

test('descarta una copia vencida y usa el shell guardado', async () => {
  const { cache, handleFetch } = createServiceWorker({ entries: [
    [routeListUrl, routeListResponse()],
    [routeCacheKey, cachedPageResponse('perfil antiguo', 8 * 24 * 60 * 60 * 1000)],
    [shellUrl, new Response('app shell')],
  ] });

  const response = await handleFetch(routeUrl);

  assert.equal(await response.text(), 'app shell');
  assert.equal(await cache.match(routeCacheKey), null);
});

test('usa la página offline independiente si no hay ruta ni shell guardados', async () => {
  const { handleFetch } = createServiceWorker({ entries: [
    [routeListUrl, routeListResponse()],
    [offlineUrl, new Response('página offline')],
  ] });

  const response = await handleFetch('https://adoptame.example/animalitos/__ruta-no-cacheada__/');

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'página offline');
});

test('no reutiliza rutas públicas en URLs con parámetros ni guarda rutas administrativas', async () => {
  const networkResponse = new Response('no cachear', { status: 200 });
  const { cache, handleFetch } = createServiceWorker({
    entries: [[routeListUrl, routeListResponse()], [routeCacheKey, cachedPageResponse('perfil')]],
    fetchImpl: async () => networkResponse.clone(),
  });

  const withQuery = await handleFetch(`${routeUrl}?app=1`);
  const admin = await handleFetch('https://adoptame.example/animalitos/admin/login/');

  assert.equal(await withQuery.text(), 'no cachear');
  assert.equal(await admin.text(), 'no cachear');
  assert.equal(await cache.match(`${routeUrl}?app=1`), null);
  assert.equal(await cache.match('https://adoptame.example/animalitos/admin/login/'), null);
});
