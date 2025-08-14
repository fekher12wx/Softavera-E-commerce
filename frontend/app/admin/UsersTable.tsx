import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { User } from './adminTypes';
import { useLanguage } from '../../lib/languageContext';

interface UsersTableProps {
  users: User[];
  searchTerm: string;
  handleView: (user: User) => void;
  handleEdit: (user: User) => void;
  handleDelete: (id: string) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, searchTerm, handleView, handleEdit, handleDelete }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div className="bg-violet-50 rounded-2xl shadow-lg border border-violet-100/70 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('users')}</h3>
                <p className="text-sm text-gray-500">{t('admin_dashboard')}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {users?.length || 0} {t('users')}
            </div>
          </div>
        </div>
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200/60">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('profile')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('role')}
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('address')}
                </th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {users
                .filter(user => {
                  const name = user?.name || '';
                  const email = user?.email || '';
                  const term = searchTerm?.toLowerCase() || '';
                  return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
                })
                .map((user, index) => (
                  <tr
                    key={user.id || index}
                    className="group hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200"
                  >
                    {/* User Information */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-4">
                        {/* Removed avatar/circle */}
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900 truncate">{user?.name || t('unknown_user')}</p>
                            {user?.role === 'ADMIN' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                                {t('admin')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <p className="text-sm text-gray-600 truncate">{user?.email || t('no_email_provided')}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="py-5 px-6">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user?.role === 'ADMIN'
                            ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200'
                            : 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border border-teal-200'
                        }`}
                      >
                        {user?.role === 'ADMIN' ? (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 12a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                        {user?.role || t('user')}
                      </span>
                    </td>
                    {/* Location */}
                    <td className="py-5 px-6">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.address && user.address.city
                              ? user.address.city
                              : t('unknown')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user?.address && user.address.country
                              ? user.address.country
                              : t('no_location')}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleView?.(user)}
                          className="group/btn p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('view_details')}
                        >
                          <Eye className="w-4 h-4 text-indigo-600 group-hover/btn:text-indigo-700" />
                        </button>
                        <button
                          onClick={() => handleEdit?.(user)}
                          className="group/btn p-2 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('edit_user')}
                        >
                          <Edit className="w-4 h-4 text-amber-600 group-hover/btn:text-amber-700" />
                        </button>
                        <button
                          onClick={() => handleDelete?.(user.id)}
                          className="group/btn p-2 hover:bg-rose-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title={t('delete_user')}
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 group-hover/btn:text-rose-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Empty State */}
        {users?.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_users_found')}</h3>
            <p className="text-gray-500 max-w-sm mx-auto">{t('get_started_add_user')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTable; 