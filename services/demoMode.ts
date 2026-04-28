/**
 * Demo Mode Configuration
 * Enable this to use mock data instead of real API calls
 */

// Set to true to enable demo mode (no API needed)
// Set to false to use real API
export const DEMO_MODE = false;

// Demo user data
export const DEMO_USER = {
  id: 'demo-user-1',
  public_id: 'demo-user-1',
  phone: '+1234567890',
  email: 'demo@usrah.app',
  full_name: 'أحمد محمد',
  avatar: null,
  gender: 'male',
  is_verified: true,
  families: [{
    id: 'demo-family-1',
    name: 'عائلة الديمو',
    role: 'admin',
  }],
};

// Demo tokens
export const DEMO_TOKENS = {
  access: 'demo-access-token',
  refresh: 'demo-refresh-token',
};

// Demo family data
export const DEMO_FAMILY = {
  id: 'demo-family-1',
  name: 'عائلة الديمو',
  invite_code: 'DEMO123',
  members: [
    { id: '1', user: { full_name: 'أحمد محمد', avatar: null }, role: 'admin' },
    { id: '2', user: { full_name: 'فاطمة أحمد', avatar: null }, role: 'member' },
    { id: '3', user: { full_name: 'محمد أحمد', avatar: null }, role: 'member' },
  ],
};

// Demo transactions - comprehensive financial tracking
export const DEMO_TRANSACTIONS = [
  // Regular expenses
  { id: '1', type: 'expense', amount: 150, currency: 'TND', category: { name: 'Groceries', name_ar: 'البقالة', icon: '🛒' }, description: 'مشتريات السوبر ماركت', date: '2026-04-21', created_by: { full_name: 'أحمد' } },
  { id: '2', type: 'expense', amount: 80, currency: 'TND', category: { name: 'Transport', name_ar: 'المواصلات', icon: '🚗' }, description: 'بنزين', date: '2026-04-20', created_by: { full_name: 'أحمد' } },
  { id: '3', type: 'income', amount: 3000, currency: 'TND', category: { name: 'Salary', name_ar: 'الراتب', icon: '💰' }, description: 'راتب شهر أبريل', date: '2026-04-15', created_by: { full_name: 'أحمد' } },
  { id: '4', type: 'expense', amount: 200, currency: 'TND', category: { name: 'Bills', name_ar: 'الفواتير', icon: '📄' }, description: 'فاتورة الكهرباء', date: '2026-04-10', created_by: { full_name: 'فاطمة' } },
  { id: '5', type: 'expense', amount: 50, currency: 'TND', category: { name: 'Education', name_ar: 'التعليم', icon: '📚' }, description: 'كتب مدرسية', date: '2026-04-08', created_by: { full_name: 'فاطمة' } },
  // Wasted/Lost money
  { id: '6', type: 'expense', amount: 45, currency: 'TND', category: { name: 'Wasted', name_ar: 'مصاريف ضائعة', icon: '🗑️' }, description: 'اشتراك لم أستخدمه', date: '2026-04-05', created_by: { full_name: 'أحمد' } },
  // Gift given
  { id: '7', type: 'expense', amount: 100, currency: 'TND', category: { name: 'Gift Given', name_ar: 'هدية مقدمة', icon: '🎁' }, description: 'هدية عيد ميلاد صديق', date: '2026-04-03', created_by: { full_name: 'فاطمة' } },
  // Gift received
  { id: '8', type: 'income', amount: 200, currency: 'TND', category: { name: 'Gift Received', name_ar: 'هدية مستلمة', icon: '🎀' }, description: 'هدية من الجدة', date: '2026-04-01', created_by: { full_name: 'محمد' } },
  // Investment contribution
  { id: '9', type: 'expense', amount: 500, currency: 'TND', category: { name: 'Investment', name_ar: 'استثمار', icon: '📈' }, description: 'إيداع في صندوق الاستثمار', date: '2026-03-28', created_by: { full_name: 'أحمد' } },
  // Emergency fund deposit
  { id: '10', type: 'expense', amount: 300, currency: 'TND', category: { name: 'Emergency Fund', name_ar: 'صندوق الطوارئ', icon: '🏦' }, description: 'إيداع صندوق الطوارئ', date: '2026-03-25', created_by: { full_name: 'أحمد' } },
];

