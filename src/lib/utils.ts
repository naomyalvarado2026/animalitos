import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency using Intl.NumberFormat.
 * The base is USD; the locale adapts if a specific currency code is provided.
 */
export function formatCurrency(
  amountUSD: number,
  currency: string = 'USD',
  locale?: string,
): string {
  const resolvedLocale = locale ?? getCurrencyLocale(currency);
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUSD);
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

export function formatDate(dateString: string, locale: string = 'es'): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
