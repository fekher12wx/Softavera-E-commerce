import React from 'react';
import { Users, Package, ShoppingCart, Plus, DollarSign, Percent, CreditCard, Settings, Coins, ChevronDown } from 'lucide-react';
import { TabType } from './adminTypes';

interface TabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  users?: any[];
  products?: any[];
  orders?: any[];
  onAddNew: () => void;
}

const TabBar = ({ 
  activeTab, 
  setActiveTab, 
  users = [], 
  products = [], 
  orders = [], 
  onAddNew 
}: TabBarProps) => {
  
  const tabs: TabType[] = ['users', 'products', 'orders', 'customize'];

  const getTabConfig = (tab: TabType) => {
    const configs = {
      users: { 
        label: 'Users', 
        icon: Users, 
        count: Array.isArray(users) ? users.length : 0, 
        color: 'from-blue-500 to-cyan-500',
        lightColor: 'from-blue-50 to-cyan-50',
        textColor: 'text-blue-600'
      },
      products: { 
        label: 'Products', 
        icon: Package, 
        count: Array.isArray(products) ? products.length : 0,
        color: 'from-green-500 to-emerald-500',
        lightColor: 'from-green-50 to-emerald-50',
        textColor: 'text-green-600'
      },
      orders: { 
        label: 'Orders', 
        icon: ShoppingCart, 
        count: Array.isArray(orders) ? orders.length : 0,
        color: 'from-orange-500 to-amber-500',
        lightColor: 'from-orange-50 to-amber-50',
        textColor: 'text-orange-600'
      },

      customize: { 
        label: 'Customize', 
        icon: Settings, 
        count: undefined,
        color: 'from-slate-500 to-gray-500',
        lightColor: 'from-slate-50 to-gray-50',
        textColor: 'text-slate-600'
      }
    };
    return configs[tab];
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Compact Tab Navigation */}
      <div className="flex bg-white/95 backdrop-blur-lg rounded-xl p-1 shadow-lg border border-slate-200/50">
        {tabs.map((tab) => {
          const config = getTabConfig(tab);
          const Icon = config.icon;
          const isActive = activeTab === tab;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? `bg-gradient-to-r ${config.color} text-white shadow-md`
                  : `text-slate-600 hover:bg-slate-50 hover:${config.textColor}`
              }`}
            >
              <div className={`p-1 rounded-md transition-all duration-200 ${
                isActive 
                  ? 'bg-white/20' 
                  : 'bg-slate-100/50 group-hover:bg-white/70'
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              
              <span className="text-sm font-semibold whitespace-nowrap">{config.label}</span>
              
              {config.count !== undefined && (
                <div className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-600 group-hover:bg-white/90'
                }`}>
                  {config.count}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Compact Add Button - Hidden for Customize */}
      {activeTab !== 'customize' && (
        <button
          onClick={onAddNew}
          className="group relative overflow-hidden px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="relative flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-md group-hover:rotate-90 transition-transform duration-200">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">Add New</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default TabBar;