// AdyenDropin.tsx
import React, { useEffect, useRef, useState } from 'react';
import AdyenCheckout from '@adyen/adyen-web';
import "@adyen/adyen-web/dist/adyen.css";
import { CURRENCY_SYMBOL } from '../lib/constants';
import { useLanguage } from '../lib/languageContext';

// Type workaround for AdyenCheckout constructor
type AdyenCheckoutConstructor = new (config: any) => any;

interface AdyenDropinProps {
  session: any;
  clientKey: string;
  paymentMethodsConfiguration?: any;
  onSuccess?: () => void;
  onError?: () => void;
}

export const PaymentContainer = () => {
  return (
      <div id="payment-page">
          <div className="container">
              {/* AdyenDropin must be used with the correct props */}
          </div>
      </div>
  );
}

const AdyenDropin: React.FC<AdyenDropinProps> = ({ 
  session, 
  clientKey, 
  paymentMethodsConfiguration,
  onSuccess,
  onError
}) => {
  const dropinRef = useRef<HTMLDivElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  // Map your app's language to Adyen's locale codes
  const adyenLocale = language === 'fr' ? 'fr_FR' : language === 'ar' ? 'ar_TN' : 'en_US';

  useEffect(() => {
    if (!session || !clientKey) {
      setLocalError(t('adyenPaymentError') + ': ' + t('missingAdyenSessionOrKey'));
      return;
    }

    let dropinInstance: any;

    function handleOnPaymentCompleted(result: any, component: any) {
      const { resultCode, merchantReference } = result;
      
      switch (resultCode) {
        case "Authorised":
          onSuccess?.();
          break;
        case "Pending":
        case "Received":
          onSuccess?.();
          break;
        case "Cancelled":
        case "Refused":
          onError?.();
          break;
        default:
          console.error('Unknown payment result:', result);
          onError?.();
          break;
      }
    }

    function handleOnPaymentFailed(result: any, component: any) {
      console.error('Payment failed:', result);
      onError?.();
    }

    const configuration = {
      session,
      clientKey,
      environment: 'test' as 'test',
      locale: adyenLocale,
      countryCode: 'TN',
      showPayButton: true,
      paymentMethodsConfiguration: paymentMethodsConfiguration || {
        card: {
          hasHolderName: true,
          holderNameRequired: true,
          styles: {
            base: {
              color: '#000',
              fontSize: '16px',
              fontSmoothing: 'antialiased',
              fontFamily: 'Helvetica',
            },
            error: {
              color: '#B00020',
            },
            placeholder: {
              color: '#999999',
            },
          },
        },
      },
      onPaymentCompleted: handleOnPaymentCompleted,
      onPaymentFailed: handleOnPaymentFailed,
      onError: (error: any, component: any) => {
        console.error("Payment error:", error);
        setLocalError(t('adyenPaymentError') + ': ' + (error.message || t('unknownError')));
        onError?.();
      }
    };

    const initCheckout = async () => {
      try {
        const checkout = await AdyenCheckout(configuration);
        if (dropinRef.current) {
          dropinInstance = checkout.create('dropin').mount(dropinRef.current);
        }
      } catch (error: any) {
        console.error("Adyen Drop-in initialization error:", error);
        setLocalError(t('adyenPaymentError') + ': ' + (error?.message || t('unknownError')));
        onError?.();
      }
    };

    initCheckout();

    return () => {
      if (dropinInstance && dropinInstance.unmount) {
        dropinInstance.unmount();
      }
    };
  }, [session, clientKey, paymentMethodsConfiguration, onSuccess, onError, adyenLocale, t]);

  if (localError) {
    return <div style={{ color: 'red' }}>{localError}</div>;
  }

  return <div 
    id='dropin'
    ref={dropinRef} style={{ minHeight: 400, color: 'red' }} />;
};

export default AdyenDropin;
