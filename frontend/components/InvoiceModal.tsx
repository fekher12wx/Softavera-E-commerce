import React, { useRef, useEffect, useState } from 'react';
import { Order, User } from '../lib/types';
import { useLanguage } from '../lib/languageContext';
import { useCurrency } from '../lib/currencyContext';
import { useTax } from '../lib/taxContext';

interface InvoiceSettings {
  companyName: string;
  companyTagline: string;
  companyEmail: string;
  companyWebsite: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyPhone: string;
  paymentText: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fiscalInformation: string;
}

interface InvoiceModalProps {
  order: Order;
  user: User;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, user, onClose }) => {
  const { t } = useLanguage();
  const { getCurrencySymbol, convertPrice } = useCurrency();
  const { getTaxById, defaultTax } = useTax();
  const modalRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    companyName: 'E-Shop',
    companyTagline: 'Your Trusted Online Store',
    companyEmail: 'contact@e-shop.com',
    companyWebsite: 'e-shop.com',
    companyAddress: '123 Business Street',
    companyCity: 'Tunis',
    companyCountry: 'Tunisia',
    companyPhone: '+216 71 234 567',
    paymentText: 'Payment to E-Shop',
    logoUrl: '',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#3B82F6',
    fiscalInformation: ''
  });

  useEffect(() => {
    loadInvoiceSettings();
  }, []);

  const loadInvoiceSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/settings/invoice');
      if (response.ok) {
        const data = await response.json();
        setInvoiceSettings(data.settings);
      }
    } catch (error) {
      // Use default settings if API fails
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handlePrintAndDownload = async () => {
    if (!invoiceRef.current || typeof window === 'undefined') return;
    
    const printContents = invoiceRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: '2-digit'
    });
  };

  const symbol = getCurrencySymbol();

  // Calculate detailed tax breakdown per product
  const calculateDetailedTax = () => {
    let subtotal = 0;
    let totalTax = 0;
    const itemTaxes: Array<{ name: string; subtotal: number; taxRate: number; taxAmount: number }> = [];

    // Calculate subtotal from items
    order.items?.forEach(item => {
      const itemSubtotal = (item.product?.price || 0) * item.quantity;
      subtotal += itemSubtotal;
    });

    // Calculate tax from order total vs subtotal
    if (order.total && order.total > subtotal) {
      totalTax = order.total - subtotal;
    } else {
      // Fallback: calculate tax using default rate
      const defaultTaxRate = defaultTax?.rate || 20;
      totalTax = subtotal * (defaultTaxRate / 100);
    }

    // Create item tax breakdown (simplified)
    order.items?.forEach(item => {
      const itemSubtotal = (item.product?.price || 0) * item.quantity;
      const itemTaxRatio = subtotal > 0 ? itemSubtotal / subtotal : 0;
      const itemTax = totalTax * itemTaxRatio;
      
      itemTaxes.push({
        name: item.product?.name || 'Product',
        subtotal: itemSubtotal,
        taxRate: subtotal > 0 ? (itemTax / itemSubtotal) * 100 : 0,
        taxAmount: itemTax
      });
    });

    return { subtotal, totalTax, itemTaxes };
  };

  const { subtotal: subtotalRaw, totalTax: totalTaxRaw, itemTaxes } = calculateDetailedTax();
  const subtotal = convertPrice(subtotalRaw);
  const totalTax = convertPrice(totalTaxRaw);
  const total = convertPrice(subtotalRaw + totalTaxRaw);

  // Create gradient style from colors
  const getGradientStyle = () => {
    return {
      background: `linear-gradient(135deg, ${invoiceSettings.primaryColor}, ${invoiceSettings.secondaryColor}, ${invoiceSettings.accentColor})`
    };
  };

  const getPrimaryColorStyle = () => ({
    color: invoiceSettings.primaryColor
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2">
      <div ref={modalRef} className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close button with dynamic gradient */}
        <div className="flex justify-end p-2 pb-0">
          <button
            onClick={onClose}
            className="w-6 h-6 text-white rounded-full flex items-center justify-center transition-all text-sm"
            style={getGradientStyle()}
          >
            ×
          </button>
        </div>

        <div ref={invoiceRef} className="bg-white p-4 pt-1 flex-1 overflow-y-auto">
          {/* Header with dynamic branding */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-light text-black mb-2">{t('invoice')}</h1>
              <div className="flex flex-wrap gap-2">
                <div 
                  className="border rounded-full px-2 py-1 text-white text-xs font-medium"
                  style={{ 
                    borderColor: invoiceSettings.primaryColor,
                    backgroundColor: `${invoiceSettings.primaryColor}20`
                  }}
                >
                  #{order.id?.slice(-5).toUpperCase()}
                </div>
                <div 
                  className="border rounded-full px-2 py-1 text-white text-xs font-medium"
                  style={{ 
                    borderColor: invoiceSettings.secondaryColor,
                    backgroundColor: `${invoiceSettings.secondaryColor}20`
                  }}
                >
                  {formatDate(order.createdAt)}
                </div>
                <div 
                  className="border rounded-full px-2 py-1 text-white text-xs font-medium"
                  style={{ 
                    borderColor: invoiceSettings.accentColor,
                    backgroundColor: `${invoiceSettings.accentColor}20`
                  }}
                >
                  {order.status}
                </div>
              </div>
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={getGradientStyle()}
            >
              {invoiceSettings.logoUrl ? (
                <img 
                  src={invoiceSettings.logoUrl} 
                  alt="Logo" 
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <span className="text-white text-sm font-bold">
                  {invoiceSettings.companyName.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* From/To Section with dynamic branding */}
          <div className="flex justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {invoiceSettings.logoUrl ? (
                  <div className="w-8 h-8 border-2 rounded-lg overflow-hidden">
                    <img 
                      src={invoiceSettings.logoUrl} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: invoiceSettings.primaryColor }}
                  >
                    {invoiceSettings.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 
                    className="font-bold text-black text-sm"
                    style={getPrimaryColorStyle()}
                  >
                    {invoiceSettings.companyName}
                  </h3>
                  <p className="text-xs text-gray-500">{invoiceSettings.companyTagline}</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                <div>{invoiceSettings.companyAddress}, {invoiceSettings.companyCity}, {invoiceSettings.companyCountry}</div>
                {invoiceSettings.companyEmail && (
                  <div>{invoiceSettings.companyEmail}</div>
                )}
                {invoiceSettings.companyPhone && (
                  <div>{invoiceSettings.companyPhone}</div>
                )}
                {invoiceSettings.companyWebsite && (
                  <div>{invoiceSettings.companyWebsite}</div>
                )}
                
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-black mb-1 text-sm">{t('bill_to')}</h3>
              <div className="text-xs text-gray-600 space-y-0.5">
                <div className="font-semibold text-black">{user?.name || user?.nom}</div>
                <div>{user?.email}</div>
                <div>{user?.address?.street || user?.adresse || 'Address not provided'}</div>
                <div>{user?.address?.city || user?.ville || ''}</div>
              </div>
            </div>
          </div>

          {/* Items Table with dynamic gradient header */}
          <table className="w-full border-collapse mb-3">
            <thead>
              <tr className="text-white" style={getGradientStyle()}>
                <th className="text-left py-1 px-2 font-normal text-xs">{t('description')}</th>
                <th className="text-center py-1 px-2 font-normal text-xs">{t('price')}</th>
                <th className="text-center py-1 px-2 font-normal text-xs">{t('qty')}</th>
                <th className="text-right py-1 px-2 font-normal text-xs">{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr 
                  key={idx} 
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  style={idx % 2 === 0 ? {
                    backgroundColor: `${invoiceSettings.primaryColor}08`
                  } : {}}
                >
                  <td className="py-1 px-2 text-xs">{item.product?.name || 'Product'}</td>
                  <td className="text-center py-1 px-2 text-xs">{symbol}{convertPrice(item.product?.price).toFixed(2)}</td>
                  <td className="text-center py-1 px-2 text-xs">{item.quantity.toString().padStart(2, '0')}</td>
                  <td className="text-right py-1 px-2 text-xs font-medium">{symbol}{convertPrice(item.product?.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals with dynamic gradient accent */}
          <div className="flex justify-end mb-3">
            <div className="w-40">
              <div className="flex justify-between py-0.5 border-b text-xs">
                <span>{t('subtotal')}:</span>
                <span>{symbol} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b text-xs">
                <span>{t('tax')}:</span>
                <span>{symbol} {totalTax.toFixed(2)}</span>
              </div>
              <div 
                className="text-white text-center py-1 mt-1 rounded text-xs"
                style={getGradientStyle()}
              >
                <span className="font-medium">{t('total')}: {symbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer with company information */}
          <div className="pt-4 border-t border-gray-200">
            {/* Company Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Left side - Company Details */}
              <div className="text-xs text-gray-600">
                <h4 className="font-semibold text-gray-800 mb-2" style={{ color: invoiceSettings.primaryColor }}>
                  {invoiceSettings.companyName}
                </h4>
                <div className="space-y-1">
                  {invoiceSettings.companyAddress && (
                    <div>{invoiceSettings.companyAddress}</div>
                  )}
                  {(invoiceSettings.companyCity || invoiceSettings.companyCountry) && (
                    <div>
                      {invoiceSettings.companyCity && `${invoiceSettings.companyCity}`}
                      {invoiceSettings.companyCity && invoiceSettings.companyCountry && ', '}
                      {invoiceSettings.companyCountry}
                    </div>
                  )}

                </div>
              </div>

              {/* Right side - Fiscal Information */}
              <div className="text-xs text-gray-600 text-right">
                <h4 className="font-semibold text-gray-800 mb-2" style={{ color: invoiceSettings.primaryColor }}>
                  Informations Fiscales
                </h4>
                <div className="space-y-1">
                                  {invoiceSettings.fiscalInformation && (
                  <div>
                    {invoiceSettings.fiscalInformation.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="text-center border-t border-gray-200 pt-3 mb-3">
              <div className="text-xs text-gray-600">
                <div className="font-semibold text-gray-800 mb-1">{invoiceSettings.paymentText}</div>
                <div className="text-gray-500">Paiement sécurisé en ligne</div>
              </div>
            </div>

            {/* Thank You Message */}
            <div 
              className="text-center text-xs font-semibold"
              style={{ color: invoiceSettings.primaryColor }}
            >
              {t('thank_you')}
            </div>
          </div>
        </div>

        {/* Action Buttons with dynamic gradient */}
        <div className="flex justify-end gap-2 p-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {t('close')}
          </button>
          <button
            onClick={handlePrintAndDownload}
            className="px-6 py-2 text-white rounded-lg transition-all duration-300 font-medium flex items-center gap-2"
            style={getGradientStyle()}
          >
            <span>📄</span>
            {t('download_pdf')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;