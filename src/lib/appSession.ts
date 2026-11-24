import { isNativeAndroidApp } from './androidApp.ts';

export const APP_GUEST_SESSION_KEY = 'adoptame_app_guest_session';

export interface AppLaunchInput {
  userAgent?: string;
  search?: string;
  standalone?: boolean;
}

export interface StartupAuthGateInput {
  isApp: boolean;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  guestDismissed: boolean;
  pathname: string;
}

export function isAppLaunchContext({
  userAgent = '',
  search = '',
  standalone = false,
}: AppLaunchInput): boolean {
  if (standalone || isNativeAndroidApp(userAgent)) {
    return true;
  }
  if (!search) {
    return false;
  }
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(normalizedSearch).get('app') === '1';
}

export function shouldShowStartupAuthGate({
  isApp,
  isAuthenticated,
  isLoadingAuth,
  guestDismissed,
  pathname,
}: StartupAuthGateInput): boolean {
  if (!isApp || isLoadingAuth || isAuthenticated || guestDismissed) {
    return false;
  }
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (normalizedPath === '/app' || normalizedPath.startsWith('/admin')) {
    return false;
  }
  return true;
}

function parseSemverParts(rawVersion: string): [number, number, number] {
  const cleaned = rawVersion.trim().replace(/^android-v/i, '').replace(/^v/i, '').split('-')[0];
  const segments = cleaned.split('.').map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
  return [segments[0] ?? 0, segments[1] ?? 0, segments[2] ?? 0];
}

export function compareSemver(remoteTag: string, currentVersion: string): -1 | 0 | 1 {
  const remote = parseSemverParts(remoteTag);
  const current = parseSemverParts(currentVersion);
  for (let index = 0; index < 3; index += 1) {
    if (remote[index] > current[index]) return 1;
    if (remote[index] < current[index]) return -1;
  }
  return 0;
}
