'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '../../lib/cartContext';
import { useTax } from '../../lib/taxContext';
import { useAuth } from '../../lib/authContext';
import { useLanguage } from '../../lib/languageContext';
import { useCurrency } from '../../lib/currencyContext';
import { toast } from 'react-hot-toast';
import { Address, CartItem } from '../../lib/types';
import AddressModal from '../../components/AddressModal';
import AddressCard from '../../components/AddressCard';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import AdyenDropin from '../../components/AdyenDropin';
import PaymeePayment from '../../components/PaymeePayment';
import KonnectPayment from '../../components/KonnectPayment';
import Header from '../../components/Header';

// Payment status components
const PaymentSuccess = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center">
      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-green-600 mb-4">{t('payment_successful')}</h1>
      <p className="text-gray-700 mb-6">
        {t('payment_success_message')}
      </p>
      
      <div className="space-y-3">
        <Link 
          href="/"
          className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl font-semibold shadow hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition"
        >
          {t('return_to_home')}
        </Link>
        <Link 
          href="/profile"
          className="block w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
        >
          {t('view_order_status')}
        </Link>
      </div>
    </div>
  );
};

const PaymentError = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center">
      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-red-600 mb-4">{t('payment_error')}</h1>
      <p className="text-gray-700 mb-6">
        {t('payment_error_message')}
      </p>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p className="text-red-700 text-sm">
          {t('payment_error_help')}
        </p>
      </div>
      
      <div className="space-y-3">
        <button 
          onClick={onRetry}
          className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl font-semibold shadow hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition"
        >
          {t('try_again')}
        </button>
        <Link 
          href="/"
          className="block w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
        >
          {t('return_to_home')}
        </Link>
      </div>
    </div>
  );
};

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, total, totalWithTax } = useCart();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const { defaultTax, calculateTax } = useTax();
  const { t } = useLanguage();
  const [showPayment, setShowPayment] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [clientKey, setClientKey] = useState<string>("");
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAddress, setUserAddress] = useState<Address | null>(null);
  const [user, setUser] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'error' | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'adyen' | 'paymee' | 'konnect' | null>(null);
  const [orderReady, setOrderReady] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'adyen' | 'paymee' | 'konnect' | null>(null);

  // Calculate tax using database tax rates from products
  const calculateTaxFromDatabase = useCallback(() => {
    let totalTax = 0;
    
    for (const item of cart) {
      const itemSubtotal = item.product.price * item.quantity;
      // Use database tax rate if available, fallback to default
      const itemTaxRate = (item.product as any).taxRate || defaultTax?.rate || 0;
      const itemTax = itemSubtotal * (itemTaxRate / 100);
      totalTax += itemTax;
    }
    
    // Debug logging to help identify price discrepancies

    
    // Verify consistency with cart context
    const difference = Math.abs((total + totalTax) - totalWithTax);
    if (difference > 0.01) {
      console.warn('⚠️ Price discrepancy detected:', {
        cartContextTotal: totalWithTax,
        calculatedTotal: total + totalTax,
        difference: difference.toFixed(2)
      });
    }
  }, [cart, total, totalWithTax, defaultTax]);

  useEffect(() => {
    calculateTaxFromDatabase();
  }, [calculateTaxFromDatabase]);

  useEffect(() => {
    // Check if user is logged in and fetch their address
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoggedIn(false);
          setUserAddress(null);
          return;
        }
        const response = await fetch('http://localhost:3001/api/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setUser(userData);
          setUserAddress(userData.address || null); // Use the full address object
        } else {
          setIsLoggedIn(false);
          setUserAddress(null);
        }
      } catch (error) {
        setIsLoggedIn(false);
        setUserAddress(null);
      }
    };
    checkAuth();
  }, []);

  const createPaymentSession = async () => {
    if (showPayment && shippingAddress) {
      setLoadingSession(true);
      setSessionError(null);
      try {
            // Use the cart total with tax from the cart context
            const amountInCents = Math.round(totalWithTax * 100);
        const requestPayload = {
          amount: amountInCents,
          currency: 'EUR',
          countryCode: 'TN',
          reference: 'order-' + Date.now(),
          returnUrl: typeof window !== 'undefined' ? window.location.origin + '/cart' : '',
          store: 'AURES_STORE',
          shippingAddress
        };
        const res = await fetch('http://localhost:3001/api/payments/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.details || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setSession(data.session);
        setClientKey(data.clientKey);
        toast.success(t('payment_session_created'));
      } catch (err: any) {
        setSessionError(t('failed_to_load_payment_session') + ': ' + err.message);
        toast.error(t('failed_to_create_payment_session'));
      } finally {
        setLoadingSession(false);
      }
    }
  };

  const handleAddressSelected = (address: Address, type: 'profile' | 'new') => {
    setShippingAddress(address);
    setShowAddressModal(false);
    
    if (type === 'new') {
      toast.success(t('new_address_added'));
    } else {
      toast.success(t('using_profile_address'));
    }
    
    // Proceed to payment
    handleProceedToPayment(address);
  };

  useEffect(() => {
    createPaymentSession();
  }, [showPayment, shippingAddress]);

  // Fetch active payment method when cart loads
  useEffect(() => {
    const fetchActivePaymentMethod = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/payment-methods/active');
        const data = await res.json();
        
        if (data && data.length > 0) {
          const activeMethod = data[0]; // Get the first (and only) active method
          
          if (['adyen','paymee','konnect'].includes(activeMethod.code)) {
            setActivePaymentMethod(activeMethod.code);
            setSelectedPaymentMethod(activeMethod.code); // auto-select
          } else {
            setActivePaymentMethod(null);
            setSelectedPaymentMethod(null);
          }
        } else {
          // No active payment method found
          setActivePaymentMethod(null);
          setSelectedPaymentMethod(null);
        }
      } catch (err) {
        console.error('Error fetching active payment method:', err);
        setActivePaymentMethod(null);
        setSelectedPaymentMethod(null);
      }
    };
    fetchActivePaymentMethod();
  }, []); // Run once when component mounts

  // Fetch active payment method when payment step is reached (for refresh)
  useEffect(() => {
    if (!showPayment) return;
    const fetchActivePaymentMethod = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/payment-methods/active');
        const data = await res.json();
        if (data && data.length > 0) {
          const activeMethod = data[0]; // Get the first (and only) active method
          if (['adyen','paymee','konnect'].includes(activeMethod.code)) {
            setActivePaymentMethod(activeMethod.code);
            setSelectedPaymentMethod(activeMethod.code); // auto-select
          }
        } else {
          // No active payment method found
          setActivePaymentMethod(null);
          setSelectedPaymentMethod(null);
        }
      } catch (err) {
        console.error('Error fetching active payment method:', err);
        setActivePaymentMethod(null);
        setSelectedPaymentMethod(null);
      }
    };
    fetchActivePaymentMethod();
  }, [showPayment]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  // Helper function to construct proper image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http:/') && !imagePath.startsWith('http://')) {
      return imagePath.replace('http:/', 'http://');
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `http://localhost:3001/uploads/${imagePath}`;
  };

  const handleConfirmAddress = async () => {
    if (!shippingAddress) return;
    
    // Create order and proceed to payment
    await createOrderAndProceedToPayment(shippingAddress);
  };

  const generateGuestCredentials = () => {
    const timestamp = Date.now();
    return {
      name: "Guest",
      email: `guest${timestamp}@example.com`,
      password: `guest${timestamp}`
    };
  };

  const createOrderAndProceedToPayment = async (address: Address) => {
    try {
      let userIdToUse = user?.id;
      if (!isLoggedIn) {
        const guest = generateGuestCredentials();
        const userRes = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: guest.name,
            email: guest.email,
            password: guest.password,
            address
          }),
        });
        let userData;
        try {
          userData = await userRes.json();
        } catch (e) {
          return false;
        }
        if (!userRes.ok) {
          return false;
        }
        userIdToUse = userData.user?.id;
      }
      const orderPayload = {
        userId: userIdToUse,
        items: cart.map((item: CartItem) => ({
          product: { id: item.product.id },
          quantity: item.quantity,
          price: item.product.price
        })),
        total,
        shippingAddress: address
      };
      const res = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        return false;
      }
      if (!res.ok) {
        return false;
      }
      toast.success(t('order_created_successfully'));
      return true;
    } catch (err) {
      return false;
    }
  };

  const createOrderAfterPayment = async () => {
    try {
      let userIdToUse = user?.id;
  

      if (!isLoggedIn) {
        const guest = generateGuestCredentials();
        const userRes = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: guest.name,
            email: guest.email,
            password: guest.password,
            address: shippingAddress
          }),
        });

        if (!userRes.ok) {
          toast.error(t('failed_to_create_guest_user'));
          return;
        }
        const userData = await userRes.json();
        userIdToUse = userData.user?.id;
      }

      const orderPayload = {
        userId: userIdToUse,
        items: cart.map((item) => ({
          product: {
            id: item.product.id,
            price: item.product.price // Ensure price is included
          },
          quantity: item.quantity
        })),
        total,
        shippingAddress,
        status: 'shipped' // Set status to shipped after payment
      };

      const res = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        toast.error(t('failed_to_create_order'));
        return;
      }

      toast.success(t('order_created_successfully'));
      clearCart();
    } catch (err) {
      toast.error(t('failed_to_create_order'));
    }
  };

  const handleProceedToPayment = async (address: Address) => {
    setOrderLoading(true);
    setOrderReady(false);
    await createOrderAndProceedToPayment(address);
    setOrderLoading(false);
    setOrderReady(true);
    setShowPayment(true);
  };

  // Helper to get best name/email
  const guest = React.useMemo(() => generateGuestCredentials(), []);
  const getBestEmail = () => (user?.email && user.email.trim()) ? user.email : guest.email;
  const getBestFirstName = () => (user?.first_name && user.first_name.trim())
    ? user.first_name
    : (user?.name && user.name.split(' ')[0]) || guest.name;
  const getBestLastName = () => (user?.last_name && user.last_name.trim())
    ? user.last_name
    : (user?.name && user.name.split(' ').slice(1).join(' ')) || 'User';
