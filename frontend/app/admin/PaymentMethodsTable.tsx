import React, { useState } from 'react';
import { Eye, Edit, Trash2, CreditCard, CheckCircle, XCircle, Settings, Globe, Shield, Plus, Search } from 'lucide-react';
import { PaymentMethod } from './adminTypes';
import { useLanguage } from '../../lib/languageContext';

interface PaymentMethodsTableProps {
  paymentMethods: PaymentMethod[];
  searchTerm: string;
  handleView: (paymentMethod: PaymentMethod) => void;
  handleEdit: (paymentMethod: PaymentMethod) => void;
  handleDelete: (id: string) => void;
  handleToggleStatus: (paymentMethod: PaymentMethod) => void;
  onAddNew?: () => void;
  handleClearConfig?: (id: string) => void;
}

const PaymentMethodsTable: React.FC<PaymentMethodsTableProps> = ({
  paymentMethods,
  searchTerm,
  handleView,
  handleEdit,
  handleDelete,
  handleToggleStatus,
  onAddNew,
  handleClearConfig,
}) => {
  const { t } = useLanguage();
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  // Safety check - ensure paymentMethods is always an array
  const safePaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];

  // Filter payment methods based on search term
  const filteredPaymentMethods = safePaymentMethods.filter(paymentMethod =>
    paymentMethod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paymentMethod.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get the currently selected method with latest data
  const selectedMethod = React.useMemo(() => {
    if (!selectedMethodId || filteredPaymentMethods.length === 0) {
      return filteredPaymentMethods[0] || null;
    }
    return filteredPaymentMethods.find(m => m.id === selectedMethodId) || filteredPaymentMethods[0] || null;
  }, [selectedMethodId, filteredPaymentMethods]);

  // Set default selected method ID if none selected
  React.useEffect(() => {
    if (filteredPaymentMethods.length > 0 && !selectedMethodId) {
      setSelectedMethodId(filteredPaymentMethods[0].id);
    }
  }, [filteredPaymentMethods, selectedMethodId]);

  const toggleMethod = (methodId: string) => {
    setExpandedMethod(prev => (prev === methodId ? null : methodId));
  };

  const getIcon = (code: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Payment Methods</h1>
              <p className="text-purple-100 mt-1">Configure and manage payment gateways</p>
            </div>
            <button 
              onClick={onAddNew}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Method
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Methods List */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 sticky top-8">
              
             

              {/* Methods List */}
              <div className="divide-y divide-gray-100">
                {filteredPaymentMethods.map((method) => (
                  <div key={method.id} className="group">
                    <button
                                             onClick={() => {
                         toggleMethod(method.id);
                         setSelectedMethodId(method.id);
                       }}
                      className={`w-full flex items-center justify-between px-5 py-4 transition-all duration-300 ${
                        expandedMethod === method.id
                          ? 'bg-purple-50 border-l-4 border-purple-400 shadow-inner'
                          : selectedMethod?.id === method.id
                          ? 'bg-blue-50 border-l-4 border-blue-400'
                          : 'hover:bg-purple-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                          method.isActive
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getIcon(method.code)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.code.toUpperCase()}</p>
                          {method.isActive && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-1">
                              <CheckCircle className="w-2.5 h-2.5" />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 transform transition-transform duration-300 ${
                          expandedMethod === method.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Actions */}
                    <div
                      className={`overflow-hidden transition-all duration-500 ${
                        expandedMethod === method.id ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="bg-white/60 backdrop-blur-sm p-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <button
                            onClick={() => handleToggleStatus(method)}
                            className="w-full px-4 py-2 flex items-center gap-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            </div>
                            <span className="text-sm font-medium">
                              {method.isActive ? 'Deactivate' : 'Activate & Deactivate Others'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleEdit(method)}
                            className="w-full px-4 py-2 flex items-center gap-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-300 hover:bg-purple-50 transition-all"
                          >
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            </div>
                            <span className="text-sm font-medium">Edit Configuration</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Method Details */}
          <div className="col-span-12 lg:col-span-8">
            {selectedMethod && (
              <div className="space-y-6">
                
                {/* Method Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                        selectedMethod.isActive 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {React.cloneElement(getIcon(selectedMethod.code), { className: "w-8 h-8" })}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedMethod.name}</h2>
                        <p className="text-gray-600 mt-1">{selectedMethod.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            selectedMethod.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {selectedMethod.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {selectedMethod.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {selectedMethod.isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <CheckCircle className="w-3 h-3" />
                              Only Active Method
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                     
                       <button 
                         onClick={() => handleEdit(selectedMethod)}
                         className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                                               <button 
                          onClick={() => handleClearConfig ? handleClearConfig(selectedMethod.id) : handleDelete(selectedMethod.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Clear Configuration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   </div>
                 </div>

                 {/* Basic Information */}
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                       <p className="text-gray-900">{selectedMethod.name}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                       <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                         {selectedMethod.code}
                       </span>
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                       <p className="text-gray-900">{selectedMethod.description || 'No description'}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                         selectedMethod.isActive
                           ? 'bg-green-100 text-green-800'
                           : 'bg-red-100 text-red-800'
                       }`}>
                         {selectedMethod.isActive ? 'Active' : 'Inactive'}
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Configuration */}
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                   <div className="p-6 border-b border-gray-200">
                     <div className="flex items-center gap-2">
                       <Settings className="w-5 h-5 text-gray-500" />
                       <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
                     </div>
                   </div>
                   
                   <div className="p-6">
                     {Object.keys(selectedMethod.config || {}).length === 0 ? (
                       <div className="text-center py-8">
                         <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                         <p className="text-gray-500">No configuration set</p>
                       </div>
                     ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {Object.entries(selectedMethod.config || {}).map(([key, value]) => (
                           <div key={key} className="border border-gray-200 rounded-lg p-4">
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                             </label>
                             <div className="bg-gray-50 rounded p-3">
                               <code className="text-sm text-gray-800 break-all">{String(value)}</code>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Actions Panel */}
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                   <div className="flex flex-wrap gap-3">
                     <button 
                       onClick={() => handleToggleStatus(selectedMethod)}
                       className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                         selectedMethod.isActive
                           ? 'bg-red-100 text-red-700 hover:bg-red-200'
                           : 'bg-green-100 text-green-700 hover:bg-green-200'
                       }`}
                     >
                       {selectedMethod.isActive ? 'Deactivate' : 'Activate & Deactivate Others'}
                     </button>
                     
                                           <button 
                        onClick={() => handleEdit(selectedMethod)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 font-medium transition-colors"
                      >
                        Edit Configuration
                      </button>
                      
                      <button 
                        onClick={() => handleClearConfig ? handleClearConfig(selectedMethod.id) : handleDelete(selectedMethod.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
                        title="Clear Configuration"
                      >
                        Clear Configuration
                      </button>
                     
         
                     
                    
                   </div>
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 };

export default PaymentMethodsTable;