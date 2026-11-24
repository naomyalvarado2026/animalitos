import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ANDROID_APK_DOWNLOAD_URL,
  ANDROID_APK_FILENAME,
  ANDROID_APP_FALLBACK_VERSION,
  ANDROID_APP_PACKAGE_ID,
  formatFileSizeMb,
  getAndroidAppFallbackInfo,
  isNativeAndroidApp,
  parseGithubApkRelease,
} from '../src/lib/androidApp.ts';
import {
  compareSemver,
  isAppLaunchContext,
  shouldShowStartupAuthGate,
} from '../src/lib/appSession.ts';
import { PUBLIC_DESTINATIONS, searchPublicContent } from '../src/lib/publicDiscovery.ts';

test('detecta el User-Agent nativo de la app Android de AdoptaME', () => {
  assert.equal(isNativeAndroidApp('Mozilla/5.0 (Linux; Android 14) AdoptaMEAndroid/1.1.0'), true);
  assert.equal(isNativeAndroidApp('Mozilla/5.0 (Linux; Android 14) Chrome/130.0.0.0 Mobile'), false);
  assert.equal(isNativeAndroidApp(''), false);
});

test('formatea el tamaño del APK en megabytes legibles', () => {
  assert.equal(formatFileSizeMb(2_904_555), '2.8 MB');
  assert.equal(formatFileSizeMb(0), null);
  assert.equal(formatFileSizeMb(null), null);
});

