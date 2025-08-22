'use client';

import React from 'react';
import { Order } from '../lib/types';
import { useCurrency } from '../lib/currencyContext';
import { useLanguage } from '../lib/languageContext';

interface OrdersCardProps {
  orders: Order[];
  loading: boolean;
  getImageUrl: (path: string) => string;
  onCancelOrder?: (orderId: string) => void;
}

const OrdersCard: React.FC<OrdersCardProps> = ({
  orders,
  loading,
  getImageUrl,
  onCancelOrder,
}) => {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-purple-600 font-semibold">🛍️</span>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/4"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-semibold">🛍️</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">{t('my_orders')}</h3>
        </div>
        <p className="text-gray-600 text-center py-4">{t('no_orders_yet')}</p>
      </div>
    );
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return t('pending');
      case 'processing':
        return t('processing');
      case 'shipped':
        return t('shipped');
      case 'delivered':
        return t('delivered');
      case 'cancelled':
        return t('cancelled');
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600 font-semibold">🛍️</span>
        </div>
        <h3 className="text-lg font-bold text-gray-800">{t('my_orders')}</h3>
      </div>

      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} 
            className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-800">
                  {t('order')} #{order.id.slice(-6)}
                </h4>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-lg">
                  <img
                    src={getImageUrl(item.product.image)}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('quantity')}: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {convertPrice(item.product.price * item.quantity).toFixed(3)} {getCurrencySymbol()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-gray-600">{t('total')}</span>
              <span className="font-semibold text-gray-800">{convertPrice(order.total).toFixed(3)} {getCurrencySymbol()}</span>
              {onCancelOrder && order.status !== 'cancelled' && order.status !== 'delivered' && (
                <button
                  onClick={() => onCancelOrder(order.id)}
                  className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {t('cancel')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersCard; 