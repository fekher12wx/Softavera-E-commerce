'use client';

import React from 'react';
import { Address } from '../lib/types';
import { CURRENCY_SYMBOL } from '../lib/constants';
import { useLanguage } from '../lib/languageContext';

interface AddressCardProps {
  address?: Address;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  adresse,
  ville,
  codePostal,
  pays,
}) => {
  const { t } = useLanguage();
  const hasAddress = adresse || (address && address.street && address.street.trim() !== '');

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-semibold">📍</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800">{t('address')}</h3>
      </div>
      
      <div className="space-y-3">
        {hasAddress ? (
          <>
            <div>
              <p className="text-sm text-gray-500">{t('street_address')}</p>
              <p className="font-medium text-gray-800">
                {adresse || address?.street || t('not_specified')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">{t('city')}</p>
                <p className="font-medium text-gray-800">{ville || address?.city || t('not_specified')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('zip_code')}</p>
                <p className="font-medium text-gray-800">{codePostal || address?.zipCode || t('not_specified')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('country')}</p>
                <p className="font-medium text-gray-800">{pays || address?.country || t('not_specified')}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500 italic">{t('no_address_provided')}</p>
        )}
      </div>
    </div>
  );
};

export default AddressCard; 