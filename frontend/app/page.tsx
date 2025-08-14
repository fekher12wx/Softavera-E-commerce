'use client';

import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Plus } from 'lucide-react';
import { useLanguage } from '../lib/languageContext';

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  rating: number;
  reviews: number;
}

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Progressive Show More state
  const [visibleCount, setVisibleCount] = useState(10);
  const [showMoreClicks, setShowMoreClicks] = useState(0);
  const [showMoreLoading, setShowMoreLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = 'http://localhost:3001/api/products';
        if (activeCategory) {
          url = `http://localhost:3001/api/products/category/${encodeURIComponent(activeCategory)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data); // Optionally, keep subcategory filtering below
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory]);

  // Filter products based on active filters
  useEffect(() => {
    let filtered = [...products];

    if (activeSubcategory) {
      filtered = filtered.filter(product => {
        // Check subcategory, brand, or product name
        return (
          product.subcategory?.toLowerCase() === activeSubcategory.toLowerCase() ||
          product.brand?.toLowerCase() === activeSubcategory.toLowerCase() ||
          product.name.toLowerCase().includes(activeSubcategory.toLowerCase())
        );
      });
    }

    setFilteredProducts(filtered);
  }, [products, activeSubcategory]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSubcategory]);

  // Reset visibleCount and showMoreClicks when filters change
  useEffect(() => {
    setVisibleCount(10);
    setShowMoreClicks(0);
  }, [activeCategory, activeSubcategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Products to display
  const productsToShow = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleCategoryFilter = (category: string) => {
    setActiveCategory(category || null);
    setActiveSubcategory(null); // Reset subcategory when category changes
  };

  const handleSubcategoryFilter = (subcategory: string) => {
    setActiveSubcategory(subcategory || null);
  };

  // Add a useEffect to fetch all products when both filters are cleared
  useEffect(() => {
    if (!activeCategory && !activeSubcategory) {
      const fetchAllProducts = async () => {
        setLoading(true);
        try {
          const res = await fetch('http://localhost:3001/api/products');
          if (!res.ok) throw new Error('Failed to fetch products');
          const data = await res.json();
          setProducts(data);
          setFilteredProducts(data);
        } catch (error) {
          setProducts([]);
          setFilteredProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAllProducts();
    }
  }, [activeCategory, activeSubcategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-56 mb-8 md:mb-0 md:mr-8 rounded-2xl shadow-2xl border border-gray-200 bg-gray-100 animate-pulse h-96"></div>
          <section className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        <div className="flex flex-col gap-8">
          <Sidebar
            onCategoryFilterAction={handleCategoryFilter}
            onSubcategoryFilterAction={handleSubcategoryFilter}
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
          />
        </div>
        <section className="flex-1">
          {/* Filter Status */}
          <div className="mb-6">
            <p className="text-gray-600">
              {activeCategory && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {activeCategory}
                </span>
              )}
              {activeSubcategory && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {activeSubcategory}
                </span>
              )}
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productsToShow.length > 0 ? (
              productsToShow.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
                             <div className="col-span-full text-center py-12">
                 <div className="text-gray-500">
                   <p className="text-lg font-semibold">{t('no_products_found')}</p>
                   <p className="mt-2">{t('try_adjusting_filters')}</p>
                 </div>
               </div>
            )}
          </div>

          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={async () => {
                  setShowMoreLoading(true);
                  await new Promise((r) => setTimeout(r, 350)); // Simulate loading
                  if (showMoreClicks === 0) {
                    setVisibleCount((prev) => prev + 10);
                  } else {
                    setVisibleCount((prev) => prev + 30);
                  }
                  setShowMoreClicks((prev) => prev + 1);
                  setShowMoreLoading(false);
                }}
                disabled={showMoreLoading}
                className="relative flex items-center justify-center px-8 py-3 rounded-2xl font-bold shadow-xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed group overflow-hidden"
              >
                {showMoreLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                                 <span className="tracking-wide">{t('show_more')}</span>
              </button>
            </div>
          )}

          {/* Showing X of Y products message */}
          {productsToShow.length > 0 && (
            <div className="flex justify-center mt-4">
                             <span className="text-gray-600 text-sm">
                 {t('showing')} {Math.min(productsToShow.length, filteredProducts.length)} {t('of')} {filteredProducts.length} {t('products_count')}
               </span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}