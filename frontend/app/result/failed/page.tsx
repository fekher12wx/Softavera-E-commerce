'use client';

import Header from '../../../components/Header';
import Link from 'next/link';
import { useLanguage } from '../../../lib/languageContext';

export default function FailedResultPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-xl text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">{t('payment_error')}</h1>
          <p className="text-gray-700 mb-6">{t('payment_error_message')}</p>
          <Link href="/" className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white rounded-xl font-semibold shadow hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition">{t('back_to_home')}</Link>
        </div>
      </main>
    </div>
  );
} 