'use client';

import React from 'react';
import { useLanguage } from '../lib/languageContext';

interface PaymentMethodSelectorProps {
  onMethodSelected: (method: 'adyen' | 'paymee' | 'konnect') => void;
  selectedMethod: 'adyen' | 'paymee' | 'konnect' | null;
  allowedMethods?: Array<'adyen' | 'paymee' | 'konnect'>;
}

const paymentMethods = [
  {
    id: 'adyen' as const,
    name: 'Adyen',
    description: 'Pay securely with international cards and wallets.',
    icon: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"></div>
        <svg className="relative w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="2" y="6" width="20" height="12" rx="4" fill="none" strokeWidth="1.5" />
          <circle cx="7" cy="12" r="1.5" fill="currentColor" />
          <rect x="11" y="10" width="8" height="4" rx="1" fill="currentColor" />
          <path d="m2 10 2-2 2 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    gradient: 'from-purple-500 via-purple-600 to-pink-600',
    hoverGradient: 'from-purple-600 via-purple-700 to-pink-700',
    shadowColor: 'shadow-purple-500/30',
    features: ['Global Coverage', 'Multiple Currencies', 'Instant Processing']
  },
  {
    id: 'paymee' as const,
    name: 'Paymee',
    description: 'Pay with local methods and Tunisian banks.',
    icon: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full opacity-20 blur-xl"></div>
        <svg className="relative w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="2" y="6" width="20" height="12" rx="4" fill="none" strokeWidth="1.5" />
          <path d="M6 12h12M9 9l-3 3 3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="12" r="2" fill="none" strokeWidth="1.5" />
        </svg>
      </div>
    ),
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
    hoverGradient: 'from-emerald-600 via-green-600 to-teal-700',
    shadowColor: 'shadow-emerald-500/30',
    features: ['Local Banking', 'Tunisian Dinar', 'Trusted Partner']
  },
  {
    id: 'konnect' as const,
    name: 'Konnect',
    description: 'Pay via Konnect regional payment gateway.',
    icon: (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-20 blur-xl"></div>
        <svg className="relative w-12 h-12 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M8 12h8M12 8v8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" fill="none" strokeWidth="1.5" />
        </svg>
      </div>
    ),
    gradient: 'from-cyan-500 via-sky-500 to-blue-600',
    hoverGradient: 'from-cyan-600 via-sky-600 to-blue-700',
    shadowColor: 'shadow-cyan-500/30',
    features: ['Regional Gateway', 'Secure Checkout', 'Fast Payments']
  },
];

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onMethodSelected,
  selectedMethod,
  allowedMethods
}) => {
  const { t } = useLanguage();

  // Filter payment methods if allowedMethods is provided
  const filteredMethods = allowedMethods
    ? paymentMethods.filter((m) => allowedMethods.includes(m.id))
    : paymentMethods;

  // Auto-select if only one method is allowed
  React.useEffect(() => {
    if (filteredMethods.length === 1 && selectedMethod !== filteredMethods[0].id) {
      onMethodSelected(filteredMethods[0].id);
    }
    // eslint-disable-next-line
  }, [filteredMethods.length]);

  const formatTranslation = (key: string) => t(key).replace(/_/g, ' ');

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
          {filteredMethods.length === 1 ? 'Payment Method' : formatTranslation('choose_payment_method')}
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          {filteredMethods.length === 1 
            ? 'Your selected payment method is ready for checkout.' 
            : t('select_payment_method_description')
          }
        </p>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {filteredMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <div key={method.id} className="relative group">
              {/* Selection Glow Effect */}
              {isSelected && (
                <div className={`absolute -inset-1 bg-gradient-to-r ${method.gradient} rounded-3xl blur opacity-30 group-hover:opacity-40 animate-pulse`}></div>
              )}
              
              <button
                type="button"
                onClick={() => onMethodSelected(method.id)}
                className={`
                  relative w-full rounded-2xl border-2 p-8 transition-all duration-500 ease-out
                  focus:outline-none focus:ring-4 focus:ring-blue-500/20
                  transform hover:scale-[1.02] hover:-translate-y-1
                  ${isSelected 
                    ? `border-transparent bg-gradient-to-br ${method.gradient} text-white ${method.shadowColor} shadow-2xl` 
                    : 'border-gray-200 bg-white hover:border-gray-300 shadow-lg hover:shadow-xl'
                  }
                `}
                aria-pressed={isSelected}
              >
                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-in fade-in-50 zoom-in-50 duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {method.icon}
                  </div>

                  {/* Method Name */}
                  <h3 className={`text-2xl font-bold mb-3 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {formatTranslation(method.name.toLowerCase())}
                  </h3>

                  {/* Description */}
                  <p className={`text-base mb-6 leading-relaxed ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                    {t(method.id + '_description')}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {method.features.map((feature, index) => (
                      <span 
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                {!isSelected && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-center space-x-3 text-center">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-700 font-medium">
              {formatTranslation('securePayment')}
            </p>
            <p className="text-gray-600 text-sm mt-1">
              {formatTranslation('all_payments_secure')}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {selectedMethod && (
        <div className="mt-8 flex items-center justify-center animate-in slide-in-from-bottom-4 fade-in-50 duration-500">
          <div className="flex items-center space-x-2 text-green-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Payment method selected</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;