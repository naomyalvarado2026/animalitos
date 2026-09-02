import { createContext, useContext, type ReactNode } from 'react';
import {
  convertFromUSD,
  formatLocalCurrency,
  APP_CURRENCY,
} from '@/lib/currency';

interface CurrencyContextValue {
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
  convertAmount: (amountUSD: number) => number;
  formatAmount: (amountUSD: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currencyCode = APP_CURRENCY;
  const setCurrencyCode = (_code: string) => undefined;
  const isLoading = false;

  function convertAmount(amountUSD: number): number {
    return convertFromUSD(amountUSD, 1);
  }

  function formatAmount(amountUSD: number): string {
    return formatLocalCurrency(convertAmount(amountUSD), APP_CURRENCY);
  }

  return (
    <CurrencyContext.Provider value={{
      currencyCode,
      setCurrencyCode,
      convertAmount,
      formatAmount,
      isLoading,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
