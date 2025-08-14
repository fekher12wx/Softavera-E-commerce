import React, { useRef, useEffect } from 'react';
import { Order, User } from '../lib/types';
import { useLanguage } from '../lib/languageContext';
import { useCurrency } from '../lib/currencyContext';
import { useTax } from '../lib/taxContext';

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

    console.log('InvoiceModal - Order items:', order.items);
    console.log('InvoiceModal - Order total:', order.total);
    console.log('InvoiceModal - Default tax:', defaultTax);

    // Calculate subtotal from items
    order.items?.forEach(item => {
      const itemSubtotal = (item.product?.price || 0) * item.quantity;
      subtotal += itemSubtotal;
    });

    // Calculate tax from order total vs subtotal
    if (order.total && order.total > subtotal) {
      totalTax = order.total - subtotal;
      console.log('InvoiceModal - Calculated tax from order total:', totalTax);
    } else {
      // Fallback: calculate tax using default rate
      const defaultTaxRate = defaultTax?.rate || 20;
      totalTax = subtotal * (defaultTaxRate / 100);
      console.log('InvoiceModal - Using fallback tax calculation:', totalTax);
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

    console.log('InvoiceModal - Final tax calculation:', { subtotal, totalTax, itemTaxes });
    return { subtotal, totalTax, itemTaxes };
  };

  const { subtotal: subtotalRaw, totalTax: totalTaxRaw, itemTaxes } = calculateDetailedTax();
  const subtotal = convertPrice(subtotalRaw);
  const totalTax = convertPrice(totalTaxRaw);
  const total = convertPrice(subtotalRaw + totalTaxRaw);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2">
      <div ref={modalRef} className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close button with gradient */}
        <div className="flex justify-end p-2 pb-0">
          <button
            onClick={onClose}
            className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center hover:from-purple-700 hover:to-pink-700 transition-all text-sm"
          >
            ×
          </button>
        </div>

        <div ref={invoiceRef} className="bg-white p-4 pt-1 flex-1 overflow-y-auto">
          {/* Header with gradient accent */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-light text-black mb-2">{t('invoice')}</h1>
              <div className="flex flex-wrap gap-2">
                <div className="border border-purple-400 rounded-full px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50">
                  <span className="text-xs font-medium">#{order.id?.slice(-5).toUpperCase()}</span>
                </div>
                <div className="border border-blue-400 rounded-full px-2 py-1 bg-gradient-to-r from-blue-50 to-purple-50">
                  <span className="text-xs font-medium">{formatDate(order.createdAt)}</span>
                </div>
                <div className="border border-green-400 rounded-full px-2 py-1 bg-gradient-to-r from-green-50 to-blue-50">
                  <span className="text-xs font-medium capitalize">{order.status}</span>
                </div>
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🛍️</span>
            </div>
          </div>

          {/* From/To Section */}
          <div className="flex justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">E</span>
                </div>
                <div>
                  <h3 className="font-bold text-black text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">E-SHOP</h3>
                  <p className="text-xs text-gray-500">Your Trusted Online Store</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                <div>contact@e-shop.com</div>
                <div>e-shop.com</div>
                <div>Tunis, Tunisia</div>
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

          {/* Items Table with gradient header */}
          <table className="w-full border-collapse mb-3">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white">
                <th className="text-left py-1 px-2 font-normal text-xs">{t('description')}</th>
                <th className="text-center py-1 px-2 font-normal text-xs">{t('price')}</th>
                <th className="text-center py-1 px-2 font-normal text-xs">{t('qty')}</th>
                <th className="text-right py-1 px-2 font-normal text-xs">{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gradient-to-r from-purple-50/30 to-pink-50/30' : 'bg-white'}>
                  <td className="py-1 px-2 text-xs">{item.product?.name || 'Product'}</td>
                  <td className="text-center py-1 px-2 text-xs">{symbol}{convertPrice(item.product?.price).toFixed(2)}</td>
                  <td className="text-center py-1 px-2 text-xs">{item.quantity.toString().padStart(2, '0')}</td>
                  <td className="text-right py-1 px-2 text-xs font-medium">{symbol}{convertPrice(item.product?.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Detailed Tax Breakdown */}
   

          {/* Totals with gradient accent */}
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
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white text-center py-1 mt-1 rounded text-xs">
                <span className="font-medium">{t('total')}: {symbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t text-xs text-gray-600">
            <div className="text-center">
              <div className="font-semibold">Payment to E-Shop</div>
              <div>Secure online payment</div>
            </div>
          </div>

          <div className="text-center mt-2 text-xs bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
            {t('thank_you')}
          </div>
        </div>

        {/* Action Buttons with gradient */}
        <div className="flex justify-end gap-2 p-3 bg-gradient-to-r from-gray-50 to-purple-50/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {t('close')}
          </button>
          <button
            onClick={handlePrintAndDownload}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-all duration-300 font-medium flex items-center gap-2"
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