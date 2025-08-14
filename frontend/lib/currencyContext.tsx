'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Currency = 'USD' | 'EUR' | 'TND';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number) => number;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  // Fetch currency from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currencyRes = await fetch('http://localhost:3001/api/settings/currency');
        const currencyData = await currencyRes.json();
        setCurrency(currencyData.currency || 'USD');
      } catch (err) {
        // fallback to defaults
        setCurrency('USD');
      }
    };
    fetchSettings();
    // Only poll in admin pages, not in regular user pages
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
      const interval = setInterval(fetchSettings, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const convertPrice = (price: number): number => price; // No conversion, just display in selected currency

  const getCurrencySymbol = (): string => {
    if (currency === 'USD') return '$';
    if (currency === 'EUR') return '€';
    if (currency === 'TND') return 'DT';
    return currency;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      convertPrice,
      getCurrencySymbol,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 