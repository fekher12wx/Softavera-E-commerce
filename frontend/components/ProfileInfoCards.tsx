'use client';

import React from 'react';
import { User } from '../lib/types';
import { useLanguage } from '../lib/languageContext';

interface ProfileInfoCardsProps {
  user: User;
  ordersCount: number;
  onShowOrders: () => void;
}

const ProfileInfoCards: React.FC<ProfileInfoCardsProps> = ({
  user,
  ordersCount,
  onShowOrders,
}) => {
  const { t } = useLanguage();
  
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Address Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-semibold">📍</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">{t('address')}</h3>
        </div>
        
        <div className="space-y-3">
          {(user.adresse || user.address) ? (
            <>
              <div>
                <p className="text-sm text-gray-500">{t('street')}</p>
                <p className="font-medium text-gray-800">
                  {user.adresse || user.address?.street || t('not_provided')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">{t('city')}</p>
                  <p className="font-medium text-gray-800">{user.ville || user.address?.city || t('not_provided')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('postal_code')}</p>
                  <p className="font-medium text-gray-800">{user.codePostal || user.address?.zipCode || t('not_provided')}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('country')}</p>
                <p className="font-medium text-gray-800">{user.pays || user.address?.country || t('not_provided')}</p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">{t('no_address_provided')}</p>
          )}
        </div>
      </div>

      {/* Stats Card */}
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
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-semibold">🛍️</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">{t('orders')}</h3>
        </div>
        
        <div className="text-center">
          <button
            onClick={onShowOrders}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl shadow hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 transition-all duration-300 hover:shadow-lg"
          >
            {t('view_my_orders')}
          </button>
          {ordersCount > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {ordersCount} {ordersCount === 1 ? t('order_total') : t('orders_total')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCards; 