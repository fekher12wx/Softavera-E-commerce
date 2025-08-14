'use client';

import { useState, useEffect } from 'react';
import { Product, CartItem, Order } from '../lib/types';
import { useCart } from '../lib/cartContext';
import { useCurrency } from '../lib/currencyContext';
import { useLanguage } from '../lib/languageContext';
import { useAuth } from '../lib/authContext';
import ReviewsSection from './ReviewsSection';

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const checkPurchased = async () => {
      if (!user) {
        setHasPurchased(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:3001/api/orders?userId=${user.id}`);
        if (!res.ok) return;
        const orders: Order[] = await res.json();
        console.log('Fetched orders:', orders);
        let purchased = false;
        orders.forEach(order => {
          console.log('Order status:', order.status);
          order.items.forEach(item => {
            console.log('Order item product id:', item.product.id, 'Current product id:', product.id);
            if ((order.status === 'delivered' || order.status === 'shipped' || order.status === 'processing') && item.product.id === product.id) {
              purchased = true;
            }
          });
        });
        console.log('Has purchased this product:', purchased);
        setHasPurchased(purchased);
      } catch (e) {
        setHasPurchased(false);
      }
    };
    checkPurchased();
  }, [user, product.id]);

  useEffect(() => {
    if (!user) {
      setHasPurchased(false);
      // If you have a showReviewForm state, also setShowReviewForm(false);
    }
  }, [user]);

  const handleAddToCart = () => {
    const cartItem: CartItem = { product, quantity };
    addToCart(cartItem);
    alert(`${product.name} ${t('added_to_cart')}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Product Information */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Product Image */}
            <div className="flex-1 flex items-center justify-center">
              <img 
                src={`http://localhost:3001/uploads/${product.image}`} 
                alt={product.name} 
                className="w-full max-w-xs h-auto object-cover rounded-2xl shadow-lg" 
              />
            </div>
            {/* Product Info */}
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl font-bold text-gray-800 leading-tight">{product.name}</h1>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {convertPrice(product.price).toFixed(2)} {getCurrencySymbol()}
              </div>
              <div className="text-gray-600 text-lg">{product.description}</div>
              <div>
                {product.stock > 0 ? (
                  <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">{product.stock} {t('in_stock_count')}</span>
                ) : (
                  <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold">{t('out_of_stock')}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 bg-gray-200 rounded-l-lg">-</button>
                <input type="number" value={quantity} min={1} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="w-16 text-center border rounded" />
                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-2 bg-gray-200 rounded-r-lg">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? t('out_of_stock') : t('add_to_cart')}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <ReviewsSection productId={product.id} canReview={hasPurchased} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;