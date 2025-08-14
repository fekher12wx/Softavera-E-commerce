'use client';

import React from 'react';
import { CURRENCY_SYMBOL } from '../lib/constants';
import { useLanguage } from '../lib/languageContext';

interface StatsCardProps {
  role: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ role }) => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-yellow-600 font-semibold">📊</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800">{t('statistics')}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('status')}</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {t('active')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('role')}</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium capitalize">
            {role}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard; 