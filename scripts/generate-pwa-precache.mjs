import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const manifestPath = path.join(dist, '.vite', 'manifest.json');
const buildManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const manifestContent = await readFile(manifestPath);
const requiredUrls = new Set(['./manifest.webmanifest', './pwa-icon-192.png', './pwa-icon-512.png', './apple-touch-icon.png', './brand/logo-color.webp', './brand/logo-negative.webp', './offline.html', './public-routes.json']);
const optionalUrls = new Set();
const visitedEntries = new Set();

function addBuildEntry(key, followDynamicImports = true) {
  if (visitedEntries.has(key)) return;
  const entry = buildManifest[key];
  if (!entry) throw new Error(`Missing Vite manifest entry: ${key}`);
  visitedEntries.add(key);

  if (entry.file) requiredUrls.add(`./${entry.file}`);
  for (const file of [...(entry.css ?? []), ...(entry.assets ?? [])]) requiredUrls.add(`./${file}`);
  for (const importedKey of entry.imports ?? []) addBuildEntry(importedKey, followDynamicImports);
  if (followDynamicImports) {
    for (const importedKey of entry.dynamicImports ?? []) addBuildEntry(importedKey, true);
  }
}

// The installed app serves the public experience. Avoid downloading admin-only
// route bundles during installation; retain shared dependencies of public routes.
addBuildEntry('index.html', false);
const publicEntryKeys = Object.keys(buildManifest).filter((key) => key.startsWith('src/components/public/'));
for (const key of publicEntryKeys) addBuildEntry(key, true);

async function addLocalDogImages(directory, relative = '') {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, item.name);
    const childPath = path.join(directory, item.name);
    if (item.isDirectory()) await addLocalDogImages(childPath, childRelative);
    else if (/\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(item.name)) optionalUrls.add(`./images/refugio/${childRelative}`);
  }
}

await addLocalDogImages(path.join(root, 'public', 'images', 'refugio'));
const precache = {
  required: [...requiredUrls].sort(),
  optional: [...optionalUrls].sort(),
};
const precacheUrls = [...precache.required, ...precache.optional];
const cacheHash = createHash('sha256').update(manifestContent).update(JSON.stringify(precache));
for (const url of precacheUrls) {
  cacheHash.update(await readFile(path.join(dist, url.replace(/^\.\//, ''))));
}
const cacheVersion = cacheHash.digest('hex').slice(0, 12);
await writeFile(path.join(dist, 'pwa-precache.json'), `${JSON.stringify(precache, null, 2)}\n`, 'utf8');
const workerPath = path.join(root, 'public', 'sw.js');
const worker = await readFile(workerPath, 'utf8');
await writeFile(path.join(dist, 'sw.js'), worker.replaceAll('__PWA_CACHE_VERSION__', cacheVersion), 'utf8');
console.log(`Generated offline precache with ${precache.required.length} required resources and ${precache.optional.length} optional dog images.`);