// Demo categories - comprehensive
export const DEMO_CATEGORIES = [
  // Expense categories
  { id: '1', name: 'Groceries', name_ar: 'البقالة', icon: '🛒', color: '#4CAF50', type: 'expense' },
  { id: '2', name: 'Transport', name_ar: 'المواصلات', icon: '🚗', color: '#2196F3', type: 'expense' },
  { id: '3', name: 'Bills', name_ar: 'الفواتير', icon: '📄', color: '#FF9800', type: 'expense' },
  { id: '4', name: 'Education', name_ar: 'التعليم', icon: '📚', color: '#9C27B0', type: 'expense' },
  { id: '5', name: 'Healthcare', name_ar: 'الصحة', icon: '🏥', color: '#F44336', type: 'expense' },
  { id: '6', name: 'Entertainment', name_ar: 'الترفيه', icon: '🎬', color: '#E91E63', type: 'expense' },
  { id: '7', name: 'Clothing', name_ar: 'الملابس', icon: '👕', color: '#00BCD4', type: 'expense' },
  { id: '8', name: 'Gift Given', name_ar: 'هدية مقدمة', icon: '🎁', color: '#FF5722', type: 'expense' },
  { id: '9', name: 'Wasted', name_ar: 'مصاريف ضائعة', icon: '🗑️', color: '#795548', type: 'expense' },
  { id: '10', name: 'Investment', name_ar: 'استثمار', icon: '📈', color: '#3F51B5', type: 'expense' },
  { id: '11', name: 'Emergency Fund', name_ar: 'صندوق الطوارئ', icon: '🏦', color: '#607D8B', type: 'expense' },
  { id: '12', name: 'Charity', name_ar: 'صدقة', icon: '🤲', color: '#009688', type: 'expense' },
  // Income categories
  { id: '13', name: 'Salary', name_ar: 'الراتب', icon: '💰', color: '#4CAF50', type: 'income' },
  { id: '14', name: 'Gift Received', name_ar: 'هدية مستلمة', icon: '🎀', color: '#E91E63', type: 'income' },
  { id: '15', name: 'Investment Return', name_ar: 'عائد استثمار', icon: '📊', color: '#3F51B5', type: 'income' },
  { id: '16', name: 'Bonus', name_ar: 'مكافأة', icon: '🏆', color: '#FFC107', type: 'income' },
  { id: '17', name: 'Freelance', name_ar: 'عمل حر', icon: '💼', color: '#673AB7', type: 'income' },
];

// Demo debts (borrowed/lent money)
export const DEMO_DEBTS = [
  // Money I borrowed (I owe others)
  { id: '1', type: 'borrowed', amount: 500, currency: 'TND', person: 'محمد علي', description: 'قرض لشراء لابتوب', date: '2026-03-15', due_date: '2026-06-15', status: 'pending', paid_amount: 0 },
  { id: '2', type: 'borrowed', amount: 200, currency: 'TND', person: 'خالد', description: 'سلف حتى الراتب', date: '2026-04-10', due_date: '2026-04-30', status: 'pending', paid_amount: 0 },
  // Money I lent (others owe me)
  { id: '3', type: 'lent', amount: 300, currency: 'TND', person: 'أخي أحمد', description: 'مساعدة في إيجار الشهر', date: '2026-02-20', due_date: '2026-05-20', status: 'pending', paid_amount: 100 },
  { id: '4', type: 'lent', amount: 150, currency: 'TND', person: 'صديق العمل سامي', description: 'سلف طوارئ', date: '2026-04-05', due_date: '2026-04-20', status: 'paid', paid_amount: 150 },
];

// Demo investments
export const DEMO_INVESTMENTS = [
  { id: '1', name: 'صندوق الأسهم', type: 'stocks', initial_amount: 5000, current_value: 5450, currency: 'TND', profit_loss: 450, percentage: 9, start_date: '2025-06-01', status: 'active' },
  { id: '2', name: 'ذهب', type: 'gold', initial_amount: 2000, current_value: 2200, currency: 'TND', profit_loss: 200, percentage: 10, start_date: '2025-09-15', status: 'active' },
  { id: '3', name: 'عقار استثماري', type: 'real_estate', initial_amount: 50000, current_value: 55000, currency: 'TND', profit_loss: 5000, percentage: 10, start_date: '2024-01-01', status: 'active' },
];

// Demo emergency fund
export const DEMO_EMERGENCY_FUND = {
  id: '1',
  name: 'صندوق الطوارئ',
  target_amount: 10000,
  current_amount: 3500,
  currency: 'TND',
  status: 'active',
  monthly_contribution: 300,
  last_contribution: '2026-04-01',
  history: [
    { id: '1', amount: 300, date: '2026-04-01', type: 'deposit' },
    { id: '2', amount: 300, date: '2026-03-01', type: 'deposit' },
    { id: '3', amount: 500, date: '2026-02-15', type: 'withdraw', reason: 'إصلاح السيارة' },
    { id: '4', amount: 300, date: '2026-02-01', type: 'deposit' },
  ],
};

// Demo tasks
export const DEMO_TASKS = [
  { id: '1', title: 'تنظيف الغرفة', description: 'ترتيب وتنظيف غرفة النوم', status: 'pending', priority: 'medium', assigned_to: { full_name: 'محمد' }, due_date: '2026-04-22', points: 10 },
  { id: '2', title: 'شراء الخضروات', description: 'شراء خضروات للأسبوع', status: 'completed', priority: 'high', assigned_to: { full_name: 'فاطمة' }, due_date: '2026-04-21', points: 15 },
  { id: '3', title: 'مراجعة الدروس', description: 'مراجعة دروس الرياضيات', status: 'in_progress', priority: 'high', assigned_to: { full_name: 'محمد' }, due_date: '2026-04-23', points: 20 },
  { id: '4', title: 'دفع فاتورة الماء', description: 'دفع فاتورة الماء الشهرية', status: 'pending', priority: 'low', assigned_to: { full_name: 'أحمد' }, due_date: '2026-04-25', points: 5 },
];

