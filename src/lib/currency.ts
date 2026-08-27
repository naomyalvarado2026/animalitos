/**
 * Currency detection and conversion utilities.
 *
 * Strategy:
 * 1. Detect user's country via the Intl API (no network call needed for locale).
 * 2. Map country → currency code.
 * 3. Fetch exchange rates from exchangerate-api.com (free tier, cached).
 * 4. Convert USD amounts to the user's local currency on display.
 */

// Maps ISO 3166-1 alpha-2 country codes to ISO 4217 currency codes.
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD',
  MX: 'MXN', CO: 'COP', AR: 'ARS', CL: 'CLP', PE: 'PEN',
  BR: 'BRL', UY: 'UYU', PY: 'PYG', BO: 'BOB', EC: 'USD',
  VE: 'USD', PA: 'USD', CR: 'CRC', GT: 'GTQ', HN: 'HNL',
  SV: 'USD', NI: 'NIO', DO: 'DOP', CU: 'CUP',
  ES: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', PT: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', CH: 'CHF', SE: 'SEK',
  NO: 'NOK', DK: 'DKK', JP: 'JPY', CN: 'CNY', KR: 'KRW',
  IN: 'INR', PH: 'PHP', SG: 'SGD', MY: 'MYR', TH: 'THB',
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', EG: 'EGP',
};

export type CurrencyInfo = {
  code: string;
  symbol: string;
  locale: string;
  rate: number; // rate relative to 1 USD
};

const CURRENCY_META: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'es-ES' },
  GBP: { symbol: '£', locale: 'en-GB' },
  MXN: { symbol: '$', locale: 'es-MX' },
  COP: { symbol: '$', locale: 'es-CO' },
  ARS: { symbol: '$', locale: 'es-AR' },
  CLP: { symbol: '$', locale: 'es-CL' },
  PEN: { symbol: 'S/', locale: 'es-PE' },
  BRL: { symbol: 'R$', locale: 'pt-BR' },
  CAD: { symbol: 'CA$', locale: 'en-CA' },
  JPY: { symbol: '¥', locale: 'ja-JP' },
  CHF: { symbol: 'CHF', locale: 'de-CH' },
  default: { symbol: '$', locale: 'en-US' },
};

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/** Detects the user's currency code based on browser locale and Intl API. */
export function detectUserCurrency(): string {
  try {
    const locale = navigator.language || 'en-US';
    const region = new Intl.Locale(locale).region ?? '';
    return COUNTRY_CURRENCY_MAP[region] ?? 'USD';
  } catch {
    return 'USD';
  }
}

/** Fetches USD-based exchange rates (cached). */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!res.ok) throw new Error('Exchange rate fetch failed');
    const data = await res.json();
    cachedRates = data.rates as Record<string, number>;
    cacheTimestamp = Date.now();
    return cachedRates;
  } catch {
    // Fallback: static approximate rates (updated manually when needed)
    return {
      USD: 1, EUR: 0.92, GBP: 0.79, MXN: 17.15, COP: 4050,
      ARS: 890, CLP: 920, PEN: 3.72, BRL: 4.97, CAD: 1.36,
      JPY: 149.5, CHF: 0.90, AUD: 1.53, NZD: 1.63,
    };
  }
}

/** Converts a USD amount to the target currency. */
export function convertFromUSD(amountUSD: number, rate: number): number {
  return amountUSD * rate;
}

/** Formats a converted amount for display. */
export function formatLocalCurrency(amount: number, currency: string): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.default;
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}

export function getCurrencyMeta(code: string) {
  return CURRENCY_META[code] ?? CURRENCY_META.default;
}
