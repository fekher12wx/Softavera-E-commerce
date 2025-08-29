'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Header from '../../components/Header';
import { User, Order } from '../../lib/types';
import InvoiceModal from '../../components/InvoiceModal';
import { countries } from '../../lib/countries';
import { useLanguage } from '../../lib/languageContext';
import { useCurrency } from '../../lib/currencyContext';

type EditFormField = 'name' | 'email' | 'address' | 'city' | 'zipCode' | 'country';
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

const ProfilePage = () => {
  const { t } = useLanguage();
  const { getCurrencySymbol, convertProductPrice } = useCurrency();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '', email: '', address: '', city: '', zipCode: '', country: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user?.id) fetchOrders();
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return router.push('/');
      
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setEditForm({
          name: data.nom || data.name || '',
          email: data.email || '',
          address: data.adresse || data.address?.street || '',
          city: data.ville || data.address?.city || '',
          zipCode: data.codePostal || data.address?.zipCode || '',
          country: data.pays || data.address?.country || ''
        });
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/');
      }
    } catch {
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!user?.id) return;
      
      const response = await fetch(`http://localhost:3001/api/orders/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    toast.loading(t('updating_profile'), { id: 'profile-update' });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          address: {
            street: editForm.address,
            city: editForm.city,
            zipCode: editForm.zipCode,
            country: editForm.country
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditMode(false);
        toast.success(`✅ ${t('profile_updated_successfully')}`, { id: 'profile-update' });
      } else {
        const error = await response.json();
        toast.error(`❌ ${error.message || t('error_updating_profile')}`, { id: 'profile-update' });
      }
    } catch {
      toast.error(`❌ ${t('network_error')}`, { id: 'profile-update' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error(`❌ ${t('passwords_do_not_match')}`);
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error(`❌ ${t('password_must_be_at_least_6_characters')}`);
    }

    setUpdatingPassword(true);
    toast.loading(t('changing_password'), { id: 'password-update' });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success(`✅ ${t('password_updated_successfully')}`, { id: 'password-update' });
      } else {
        const error = await response.json();
        toast.error(`❌ ${error.message || t('error_changing_password')}`, { id: 'password-update' });
      }
    } catch {
      toast.error(`❌ ${t('network_error')}`, { id: 'password-update' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrder(orderId);
    toast.loading(t('cancelling_order'), { id: `cancel-${orderId}` });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' }
            : order
        ));
        toast.success(`✅ ${t('order_cancelled_successfully')}`, { id: `cancel-${orderId}` });
      } else {
        const error = await response.json();
        toast.error(`❌ ${error.message || t('error_cancelling_order')}`, { id: `cancel-${orderId}` });
      }
    } catch {
      toast.error(`❌ ${t('network_error')}`, { id: `cancel-${orderId}` });
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleEditClick = () => {
    if (editMode) {
      handleUpdateProfile();
    } else {
      setEditMode(true);
      toast(`📝 ${t('edit_mode_enabled')}`,);
    }
  };

  const handlePasswordClick = () => {
    setShowPasswordModal(true);
    toast(` ${t('opening_password_change')}`, { icon: '🔒' });
  };

  const updateEditForm = (field: EditFormField, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const updatePasswordData = (field: PasswordField, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending' || order.status === 'processing';
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http:/') && !imagePath.startsWith('http://')) {
      return imagePath.replace('http:/', 'http://');
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `http://localhost:3001/uploads/${imagePath}`;
  };

  // Get orders to display based on showAllOrders state
  const getDisplayedOrders = () => {
    return showAllOrders ? orders : orders.slice(0, 3);
  };

  const hasMoreOrders = orders.length > 3;


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currencySymbol = getCurrencySymbol();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* User Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center text-3xl text-white shadow-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {user.name || user.nom}
              </h1>
              <p className="text-gray-600 text-lg">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium">
                {user.role === 'ADMIN' ? `👑 ${t('administrator')}` : `🛍️ ${t('client')}`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('profile_information')}
                </h2>
                <button
                  onClick={handleEditClick}
                  disabled={updatingProfile}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('saving')}
                    </>
                  ) : editMode ? (
                    `💾 ${t('save')}`
                  ) : (
                    `✏️ ${t('edit_profile')}`
                  )}
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { label: t('full_name'), key: 'name' as EditFormField, value: user.name || user.nom },
                  { label: t('email'), key: 'email' as EditFormField, value: user.email },
                  { label: t('address'), key: 'address' as EditFormField, value: user.address?.street || user.adresse },
                  { label: t('city'), key: 'city' as EditFormField, value: user.address?.city || user.ville },
                  { label: t('zip_code'), key: 'zipCode' as EditFormField, value: user.address?.zipCode || user.codePostal },
                  { label: t('country'), key: 'country' as EditFormField, value: user.address?.country || user.pays }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                    {editMode ? (
                      field.key === 'country' ? (
                        <select
                          value={editForm.country}
                          onChange={e => updateEditForm('country', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          <option value="">{t('select_your_country')}</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={editForm[field.key] || ''}
                          onChange={(e) => updateEditForm(field.key, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          placeholder={`${t('enter_your')} ${field.label.toLowerCase()}`}
                        />
                      )
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                        {field.value || t('not_provided')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Orders Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('order_history')}
                </h2>
                {orders.length > 0 && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {t('showing')} {getDisplayedOrders().length} {t('of')} {orders.length} {t('orders_total')}
                  </span>
                )}
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500 text-lg">{t('no_orders_found')}</p>
                  <p className="text-gray-400 text-sm">{t('your_orders_will_appear_here')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getDisplayedOrders().map((order) => (
                    <div key={order.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                      {/* Product thumbnails and names */}
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img
                              src={getImageUrl(item.product.image)}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.jpg';
                              }}
                            />
                            <span className="font-medium text-gray-800 text-sm">{item.product.name}</span>
                            <span className="text-xs text-gray-500 ml-1">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Removed order id, replaced by product info above */}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {t('passed_on')} {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            {order.items?.length || 0} {t('items')}
                          </p>
                        </div>
                        <div className="text-right flex flex-col gap-2 items-end">
                          <p className="font-bold text-xl text-gray-900 mb-3">{currencySymbol}{convertProductPrice(order.total).toFixed(3)}</p>
                          {canCancelOrder(order) && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingOrder === order.id}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                              {cancellingOrder === order.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                                  {t('cancelling')}
                                </>
                              ) : (
                                t('cancel')
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedOrder(order); setShowInvoiceModal(true); }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-sm font-medium"
                          >
                            {t('invoice')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                                     {hasMoreOrders && (
                     <div className="flex gap-3 mt-4">
                       {!showAllOrders ? (
                         <button
                           onClick={() => setShowAllOrders(true)}
                           className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-center font-medium shadow-md hover:shadow-lg"
                         >
                           📋 {t('show_more_orders')} ({orders.length - 3} {t('more')})
                         </button>
                       ) : (
                         <button
                           onClick={() => setShowAllOrders(false)}
                           className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-center font-medium shadow-md hover:shadow-lg"
                         >
                           🔽 {t('show_less')}
                         </button>
                       )}
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">{t('account_overview')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span>{t('total_orders')}</span>
                  <span className="font-bold text-lg">{orders.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span>{t('account_type')}</span>
                  <span className="font-bold">{user.role}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span>{t('status')}</span>
                  <span className="font-bold">{t('active')}</span>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {t('security')}
              </h3>
              <p className="text-gray-600 mb-4">{t('manage_your_account_security')}</p>
              <button
                onClick={handlePasswordClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium"
              >
                🔒 {t('change_password')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              {t('change_password')}
            </h2>
            <div className="space-y-4">
              {([
                { field: 'currentPassword' as PasswordField, label: t('current_password') },
                { field: 'newPassword' as PasswordField, label: t('new_password') },
                { field: 'confirmPassword' as PasswordField, label: t('confirm_new_password') }
              ]).map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <input
                    type="password"
                    value={passwordData[field]}
                    onChange={(e) => updatePasswordData(field, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder={`${t('enter_your')} ${label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  toast(`❌ ${t('')}`);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handlePasswordUpdate}
                disabled={updatingPassword}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('updating')}
                  </>
                ) : (
                  t('update')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <InvoiceModal order={selectedOrder} user={user} onClose={() => setShowInvoiceModal(false)} />
      )}
    </div>
  );
};

export default ProfilePage;