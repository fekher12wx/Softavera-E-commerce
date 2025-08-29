'use client';

import { useState, useEffect } from 'react';
import { getCategories } from '../lib/categories';
import { useLanguage } from '../lib/languageContext';

interface SidebarProps {
  onCategoryFilterAction: (category: string) => void;
  onSubcategoryFilterAction: (subcategory: string) => void;
  activeCategory: string | null;
  activeSubcategory: string | null;
}

export default function Sidebar({ 
  onCategoryFilterAction, 
  onSubcategoryFilterAction, 
  activeCategory, 
  activeSubcategory 
}: SidebarProps) {
  
  const { language } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const categories = getCategories(language);

  // Auto-expand category when subcategory is selected
  useEffect(() => {
    if (activeSubcategory) {
      const categoryWithSub = categories.find(cat => cat.sub.includes(activeSubcategory));
      if (categoryWithSub && !expandedCategories.includes(categoryWithSub.name)) {
        setExpandedCategories(prev => [...prev, categoryWithSub.name]);
      }
    }
  }, [activeSubcategory, categories, expandedCategories]);

  // Auto-expand category when it's selected
  useEffect(() => {
    if (activeCategory && !expandedCategories.includes(activeCategory)) {
      setExpandedCategories(prev => [...prev, activeCategory]);
    }
  }, [activeCategory, expandedCategories]);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(name)) {
        return prev.filter(cat => cat !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const handleCategoryClick = (categoryName: string) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    onCategoryFilterAction(categoryName);
    
    if (activeCategory !== categoryName) {
      // Ensure the category is expanded when selected
      if (!expandedCategories.includes(categoryName)) {
        setExpandedCategories(prev => [...prev, categoryName]);
      }
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleSubcategoryClick = (subcategoryName: string) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    onSubcategoryFilterAction(subcategoryName);
    setTimeout(() => setIsTransitioning(false), 200);
  };

  const handleResetFilters = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    onCategoryFilterAction('');
    onSubcategoryFilterAction('');
    // Keep categories expanded for better UX
    setExpandedCategories([]);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const getSidebarHeight = () => {
    if (expandedCategories.length === 0) return 'max-h-[500px]';
    
    let totalHeight = 200; // Header height
    totalHeight += categories.length * 80; // Each category takes ~80px
    
    // Add height for expanded subcategories
    expandedCategories.forEach(catName => {
      const category = categories.find(cat => cat.name === catName);
      if (category) {
        totalHeight += category.sub.length * 48; // Each subcategory takes ~48px
      }
    });
    
    // Add padding and ensure reasonable bounds
    totalHeight = Math.max(500, Math.min(900, totalHeight + 100));
    return `max-h-[${totalHeight}px]`;
  };

  return (
    <aside className={`w-full md:w-64 mb-8 md:mb-0 md:mr-8 rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 backdrop-blur-sm flex flex-col transition-all duration-500 ease-in-out ${getSidebarHeight()}`}>
      
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-blue-600/90"></div>
        <div className="relative z-10">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="text-2xl">📱</span>
            {language === 'fr' ? 'Catégories' : language === 'ar' ? 'الفئات' : 'Categories'}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {language === 'fr' ? 'Filtrez par catégorie' : language === 'ar' ? 'تصفية حسب الفئة' : 'Filter by category'}
          </p>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-200/30">
          {categories.map((cat, index) => (
            <li key={cat.name} className="group" 
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}>
              {/* Category Button */}
              <div className="relative">
                <div
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`w-full text-left block px-6 py-4 transition-all duration-300 cursor-pointer relative ${
                    activeCategory === cat.name
                      ? 'bg-gradient-to-r from-purple-200 to-blue-200 text-purple-900 font-medium shadow-sm'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-white/70 hover:to-white/40 hover:text-gray-900'
                  } ${isTransitioning ? 'pointer-events-none opacity-70' : ''}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(cat.name);
                      }}
                      className={`transform transition-transform duration-300 cursor-pointer ${
                        expandedCategories.includes(cat.name) ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Subcategories */}
              <div
                className={`overflow-hidden transition-all duration-700 ease-out ${
                  expandedCategories.includes(cat.name) 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform -translate-y-4 pointer-events-none'
                }`}
                style={{
                  maxHeight: expandedCategories.includes(cat.name) ? `${cat.sub.length * 48}px` : '0px',
                  overflow: 'hidden',
                }}
              >
                <ul className="bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-sm border-l-4 border-purple-300">
                  {cat.sub.map((sub, subIndex) => (
                    <li key={sub} className="relative"
                        style={{
                          animation: expandedCategories.includes(cat.name) 
                            ? `slideInLeft 0.5s ease-out ${subIndex * 0.1}s both` 
                            : 'none'
                        }}>
                      <button
                        onClick={() => handleSubcategoryClick(sub)}
                        className={`w-full text-left block px-8 py-3 transition-all duration-300 cursor-pointer relative ${
                          activeSubcategory === sub
                            ? 'bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 font-medium shadow-sm'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-white/70 hover:to-white/40 hover:text-gray-900'
                        } ${isTransitioning ? 'pointer-events-none opacity-70' : ''}`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            activeSubcategory === sub
                              ? 'bg-blue-500 shadow-md'
                              : 'bg-gray-400 group-hover:bg-purple-400'
                          }`}></span>
                          <span>{sub}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Reset Filters Button (only when filters are active) */}
      {(activeCategory || activeSubcategory) && (
        <div className="p-4 border-t border-gray-200/30 bg-white/50 backdrop-blur-sm"
             style={{ animation: 'bounceIn 0.6s ease-out' }}>
          <button
            onClick={handleResetFilters}
            className={`w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 ${
              isTransitioning ? 'pointer-events-none opacity-70' : ''
            }`}
          >
            <span className="text-lg animate-spin-slow">🔄</span>
            {language === 'fr' ? 'Réinitialiser les filtres' : language === 'ar' ? 'إعادة تعيين المرشحات' : 'Reset Filters'}
          </button>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </aside>
  );
}