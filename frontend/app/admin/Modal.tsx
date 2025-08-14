import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User, Product, Order, Tax, PaymentMethod, TabType, ModalType } from './adminTypes';
import { getCategories, CategoryType } from '../../lib/categories';
import { getCountries } from '../../lib/countries';
import { useCurrency } from '../../lib/currencyContext';
import { useLanguage } from '../../lib/languageContext';
import toast from 'react-hot-toast';

// FormField component defined outside Modal to prevent recreation
const FormField = React.memo(({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  options, 
  className = '',
  disabled,
  value,
  onChange,
  onTextareaChange,
  isViewMode,
  ...props 
}: any) => {
  // Determine if field should be disabled
  const isDisabled = disabled !== undefined ? disabled : isViewMode;
  
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-800 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={isDisabled}
          aria-label={label}
          title={label}
          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm hover:border-gray-300"
          {...props}
        >
          <option value="">{`Select ${label.toLowerCase()}`}</option>
          {options.map((opt: any) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={onTextareaChange || onChange}
          disabled={isDisabled}
          aria-label={label}
          title={label}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm hover:border-gray-300 resize-none"
          rows={3}
          {...props}
        />
      ) : (
        type === 'file' ? (
          <input
            id={name}
            type={type}
            name={name}
            onChange={onChange}
            disabled={isDisabled}
            aria-label={label}
            title={label}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm hover:border-gray-300"
            {...props}
          />
        ) : (
          <input
            id={name}
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            disabled={isDisabled}
            aria-label={label}
            title={label}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 focus:outline-none disabled:bg-gray-500 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm hover:border-gray-300"
            {...props}
          />
        )
      )}
    </div>
  );
});

interface ModalProps {
  modalType: ModalType;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedItem: User | Product | Order | Tax | PaymentMethod | null;
  handleSave: (formData: any) => Promise<void>;
  activeTab: TabType;
  users: User[];
  products: Product[];
  orders: Order[];
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
}

function Modal({
  modalType,
  showModal,
  setShowModal,
  selectedItem,
  handleSave,
  activeTab,
  users,
  products,
  orders,
  taxes,
  paymentMethods,
}: ModalProps) {
  const { getCurrencySymbol } = useCurrency();
  const { t, language } = useLanguage();
  const categories = useMemo(() => getCategories(language), [language]);
  const countries = useMemo(() => getCountries(language), [language]);
  
  // Always ensure formData.address is an object for users
  const getInitialFormData = useCallback((item: any) => {
    if (activeTab === 'users') {
      return {
        ...item,
        address: {
          street: item?.address?.street || '',
          city: item?.address?.city || '',
          zipCode: item?.address?.zipCode || '',
          country: item?.address?.country || '',
        },
      };
    } else if (activeTab === 'taxes') {
      // Initialize tax fields with proper defaults
      return {
        rate: item?.rate !== undefined ? item.rate : 0,
        isActive: item?.isActive !== undefined ? item.isActive : true,
        ...item
      };
    } else if (activeTab === 'paymentMethods') {
      // Initialize payment method fields with proper defaults
      return {
        name: item?.name || '',
        code: item?.code || '',
        description: item?.description || '',
        isActive: item?.isActive !== undefined ? item.isActive : true,
        config: item?.config || {
          apiKey: '',
          merchantId: '',
          environment: 'test'
        },
        ...item
      };
    }
    return item || {};
  }, [activeTab]);

  const initialFormData = useMemo(() => getInitialFormData(selectedItem), [selectedItem, getInitialFormData]);
  const [formData, setFormData] = useState<any>(initialFormData);
  const [subcategoryOptions, setSubcategoryOptions] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const isViewMode = useMemo(() => modalType === 'view', [modalType]);
  const isOrderInvoice = useMemo(() => activeTab === 'orders' && isViewMode, [activeTab, isViewMode]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showModal, setShowModal]);

  useEffect(() => {
    if (showModal) {
      setFormData(initialFormData);
    }
  }, [initialFormData, showModal]);

  useEffect(() => {
    if (formData.category) {
      const cat = categories.find((c: CategoryType) => c.name === formData.category);
      setSubcategoryOptions(cat ? cat.sub : []);
      if (!cat?.sub.includes(formData.subcategory)) {
        setFormData((prev: any) => ({ ...prev, subcategory: '' }));
      }
    } else {
      setSubcategoryOptions([]);
      setFormData((prev: any) => ({ ...prev, subcategory: '' }));
    }
  }, [formData.category, categories]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!e?.target) return;
    const { name, value, files } = e.target as HTMLInputElement;
    
    if (name === 'imageFile' && files?.[0]) {
      setFormData((prev: any) => ({ ...prev, imageFile: files[0] }));
    } else if (name.includes('.')) {
      const [parent, field] = name.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: { ...prev[parent], [field]: value },
      }));
    } else {
      setFormData((prev: any) => {
        const updated = {
          ...prev,
          [name]: ['price', 'stock', 'total', 'rate'].includes(name) ? parseFloat(value) || 0 : value,
        };
        return updated;
      });
    }
  }, []);

  const handleItemsChange = useCallback((index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any, i: number) =>
        i === index ? { ...item, [field]: field === 'quantity' ? parseInt(value) || 0 : value } : item
      ),
    }));
  }, []);

  const addOrderItem = useCallback(() => {
    setFormData((prev: any) => {
      const newProduct = products[0];
      const newItemTotal = newProduct ? (newProduct.price * 1) : 0;
      return {
        ...prev,
        items: [...(prev.items || []), { product: newProduct, quantity: 1 }],
        total: (prev.total || 0) + newItemTotal
      };
    });
  }, [products]);

  // Special handler for textarea to preserve cursor position
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    
    handleChange(e);
    
    // Restore cursor position after state update
    setTimeout(() => {
      textarea.setSelectionRange(cursorPosition, cursorPosition);
      textarea.focus();
    }, 0);
  }, [handleChange]);

  const SectionCard = useCallback(({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-violet-100">{title}</h3>
      {children}
    </div>
  ), []);

    const renderUserFields = useCallback(() => {
    // Helper function to get nested value from formData
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    };

    return (
      <div className="space-y-6">
        <SectionCard title="Account Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label={t('email')} 
              name="email" 
              type="email" 
              required 
              disabled={false}
              value={formData.email || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('role')} 
              name="role" 
              options={[{ value: 'USER', label: `👤 ${t('user')}` }, { value: 'ADMIN', label: `👑 ${t('admin')}` }]} 
              disabled={false}
              value={formData.role || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            {modalType === 'add' && (
              <FormField 
                label={t('password')} 
                name="password" 
                type="password" 
                required 
                className="md:col-span-2" 
                disabled={false}
                value={formData.password || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
              />
            )}
          </div>
        </SectionCard>

        <SectionCard title={t('address_details')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label={t('street_address')} 
              name="address.street" 
              disabled={false}
              value={getNestedValue(formData, 'address.street')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('city')} 
              name="address.city" 
              disabled={false}
              value={getNestedValue(formData, 'address.city')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('zip_code')} 
              name="address.zipCode" 
              disabled={false}
              value={getNestedValue(formData, 'address.zipCode')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('country')} 
              name="address.country" 
              options={countries} 
              disabled={false}
              value={getNestedValue(formData, 'address.country')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
          </div>
        </SectionCard>
      </div>
    );
  }, [t, isViewMode, countries, modalType, formData, handleChange, SectionCard]);

  const renderProductFields = useCallback(() => {
    // Helper function to get nested value from formData
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    };

    return (
      <div className="space-y-6">
        <SectionCard title={t('product_information')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label={t('price')} 
              name="price" 
              type="number" 
              min="0" 
              step="0.01" 
              required 
              disabled={false}
              value={formData.price || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('stock_quantity')} 
              name="stock" 
              type="number" 
              min="0" 
              required 
              disabled={false}
              value={formData.stock || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('product_name')} 
              name="name" 
              required 
              disabled={false}
              value={formData.name || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('category')} 
              name="category" 
              options={categories.map(cat => ({ value: cat.name, label: `${cat.icon} ${cat.name}` }))} 
              required 
              disabled={false}
              value={formData.category || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('subcategory')} 
              name="subcategory" 
              options={subcategoryOptions} 
              disabled={!formData.category}
              required 
              value={formData.subcategory || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('tax') || 'Tax'} 
              name="taxId" 
              options={taxes.filter(tax => tax.isActive).map(tax => ({ 
                value: tax.id, 
                label: `${tax.rate}%` 
              }))} 
              required={true}
              disabled={false}
              value={formData.taxId || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('description')} 
              name="description" 
              type="textarea" 
              className="md:col-span-2" 
              disabled={false}
              value={formData.description || ''}
              onChange={handleChange}
              onTextareaChange={handleTextareaChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('product_image')} 
              name="imageFile" 
              type="file" 
              accept="image/*" 
              className="md:col-span-2" 
              disabled={false}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
          </div>
        </SectionCard>
      </div>
    );
  }, [t, categories, subcategoryOptions, taxes, formData, isViewMode, handleChange, handleTextareaChange, SectionCard]);

  const renderTaxFields = useCallback(() => (
    <div className="space-y-6">
      <SectionCard title={t('tax_information') || 'Tax Information'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField 
            label={t('rate') || 'Rate (%)'} 
            name="rate" 
            type="number" 
            min="0" 
            max="100" 
            step="0.01" 
            required 
            disabled={isViewMode}
            value={formData.rate || ''}
            onChange={handleChange}
            isViewMode={isViewMode}
          />
          <div className="md:col-span-2">
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive !== false}
                onChange={(e) => {
                  setFormData((prev: any) => ({ ...prev, isActive: e.target.checked }));
                }}
                disabled={isViewMode}
                className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 focus:border-purple-500 transition-all duration-200 disabled:opacity-50"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {t('active') || 'Active'}
                </span>
                <span className="text-xs text-gray-500">
                  Active taxes will be available for use in orders
                </span>
              </div>
            </label>
          </div>
        </div>
      </SectionCard>
    </div>
  ), [t, formData.isActive, formData.rate, isViewMode, handleChange, SectionCard]);

  const renderPaymentMethodFields = useCallback(() => {
    const getProviderSpecificFields = () => {
      const providerCode = formData.code?.toLowerCase();
      
      switch (providerCode) {
        case 'adyen':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="API Key" 
                name="config.apiKey" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.apiKey || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="sk_test_... or pk_test_..."
                required
              />
              <FormField 
                label="Merchant Account" 
                name="config.merchantAccount" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.merchantAccount || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="YOUR_MERCHANT_ACCOUNT"
                required
              />
              <FormField 
                label="Environment" 
                name="config.environment" 
                options={[
                  { value: 'test', label: 'Test/Sandbox' },
                  { value: 'live', label: 'Production/Live' }
                ]}
                disabled={isViewMode}
                value={formData.config?.environment || 'test'}
                onChange={handleChange}
                isViewMode={isViewMode}
                required
              />

            </div>
          );

        case 'paymee':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="API Token" 
                name="config.apiToken" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.apiToken || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="your-api-token"
                required
              />
              <FormField 
                label="Vendor ID" 
                name="config.vendorId" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.vendorId || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="1234"
                required
              />
              <FormField 
                label="Base URL" 
                name="config.baseUrl" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.baseUrl || 'https://sandbox.paymee.tn/api/v2'}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="https://sandbox.paymee.tn/api/v2"
              />
              <FormField 
                label="Environment" 
                name="config.environment" 
                options={[
                  { value: 'sandbox', label: 'Sandbox/Test' },
                  { value: 'test', label: 'Test' },
                  { value: 'live', label: 'Production/Live' }
                ]}
                disabled={isViewMode}
                value={formData.config?.environment || 'sandbox'}
                onChange={handleChange}
                isViewMode={isViewMode}
                required
              />

            </div>
          );

        case 'konnect':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="API Key" 
                name="config.apiKey" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.apiKey || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="your-api-key"
                required
              />
              <FormField 
                label="Merchant ID" 
                name="config.merchantId" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.merchantId || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="your-merchant-id"
                required
              />
              <FormField 
                label="Base URL" 
                name="config.baseUrl" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.baseUrl || 'https://api.konnect.network'}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="https://api.konnect.network"
              />
              <FormField 
                label="Environment" 
                name="config.environment" 
                options={[
                  { value: 'test', label: 'Test/Sandbox' },
                  { value: 'live', label: 'Production/Live' }
                ]}
                disabled={isViewMode}
                value={formData.config?.environment || 'test'}
                onChange={handleChange}
                isViewMode={isViewMode}
                required
              />

            </div>
          );

        default:
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                label="API Key" 
                name="config.apiKey" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.apiKey || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="sk_test_... or pk_test_..."
              />
              <FormField 
                label="Merchant ID" 
                name="config.merchantId" 
                type="text"
                disabled={isViewMode}
                value={formData.config?.merchantId || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
                placeholder="merchant_123..."
              />
              <FormField 
                label="Environment" 
                name="config.environment" 
                options={[
                  { value: 'test', label: 'Test/Sandbox' },
                  { value: 'live', label: 'Production/Live' }
                ]}
                disabled={isViewMode}
                value={formData.config?.environment || 'test'}
                onChange={handleChange}
                isViewMode={isViewMode}
              />

            </div>
          );
      }
    };

    return (
      <div className="space-y-6">
        <SectionCard title={t('payment_method_information') || 'Payment Method Information'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label={t('name') || 'Name'} 
              name="name" 
              type="text"
              required 
              disabled={isViewMode}
              value={formData.name || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label={t('code') || 'Code'} 
              name="code" 
              type="text"
              required 
              disabled={isViewMode}
              value={formData.code || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
              placeholder="e.g., adyen, paymee, konnect"
            />
            <div className="md:col-span-2">
              <FormField 
                label={t('description') || 'Description'} 
                name="description" 
                type="textarea"
                disabled={isViewMode}
                value={formData.description || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => {
                    setFormData((prev: any) => ({ ...prev, isActive: e.target.checked }));
                  }}
                  disabled={isViewMode}
                  className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 focus:border-purple-500 transition-all duration-200 disabled:opacity-50"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    {t('active') || 'Active'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Active payment methods will be available for use
                  </span>
                </div>
              </label>
            </div>
          </div>
        </SectionCard>

        {/* Configuration Section */}
        <SectionCard title={t('configuration') || 'Configuration'}>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Configure your payment method settings. These will be stored securely in the database.
            </div>
            
            {/* Provider-specific Configuration Fields */}
            {getProviderSpecificFields()}

            {/* Test and Validate Buttons */}
            {!isViewMode && (
              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:3001/api/payment-methods/${selectedItem?.id}/validate`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({ config: formData.config })
                      });
                      
                      const result = await response.json();
                      
                      if (result.valid) {
                        toast.success('Configuration is valid!');
                      } else {
                        toast.error(`Validation failed: ${result.errors.join(', ')}`);
                      }
                    } catch (error) {
                      toast.error('Failed to validate configuration');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Validate Configuration
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:3001/api/payment-methods/${selectedItem?.id}/test`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                      });
                      
                      const result = await response.json();
                      
                      if (result.success) {
                        toast.success(result.message);
                      } else {
                        toast.error(result.message);
                      }
                    } catch (error) {
                      toast.error('Failed to test connection');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Test Connection
                </button>
              </div>
            )}

            {/* Custom Configuration */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Custom Configuration (JSON)
              </label>
              <textarea
                value={JSON.stringify(formData.config || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData((prev: any) => ({ 
                      ...prev, 
                      config: parsed 
                    }));
                  } catch (error) {
                    // Don't update if invalid JSON
                  }
                }}
                disabled={isViewMode}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-mono transition-all duration-300 focus:border-violet-500 focus:ring-violet-500/10 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed hover:border-gray-300"
                rows={6}
                placeholder='{
  "apiKey": "your-api-key",
  "merchantId": "your-merchant-id",
  "environment": "test"
}'
              />
              <p className="text-xs text-gray-500 mt-2">
                You can add any additional configuration fields as needed
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }, [t, formData.isActive, formData.name, formData.code, formData.description, formData.config, isViewMode, handleChange, SectionCard, selectedItem]);

    const renderOrderFields = useCallback(() => {
    // Helper function to get nested value from formData
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    };

    return (
      <div className="space-y-6">
        <SectionCard title="Order Details">
          <div className="space-y-6">
            {modalType === 'edit' && (
              <FormField 
                label="Order ID" 
                name="id" 
                disabled={true}
                value={formData.id || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Customer" 
                name="userId" 
                options={users.map(u => ({ value: u.id, label: u.name }))} 
                disabled={false}
                value={formData.userId || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
              />
              <FormField 
                label="Order Status" 
                name="status" 
                options={[
                  { value: 'pending', label: '⏳ Pending' },
                  { value: 'processing', label: '🔄 Processing' },
                  { value: 'shipped', label: '🚚 Shipped' },
                  { value: 'delivered', label: '✅ Delivered' },
                  { value: 'cancelled', label: '❌ Cancelled' }
                ]} 
                disabled={false}
                value={formData.status || ''}
                onChange={handleChange}
                isViewMode={isViewMode}
              />
            </div>
            <FormField 
              label="Total Amount" 
              name="total" 
              type="number" 
              min="0" 
              step="0.01" 
              disabled={false}
              value={formData.total || ''}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
          </div>
        </SectionCard>

        <SectionCard title="Shipping Address">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Street Address" 
              name="shippingAddress.street" 
              disabled={false}
              value={getNestedValue(formData, 'shippingAddress.street')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label="City" 
              name="shippingAddress.city" 
              disabled={false}
              value={getNestedValue(formData, 'shippingAddress.city')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label="Postal Code" 
              name="shippingAddress.zipCode" 
              disabled={false}
              value={getNestedValue(formData, 'shippingAddress.zipCode')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
            <FormField 
              label="Country" 
              name="shippingAddress.country" 
              options={countries} 
              disabled={false}
              value={getNestedValue(formData, 'shippingAddress.country')}
              onChange={handleChange}
              isViewMode={isViewMode}
            />
          </div>
        </SectionCard>
        
        <SectionCard title="Order Items">
          <div className="space-y-4">
            {!isViewMode && (
              <button
                onClick={addOrderItem}
                title="Add new order item"
                aria-label="Add new order item"
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 rounded-xl font-semibold hover:from-violet-100 hover:to-purple-100 transition-all duration-300 border-2 border-dashed border-violet-200 hover:border-violet-300"
              >
                + Add New Item
              </button>
            )}
            <div className="max-h-48 overflow-y-auto space-y-3">
              {formData.items?.map((item: any, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={item.product?.id || ''}
                      onChange={(e) => handleItemsChange(index, 'product', products.find(p => p.id === e.target.value))}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-violet-500 focus:outline-none"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                      type="number"
                      value={item.quantity || 1}
                      onChange={(e) => handleItemsChange(index, 'quantity', e.target.value)}
                      disabled={isViewMode}
                      min="1"
                      placeholder="Quantity"
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }, [modalType, users, countries, isViewMode, formData, addOrderItem, handleItemsChange, products, handleChange, SectionCard]);

  const StatusBadge = useCallback(({ status }: { status: string }) => {
    const statusStyles = {
      delivered: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-200',
      shipped: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-200',
      processing: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200',
      cancelled: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-200',
      pending: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-gray-200'
    };
    
    return (
      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </div>
    );
  }, []);

  const renderOrderInvoice = useCallback(() => {
    const user = users.find(u => u.id === formData.userId);
    
    return (
      <div className="bg-white">
        {/* Compact Invoice Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">INVOICE</h1>
              <p className="text-violet-200 font-medium">#{formData.id?.slice(-8).toUpperCase()}</p>
            </div>
            <div className="text-right space-y-2">
              <StatusBadge status={formData.status} />
              <div className="text-2xl font-bold text-white">{getCurrencySymbol()}{formData.total?.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Compact Billing Section */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
              <h3 className="text-sm font-bold text-violet-800 mb-2">FROM</h3>
              <div className="space-y-1">
                <div className="font-bold text-gray-900">E-Shop</div>
                <div className="text-sm text-gray-600">Tunis, Tunisia</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200 text-right">
              <h3 className="text-sm font-bold text-gray-800 mb-2">TO</h3>
              <div className="space-y-1">
                <div className="font-bold text-gray-900">{user?.name || 'Unknown'}</div>
                <div className="text-sm text-gray-600">{user?.email}</div>
                <div className="text-sm text-gray-600">{formData.shippingAddress?.city}</div>
              </div>
            </div>
          </div>

          {/* Compact Items Table */}
          <div className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-4 py-3">
              <h3 className="font-bold text-white">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-violet-50/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900">{item.product?.name || 'Unknown'}</td>
                      <td className="text-center py-4 px-4 text-gray-600">{item.quantity}</td>
                      <td className="text-right py-4 px-4 text-gray-600">{getCurrencySymbol()}{item.product?.price?.toFixed(2)}</td>
                      <td className="text-right py-4 px-4 font-bold text-gray-900">{getCurrencySymbol()}{(item.product?.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compact Total */}
          <div className="flex justify-end">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-xl p-6 shadow-xl">
              <div className="text-center">
                <div className="text-sm font-semibold opacity-90 mb-1">TOTAL AMOUNT</div>
                <div className="text-3xl font-bold">{getCurrencySymbol()}{formData.total?.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [users, formData, getCurrencySymbol, StatusBadge]);

  if (!showModal) return null;

  return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" style={{WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)'}}>
      <div 
        ref={modalRef}
        className={`w-full bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden transition-all duration-300 ${
          isOrderInvoice ? 'max-w-4xl max-h-[90vh]' : 'max-w-2xl max-h-[85vh]'
        }`}
      >
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">
                  {modalType === 'add' ? '➕' : modalType === 'edit' ? '✏️' : '👁️'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {modalType === 'add' ? 'Create New' : modalType === 'edit' ? 'Edit' : 'View Details'} 
                </h2>
                <p className="text-white text-sm font-semibold">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)} Management
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              title="Close modal"
              aria-label="Close modal"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:rotate-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className={`overflow-y-auto ${!isViewMode ? 'p-6' : ''}`} style={{maxHeight: isOrderInvoice ? 'calc(90vh - 180px)' : 'calc(85vh - 180px)'}}>
          {activeTab === 'users' && renderUserFields()}
          {activeTab === 'products' && renderProductFields()}
          {activeTab === 'taxes' && renderTaxFields()}
          {activeTab === 'paymentMethods' && renderPaymentMethodFields()}
          {activeTab === 'orders' && isViewMode && renderOrderInvoice()}
          {activeTab === 'orders' && !isViewMode && (
            <div className="p-6">
              {renderOrderFields()}
            </div>
          )}
        </div>
        
        {/* Professional Footer */}
        {!isViewMode && (
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-violet-50/30 border-t-2 border-gray-100">
            <div className="flex gap-4">
                             <button
                 onClick={() => { handleSave(formData); }}
                 title="Save changes"
                 aria-label="Save changes"
                 className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:from-purple-700 via-pink-700 to-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-200 transform hover:scale-[1.02]"
               >
                 💾 Save Changes
               </button>
               <button
                 onClick={() => setShowModal(false)}
                 title="Cancel changes"
                 aria-label="Cancel changes"
                 className="flex-1 bg-white text-purple-700 py-3 px-6 rounded-xl font-bold border-2 border-purple-300 hover:bg-purple-50 hover:border-pink-400 transition-all duration-300 transform hover:scale-[1.02]"
               >
                 Cancel
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(Modal);