import React, { useState } from 'react';
import { Eye, Edit, Trash2, CreditCard, CheckCircle, XCircle, Settings, Globe, Shield } from 'lucide-react';
import { PaymentMethod } from './adminTypes';
import { useLanguage } from '../../lib/languageContext';

interface PaymentMethodsTableProps {
  paymentMethods: PaymentMethod[];
  searchTerm: string;
  handleView: (paymentMethod: PaymentMethod) => void;
  handleEdit: (paymentMethod: PaymentMethod) => void;
  handleDelete: (id: string) => void;
  handleToggleStatus: (paymentMethod: PaymentMethod) => void;
}

const PaymentMethodsTable: React.FC<PaymentMethodsTableProps> = ({
  paymentMethods,
  searchTerm,
  handleView,
  handleEdit,
  handleDelete,
  handleToggleStatus,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('');

  // Safety check - ensure paymentMethods is always an array
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];

  // Filter payment methods based on search term
  const filteredPaymentMethods = safePaymentMethods.filter(paymentMethod =>
    paymentMethod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paymentMethod.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set default active tab if none selected
  React.useEffect(() => {
    if (filteredPaymentMethods.length > 0 && !activeTab) {
      setActiveTab(filteredPaymentMethods[0].code);
    }
  }, [filteredPaymentMethods, activeTab]);

  const getActivePaymentMethod = (): PaymentMethod | undefined => {
    return filteredPaymentMethods.find(pm => pm.code === activeTab);
  };

  const getTabIcon = (code: string) => {
    switch (code.toLowerCase()) {
      case 'adyen':
        return <Globe className="w-5 h-5" />;
      case 'paymee':
        return <CreditCard className="w-5 h-5" />;
      case 'konnect':
        return <Shield className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getTabColor = (code: string): string => {
    switch (code.toLowerCase()) {
      case 'adyen':
        return 'from-blue-500 to-indigo-600';
      case 'paymee':
        return 'from-green-500 to-emerald-600';
      case 'konnect':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const renderConfigurationCard = (paymentMethod: PaymentMethod) => {
    const config = paymentMethod.config || {};
    
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
              <p className="text-lg font-medium text-gray-900">{paymentMethod.name}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Code</label>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {paymentMethod.code}
              </span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
              <p className="text-gray-700">{paymentMethod.description || 'No description'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  paymentMethod.isActive
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {paymentMethod.isActive ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {paymentMethod.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Configuration
          </h3>
          
          {Object.keys(config).length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No configuration set</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-600 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {typeof value === 'object' ? (
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-gray-700 font-mono text-sm break-all">
                        {String(value)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Actions
          </h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleToggleStatus(paymentMethod)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                paymentMethod.isActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={paymentMethod.isActive ? 'Deactivate (will activate another method)' : 'Activate (will deactivate others)'}
            >
              {paymentMethod.isActive ? (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Activate</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleEdit(paymentMethod)}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Configuration</span>
            </button>
            <button
              onClick={() => handleView(paymentMethod)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </button>
            <button
              onClick={() => handleDelete(paymentMethod.id)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Payment Methods</h3>
              <p className="text-sm text-gray-600">{filteredPaymentMethods.length} total methods</p>
              <p className="text-xs text-blue-600 mt-1">💡 Only one payment method can be active at a time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 px-6 py-2 overflow-x-auto">
          {filteredPaymentMethods.map((paymentMethod) => (
            <button
              key={paymentMethod.code}
              onClick={() => setActiveTab(paymentMethod.code)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === paymentMethod.code
                  ? `bg-gradient-to-r ${getTabColor(paymentMethod.code)} text-white shadow-lg`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {getTabIcon(paymentMethod.code)}
              <span>{paymentMethod.name}</span>
              {paymentMethod.isActive ? (
                <span className="w-2 h-2 bg-green-400 rounded-full" title="Active"></span>
              ) : (
                <span className="w-2 h-2 bg-red-400 rounded-full" title="Inactive"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab && getActivePaymentMethod() ? (
          renderConfigurationCard(getActivePaymentMethod()!)
        ) : (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods</h3>
            <p className="text-gray-500">Add your first payment method to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodsTable;