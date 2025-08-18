'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Tax {
  id: string;
  rate: number; // Percentage rate (e.g., 20 for 20%)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TaxContextType {
  taxes: Tax[];
  activeTaxes: Tax[];
  defaultTax: Tax | null;
  loading: boolean;
  error: string | null;
  refreshTaxes: () => Promise<void>;
  retryFetch: () => void;
  getTaxById: (id: string) => Tax | null;
  calculateTax: (amount: number, taxId?: string) => number;
  calculateTotalWithTax: (amount: number, taxId?: string) => number;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const TaxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [activeTaxes, setActiveTaxes] = useState<Tax[]>([]);
  const [defaultTax, setDefaultTax] = useState<Tax | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      // First check if backend is accessible
      const healthCheck = await fetch('http://localhost:3001/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!healthCheck.ok) {
        throw new Error(`Backend health check failed: ${healthCheck.status} ${healthCheck.statusText}`);
      }
      
      // Get auth token for authenticated requests
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const [allTaxesRes, activeTaxesRes] = await Promise.all([
        fetch('http://localhost:3001/api/taxes', {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }),
        fetch('http://localhost:3001/api/taxes/active', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

    

      if (allTaxesRes.ok && activeTaxesRes.ok) {
        const [allTaxesData, activeTaxesData] = await Promise.all([
          allTaxesRes.json(),
          activeTaxesRes.json()
        ]);

    
        setTaxes(allTaxesData);
        setActiveTaxes(activeTaxesData);
        
        // Set default tax (first active tax or first tax)
        const firstActiveTax = activeTaxesData[0] || allTaxesData[0];
        setDefaultTax(firstActiveTax || null);
      } else if (activeTaxesRes.ok) {
        // If only active taxes endpoint works, use that
        const activeTaxesData = await activeTaxesRes.json();
        
       
        setTaxes(activeTaxesData);
        setActiveTaxes(activeTaxesData);
        setDefaultTax(activeTaxesData[0] || null);
        
        if (allTaxesRes.status === 401) {
          console.warn('🔐 All taxes endpoint requires authentication, using active taxes only');
        }
      } else {
        const allTaxesText = await allTaxesRes.text();
        const activeTaxesText = await activeTaxesRes.text();
        
        console.error('❌ Tax endpoints failed:', {
          allTaxes: { status: allTaxesRes.status, text: allTaxesText },
          activeTaxes: { status: activeTaxesRes.status, text: activeTaxesText }
        });
        
        if (allTaxesRes.status === 401) {
          throw new Error('Authentication required for tax management. Please log in as admin.');
        } else {
          throw new Error(`Tax endpoints failed: All taxes (${allTaxesRes.status}), Active taxes (${activeTaxesRes.status})`);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching taxes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch taxes');
      
             // Fallback to default tax structure
       const fallbackTax: Tax = {
         id: 'default',
         rate: 20,
         isActive: true,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString()
       };
      
      
      setTaxes([fallbackTax]);
      setActiveTaxes([fallbackTax]);
      setDefaultTax(fallbackTax);
    } finally {
      setLoading(false);
    }
  };

  const refreshTaxes = async () => {
    await fetchTaxes();
  };

  const getTaxById = (id: string): Tax | null => {
    return taxes.find(tax => tax.id === id) || null;
  };



  const calculateTax = (amount: number, taxId?: string): number => {
    let taxRate = 0;
    
    if (taxId) {
      const tax = getTaxById(taxId);
      if (tax && tax.isActive) {
        taxRate = tax.rate;
      }
    } else if (defaultTax) {
      taxRate = defaultTax.rate;
    }
    
    return amount * (taxRate / 100);
  };

  const calculateTotalWithTax = (amount: number, taxId?: string): number => {
    const taxAmount = calculateTax(amount, taxId);
    return amount + taxAmount;
  };

  useEffect(() => {
    fetchTaxes();
    
    // Poll for tax updates every 30 seconds in admin pages
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
      const interval = setInterval(fetchTaxes, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Add retry functionality
  const retryFetch = () => {
    fetchTaxes();
  };

  return (
    <TaxContext.Provider value={{
      taxes,
      activeTaxes,
      defaultTax,
      loading,
      error,
      refreshTaxes,
      retryFetch,
      getTaxById,
      calculateTax,
      calculateTotalWithTax,
    }}>
      {children}
    </TaxContext.Provider>
  );
};

export const useTax = (): TaxContextType => {
  const context = useContext(TaxContext);
  if (context === undefined) {
    throw new Error('useTax must be used within a TaxProvider');
  }
  return context;
};
