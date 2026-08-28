import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency using Intl.NumberFormat safely.
 * The base is USD; the locale adapts if a specific currency code is provided.
 */
export function formatCurrency(
  amountUSD?: number | null,
  currency: string = 'USD',
  locale?: string,
): string {
  const safeAmount = typeof amountUSD === 'number' && !isNaN(amountUSD) ? amountUSD : 0;
  const resolvedLocale = locale ?? getCurrencyLocale(currency);
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `$${safeAmount.toFixed(2)} ${currency}`;
  }
}

/** Returns a sensible locale string for a given currency code. */
function getCurrencyLocale(currency: string): string {
  const map: Record<string, string> = {
    USD: 'en-US',
    EUR: 'es-ES',
    MXN: 'es-MX',
    COP: 'es-CO',
    ARS: 'es-AR',
    CLP: 'es-CL',
    PEN: 'es-PE',
    BRL: 'pt-BR',
    GBP: 'en-GB',
    CAD: 'en-CA',
  };
  return map[currency] ?? 'en-US';
}

export function formatDate(dateString?: string | null, locale: string = 'es'): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export function formatDateShort(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

export function slugify(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
