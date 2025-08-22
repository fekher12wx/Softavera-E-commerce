import React from 'react';
import { Percent, CreditCard, Coins, Settings } from 'lucide-react';
import { SettingsSubTab } from './adminTypes';

interface SettingsTabBarProps {
  activeSettingsSubTab: SettingsSubTab;
  setActiveSettingsSubTab: (subTab: SettingsSubTab) => void;
  taxes?: any[];
  paymentMethods?: any[];
  currencies?: any[];
}

const SettingsTabBar: React.FC<SettingsTabBarProps> = ({ 
  activeSettingsSubTab, 
  setActiveSettingsSubTab, 
  taxes = [], 
  paymentMethods = [], 
  currencies = [] 
}) => {
  
  const subTabs = [
    { 
      type: 'paymentMethods' as SettingsSubTab, 
      label: 'Payment Methods', 
      icon: CreditCard, 
      count: paymentMethods.length,
      color: 'indigo'
    },
    { 
      type: 'currencies' as SettingsSubTab, 
      label: 'Currencies', 
      icon: Coins, 
      count: currencies.length,
      color: 'emerald'
    },
    { 
      type: 'taxes' as SettingsSubTab, 
      label: 'Taxes', 
      icon: Percent, 
      count: taxes.length,
      color: 'amber'
    },
    { 
      type: 'invoiceSettings' as SettingsSubTab, 
      label: 'Settings', 
      icon: Settings,
      color: 'slate'
    }
  ];

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      
      {/* Professional Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
        <div className="flex gap-1">
          {subTabs.map((subTab) => {
            const Icon = subTab.icon;
            const isActive = activeSettingsSubTab === subTab.type;
            
            const getColorClasses = (color: string, active: boolean) => {
              const colorMap = {
                indigo: active 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700',
                emerald: active 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                  : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
                amber: active 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25' 
                  : 'text-amber-600 hover:bg-amber-50 hover:text-amber-700',
                slate: active 
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/25' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'
              };
              return colorMap[color] || colorMap.slate;
            };
            
            return (
              <button
                key={subTab.type}
                onClick={() => setActiveSettingsSubTab(subTab.type)}
                className={`flex items-center gap-3 px-5 py-3 rounded-lg font-medium transition-all duration-300 flex-1 justify-center group ${
                  getColorClasses(subTab.color, isActive)
                }`}
              >
                <div className={`p-1 rounded-md transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 backdrop-blur-sm' 
                    : 'group-hover:scale-110'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold">{subTab.label}</span>
                
                {/* Count Badge */}
                {subTab.count !== undefined && subTab.count > 0 && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-white/25 text-white backdrop-blur-sm'
                      : `bg-${subTab.color}-100 text-${subTab.color}-700 group-hover:scale-105`
                  }`}>
                    {subTab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsTabBar;