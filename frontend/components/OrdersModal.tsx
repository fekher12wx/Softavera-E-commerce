'use client';

import React, { useState, useEffect } from 'react';
import { Order, Review } from '../lib/types';
import toast from 'react-hot-toast';
import { useCurrency } from '../lib/currencyContext';
import { useLanguage } from '../lib/languageContext';
import { useAuth } from '../lib/authContext';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  loading: boolean;
  getImageUrl: (path: string) => string;
}

const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  loading,
  getImageUrl,
}) => {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [productReviews, setProductReviews] = useState<Record<string, Review[]>>({});
  const [showReviewForm, setShowReviewForm] = useState<Record<string, boolean>>({});
  const [reviewLoading, setReviewLoading] = useState<Record<string, boolean>>({});

  // Fetch reviews for all products in all orders when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchAllReviews = async () => {
      const productIds = Array.from(new Set(orders.flatMap(order => order.items.map(item => item.product.id))));
      const reviewsMap: Record<string, Review[]> = {};
      await Promise.all(productIds.map(async (productId) => {
        try {
          const res = await fetch(`http://localhost:3001/api/products/${productId}/reviews`);
          if (res.ok) {
            reviewsMap[productId] = await res.json();
          } else {
            reviewsMap[productId] = [];
          }
        } catch {
          reviewsMap[productId] = [];
        }
      }));
      setProductReviews(reviewsMap);
    };
    fetchAllReviews();
  }, [isOpen, orders]);

  const handleReviewSubmit = async (productId: string, review: { rating: number; comment: string }) => {
    if (!user) return;
    setReviewLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(review)
      });
      if (res.ok) {
        const newReview = await res.json();
        setProductReviews(prev => ({
          ...prev,
          [productId]: [newReview, ...(prev[productId] || [])]
        }));
        setShowReviewForm(prev => ({ ...prev, [productId]: false }));
        toast.success(t('success'));
      } else {
        const error = await res.json();
        toast.error(error.error || t('error_submitting_review'));
      }
    } catch {
      toast.error(t('error_submitting_review'));
    } finally {
      setReviewLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (!isOpen) return null;

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(t('confirm_delete_order'))) return;
    try {
      setDeletingOrderId(orderId);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success(t('order_deleted_successfully'));
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(`${t('error_deleting_order')}: ${error.message || t('unknown_error')}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(t('network_error'));
    } finally {
      setDeletingOrderId(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return t('pending');
      case 'processing':
        return t('processing');
      case 'shipped':
        return t('shipped');
      case 'delivered':
        return t('delivered');
      case 'cancelled':
        return t('cancelled');
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-indigo-900/40 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-500 border border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 px-8 py-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
                <span className="text-2xl">🛍️</span>
              </div>
              <div className="text-white">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                  {t('my_orders')}
                </h2>
                <p className="text-purple-100/80 text-sm mt-1">
                  {t('order_history')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-all duration-200 p-3 hover:bg-white/20 rounded-2xl backdrop-blur-sm border border-white/10 group"
            >
              <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !orders.length ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('no_orders')}</h3>
              <p className="text-gray-600">{t('no_orders_yet')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} 
                  className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-200 group relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {t('order')} #{order.id.slice(-6)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </div>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deletingOrderId === order.id}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-red-50 rounded-xl text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={t('delete_order')}
                      >
                        {deletingOrderId === order.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item, idx) => {
                      const reviews = productReviews[item.product.id] || [];
                      const userHasReviewed = user && reviews.some(r => r.userId === user.id);
                      return (
                        <div key={idx} className="flex flex-col gap-2 bg-white p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImageUrl(item.product.image)}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {t('quantity')}: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium text-gray-800">
                              {convertPrice(item.product.price * item.quantity).toFixed(3)} {getCurrencySymbol()}
                            </p>
                          </div>
                          {/* Reviews List */}
                          <div className="mt-2">
                            <ReviewList
                              reviews={reviews}
                              onEdit={() => {}}
                              onDelete={() => {}}
                              isLoading={false}
                            />
                          </div>
                          {/* Review Form */}
                          {user && !userHasReviewed && (
                            <div className="mt-2">
                              {showReviewForm[item.product.id] ? (
                                <ReviewForm
                                  productId={item.product.id}
                                  onSubmit={review => handleReviewSubmit(item.product.id, review)}
                                  onCancel={() => setShowReviewForm(prev => ({ ...prev, [item.product.id]: false }))}
                                  isLoading={!!reviewLoading[item.product.id]}
                                />
                              ) : (
                                <button
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                                  onClick={() => setShowReviewForm(prev => ({ ...prev, [item.product.id]: true }))}
                                >
                                  {t('write_review')}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-gray-600">{t('total')}</span>
                    <span className="font-semibold text-gray-800">{convertPrice(order.total).toFixed(3)} {getCurrencySymbol()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersModal; 