'use client';

import Header from '../../../components/Header';
import Link from 'next/link';
import { useLanguage } from '../../../lib/languageContext';

export default function PendingResultPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl text-center">
          {/* Pending Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-500">
            <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-yellow-600 mb-4">{t('payment_pending')}</h1>
          <p className="text-gray-700 mb-6">
            {t('payment_pending_message')}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-700 text-sm">
              {t('payment_pending_warning')}
            </p>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/profile"
              className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl font-semibold shadow hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition"
            >
              {t('check_order_status')}
            </Link>
            <Link 
              href="/"
              className="block w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
            >
              {t('return_to_home')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 