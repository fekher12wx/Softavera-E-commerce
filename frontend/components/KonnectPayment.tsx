import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../lib/languageContext';

interface KonnectPaymentProps {
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  reference?: string;
  onSuccess: () => void;
  onError: () => void;
  onCancel: () => void;
}

const KonnectPayment: React.FC<KonnectPaymentProps> = ({
  amount,
  email,
  firstName,
  lastName,
  reference,
  onSuccess,
  onError,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 24;
  const pollTimeout = useRef<NodeJS.Timeout | null>(null);

  const createKonnectPayment = async () => {
    setLoading(true);
    setPending(false);
    setPollCount(0);
    if (!amount || !email?.trim() || !firstName?.trim() || !lastName?.trim()) {
      toast.error('Missing required payment information.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/api/payments/konnect/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          note: `Payment for Order ${reference || Date.now()}`,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          reference: reference || `ORDER-${Date.now()}`,
          returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/cart` : ''
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentToken(result.data.token);
        setPaymentUrl(result.data.payment_url);
        toast.success(t('payment_created_successfully'));
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error: any) {
      toast.error(error.message || t('failed_to_create_payment'));
      onError();
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (token: string, currentPoll: number = 0) => {
    try {
      const response = await fetch(`http://localhost:3001/api/payments/konnect/status/${token}`);
      const result = await response.json();
      if (result.success) {
        if (result.data.payment_status) {
          toast.success(t('payment_successful'));
          setPending(false);
          onSuccess();
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
          }
        }
      } else {
        throw new Error(result.error || 'Failed to check payment status');
      }
    } catch (error: any) {
      setPending(false);
      toast.error(error.message || t('failed_to_check_payment_status'));
      onError();
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

  React.useEffect(() => () => { if (pollTimeout.current) clearTimeout(pollTimeout.current); }, []);

  if (pending) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 text-center">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="mb-4 animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500"></div>
          <h3 className="text-2xl font-bold text-cyan-700 mb-2">{t('waiting_for_payment')}</h3>
          <p className="text-gray-600 mb-4">{t('please_complete_payment_in_new_tab')}</p>
          <p className="text-gray-500 text-sm mb-2">{t('polling_attempts')}: {pollCount} / {maxPolls}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={handleRetry} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300">
            {t('retry_check_payment_status')}
          </button>
          <button onClick={onCancel} className="w-full bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300">
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
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 text-cyan-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Konnect Payment</h3>
          <p className="text-gray-600 mb-4">Redirecting to Konnect...</p>
        </div>
        <div className="space-y-4">
          <button onClick={handlePaymentRedirect} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 rounded-xl font-bold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg">
            🔗 Proceed to Konnect
          </button>
          <button onClick={() => { setPaymentUrl(null); setPaymentToken(null); }} className="w-full bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300">
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
      <div className="text-center mb-6">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 text-cyan-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Konnect Payment</h3>
        <p className="text-gray-600 mb-4">Secure payment via Konnect gateway</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">{t('amount')}:</span>
            <span className="font-bold text-gray-800">{amount.toFixed(3)}</span>
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

        <button onClick={createKonnectPayment} disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 rounded-xl font-bold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              {t('creating_payment')}...
            </div>
          ) : (
            '💳 Pay with Konnect'
          )}
        </button>

        <button onClick={onCancel} className="w-full bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300">
          {t('cancel')}
        </button>
      </div>
    </div>
  );
};

export default KonnectPayment;
