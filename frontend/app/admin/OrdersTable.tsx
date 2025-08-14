import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Order, User } from './adminTypes';
import { CURRENCY_SYMBOL } from '../../lib/constants';
import { useLanguage } from '../../lib/languageContext';

interface OrdersTableProps {
  orders: Order[];
  users: User[];
  searchTerm: string;
  handleView: (order: Order) => void;
  handleEdit: (order: Order) => void;
  handleDelete: (id: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, users, searchTerm, handleView, handleEdit, handleDelete }) => {
  const { t } = useLanguage();
  
  return (
  <div className="space-y-6">
    <div className="bg-blue-50 rounded-2xl shadow-lg border border-blue-100/70 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('admin_orders')}</h3>
              <p className="text-sm text-gray-500">{t('track_manage_orders')}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {orders?.length || 0} {t('admin_orders')}
          </div>
        </div>
      </div>
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200/60">
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('order_details')}
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('customer')}
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {orders
              ?.filter(order => {
                const orderId = (order?.id || '').toLowerCase();
                const term = (searchTerm || '').toLowerCase();
                return orderId.includes(term);
              })
              .map((order, index) => {
                const orderIdDisplay = order?.id ? order.id.slice(-6).toUpperCase() : '------';
                const createdAtDisplay = order?.createdAt ? new Date(order.createdAt).toLocaleString() : t('unknown_date');
                const totalDisplay = typeof order?.total === 'number' ? order.total : 'N/A';
                const statusDisplay = order?.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : t('unknown');
                const statusClass =
                  order?.status === 'pending'
                    ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200'
                    : order?.status === 'processing'
                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200'
                    : order?.status === 'shipped'
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200'
                    : order?.status === 'delivered'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
                    : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border-rose-200';
                const customer = users.find(u => u.id === order.userId);
                return (
                  <tr
                    key={order?.id || index}
                    className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200"
                  >
                    {/* Order Details */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{t('order')} #{orderIdDisplay}</span>
                        <span className="text-xs text-gray-500">{createdAtDisplay}</span>
                        <span className="text-xs text-gray-500">{t('total')}: {totalDisplay} {CURRENCY_SYMBOL}</span>
                      </div>
                    </td>
                    {/* Customer Name */}
                    <td className="py-5 px-6">
                      <span className="font-medium text-gray-800">{customer?.name || t('unknown')}</span>
                    </td>
                    {/* Status */}
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
                        {statusDisplay}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleView?.(order)}
                          className="group/btn p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('view_details')}
                        >
                          <Eye className="w-4 h-4 text-indigo-600 group-hover/btn:text-indigo-700" />
                        </button>
                        <button
                          onClick={() => handleEdit?.(order)}
                          className="group/btn p-2 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('edit_order')}
                        >
                          <Edit className="w-4 h-4 text-amber-600 group-hover/btn:text-amber-700" />
                        </button>
                        <button
                          onClick={() => handleDelete?.(order.id)}
                          className="group/btn p-2 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('delete_order')}
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
      {orders?.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_orders_found')}</h3>
          <p className="text-gray-500 max-w-sm mx-auto">{t('get_started_add_order')}</p>
        </div>
      )}
    </div>
  </div>
  );
};

export default OrdersTable; 