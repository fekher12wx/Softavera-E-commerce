'use client';

import Header from '../../../components/Header';
import Link from 'next/link';
import { useLanguage } from '../../../lib/languageContext';

export default function SuccessResultPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      <Header />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-2xl text-center border border-green-100">
          {/* Success Icon with Animation */}
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white animate-bounce">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-green-600 mb-4">{t('payment_successful')}</h1>
          <p className="text-gray-700 mb-6 text-lg">
            {t('payment_success_message')}
          </p>
          
          {/* Additional Success Info */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-700 font-semibold">{t('order_confirmed')}</span>
            </div>
            <p className="text-green-600 text-sm">
              {t('order_confirmation_message')}
            </p>
          </div>
          
          <div className="space-y-4">
            <Link 
              href="/"
              className="block w-full px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              🏠 {t('return_to_home')}
            </Link>
            <Link 
              href="/profile"
              className="block w-full px-8 py-4 bg-white border-2 border-green-200 text-green-700 rounded-2xl font-bold text-lg hover:bg-green-50 hover:border-green-300 transition-all duration-300 transform hover:scale-105"
            >
              📋 {t('view_order_status')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 