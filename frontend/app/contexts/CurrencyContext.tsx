'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [baseCurrency, setBaseCurrency] = useState<BaseCurrency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBaseCurrency = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/settings/currencies/base', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBaseCurrency(data.baseCurrency);
      } else if (response.status === 404) {
        // No base currency set yet
        setBaseCurrency(null);
      } else {
        throw new Error('Failed to fetch base currency');
      }
    } catch (err) {
      console.error('Error fetching base currency:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch base currency');
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

  const value: CurrencyContextType = {
    baseCurrency,
    setBaseCurrency,
    refreshBaseCurrency,
    loading,
    error,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
