'use client';

import { useState } from 'react';
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
  const { t, language } = useLanguage();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const categories = getCategories(language);

  const toggleCategory = (name: string) => {
    setExpandedCategory(prev => (prev === name ? null : name));
  };

  const handleCategoryClick = (categoryName: string) => {
    toggleCategory(categoryName);
    onCategoryFilterAction(categoryName);
  };

  const handleSubcategoryClick = (subcategoryName: string) => {
    onSubcategoryFilterAction(subcategoryName);
  };

  return (
    <aside className="w-full md:w-64 mb-8 md:mb-0 md:mr-8 rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 backdrop-blur-sm flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-blue-600/90"></div>
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="tracking-wide">{t('electronics_hub')}</span>
          </h2>
          <p className="text-purple-100 text-sm mt-1 font-medium">{t('browse_by_category')}</p>
        </div>
      </div>


      
      {/* Categories List */}
      <div className="overflow-y-auto custom-scrollbar flex-1">
        <ul className="divide-y divide-gray-200/30">
          {categories.map(cat => (
            <li key={cat.name} className="group">
              <div className="flex items-center justify-between px-6 py-4">
                <button
                  onClick={() => onCategoryFilterAction(cat.name)}
                  className={`flex items-center space-x-3 text-left transition-all duration-300 focus:outline-none ${
                    activeCategory === cat.name
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 shadow-inner'
                      : 'text-gray-800 hover:bg-gradient-to-r hover:from-white/60 hover:to-white/30'
                  }`}
                  style={{ flex: 1 }}
                >
                  <span className={`text-lg transition-transform duration-300 ${
                    activeCategory === cat.name ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    {cat.icon}
                  </span>
                  <span className="font-medium">{cat.name}</span>
                </button>
                <button
                  onClick={() => setExpandedCategory(prev => (prev === cat.name ? null : cat.name))}
                  className={`ml-2 transition-all duration-300 focus:outline-none ${
                    expandedCategory === cat.name ? 'rotate-180' : 'group-hover:rotate-12'
                  }`}
                  aria-label={t('expand_subcategories')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {/* Subcategories */}
              <div
                style={{
                  maxHeight: expandedCategory === cat.name ? cat.sub.length * 48 + 'px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ul className="bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-sm border-l-4 border-purple-300">
                  {cat.sub.map(sub => (
                    <li key={sub} className="relative">
                      <button
                        onClick={() => onSubcategoryFilterAction(sub)}
                        className={`w-full text-left block px-8 py-3 transition-all duration-300 cursor-pointer relative ${
                          activeSubcategory === sub
                            ? 'bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 font-medium shadow-sm'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-white/70 hover:to-white/40 hover:text-gray-900'
                        }`}
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

      {/* Reset Filters Button (only when a category is selected) */}
      {activeCategory && (
        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-white/30 to-white/10 shrink-0">
          <button
            onClick={() => {
              onCategoryFilterAction('');
              onSubcategoryFilterAction('');
              setExpandedCategory(null);
            }}
            className="w-full px-4 py-3 text-sm font-semibold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center gap-3">
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              <span className="tracking-wide">{t('reset_filters')}</span>
              <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}