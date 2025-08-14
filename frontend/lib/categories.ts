export interface CategoryType {
  name: string;
  sub: string[];
  icon: string;
}

// Category translations
const categoryTranslations: Record<string, Record<string, string>> = {
  en: {
    'Smartphones': 'Smartphones',
    'Computers': 'Computers',
    'Audio': 'Audio',
    'Gaming': 'Gaming',
    'Accessories': 'Accessories',
    'iPhone': 'iPhone',
    'Samsung': 'Samsung',
    'Android': 'Android',
    'Laptops': 'Laptops',
    'Desktops': 'Desktops',
    'Gaming PCs': 'Gaming PCs',
    'Components': 'Components',
    'Headphones': 'Headphones',
    'Speakers': 'Speakers',
    'Microphones': 'Microphones',
    'Systems': 'Systems',
    'Consoles': 'Consoles',
    'Controllers': 'Controllers',
    'Games': 'Games',
    'Chargers': 'Chargers',
    'Cases': 'Cases',
    'Cables': 'Cables',
    'Storage': 'Storage',
  },
  fr: {
    'Smartphones': 'Smartphones',
    'Computers': 'Ordinateurs',
    'Audio': 'Audio',
    'Gaming': 'Jeux Vidéo',
    'Accessories': 'Accessoires',
    'iPhone': 'iPhone',
    'Samsung': 'Samsung',
    'Android': 'Android',
    'Laptops': 'Ordinateurs Portables',
    'Desktops': 'Ordinateurs de Bureau',
    'Gaming PCs': 'PC Gaming',
    'Components': 'Composants',
    'Headphones': 'Écouteurs',
    'Speakers': 'Haut-parleurs',
    'Microphones': 'Microphones',
    'Systems': 'Systèmes',
    'Consoles': 'Consoles',
    'Controllers': 'Manettes',
    'Games': 'Jeux',
    'Chargers': 'Chargeurs',
    'Cases': 'Étuis',
    'Cables': 'Câbles',
    'Storage': 'Stockage',
  },
  ar: {
    'Smartphones': 'الهواتف الذكية',
    'Computers': 'أجهزة الكمبيوتر',
    'Audio': 'الصوت',
    'Gaming': 'الألعاب',
    'Accessories': 'الملحقات',
    'iPhone': 'آيفون',
    'Samsung': 'سامسونج',
    'Android': 'أندرويد',
    'Laptops': 'أجهزة الكمبيوتر المحمولة',
    'Desktops': 'أجهزة الكمبيوتر المكتبية',
    'Gaming PCs': 'أجهزة الكمبيوتر للألعاب',
    'Components': 'المكونات',
    'Headphones': 'سماعات الرأس',
    'Speakers': 'مكبرات الصوت',
    'Microphones': 'الميكروفونات',
    'Systems': 'الأنظمة',
    'Consoles': 'أجهزة الألعاب',
    'Controllers': 'أجهزة التحكم',
    'Games': 'الألعاب',
    'Chargers': 'الشواحن',
    'Cases': 'الأغلفة',
    'Cables': 'الكابلات',
    'Storage': 'التخزين',
  }
};

// Base categories structure
const baseCategories: CategoryType[] = [
  {
    name: 'Smartphones',
    sub: ['iPhone', 'Samsung', 'Android', 'Accessories'],
    icon: '📱',
  },
  {
    name: 'Computers',
    sub: ['Laptops', 'Desktops', 'Gaming PCs', 'Components'],
    icon: '💻',
  },
  {
    name: 'Audio',
    sub: ['Headphones', 'Speakers', 'Microphones', 'Systems'],
    icon: '🎧',
  },
  {
    name: 'Gaming',
    sub: ['Consoles', 'Controllers', 'Games', 'Accessories'],
    icon: '🎮',
  },
  {
    name: 'Accessories',
    sub: ['Chargers', 'Cases', 'Cables', 'Storage'],
    icon: '🔌',
  },
];

// Function to get translated categories
export const getCategories = (language: 'en' | 'fr' | 'ar' = 'en'): CategoryType[] => {
  const translations = categoryTranslations[language];
  
  return baseCategories.map(category => ({
    ...category,
    name: translations[category.name] || category.name,
    sub: category.sub.map(sub => translations[sub] || sub),
  }));
};

// Export base categories for backward compatibility
export const categories = getCategories('en'); 