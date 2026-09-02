/**
 * Utilidades monetarias de AdoptaME.
 * Todos los importes se almacenan y se muestran en dólares estadounidenses.
 */
export const APP_CURRENCY = 'USD' as const;
export const APP_CURRENCY_SYMBOL = '$';

export type CurrencyInfo = {
  code: typeof APP_CURRENCY;
  symbol: typeof APP_CURRENCY_SYMBOL;
  locale: 'en-US';
  rate: 1;
};

/** La moneda operativa siempre es USD, sin detección por navegador. */
export function detectUserCurrency(): typeof APP_CURRENCY { return APP_CURRENCY; }

/** Compatibilidad con llamadas antiguas; no consulta servicios externos. */
export async function fetchExchangeRates(): Promise<Record<string, number>> { return { USD: 1 }; }

/** Compatibilidad con la API anterior: USD no se convierte. */
export function convertFromUSD(amountUSD: number, _rate = 1): number {
  return Number.isFinite(amountUSD) ? amountUSD : 0;
}

/** Formatea siempre en USD para donaciones, tienda y merchandising. */
export function formatLocalCurrency(amount: number, _currency = APP_CURRENCY): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: APP_CURRENCY,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(safeAmount);
  return `${formatted} USD`;
}

export function getCurrencyMeta(_code = APP_CURRENCY): CurrencyInfo {
  return { code: APP_CURRENCY, symbol: APP_CURRENCY_SYMBOL, locale: 'en-US', rate: 1 };
}
