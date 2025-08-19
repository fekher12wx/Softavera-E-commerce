'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LogoContextType {
  currentLogo: string;
  updateLogo: (logoUrl: string) => void;
  loadLogo: () => Promise<void>;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};

interface LogoProviderProps {
  children: React.ReactNode;
}

export const LogoProvider: React.FC<LogoProviderProps> = ({ children }) => {
  const [currentLogo, setCurrentLogo] = useState<string>('');

  const updateLogo = (logoUrl: string) => {
    setCurrentLogo(logoUrl);
  };

  const loadLogo = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/invoice');
      if (response.ok) {
        const data = await response.json();
        if (data.settings.logoUrl) {
          setCurrentLogo(data.settings.logoUrl);
        }
      }
    } catch (error) {
      // Failed to load logo from settings
    }
  };

  useEffect(() => {
    loadLogo();
  }, []);

  const value: LogoContextType = {
    currentLogo,
    updateLogo,
    loadLogo
  };

  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  );
};
