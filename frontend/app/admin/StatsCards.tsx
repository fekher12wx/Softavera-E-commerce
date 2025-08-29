import React from 'react';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { useCurrency } from '../../lib/currencyContext';
import { useLanguage } from '../../lib/languageContext';

const StatsCards = ({ users, products, orders, totalRevenue }: any) => {
  const { t } = useLanguage();
  const { getCurrencySymbol, convertProductPrice } = useCurrency();
  
  // Ensure arrays are always arrays to prevent runtime errors
  const safeUsers = Array.isArray(users) ? users : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeTotalRevenue = typeof totalRevenue === 'number' ? totalRevenue : 0;
  
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <div className="rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-400 border-blue-500">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-white/10 shadow-sm">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{safeUsers.length}</p>
            <p className="text-xs text-white/80 mt-1">{t('total_users')}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-400 border-emerald-500">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-white/10 shadow-sm">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{safeProducts.length}</p>
            <p className="text-xs text-white/80 mt-1">{t('total_products')}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-500 to-pink-500 border-purple-500">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-white/10 shadow-sm">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{safeOrders.length}</p>
            <p className="text-xs text-white/80 mt-1">{t('total_orders')}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-500 to-yellow-400 border-amber-500">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-xl bg-white/10 shadow-sm">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              {convertProductPrice(safeTotalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + getCurrencySymbol()}
            </p>
            <p className="text-xs text-white/80 mt-1">{t('total_revenue')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards; 