import { supabase } from '@/lib/supabase';

const CONSENT_KEY = 'adoptame_analytics_consent_v1';
const EVENT_PREFIX = 'adoptame_analytics_event_v1';
export const ANALYTICS_CONSENT_EVENT = 'adoptame:analytics-consent-changed';

export type AnimalAnalyticsEvent = 'profile_view' | 'adoption_submit';

export function getAnalyticsConsent(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.sessionStorage.getItem(CONSENT_KEY);
    return value === 'accepted' ? true : value === 'rejected' ? false : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(accepted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'rejected');
  } catch {
    // If session storage is unavailable, keep analytics disabled for this visit.
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}

export function trackAnimalEvent(eventType: AnimalAnalyticsEvent, slug: string): void {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || getAnalyticsConsent() !== true) return;
  const key = `${EVENT_PREFIX}:${eventType}:${slug}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, 'sent');
  } catch {
    return;
  }

  void (async () => {
    try {
      const { error } = await supabase.from('site_analytics_events').insert({ event_type: eventType, animal_slug: slug });
      if (error) window.sessionStorage.removeItem(key);
    } catch {
    try { window.sessionStorage.removeItem(key); } catch { /* ignored */ }
    }
  })();
}