// Stepper component with improved design and cleaner code
const Stepper = ({ step }: { step: number }) => {
  const steps = [
    { number: 1, label: t('address') },
    { number: 2, label: t('payment_method') },
    { number: 3, label: t('pay') }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Steps indicators */}
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10"></div>
        {/* Active progress line */}
        <div 
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 -z-10 transition-all duration-500 ease-out"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((stepItem, index) => (
          <div key={stepItem.number} className="flex flex-col items-center relative">
            {/* Step circle */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
              transition-all duration-300 ease-out transform
              ${step >= stepItem.number 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-110 shadow-lg' 
                : 'bg-white text-gray-400 border-2 border-gray-200 hover:border-gray-300'
              }
              ${step === stepItem.number ? 'ring-4 ring-blue-100' : ''}
            `}>
              {step > stepItem.number ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                stepItem.number
              )}
            </div>
            
            {/* Step label */}
            <span className={`
              mt-3 text-sm font-medium transition-colors duration-300
              ${step === stepItem.number 
                ? 'text-blue-600' 
                : step > stepItem.number 
                  ? 'text-green-600' 
                  : 'text-gray-400'
              }
            `}>
              {stepItem.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Empty cart component with improved design
if (cart.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-lg mx-auto text-center">
          {/* Animated cart icon */}
          <div className="relative mb-8">
            <div className="text-8xl mb-4 animate-bounce">🛒</div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            {t('shopping_cart')}
          </h1>
          
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-300">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-slate-600 text-lg font-medium">{t('cart_empty')}</p>
            </div>
            
            {/* CTA Button */}
            <Link
              href="/"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      <div className="container mx-auto p-4 pt-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🛍️ {t('shopping_cart')}
            </h1>
            <button
              onClick={clearCart}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              🗑️ {t('clear_cart')}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item: CartItem) => {
                const imageUrl = getImageUrl(item.product.image);
                return (
                  <div
                    key={item.product.id}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-xl shadow-md"
                            onError={(e) => {
                              console.error('Image failed to load:', imageUrl);
                              e.currentTarget.src = '/placeholder-image.jpg';
                            }}
                          />
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {item.quantity}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 mb-2">{item.product.name}</h2>
                          <p className="text-gray-600 font-medium">
                            💰 {convertPrice(item.product.price).toFixed(2)} {getCurrencySymbol()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center bg-white/80 rounded-xl shadow-md border border-gray-200 overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 px-4 py-2 font-bold text-gray-700 transition-all duration-200 hover:scale-110"
                          >
                            −
                          </button>
                          <span className="px-6 py-2 font-bold text-gray-800 bg-white min-w-[60px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 px-4 py-2 font-bold text-gray-700 transition-all duration-200 hover:scale-110"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            {convertPrice(item.product.price * item.quantity).toFixed(2)} {getCurrencySymbol()}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700 font-medium transition-colors duration-200 hover:underline"
                          >
                            🗑️ {t('remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div 
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30 sticky top-8 mx-auto" 
                style={{ maxWidth: 580, minWidth: 400, width: '100%' }}
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 {t('order_summary')}</h3>
                
                {/* Address Section - Only show when showAddressSection is true */}
                {shippingAddress && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">📍 {t('shipping_address')}</h4>
                      <button
                        onClick={() => setShippingAddress(null)}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        {t('edit')}
                      </button>
                    </div>
                    {shippingAddress && shippingAddress.street && <AddressCard address={shippingAddress} />}
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('subtotal')}:</span>
                    <span className="font-semibold text-gray-800">{convertPrice(total).toFixed(2)} {getCurrencySymbol()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('shipping')}:</span>
                    <span className="font-semibold text-green-600">🚚 {t('free_shipping')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('tax')}:</span>
                    <span className="font-semibold text-gray-800">{convertPrice(totalWithTax - total).toFixed(2)} {getCurrencySymbol()}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-bold text-gray-800">{t('total')} (with tax):</span>
                    <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {convertPrice(totalWithTax).toFixed(2)} {getCurrencySymbol()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Show different buttons based on current state */}
                  {!showPayment && (
                    <button
                      onClick={() => {
                        if (!activePaymentMethod) {
                          toast.error('No payment method is currently active. Please contact the administrator.');
                          return;
                        }
                        setShowAddressModal(true);
                      }}
                      className={`w-full block px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg text-center mb-2 ${
                        activePaymentMethod 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                      disabled={!activePaymentMethod}
                    >
                      🛒 {t('proceed_to_checkout')}
                    </button>
                  )}
                  {!activePaymentMethod && (
                    <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ No payment method is currently active. Please contact the administrator.
                      </p>
                    </div>
                  )}

                  {showPayment}

                  {/* Payment Section */}
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showPayment ? 'max-h-[1200px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    {showPayment && (
                      <div className="mb-6">
                        <Stepper step={!selectedPaymentMethod ? 2 : 3} />
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-800">{t('payment_details')}</h3>
                          <button
                            onClick={() => setShowPayment(false)}
                            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="bg-white/80 backdrop-blur-lg shadow-2xl border border-white/40 w-full h-full min-h-[350px] min-w-[370px] rounded-2xl p-6 transition-all duration-500">
                          <div className="w-full h-full">
                            {/* Payment Method Selection */}
                            {!selectedPaymentMethod && activePaymentMethod && (
                              <PaymentMethodSelector
                                selectedMethod={selectedPaymentMethod}
                                onMethodSelected={setSelectedPaymentMethod}
                                allowedMethods={[activePaymentMethod]}
                              />
                            )}
                            {/* No Active Payment Method */}
                            {!activePaymentMethod && (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Method Available</h3>
                                <p className="text-gray-600 mb-4">
                                  Please contact the administrator to activate a payment method.
                                </p>
                                <button
                                  onClick={() => setShowPayment(false)}
                                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  Go Back
                                </button>
                              </div>
                            )}
                            {/* Adyen Payment */}
                            {selectedPaymentMethod === 'adyen' && session && clientKey && (
                              <div className="w-full animate-fade-in">
                                <AdyenDropin
                                  session={session}
                                  clientKey={clientKey}
                                  onSuccess={async () => {
                                    setPaymentStatus('success');
                                    await createOrderAfterPayment();
                                  }}
                                  onError={() => setPaymentStatus('error')}
                                />
                              </div>
                            )}
                            {/* Paymee Payment */}
                            {orderLoading && (
                              <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                                <span className="ml-4 text-lg font-semibold text-purple-700">{t('creating_order')}...</span>
                              </div>
                            )}
                            {orderReady && selectedPaymentMethod === 'paymee' && (
                              <div className="w-full animate-fade-in">
                                {(() => {
                                  const paymeeProps = {
                                    amount: totalWithTax > 0 ? totalWithTax : 1,
                                    email: getBestEmail(),
                                    firstName: getBestFirstName(),
                                    lastName: getBestLastName(),
                                    reference: `ORDER-${Date.now()}`,
                                    onSuccess: async () => {
                                      setPaymentStatus('success');
                                      await createOrderAfterPayment();
                                    },
                                    onError: () => setPaymentStatus('error'),
                                    onCancel: () => setSelectedPaymentMethod(null),
                                  };
                                  return <PaymeePayment {...paymeeProps} />;
                                })()}
                              </div>
                            )}
                            {/* Konnect Payment (stub) */}
                            {orderReady && selectedPaymentMethod === 'konnect' && (
                              <div className="w-full animate-fade-in">
                                <KonnectPayment
                                  amount={totalWithTax > 0 ? totalWithTax : 1}
                                  email={getBestEmail()}
                                  firstName={getBestFirstName()}
                                  lastName={getBestLastName()}
                                  reference={`ORDER-${Date.now()}`}
                                  onSuccess={async () => {
                                    setPaymentStatus('success');
                                    await createOrderAfterPayment();
                                  }}
                                  onError={() => setPaymentStatus('error')}
                                  onCancel={() => setSelectedPaymentMethod(null)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/"
                    className="block w-full text-center bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-4 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    🔙 {t('continue_shopping')}
                  </Link>
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">🎉 {t('special_offers')}:</p>
                    <ul className="space-y-1">
                      <li>• {t('free_shipping_all_orders')}</li>
                      <li>• {t('thirty_day_return_policy')}</li>
                      <li>• {t('secure_checkout_guaranteed')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelected={handleAddressSelected}
        userProfile={user}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
};

export default Cart;