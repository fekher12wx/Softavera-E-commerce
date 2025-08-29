'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface InvoiceSettings {
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyWebsite: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyPhone: string;
  paymentText: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fiscalInformation: string;
}

interface InvoiceSettingsContextType {
  settings: InvoiceSettings;
  pendingSettings: InvoiceSettings;
  updatePendingSettings: (newSettings: Partial<InvoiceSettings>) => void;
  updateSettings: (newSettings: Partial<InvoiceSettings>) => void;
  refreshSettings: () => Promise<void>;
  commitPendingSettings: () => void;
}

const defaultSettings: InvoiceSettings = {
  companyName: 'Softavera',
  companyAddress: '123 Business Street, City, Country',
  companyEmail: 'contact@softavera.com',
  companyWebsite: 'softavera.com',
  companyPhone: '+1 234 567 8900',
  paymentText: 'Payment to Softavera',
  invoicePrefix: 'INV',
  taxRate: 10,
  currency: 'USD',
  logoUrl: '',
  termsAndConditions: 'Standard terms and conditions apply.',
  footerText: 'Thank you for choosing Softavera!'
};

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType | undefined>(undefined);

export const useInvoiceSettings = () => {
  const context = useContext(InvoiceSettingsContext);
  if (context === undefined) {
    throw new Error('useInvoiceSettings must be used within an InvoiceSettingsProvider');
  }
  return context;
};

interface InvoiceSettingsProviderProps {
  children: ReactNode;
}

export const InvoiceSettingsProvider: React.FC<InvoiceSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [pendingSettings, setPendingSettings] = useState<InvoiceSettings>(defaultSettings);

  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/invoice');
      if (response.ok) {
        const data = await response.json();
        // Ensure all fields have default values to prevent uncontrolled input errors
        const loadedSettings = {
          ...defaultSettings,
          ...data.settings,
        };
        setSettings(loadedSettings);
        setPendingSettings(loadedSettings); // Initialize pending settings
      }
    } catch (error) {
      console.error('Failed to load invoice settings:', error);
    }
  };

  const updatePendingSettings = (newSettings: Partial<InvoiceSettings>) => {
    setPendingSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateSettings = (newSettings: Partial<InvoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const commitPendingSettings = () => {
    setSettings(pendingSettings);
    // Don't reset pending settings - keep them in sync
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Settings updated
  }, [settings]);

  const value: InvoiceSettingsContextType = {
    settings,
    pendingSettings,
    updatePendingSettings,
    updateSettings,
    refreshSettings,
    commitPendingSettings
  };

  return (
    <InvoiceSettingsContext.Provider value={value}>
      {children}
    </InvoiceSettingsContext.Provider>
  );
};

