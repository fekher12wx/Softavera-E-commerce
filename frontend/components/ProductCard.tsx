import { Product, Order, Review } from '../lib/types';
import { useCart } from '../lib/cartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '../lib/currencyContext';
import { useLanguage } from '../lib/languageContext';
import { useTax } from '../lib/taxContext';
import toast from 'react-hot-toast';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { useAuth } from '../lib/authContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { convertProductPrice, getCurrencySymbol, baseCurrency } = useCurrency();
  const { t } = useLanguage();
  const { getTaxById, calculateTax } = useTax();
  const { user } = useAuth();
  

  const [quantity, setQuantity] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchasedModal, setHasPurchasedModal] = useState(false);
  const [loadingHasPurchased, setLoadingHasPurchased] = useState(false);

  // Debug stock values
  useEffect(() => {
    console.log(`Product: ${product.name}, Stock: ${product.stock}, Type: ${typeof product.stock}, Disabled: ${product.stock <= 0}`);
  }, [product.stock, product.name]);

  // Calculate tax details - use database tax rate if available, fallback to tax context
  const taxRate = (product as any).taxRate || (product.taxId ? getTaxById(product.taxId)?.rate : 0) || 0;
  const basePrice = convertProductPrice(product.price);
  const totalWithTax = convertProductPrice(product.price * (1 + taxRate / 100));
  const taxAmount = totalWithTax - basePrice;

  // Fetch reviews
  useEffect(() => {
    setLoadingReviews(true);
    fetch(`http://localhost:3001/api/products/${product.id}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [product.id]);

  useEffect(() => {
    if (!user) return;
  }, [user]);

  useEffect(() => {
    if (!user) return;
  }, [user]);

  // Handle review submit
  const handleReviewSubmit = async (review: { rating: number; comment: string }) => {
    if (!user) return;
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:3001/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...review, userId: user.id, userName: user.name }),
      });
      if (res.ok) {
        const newReview: Review = await res.json();
        setReviews([newReview, ...reviews]);
        setShowReviewForm(false);
      }
    } catch {}
    setSubmittingReview(false);
  };

  // Handle review edit
  const handleReviewEdit = async (reviewId: string, updated: { rating: number; comment: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:3001/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setReviews(reviews.map((r: Review) => r.id === reviewId ? { ...r, ...updated } : r));
      }
    } catch {}
  };

  // Handle review delete
  const handleReviewDelete = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:3001/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setReviews(reviews.filter((r: Review) => r.id !== reviewId));
      }
    } catch {}
  };

  const openDetailsModal = async () => {
    setShowDetailsModal(true);
    setLoadingHasPurchased(true);
    setHasPurchasedModal(false);
    if (user) {
      try {
        const res = await fetch(`http://localhost:3001/api/orders/user/${user.id}`);
        if (res.ok) {
          const orders = await res.json();
          const purchased = orders.some((order: Order) =>
            (order.status === 'shipped' || order.status === 'delivered') &&
            order.items.some((item: Order['items'][number]) => item.product.id === product.id)
          );
          setHasPurchasedModal(purchased);
        }
      } catch {}
    }
    setLoadingHasPurchased(false);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setShowToast(false);
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!showDetailsModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetailsModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailsModal]);

  // Pricing component for better reusability
  const PricingDisplay = ({ size = 'normal' }: { size?: 'normal' | 'large' }) => (
    <div className={`${size === 'large' ? 'space-y-3' : 'space-y-1'}`}>
      <div className="flex items-baseline gap-2">
        <span className={`font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ${
          size === 'large' ? 'text-4xl' : 'text-2xl'
        }`}>
          {basePrice.toFixed(3)} {getCurrencySymbol()}
        </span>
        {taxRate > 0 && (
          <span className={`text-gray-500 ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
            +{taxRate}% tax
          </span>
        )}
      </div>
      {taxRate > 0 && (
        <div className={`text-gray-600 ${size === 'large' ? 'text-base' : 'text-sm'}`}>
          <span className="font-medium">
            {t('total')}: {totalWithTax.toFixed(3)} {getCurrencySymbol()}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 overflow-hidden border border-gray-100 hover:border-purple-200 flex flex-col">
        {/* Product Image */}
        <div className="relative overflow-hidden h-56 flex flex-col items-center justify-start bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="relative w-full h-40 mt-4">
            <img 
              src={`http://localhost:3001/uploads/${product.image}`} 
              alt={product.name} 
              className="object-contain h-40 transition-transform duration-500 group-hover:scale-110 drop-shadow-xl" 
            />
            
            {/* Out of Stock Overlay in Center */}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{t('out_of_stock')}</span>
              </div>
            )}
          </div>
          {/* Stock Badge - Only show for in-stock items */}
          {product.stock > 0 && (
            <div className="absolute top-4 right-4">
              <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold backdrop-blur-sm shadow">
                {product.stock} {t('left')}
              </span>
            </div>
          )}
          {/* Reviews Section */}
          <div className="w-full px-4 mt-2">
            <div className="bg-white rounded-xl shadow p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">{t('reviews')}</span>
              </div>
              <div className="mt-2">
                <ReviewList
                  reviews={reviews}
                  onEdit={handleReviewEdit}
                  onDelete={handleReviewDelete}
                  isLoading={loadingReviews}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="flex-1 flex flex-col p-6 gap-4">
          <h2 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 leading-tight">
            {product.name}
          </h2>
          
          {/* Pricing */}
          <PricingDisplay />
          
          {/* Action Buttons Container */}
          <div className="space-y-3 mt-auto">
            {/* View Details Button */}
            <button 
              onClick={openDetailsModal}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('view_details')}
            </button>
            
            {/* Add to Cart Section */}
            <div className="flex items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock <= 0 || quantity <= 1}
                  className="px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                  className="w-12 px-2 py-2 text-center border-0 bg-transparent focus:outline-none focus:ring-0 font-semibold text-gray-800 appearance-none hide-number-spin"
                  disabled={product.stock <= 0}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={product.stock <= 0 || quantity >= product.stock}
                  className="px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              
              {/* Add to Cart Button */}
              <button
                onClick={() => {
                  if (product.stock > 0 && quantity > 0 && quantity <= product.stock) {
                    addToCart({ product, quantity });
                  }
                }}
                disabled={product.stock <= 0}
                className={`flex-1 bg-white border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md
                  hover:bg-purple-600 hover:text-white
                  ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400 hover:bg-white hover:text-gray-400' : ''}`}
              >
                {product.stock <= 0 ? t('out_of_stock') : `🛒 ${t('add')}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showDetailsModal && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => {
            if (e.target === e.currentTarget) closeDetailsModal();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white rounded-2xl shadow-2xl border-0 transition-all duration-300 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeDetailsModal}
              className="absolute right-4 top-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
              aria-label={t('close_modal')}
            >
              <svg className="w-6 h-6 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal Content */}
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="relative flex flex-col">
                  <div className="relative w-full h-80 overflow-hidden rounded-2xl">
                    <img 
                      src={`http://localhost:3001/uploads/${product.image}`} 
                      alt={product.name} 
                      className="w-full h-full object-cover rounded-2xl shadow-lg" 
                    />
                    
                    {/* Out of Stock Overlay in Center */}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                        <span className="text-white font-bold text-2xl">{t('out_of_stock')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Stock Badge - Only show for in-stock items */}
                  {product.stock > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="text-sm px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold backdrop-blur-sm">
                        {product.stock} {t('in_stock_count')}
                      </span>
                    </div>
                  )}
                  
                  {/* Reviews Section (modal) */}
                  <div className="w-full px-1 mt-4">
                    <div className="bg-white rounded-xl shadow p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">{t('reviews')}</span>
                        {hasPurchasedModal && user && !showReviewForm && (
                          <button
                            className="text-xs px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700"
                            onClick={() => setShowReviewForm(true)}
                          >
                            {t('add_review')}
                          </button>
                        )}
                      </div>
                      {hasPurchasedModal && showReviewForm && (
                        <ReviewForm
                          productId={product.id}
                          onSubmit={handleReviewSubmit}
                          onCancel={() => setShowReviewForm(false)}
                          isLoading={submittingReview}
                        />
                      )}
                      <div className="mt-2">
                        <ReviewList
                          reviews={reviews}
                          onEdit={handleReviewEdit}
                          onDelete={handleReviewDelete}
                          isLoading={loadingReviews}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {product.description || t('no_description_available')}
                    </p>
                  </div>
                  
                  {/* Price in Modal */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
                    <PricingDisplay size="large" />
                    {taxRate > 0 && taxAmount > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200/50">
                        <div className="text-sm text-gray-600">
                          Tax amount: {taxAmount.toFixed(3)} {getCurrencySymbol()}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">{t('category')}:</span>
                      <span className="font-semibold text-gray-800">{product.category || t('not_specified')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">{t('stock_available')}:</span>
                      <span className="font-semibold text-gray-800">{product.stock} {t('units')}</span>
                    </div>
                  </div>
                  
                  {/* Add to Cart Section in Modal */}
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-gray-700 font-semibold">{t('quantity')}:</span>
                      <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={product.stock <= 0 || quantity <= 1}
                          className="px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={product.stock}
                          value={quantity}
                          onChange={e => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                          className="w-16 px-2 py-2 text-center border-0 bg-transparent focus:outline-none focus:ring-0 font-semibold text-gray-800 appearance-none hide-number-spin"
                          disabled={product.stock <= 0}
                        />
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={product.stock <= 0 || quantity >= product.stock}
                          className="px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (product.stock > 0 && quantity > 0 && quantity <= product.stock) {
                          addToCart({ product, quantity });
                          setShowToast(true);
                        }
                      }}
                      disabled={product.stock <= 0}
                      className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl
                        hover:from-purple-700 hover:to-pink-700
                        ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 hover:from-gray-400 hover:to-gray-400' : ''}`}
                    >
                      {product.stock <= 0 ? t('out_of_stock') : `🛒 ${t('add_to_cart_quantity')} (${quantity})`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast/Message after adding to cart */}
      {showToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in">
            <div className="text-green-600 text-4xl">✔️</div>
            <div className="text-lg font-semibold text-gray-800 text-center">{t('product_added_to_cart')}</div>
            <div className="flex gap-3 w-full">
              <button
                onClick={closeDetailsModal}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
              >
                {t('continue_shopping')}
              </button>
              <button
                onClick={() => router.push('/cart')}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
              >
                {t('view_my_cart')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;