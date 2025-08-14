import React from 'react';
import { useLanguage } from '../../lib/languageContext';

interface NotificationDropdownProps {
  notifications: any[];
  setNotifications: (fn: (prev: any[]) => any[]) => void;
  handleView: (order: any) => void;
  setShowNotifications: (show: boolean) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, setNotifications, handleView, setShowNotifications }) => {
  const { t } = useLanguage();
  
  return (
    <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
      <div className="p-4 border-b font-semibold text-gray-700">{t('notifications')}</div>
      {notifications.length === 0 ? (
        <div className="p-4 text-gray-500">{t('no_notifications')}</div>
      ) : (
        notifications.map((n, idx) => (
          <div
            key={n.id + idx}
            className={`px-4 py-3 border-b last:border-b-0 flex items-start gap-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}
            onClick={() => {
              console.log('=== Notification clicked ===');
              console.log('Notification:', n);
              console.log('Order data:', n.order);
              console.log('handleView function:', handleView);
              
              setNotifications((prev) => prev.map((notif, i) => i === idx ? { ...notif, read: true } : notif));
              setShowNotifications(false);
              if (n.order) {
                console.log('Calling handleView with order:', n.order);
                handleView(n.order);
              } else {
                console.log('No order data in notification');
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex-1">
              <div className="text-sm text-gray-800">{n.message}</div>
              <div className="text-xs text-gray-400 mt-1">{n.time}</div>
            </div>
            <span className="text-xs text-blue-500 ml-2">{t('order')}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationDropdown; 