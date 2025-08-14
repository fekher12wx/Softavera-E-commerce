'use client';

import Header from '../../../components/Header';
import Link from 'next/link';
import { useLanguage } from '../../../lib/languageContext';

export default function ErrorResultPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl text-center">
          {/* Error Icon */}
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
            <Link 
              href="/checkout"
              className="block w-full px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl font-semibold shadow hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition"
            >
              {t('try_again')}
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