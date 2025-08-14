'use client';

import React from 'react';
import { User } from '../lib/types';
import { useLanguage } from '../lib/languageContext';

interface ProfileCardProps {
  user: User;
  onEditProfile: () => void;
  onChangePassword: () => void;
  formatDate: (date: string) => string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onEditProfile,
  onChangePassword,
  formatDate,
}) => {
  const { t } = useLanguage();
  
  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-purple-600">
              {(user.nom || user.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold">{user.nom || user.name}</h2>
            <p className="text-purple-100 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
      
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">@</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('email')}</p>
              <p className="font-semibold text-gray-800">{user.email}</p>
            </div>
          </div>
          
          {user.createdAt && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">📅</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('member_since')}</p>
                <p className="font-semibold text-gray-800">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onEditProfile}
            className="w-40 bg-[#7c3aed] text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-[#5b21b6] transition-all mx-auto"
          >
            ✏️ {t('edit_profile')}
          </button>
          <button
            onClick={onChangePassword}
            className="w-40 bg-[#7c3aed] text-white font-bold py-2 px-3 rounded-lg text-sm hover:bg-[#5b21b6] transition-all mx-auto"
          >
            🔒 {t('change_password')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 