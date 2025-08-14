import React, { useState } from 'react';
import { MapPin, User, Plus, X } from 'lucide-react';
import { getCountries } from '../lib/countries';
import { Address } from '../lib/types';
import { useLanguage } from '../lib/languageContext';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelected: (address: Address, type: 'profile' | 'new') => void;
  userProfile?: any;
  isLoggedIn: boolean;
}

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onAddressSelected,
  userProfile,
  isLoggedIn
}) => {
  const { t, language } = useLanguage();
  const countries = getCountries(language);
  const [selectedAddress, setSelectedAddress] = useState<'profile' | 'new' | null>(null);
  const [newAddress, setNewAddress] = useState<Address>({
    street: '',
    city: '',
    zipCode: '',
    country: ''
  });

  const handleContinue = () => {
    if (selectedAddress === 'profile' && userProfile) {
             const profileAddress: Address = {
         street: userProfile.address?.street || userProfile.street || '',
         city: userProfile.address?.city || userProfile.city || '',
         zipCode: userProfile.address?.zipCode || userProfile.zipCode || '',
         country: userProfile.address?.country || userProfile.country || ''
       };
      onAddressSelected(profileAddress, 'profile');
    } else if (selectedAddress === 'new') {
      onAddressSelected(newAddress, 'new');
    }
  };

  const isFormValid = () => {
    if (selectedAddress === 'new') {
      return newAddress.street && newAddress.city && newAddress.zipCode && newAddress.country;
    }
    return selectedAddress !== null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">{t('shipping_address')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          {isLoggedIn && userProfile && (userProfile.address || userProfile.street) && (
            <label className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${
              selectedAddress === 'profile' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddress === 'profile'}
                  onChange={() => setSelectedAddress('profile')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('use_profile_address')}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                                             {userProfile.address?.street || userProfile.street || t('no_address_on_file')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {userProfile.city}, {userProfile.zipCode} {userProfile.country}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          )}

          <label className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${
            selectedAddress === 'new' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-purple-300'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="address"
                checked={selectedAddress === 'new'}
                onChange={() => setSelectedAddress('new')}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isLoggedIn ? t('add_new_address') : t('enter_shipping_address')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isLoggedIn ? t('enter_different_shipping_address') : t('please_provide_shipping_address')}
                  </p>
                </div>
              </div>
            </div>
          </label>

          {selectedAddress === 'new' && (
            <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-2xl">
              <input
                type="text"
                placeholder={t('street_address')}
                value={newAddress.street}
                onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder={t('city')}
                value={newAddress.city}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t('zip_code')}
                  value={newAddress.zipCode}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                                 <select
                   value={newAddress.country}
                   onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                   className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                 >
                   <option value="">{t('select_country')}</option>
                   {countries.map((country) => (
                     <option key={country} value={country}>
                       {country}
                     </option>
                   ))}
                 </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleContinue}
            disabled={!isFormValid()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal; 