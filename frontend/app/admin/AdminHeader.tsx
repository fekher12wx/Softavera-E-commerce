import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useLanguage } from '../../lib/languageContext';

interface AdminHeaderProps {
  notifications: any[];
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  handleView: (order: any) => void;
  setNotifications: (fn: (prev: any[]) => any[]) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  notifications, 
  showNotifications, 
  setShowNotifications, 
  handleView, 
  setNotifications,
}) => {
  const { t } = useLanguage();
  
 
  
  return (
    <div className="fixed top-6 right-8 z-50">
      {/* Logo Display */}
      
      
      <button
        className="relative focus:outline-none"
        onClick={() => setShowNotifications((prev) => !prev)}
        aria-label={t('notifications')}
      >
        <Bell className="w-7 h-7 text-gray-700" />
        {notifications.some(n => !n.read) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>
      {showNotifications && (
        <NotificationDropdown
          notifications={notifications}
          setNotifications={() => {}}
          handleView={handleView}
          setShowNotifications={setShowNotifications}
        />
      )}
    </div>
  );
};

export default AdminHeader; 