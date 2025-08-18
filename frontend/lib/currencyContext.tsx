'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface BaseCurrency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  isActive: boolean;
  exchangeRate: number;
  isBase: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CurrencyContextType {
  baseCurrency: BaseCurrency | null;
  setBaseCurrency: (currency: BaseCurrency | null) => void;
  refreshBaseCurrency: () => Promise<void>;
  loading: boolean;
  error: string | null;
  convertPrice: (price: number, fromCurrency?: BaseCurrency) => number;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBaseCurrency = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      // Only try to fetch if we have a token
      if (!token) {
        setBaseCurrency(null);
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/settings/currencies/base', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBaseCurrency(data.baseCurrency);
        setError(null);
      } else if (response.status === 404) {
        // No base currency set yet
        setBaseCurrency(null);
        setError(null);
      } else if (response.status === 401) {
        // Unauthorized - token might be expired
        setBaseCurrency(null);
        setError('Authentication required');
      } else {
        console.error('Unexpected response:', response.status, response.statusText);
        setError(`Server error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching base currency:', err);
      setError(err instanceof Error ? err.message : 'Network error');
      setBaseCurrency(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshBaseCurrency = async () => {
    await fetchBaseCurrency();
  };

  useEffect(() => {
    fetchBaseCurrency();
  }, []);

  const convertPrice = (price: number, fromCurrency?: BaseCurrency): number => {
    if (!baseCurrency || !fromCurrency) return price;
    if (fromCurrency.id === baseCurrency.id) return price;
    
    // Convert to base currency
    const basePrice = price / fromCurrency.exchangeRate;
    return Math.round(basePrice * 100) / 100;
  };

  const getCurrencySymbol = (): string => {
    return baseCurrency?.symbol || '$';
  };

  return (
    <CurrencyContext.Provider value={{
      baseCurrency,
      setBaseCurrency,
      refreshBaseCurrency,
      loading,
      error,
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