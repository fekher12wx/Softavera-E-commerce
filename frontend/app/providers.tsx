'use client';

import { CartProvider } from '../lib/cartContext';
import { CurrencyProvider } from '../lib/currencyContext';
import { LanguageProvider } from '../lib/languageContext';  
import { AuthProvider } from '../lib/authContext';
import { TaxProvider } from '../lib/taxContext';
import { LogoProvider } from './contexts/LogoContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <CurrencyProvider>
            <TaxProvider>
              <LogoProvider>
                {children}
              </LogoProvider>
            </TaxProvider>
          </CurrencyProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}