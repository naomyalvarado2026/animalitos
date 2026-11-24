import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const androidAssetsDir = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'www');

const EXCLUDED_ROOT_ENTRIES = new Set(['.vite', 'sw.js', 'pwa-precache.json']);

function shouldExclude(relativePosixPath) {
  const topSegment = relativePosixPath.split('/')[0];
  if (EXCLUDED_ROOT_ENTRIES.has(topSegment)) return true;
  if (relativePosixPath.toLowerCase().endsWith('.mp4')) return true;
  return false;
}

async function copyRecursive(sourceDir, targetDir, relativeBase = '') {
  let fileCount = 0;
  let totalBytes = 0;
  const entries = await readdir(sourceDir, { withFileTypes: true });
  await mkdir(targetDir, { recursive: true });

  for (const entry of entries) {
    const relPosix = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;
    if (shouldExclude(relPosix)) continue;

    const srcPath = path.join(sourceDir, entry.name);
    const dstPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      const childStats = await copyRecursive(srcPath, dstPath, relPosix);
      fileCount += childStats.fileCount;
      totalBytes += childStats.totalBytes;
    } else if (entry.isFile()) {
      await copyFile(srcPath, dstPath);
      const info = await stat(srcPath);
      fileCount += 1;
      totalBytes += info.size;
    }
  }

  return { fileCount, totalBytes };
}

const distIndexPath = path.join(distDir, 'index.html');
try {
  await readFile(distIndexPath, 'utf8');
} catch {
  throw new Error('Missing dist/index.html. Run "npm run build" before syncing Android offline assets.');
}

await rm(androidAssetsDir, { recursive: true, force: true });
const { fileCount, totalBytes } = await copyRecursive(distDir, androidAssetsDir);

const metadata = {
  generatedAt: new Date().toISOString(),
  fileCount,
  totalBytes,
  totalMegabytes: Number((totalBytes / (1024 * 1024)).toFixed(2)),
};

await writeFile(
  path.join(androidAssetsDir, 'offline-bundle-meta.json'),
  `${JSON.stringify(metadata, null, 2)}\n`,
  'utf8',
);

console.log(
  `Synced Android offline bundle: ${fileCount} files (${metadata.totalMegabytes} MB) -> android/app/src/main/assets/www/`,
);
