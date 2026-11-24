export const ANDROID_GITHUB_REPO = 'naomyalvarado2026/animalitos';
export const ANDROID_APK_FILENAME = 'AdoptaME-android.apk';
export const ANDROID_APP_PACKAGE_ID = 'org.adoptame.animalitos';
export const ANDROID_APP_MIN_VERSION = 'Android 7.0+';
export const ANDROID_APP_FALLBACK_VERSION = '1.1.0';
export const ANDROID_APK_DOWNLOAD_URL = `https://github.com/${ANDROID_GITHUB_REPO}/releases/latest/download/${ANDROID_APK_FILENAME}`;
export const ANDROID_RELEASES_URL = `https://github.com/${ANDROID_GITHUB_REPO}/releases`;
export const ANDROID_LATEST_RELEASE_API_URL = `https://api.github.com/repos/${ANDROID_GITHUB_REPO}/releases/latest`;
export const ANDROID_APP_CANONICAL_URL = 'https://naomyalvarado2026.github.io/animalitos/app/';
const ALLOWED_RELEASE_PREFIX = `https://github.com/${ANDROID_GITHUB_REPO}/releases/`;

export interface AndroidReleaseInfo {
  version: string;
  tagName: string;
  downloadUrl: string;
  releaseUrl: string;
  sizeLabel: string | null;
  publishedAt: string | null;
  isLiveRelease: boolean;
}

const DEFAULT_ANDROID_RELEASE_INFO: AndroidReleaseInfo = {
  version: ANDROID_APP_FALLBACK_VERSION,
  tagName: `android-v${ANDROID_APP_FALLBACK_VERSION}`,
  downloadUrl: ANDROID_APK_DOWNLOAD_URL,
  releaseUrl: ANDROID_RELEASES_URL,
  sizeLabel: null,
  publishedAt: null,
  isLiveRelease: false,
};

export function getAndroidAppFallbackInfo(): AndroidReleaseInfo {
  return { ...DEFAULT_ANDROID_RELEASE_INFO };
}

export function isNativeAndroidApp(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  return /AdoptaMEAndroid\//i.test(ua);
}

export function formatFileSizeMb(bytes?: number | null): string | null {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

function cleanVersionTag(tag: string): string {
  const cleaned = tag.trim().replace(/^android-v/i, '').replace(/^v/i, '');
  return cleaned || ANDROID_APP_FALLBACK_VERSION;
}

export function parseGithubApkRelease(payload: unknown): AndroidReleaseInfo {
  if (!payload || typeof payload !== 'object') {
    return getAndroidAppFallbackInfo();
  }

  const record = payload as Record<string, unknown>;
  const tagName = typeof record.tag_name === 'string' ? record.tag_name.trim() : '';
  const releaseUrl =
    typeof record.html_url === 'string' && record.html_url.startsWith(ALLOWED_RELEASE_PREFIX)
      ? record.html_url
      : ANDROID_RELEASES_URL;
  const publishedAt = typeof record.published_at === 'string' ? record.published_at : null;
  const assets = Array.isArray(record.assets) ? record.assets : [];

  const apkAssets = assets.filter((asset): asset is Record<string, unknown> => {
    if (!asset || typeof asset !== 'object') return false;
    const item = asset as Record<string, unknown>;
    const name = typeof item.name === 'string' ? item.name : '';
    const url = typeof item.browser_download_url === 'string' ? item.browser_download_url : '';
    return name.toLowerCase().endsWith('.apk') && url.startsWith(ALLOWED_RELEASE_PREFIX);
  });

  const preferredAsset =
    apkAssets.find((asset) => asset.name === ANDROID_APK_FILENAME) ?? apkAssets[0];

  if (!preferredAsset || typeof preferredAsset.browser_download_url !== 'string') {
    return getAndroidAppFallbackInfo();
  }

  return {
    version: tagName ? cleanVersionTag(tagName) : ANDROID_APP_FALLBACK_VERSION,
    tagName: tagName || DEFAULT_ANDROID_RELEASE_INFO.tagName,
    downloadUrl: preferredAsset.browser_download_url,
    releaseUrl,
    sizeLabel: formatFileSizeMb(typeof preferredAsset.size === 'number' ? preferredAsset.size : null),
    publishedAt,
    isLiveRelease: true,
  };
}
