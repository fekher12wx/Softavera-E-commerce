import React, { useState } from 'react';
import { Eye, Edit, Trash2, Percent, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { Tax } from './adminTypes';
import { useLanguage } from '../../lib/languageContext';

interface TaxesTableProps {
  taxes: Tax[];
  searchTerm: string;
  handleView: (tax: Tax) => void;
  handleEdit: (tax: Tax) => void;
  handleDelete: (id: string) => void;
}

const TaxesTable: React.FC<TaxesTableProps> = ({
  taxes,
  searchTerm,
  handleView,
  handleEdit,
  handleDelete,
}) => {
  const { t } = useLanguage();
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTaxes = taxes.filter(tax =>
    tax.rate !== undefined && tax.rate !== null && 
    tax.rate.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredTaxes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTaxes = filteredTaxes.slice(startIndex, startIndex + itemsPerPage);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Percent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t('tax_rates')}</h3>
              <p className="text-sm text-gray-600">{filteredTaxes.length} {t('total_rates')}</p>
            </div>
          </div>
          
          {/* Items per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{t('show')}:</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('tax_rate')}
              </th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>
              <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedTaxes.map((tax, index) => (
              <tr
                key={tax.id || index}
                className="group hover:bg-gradient-to-r hover:from-orange-25 hover:to-red-25 transition-all duration-200"
              >
                {/* Tax Rate */}
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Percent className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {tax.rate !== undefined && tax.rate !== null ? `${tax.rate}%` : 'N/A'}
                        </span>
                        {tax.rate === 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {t('tax_free')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                      </div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      tax.isActive
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    {tax.isActive ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    {tax.isActive ? t('active') : t('inactive')}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-6">
                  <div className="flex items-center justify-center space-x-2">
                
                    <button
                      onClick={() => handleEdit(tax)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
                      title={t('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tax.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('showing')} {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTaxes.length)} {t('of')} {filteredTaxes.length}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('previous')}
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTaxes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Percent className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {taxes.length === 0 ? t('no_tax_rates') : t('no_matches')}
          </h3>
          <p className="text-gray-500">
            {taxes.length === 0 
              ? t('add_first_tax_rate') 
              : t('try_different_search')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaxesTable;