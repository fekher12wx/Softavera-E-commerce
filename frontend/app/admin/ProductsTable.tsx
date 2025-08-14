import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Product } from './adminTypes';
import { useCurrency } from '../../lib/currencyContext';
import { useLanguage } from '../../lib/languageContext';

interface ProductsTableProps {
  products: Product[];
  searchTerm: string;
  handleView: (product: Product) => void;
  handleEdit: (product: Product) => void;
  handleDelete: (id: string) => void;
  taxes: any[]; // Add taxes prop to display tax information
}

const ProductsTable: React.FC<ProductsTableProps> = ({ products, searchTerm, handleView, handleEdit, handleDelete, taxes }) => {
  const { getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  
  return (
  <div className="space-y-6">
    <div className="bg-emerald-50 rounded-2xl shadow-lg border border-emerald-100/70 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('products')}</h3>
              <p className="text-sm text-gray-500">{t('manage_products_inventory')}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {products?.length || 0} {t('products')}
          </div>
        </div>
      </div>
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200/60">
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('product_information')}
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('price')}
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('tax') || 'Tax'}
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('stock_status')}
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {products
              ?.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((product, index) => {
                const imagePath = product.image?.startsWith('/uploads/')
                  ? product.image
                  : `/uploads/${product.image}`;

                return (
                  <tr
                    key={product.id || index}
                    className="group hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 transition-all duration-200"
                  >
                    {/* Product Information */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={`http://localhost:3001${imagePath}`}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover shadow-lg border border-gray-200/50"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                            {product.stock === 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200">
                                {t('out_of_stock')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <p className="text-sm text-gray-600 truncate">{product.category}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Price */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {getCurrencySymbol()}{product.price?.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    {/* Tax */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        {product.taxId ? (
                          (() => {
                            const tax = taxes.find(t => t.id === product.taxId);
                            return tax ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border border-purple-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {tax.rate}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            );
                          })()
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    {/* Stock Status */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            product.stock > 10
                              ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200'
                              : product.stock > 0
                              ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200'
                              : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {product.stock > 10 ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : product.stock > 0 ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {product.stock > 10 ? t('in_stock') : product.stock > 0 ? t('low_stock') : t('out_of_stock')}
                        </span>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleView?.(product)}
                          className="group/btn p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('view_details')}
                        >
                          <Eye className="w-4 h-4 text-indigo-600 group-hover/btn:text-indigo-700" />
                        </button>
                        <button
                          onClick={() => handleEdit?.(product)}
                          className="group/btn p-2 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('edit_product')}
                        >
                          <Edit className="w-4 h-4 text-amber-600 group-hover/btn:text-amber-700" />
                        </button>
                        <button
                          onClick={() => handleDelete?.(product.id)}
                          className="group/btn p-2 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('delete_product')}
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 group-hover/btn:text-rose-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {/* Empty State */}
      {products?.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_products_found')}</h3>
          <p className="text-gray-500 max-w-sm mx-auto">{t('get_started_add_product')}</p>
        </div>
      )}
    </div>
  </div>
  );
};

export default ProductsTable; 