test('extrae datos válidos desde la respuesta de GitHub Releases y rechaza URLs externas', () => {
  const valid = parseGithubApkRelease({
    tag_name: 'android-v1.2.0',
    html_url: 'https://github.com/naomyalvarado2026/animalitos/releases/tag/android-v1.2.0',
    published_at: '2026-11-23T12:00:00Z',
    assets: [
      {
        name: ANDROID_APK_FILENAME,
        size: 3_145_728,
        browser_download_url:
          'https://github.com/naomyalvarado2026/animalitos/releases/download/android-v1.2.0/AdoptaME-android.apk',
      },
    ],
  });

  assert.equal(valid.isLiveRelease, true);
  assert.equal(valid.version, '1.2.0');
  assert.equal(valid.tagName, 'android-v1.2.0');
  assert.equal(valid.sizeLabel, '3.0 MB');
  assert.match(valid.downloadUrl, /^https:\/\/github\.com\/naomyalvarado2026\/animalitos\/releases\//);

  const untrusted = parseGithubApkRelease({
    tag_name: 'android-v9.9.9',
    html_url: 'https://evil.example/release',
    assets: [
      {
        name: ANDROID_APK_FILENAME,
        size: 1_000_000,
        browser_download_url: 'https://evil.example/AdoptaME-android.apk',
      },
    ],
  });

  assert.equal(untrusted.isLiveRelease, false);
  assert.equal(untrusted.downloadUrl, ANDROID_APK_DOWNLOAD_URL);
  assert.equal(untrusted.version, ANDROID_APP_FALLBACK_VERSION);

  assert.deepEqual(parseGithubApkRelease(null), getAndroidAppFallbackInfo());
});

test('detecta el contexto de app y controla la pantalla inicial de inicio de sesión', () => {
  assert.equal(isAppLaunchContext({ userAgent: 'AdoptaMEAndroid/1.1.0' }), true);
  assert.equal(isAppLaunchContext({ search: '?app=1' }), true);
  assert.equal(isAppLaunchContext({ standalone: true }), true);
  assert.equal(isAppLaunchContext({ userAgent: 'Chrome/130.0', search: '' }), false);

  assert.equal(
    shouldShowStartupAuthGate({
      isApp: true,
      isAuthenticated: false,
      isLoadingAuth: false,
      guestDismissed: false,
      pathname: '/',
    }),
    true,
  );
  assert.equal(
    shouldShowStartupAuthGate({
      isApp: true,
      isAuthenticated: false,
      isLoadingAuth: false,
      guestDismissed: true,
      pathname: '/',
    }),
    false,
  );
  assert.equal(
    shouldShowStartupAuthGate({
      isApp: true,
      isAuthenticated: true,
      isLoadingAuth: false,
      guestDismissed: false,
      pathname: '/',
    }),
    false,
  );
  assert.equal(
    shouldShowStartupAuthGate({
      isApp: true,
      isAuthenticated: false,
      isLoadingAuth: false,
      guestDismissed: false,
      pathname: '/admin/login',
    }),
    false,
  );
  assert.equal(
    shouldShowStartupAuthGate({
      isApp: true,
      isAuthenticated: false,
      isLoadingAuth: false,
      guestDismissed: false,
      pathname: '/app',
    }),
    false,
  );
});

test('compara versiones semver de lanzamientos Android correctamente', () => {
  assert.equal(compareSemver('android-v1.1.0', '1.0.0'), 1);
  assert.equal(compareSemver('v1.1.0', '1.1.0'), 0);
  assert.equal(compareSemver('1.0.9', '1.1.0'), -1);
  assert.equal(compareSemver('android-v2.0.0', '1.9.9'), 1);
});

test('la ruta /app, la auto-actualización y el acceso Admin están integrados', () => {
  const appTsx = readFileSync('src/App.tsx', 'utf8');
  const header = readFileSync('src/components/layout/PublicHeader.tsx', 'utf8');
  const footer = readFileSync('src/components/layout/PublicFooter.tsx', 'utf8');
  const mobileNav = readFileSync('src/components/layout/PublicMobileNav.tsx', 'utf8');
  const adminLayout = readFileSync('src/components/layout/AdminLayout.tsx', 'utf8');
  const layout = readFileSync('src/components/layout/PublicLayout.tsx', 'utf8');
  const staticRoutes = readFileSync('scripts/generate-static-routes.mjs', 'utf8');

  assert.match(appTsx, /path="\/app" element=\{<AppDownloadPage/);
  assert.match(appTsx, /<AppAutoUpdater \/>/);
  assert.match(appTsx, /<AppStartupAuthGate \/>/);
  assert.match(header, /href:\s*'\/app'/);
  assert.match(header, /to="\/admin"/);
  assert.match(header, /to="\/admin\/login"/);
  assert.match(footer, /href:\s*'\/app'/);
  assert.match(mobileNav, /href:\s*'\/app'/);
  assert.match(mobileNav, /Panel Administrativo/);
  assert.match(adminLayout, /useMobile\(1024\)/);
  assert.match(adminLayout, /Accesos rápidos administrativos/);
  assert.match(layout, /routePath === '\/app'/);
  assert.match(staticRoutes, /path:\s*'\/app'/);

  assert.ok(PUBLIC_DESTINATIONS.some((item) => item.href === '/app'));
  const results = searchPublicContent('apk');
  assert.ok(results.some((item) => item.href === '/app'));
});

test('las nuevas pantallas públicas respetan la paleta oficial del Manual de Marca', () => {
  const page = readFileSync('src/components/public/AppDownloadPage.tsx', 'utf8');
  const qr = readFileSync('src/components/public/AppDownloadQr.tsx', 'utf8');
  const gate = readFileSync('src/components/pwa/AppStartupAuthGate.tsx', 'utf8');
  assert.doesNotMatch(page, /#171717|#ede5da|#f0644a/i);
  assert.doesNotMatch(qr, /#171717|#ede5da|#f0644a/i);
  assert.doesNotMatch(gate, /#171717|#ede5da|#f0644a/i);
  assert.match(gate, /Continuar sin iniciar sesión/);
});

test('el proyecto Android nativo conserva identificador, seguridad, FileProvider y versión 1.1.0', () => {
  const gradle = readFileSync('android/app/build.gradle.kts', 'utf8');
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');

  assert.match(gradle, new RegExp(`applicationId\\s*=\\s*"${ANDROID_APP_PACKAGE_ID}"`));
  assert.match(gradle, /compileSdk\s*=\s*35/);
  assert.match(gradle, /minSdk\s*=\s*24/);
  assert.match(gradle, /targetSdk\s*=\s*35/);
  assert.match(gradle, /versionCode\s*=.*\?:\s*2/);
  assert.match(gradle, /versionName\s*=.*\?:\s*"1\.1\.0"/);
  assert.match(manifest, /android:usesCleartextTraffic="false"/);
  assert.match(manifest, /android:allowBackup="false"/);
  assert.match(manifest, /android:configChanges="[^"]*orientation[^"]*screenSize/);
  assert.match(manifest, /android\.permission\.REQUEST_INSTALL_PACKAGES/);
  assert.match(manifest, /androidx\.core\.content\.FileProvider/);
});
