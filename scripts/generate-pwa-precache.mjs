import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const manifestPath = path.join(dist, '.vite', 'manifest.json');
const buildManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const manifestContent = await readFile(manifestPath);
const urls = new Set(['./index.html', './manifest.webmanifest', './pwa-icon-192.png', './pwa-icon-512.png', './apple-touch-icon.png', './brand/logo-color.webp', './brand/logo-negative.webp']);

for (const entry of Object.values(buildManifest)) {
  if (entry.file) urls.add(`./${entry.file}`);
  for (const file of [...(entry.css ?? []), ...(entry.assets ?? [])]) urls.add(`./${file}`);
}

async function addLocalDogImages(directory, relative = '') {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, item.name);
    const childPath = path.join(directory, item.name);
    if (item.isDirectory()) await addLocalDogImages(childPath, childRelative);
    else if (/\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(item.name)) urls.add(`./images/refugio/${childRelative}`);
  }
}

await addLocalDogImages(path.join(root, 'public', 'images', 'refugio'));
const precacheUrls = [...urls].sort();
const cacheHash = createHash('sha256').update(manifestContent).update(precacheUrls.join('\n'));
for (const url of precacheUrls) {
  cacheHash.update(await readFile(path.join(dist, url.replace(/^\.\//, ''))));
}
const cacheVersion = cacheHash.digest('hex').slice(0, 12);
await writeFile(path.join(dist, 'pwa-precache.json'), `${JSON.stringify(precacheUrls, null, 2)}\n`, 'utf8');
const workerPath = path.join(root, 'public', 'sw.js');
const worker = await readFile(workerPath, 'utf8');
await writeFile(path.join(dist, 'sw.js'), worker.replaceAll('__PWA_CACHE_VERSION__', cacheVersion), 'utf8');
console.log(`Generated offline precache manifest with ${urls.size} app resources.`);
