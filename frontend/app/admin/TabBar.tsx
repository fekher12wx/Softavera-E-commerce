import React from 'react';
import { Users, Package, ShoppingCart, Plus, DollarSign, Percent, CreditCard, Settings } from 'lucide-react';
import { TabType, User, Product, Order, Tax, PaymentMethod } from './adminTypes';
import { useLanguage } from '../../lib/languageContext';

interface TabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  users: User[];
  products: Product[];
  orders: Order[];
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
  onAddNew: () => void;
}

const TabBar = ({ activeTab, setActiveTab, users, products, orders, taxes, paymentMethods, onAddNew }: TabBarProps) => {
  const { t } = useLanguage();
  
  const tabs: TabType[] = ['users', 'products', 'orders', 'taxes', 'paymentMethods'];

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'users': return t('users');
      case 'products': return t('products');
      case 'orders': return t('orders');
      case 'taxes': return t('taxes');
      case 'paymentMethods': return t('payment_methods') || 'Payment Methods';

      default: return tab;
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'users': return <Users className="w-5 h-5" />;
      case 'products': return <Package className="w-5 h-5" />;
      case 'orders': return <ShoppingCart className="w-5 h-5" />;
      case 'taxes': return <DollarSign className="w-5 h-5" />;
      case 'paymentMethods': return <CreditCard className="w-5 h-5" />;

      default: return <div className="w-5 h-5" />;
    }
  };

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'users': return users.length;
      case 'products': return products.length;
      case 'orders': return orders.length;
      case 'taxes': return taxes.length;
      case 'paymentMethods': return paymentMethods.length;

      default: return undefined;
    }
  };

  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const count = getTabCount(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {getTabIcon(tab)}
              <span>{getTabLabel(tab)}</span>
              {count !== undefined && (
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={onAddNew}
        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <Plus className="h-4 w-4" />
        <span>{t('add_new')}</span>
      </button>
    </div>
  );
};

export default TabBar; 