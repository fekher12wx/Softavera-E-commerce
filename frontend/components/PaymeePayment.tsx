'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../lib/languageContext';
import { useRouter } from 'next/navigation';

interface PaymeePaymentProps {
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  reference?: string;
  onSuccess: () => void;
  onError: () => void;
  onCancel: () => void;
}

const PaymeePayment: React.FC<PaymeePaymentProps> = ({
  amount,
  email,
  firstName,
  lastName,
  reference,
  onSuccess,
  onError,
  onCancel
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 24; // 2 minutes if polling every 5s
  const pollTimeout = useRef<NodeJS.Timeout | null>(null);

  const createPaymeePayment = async () => {
    setLoading(true);
    setPending(false);
    setPollCount(0);
    // Defensive: ensure all required fields are present and non-empty
    if (!amount || !email?.trim() || !firstName?.trim() || !lastName?.trim()) {
      toast.error('Missing required payment information.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/payments/paymee/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          note: `Payment for Order ${reference || Date.now()}`,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          reference: reference || `ORDER-${Date.now()}`,
          returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/result/pending` : ''
        }),
      });

      const result = await response.json();

      console.log('🔍 Frontend received response:', result);
      console.log('🔍 Response success:', result.success);
      console.log('🔍 Response data:', result.data);

      if (result.success) {
        setPaymentToken(result.data.token);
        setPaymentUrl(result.data.payment_url);
        toast.success(t('payment_created_successfully'));
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Paymee payment creation error:', error);
      toast.error(error.message || t('failed_to_create_payment'));
      onError();
      // Navigate to error page on creation failure
      router.push('/result/error');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (token: string, currentPoll: number = 0) => {
    try {
      const response = await fetch(`http://localhost:3001/api/payments/paymee/status/${token}`);
      const result = await response.json();

      if (result.success) {
        if (result.data.payment_status) {
          toast.success(t('payment_successful'));
          setPending(false);
          onSuccess();
          // Redirect to success result page
          router.push('/result/success');
        } else {
          if (currentPoll < maxPolls) {
            setPending(true);
            setPollCount(currentPoll + 1);
            pollTimeout.current = setTimeout(() => {
              checkPaymentStatus(token, currentPoll + 1);
            }, 5000);
          } else {
            setPending(false);
            toast(t('payment_still_pending'), { icon: '⏳' });
            // Redirect to pending page after timeout
            router.push('/result/pending');
          }
        }
      } else {
        throw new Error(result.error || 'Failed to check payment status');
      }
    } catch (error: any) {
      setPending(false);
      toast.error(error.message || t('failed_to_check_payment_status'));
      onError();
      // Redirect to error page on check failure
      router.push('/result/error');
    }
  };

  const handlePaymentRedirect = () => {
    if (paymentUrl && paymentToken) {
      window.open(paymentUrl, '_blank');
      setPending(true);
      setPollCount(0);
      checkPaymentStatus(paymentToken, 0);
    }
  };

  const handleRetry = () => {
    if (paymentToken) {
      setPending(true);
      setPollCount(0);
      checkPaymentStatus(paymentToken, 0);
    }
  };

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollTimeout.current) clearTimeout(pollTimeout.current);
    };
  }, []);

  if (pending) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="mb-4 animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <h3 className="text-2xl font-bold text-blue-700 mb-2">{t('waiting_for_payment')}</h3>
          <p className="text-gray-600 mb-4">{t('please_complete_payment_in_new_tab')}</p>
          <p className="text-gray-500 text-sm mb-2">
            {t('polling_attempts')}: {pollCount} / {maxPolls}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
          >
            {t('retry_check_payment_status')}
          </button>
          <button
            onClick={() => {
              onCancel();
              router.push('/result/failed');
            }}
            className="w-full bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }

  if (paymentUrl) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
        <div className="text-center mb-6">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('paymee_payment')}</h3>
          <p className="text-gray-600 mb-4">{t('redirecting_to_paymee')}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handlePaymentRedirect}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
          >
            🔗 {t('proceed_to_paymee')}
          </button>
          
          <button
            onClick={() => {
              setPaymentUrl(null);
              setPaymentToken(null);
              onCancel();
              router.push('/result/failed');
            }}
            className="w-full bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
          >
            {t('cancel')}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>ℹ️ {t('payment_instructions')}:</strong>
          </p>
          <ul className="text-sm text-blue-600 mt-2 space-y-1">
            <li>• {t('click_proceed_to_complete_payment')}</li>
            <li>• {t('payment_page_will_open_new_tab')}</li>
            <li>• {t('return_here_after_payment')}</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
      <div className="text-center mb-6">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('paymee_payment')}</h3>
        <p className="text-gray-600 mb-4">{t('secure_payment_with_paymee')}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">{t('amount')}:</span>
            <span className="font-bold text-gray-800">{amount.toFixed(3)} TND</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">{t('customer')}:</span>
            <span className="font-semibold text-gray-800">{firstName} {lastName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('email')}:</span>
            <span className="font-semibold text-gray-800">{email}</span>
          </div>
        </div>

        <button
          onClick={createPaymeePayment}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              {t('creating_payment')}...
            </div>
          ) : (
            `💳 ${t('pay_with_paymee')}`
          )}
        </button>

        <button
          onClick={() => {
            onCancel();
            router.push('/result/failed');
          }}
          className="w-full bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
        >
          {t('cancel')}
        </button>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
        <p className="text-sm text-green-700">
          <strong>🔒 {t('secure_payment')}:</strong>
        </p>
        <ul className="text-sm text-green-600 mt-2 space-y-1">
          <li>• {t('paymee_secure_encryption')}</li>
          <li>• {t('no_card_details_stored')}</li>
          <li>• {t('instant_payment_confirmation')}</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymeePayment;
