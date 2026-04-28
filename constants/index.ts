export * from './colors';

export const APP_NAME = 'Usrah';
export const APP_NAME_AR = 'أسرة';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// Border Radius
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Font Sizes
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Font Weights
export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  glow: {
    shadowColor: '#3d8b6f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  glowGold: {
    shadowColor: '#D8BA61',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 15,
  },
};

// Prayer Methods
export const PrayerMethods = [
  { id: 'MWL', name: 'Muslim World League', nameAr: 'رابطة العالم الإسلامي' },
  { id: 'ISNA', name: 'Islamic Society of North America', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية' },
  { id: 'Egypt', name: 'Egyptian General Authority', nameAr: 'الهيئة المصرية العامة للمساحة' },
  { id: 'Makkah', name: 'Umm Al-Qura University, Makkah', nameAr: 'جامعة أم القرى، مكة' },
  { id: 'Karachi', name: 'University of Islamic Sciences, Karachi', nameAr: 'جامعة العلوم الإسلامية، كراتشي' },
  { id: 'Tehran', name: 'Institute of Geophysics, Tehran', nameAr: 'معهد الجيوفيزياء، طهران' },
  { id: 'Jafari', name: 'Shia Ithna-Ashari', nameAr: 'الشيعة الاثني عشرية' },
] as const;

// Default Expense Categories
export const DefaultCategories = {
  expense: [
    { id: 'food', name: 'Food & Groceries', nameAr: 'طعام وبقالة', icon: 'shopping-cart', color: '#22c55e' },
    { id: 'bills', name: 'Bills & Utilities', nameAr: 'فواتير ومرافق', icon: 'file-text', color: '#3b82f6' },
    { id: 'transport', name: 'Transportation', nameAr: 'مواصلات', icon: 'car', color: '#f59e0b' },
    { id: 'health', name: 'Health & Medical', nameAr: 'صحة وطب', icon: 'heart', color: '#ef4444' },
    { id: 'education', name: 'Education', nameAr: 'تعليم', icon: 'book', color: '#8b5cf6' },
    { id: 'clothing', name: 'Clothing', nameAr: 'ملابس', icon: 'shirt', color: '#ec4899' },
    { id: 'entertainment', name: 'Entertainment', nameAr: 'ترفيه', icon: 'film', color: '#06b6d4' },
    { id: 'charity', name: 'Charity & Zakat', nameAr: 'صدقة وزكاة', icon: 'hand-heart', color: '#D8BA61' },
    { id: 'gifts', name: 'Gifts', nameAr: 'هدايا', icon: 'gift', color: '#f472b6' },
    { id: 'other', name: 'Other', nameAr: 'أخرى', icon: 'more-horizontal', color: '#64748b' },
  ],
  income: [
    { id: 'salary', name: 'Salary', nameAr: 'راتب', icon: 'briefcase', color: '#22c55e' },
    { id: 'business', name: 'Business', nameAr: 'أعمال تجارية', icon: 'building', color: '#3b82f6' },
    { id: 'investment', name: 'Investment', nameAr: 'استثمار', icon: 'trending-up', color: '#8b5cf6' },
    { id: 'gift', name: 'Gift', nameAr: 'هدية', icon: 'gift', color: '#f472b6' },
    { id: 'other', name: 'Other', nameAr: 'أخرى', icon: 'more-horizontal', color: '#64748b' },
  ],
};

// Recipe Categories
export const RecipeCategories = [
  { id: 'breakfast', name: 'Breakfast', nameAr: 'فطور', icon: 'sunrise' },
  { id: 'lunch', name: 'Lunch', nameAr: 'غداء', icon: 'sun' },
  { id: 'dinner', name: 'Dinner', nameAr: 'عشاء', icon: 'moon' },
  { id: 'dessert', name: 'Dessert', nameAr: 'حلويات', icon: 'cake' },
  { id: 'snack', name: 'Snack', nameAr: 'وجبة خفيفة', icon: 'cookie' },
  { id: 'beverage', name: 'Beverage', nameAr: 'مشروبات', icon: 'coffee' },
  { id: 'ramadan', name: 'Ramadan Special', nameAr: 'رمضان', icon: 'moon-star' },
  { id: 'eid', name: 'Eid Special', nameAr: 'العيد', icon: 'sparkles' },
];

// Task Priorities
export const TaskPriorities = [
  { id: 'urgent', name: 'Urgent', nameAr: 'عاجل', color: '#ef4444' },
  { id: 'high', name: 'High', nameAr: 'عالي', color: '#f59e0b' },
  { id: 'normal', name: 'Normal', nameAr: 'عادي', color: '#3b82f6' },
  { id: 'low', name: 'Low', nameAr: 'منخفض', color: '#64748b' },
];

// Islamic Months
export const HijriMonths = [
  { id: 1, name: 'Muharram', nameAr: 'محرم' },
  { id: 2, name: 'Safar', nameAr: 'صفر' },
  { id: 3, name: 'Rabi al-Awwal', nameAr: 'ربيع الأول' },
  { id: 4, name: 'Rabi al-Thani', nameAr: 'ربيع الثاني' },
  { id: 5, name: 'Jumada al-Awwal', nameAr: 'جمادى الأولى' },
  { id: 6, name: 'Jumada al-Thani', nameAr: 'جمادى الثانية' },
  { id: 7, name: 'Rajab', nameAr: 'رجب' },
  { id: 8, name: 'Shaban', nameAr: 'شعبان' },
  { id: 9, name: 'Ramadan', nameAr: 'رمضان' },
  { id: 10, name: 'Shawwal', nameAr: 'شوال' },
  { id: 11, name: 'Dhul Qadah', nameAr: 'ذو القعدة' },
  { id: 12, name: 'Dhul Hijjah', nameAr: 'ذو الحجة' },
];

// Reactions
export const Reactions = [
  { id: 'love', emoji: '❤️', name: 'Love', nameAr: 'حب' },
  { id: 'mashallah', emoji: '✨', name: 'Mashallah', nameAr: 'ما شاء الله' },
  { id: 'subhanallah', emoji: '🤲', name: 'Subhanallah', nameAr: 'سبحان الله' },
  { id: 'alhamdulillah', emoji: '🙏', name: 'Alhamdulillah', nameAr: 'الحمد لله' },
  { id: 'barakallah', emoji: '💫', name: 'Barakallah', nameAr: 'بارك الله' },
  { id: 'haha', emoji: '😄', name: 'Haha', nameAr: 'هاها' },
];

// Zakat Nisab (approximate values - should be fetched from API)
export const ZakatNisab = {
  goldGrams: 85, // 85 grams of gold
  silverGrams: 595, // 595 grams of silver
  zakatRate: 0.025, // 2.5%
};

// Adhkar Types
export const AdhkarTypes = [
  { id: 'morning', name: 'Morning Adhkar', nameAr: 'أذكار الصباح', icon: 'sunrise' },
  { id: 'evening', name: 'Evening Adhkar', nameAr: 'أذكار المساء', icon: 'sunset' },
  { id: 'sleep', name: 'Sleep Adhkar', nameAr: 'أذكار النوم', icon: 'moon' },
  { id: 'prayer', name: 'After Prayer', nameAr: 'بعد الصلاة', icon: 'mosque' },
  { id: 'travel', name: 'Travel Adhkar', nameAr: 'أذكار السفر', icon: 'plane' },
];
