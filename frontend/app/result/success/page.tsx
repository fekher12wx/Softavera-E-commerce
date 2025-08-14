'use client';

import Header from '../../../components/Header';
import Link from 'next/link';
import { useLanguage } from '../../../lib/languageContext';

export default function SuccessResultPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl text-center">
          {/* Success Icon */}
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
      </main>
    </div>
  );
} 