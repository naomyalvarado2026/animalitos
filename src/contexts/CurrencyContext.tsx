import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  detectUserCurrency,
  fetchExchangeRates,
  convertFromUSD,
  formatLocalCurrency,
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
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detected = detectUserCurrency();
    setCurrencyCode(detected);

    fetchExchangeRates().then((r) => {
      setRates(r);
      setIsLoading(false);
    });
  }, []);

  function convertAmount(amountUSD: number): number {
    const rate = rates[currencyCode] ?? 1;
    return convertFromUSD(amountUSD, rate);
  }

  function formatAmount(amountUSD: number): string {
    const converted = convertAmount(amountUSD);
    return formatLocalCurrency(converted, currencyCode);
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