// Demo recipes
export const DEMO_RECIPES = [
  { id: '1', title: 'كبسة دجاج', title_ar: 'كبسة دجاج', description: 'وصفة كبسة سعودية تقليدية', prep_time: 30, cook_time: 60, servings: 6, difficulty: 'medium', image: null, author: { full_name: 'فاطمة' }, rating: 4.8, ratings_count: 12 },
  { id: '2', title: 'شوربة عدس', title_ar: 'شوربة عدس', description: 'شوربة عدس صحية ولذيذة', prep_time: 15, cook_time: 30, servings: 4, difficulty: 'easy', image: null, author: { full_name: 'فاطمة' }, rating: 4.5, ratings_count: 8 },
  { id: '3', title: 'مكرونة بالبشاميل', title_ar: 'مكرونة بالبشاميل', description: 'مكرونة بالبشاميل واللحم المفروم', prep_time: 20, cook_time: 45, servings: 8, difficulty: 'medium', image: null, author: { full_name: 'أم أحمد' }, rating: 4.9, ratings_count: 15 },
];

// Demo chat conversations
export const DEMO_CONVERSATIONS = [
  { id: '1', name: 'عائلة الديمو', type: 'family', last_message: { content: 'السلام عليكم', created_at: '2026-04-21T10:30:00Z', sender: { full_name: 'فاطمة' } }, unread_count: 2 },
  { id: '2', name: 'فاطمة أحمد', type: 'direct', last_message: { content: 'هل اشتريت الخضروات؟', created_at: '2026-04-21T09:15:00Z', sender: { full_name: 'فاطمة' } }, unread_count: 0 },
];

// Demo messages
export const DEMO_MESSAGES = [
  { id: '1', content: 'السلام عليكم', sender: { id: '2', full_name: 'فاطمة' }, created_at: '2026-04-21T10:30:00Z', is_read: true },
  { id: '2', content: 'وعليكم السلام', sender: { id: '1', full_name: 'أحمد' }, created_at: '2026-04-21T10:31:00Z', is_read: true },
  { id: '3', content: 'كيف حالكم اليوم؟', sender: { id: '2', full_name: 'فاطمة' }, created_at: '2026-04-21T10:32:00Z', is_read: false },
  { id: '4', content: 'الحمد لله بخير', sender: { id: '1', full_name: 'أحمد' }, created_at: '2026-04-21T10:33:00Z', is_read: true },
];

// Demo prayer times (Tunis)
export const DEMO_PRAYER_TIMES = {
  fajr: '04:15',
  sunrise: '05:45',
  dhuhr: '12:30',
  asr: '16:00',
  maghrib: '19:15',
  isha: '20:45',
  date: '2026-04-21',
  hijri_date: '23 شوال 1447',
  location: 'تونس',
};

// Demo adhkar
export const DEMO_ADHKAR = {
  morning: [
    { id: '1', text: 'أصبحنا وأصبح الملك لله', count: 1, category: 'morning' },
    { id: '2', text: 'اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور', count: 1, category: 'morning' },
    { id: '3', text: 'سبحان الله وبحمده', count: 100, category: 'morning' },
  ],
  evening: [
    { id: '4', text: 'أمسينا وأمسى الملك لله', count: 1, category: 'evening' },
    { id: '5', text: 'اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير', count: 1, category: 'evening' },
  ],
};

// Demo expense summary
export const DEMO_EXPENSE_SUMMARY = {
  total_income: 3000,
  total_expenses: 480,
  balance: 2520,
  currency: 'TND',
  period: 'month',
  by_category: [
    { category: 'البقالة', amount: 150, percentage: 31 },
    { category: 'الفواتير', amount: 200, percentage: 42 },
    { category: 'المواصلات', amount: 80, percentage: 17 },
    { category: 'التعليم', amount: 50, percentage: 10 },
  ],
};

// Demo goals
export const DEMO_GOALS = [
  { id: '1', name: 'صندوق الحج', target_amount: 15000, current_amount: 5500, currency: 'TND', deadline: '2027-06-01', status: 'active' },
  { id: '2', name: 'شراء سيارة', target_amount: 30000, current_amount: 12000, currency: 'TND', deadline: '2027-12-01', status: 'active' },
];

// Demo calendar events
export const DEMO_EVENTS = [
  { id: '1', title: 'موعد طبيب', start: '2026-04-22T10:00:00', end: '2026-04-22T11:00:00', color: '#F44336', all_day: false },
  { id: '2', title: 'اجتماع عائلي', start: '2026-04-25T18:00:00', end: '2026-04-25T21:00:00', color: '#4CAF50', all_day: false },
  { id: '3', title: 'عيد الفطر', start: '2026-04-30', end: '2026-04-30', color: '#9C27B0', all_day: true },
];
