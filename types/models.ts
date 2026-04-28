/**
 * TypeScript Models for Usrah App
 * Based on Django API models
 */

// ==================== User & Auth ====================

export type Gender = 'male' | 'female';

export type PrayerMethod =
  | 'MWL'      // Muslim World League
  | 'ISNA'    // Islamic Society of North America
  | 'Egypt'   // Egyptian General Authority
  | 'Makkah'  // Umm Al-Qura University
  | 'Karachi' // University of Islamic Sciences
  | 'Tehran'  // Institute of Geophysics, Tehran
  | 'Jafari'; // Shia Ithna-Ashari

export interface User {
  id: string;
  public_id: string;
  phone: string;
  email?: string;
  full_name: string;
  gender: Gender;
  avatar?: string;
  bio?: string;
  public_key?: string;
  prayer_method: PrayerMethod;
  timezone: string;
  is_active: boolean;
  is_verified: boolean;
  last_seen?: string;
  created: string;
  updated: string;
}

export interface UserSession {
  id: string;
  session_id: string;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  device_name: string;
  ip_address?: string;
  is_active: boolean;
  status: 'active' | 'expired' | 'terminated';
  last_activity: string;
  created: string;
}

// Auth responses
export interface LoginResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  session_id?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface OtpResponse {
  message: string;
  phone: string;
  debug_code?: string; // Only in dev mode
  expires_in_minutes: number;
}

export interface VerifyOtpResponse {
  message: string;
  verified: boolean;
  user_exists: boolean;
}

// ==================== Family ====================

export type FamilyRole =
  | 'admin'
  | 'husband'
  | 'wife'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'relative'
  | 'other';

export type MemberStatus = 'pending' | 'active' | 'suspended' | 'removed';

export interface Family {
  id: string;
  public_id: string;
  name: string;
  description?: string;
  avatar?: string;
  cover_image?: string;
  invite_code: string;
  is_active: boolean;
  allow_join_requests: boolean;
  sisters_circle_enabled: boolean;
  created: string;
  updated: string;
  members_count?: number;
}

export interface FamilyMember {
  id: string;
  public_id: string;
  family: string; // family public_id
  user: User;
  user_id: string;
  full_name?: string;
  avatar?: string;
  role: FamilyRole;
  nickname?: string;
  is_admin: boolean;
  status: MemberStatus;
  joined_at: string;
}

export interface FamilyInvitation {
  id: string;
  public_id: string;
  family: Family;
  invited_by: User;
  invited_user?: User;
  invited_phone?: string;
  invited_name?: string;
  suggested_role: FamilyRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  expires_at: string;
  created: string;
}

export interface JoinRequest {
  id: string;
  public_id: string;
  family: Family;
  user: User;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: User;
  reviewed_at?: string;
  created: string;
}

// ==================== Expenses ====================

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';
export type CategoryType = 'income' | 'expense' | 'both';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Category {
  id: string;
  public_id: string;
  name: string;
  name_ar?: string;
  icon?: string;
  color: string;
  type: CategoryType;
  is_system: boolean;
  family?: string;
  parent?: string;
  subcategories?: Category[];
}

export interface Transaction {
  id: string;
  public_id: string;
  family: string;
  created_by: User;
  type: TransactionType;
  category?: Category;
  amount: number;
  currency: string;
  description?: string;
  notes?: string;
  date: string;
  status: TransactionStatus;
  receipt?: string;
  is_recurring: boolean;
  recurring_parent?: string;
  tags: string[];
  created: string;
  updated: string;
}

export interface RecurringTransaction {
  id: string;
  public_id: string;
  family: string;
  created_by: User;
  type: TransactionType;
  category?: Category;
  amount: number;
  currency: string;
  description?: string;
  frequency: RecurrenceFrequency;
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  is_active: boolean;
  last_generated?: string;
  created: string;
}

export interface Budget {
  id: string;
  public_id: string;
  family: string;
  category: Category;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  start_date: string;
  end_date?: string;
  alert_threshold: number;
  is_active: boolean;
  spent?: number;
  remaining?: number;
  percentage_used?: number;
  created: string;
}

export interface FinancialSummary {
  period: string;
  start_date: string;
  end_date: string;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  top_expense_categories: {
    category__name: string;
    category__color: string;
    category__icon: string;
    total: number;
  }[];
  budget_status: {
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    color: string;
  }[];
  currency: string;
}

// ==================== Zakat ====================

export type ZakatAssetType =
  | 'cash'
  | 'bank'
  | 'gold'
  | 'silver'
  | 'stock'
  | 'business'
  | 'property'
  | 'receivable'
  | 'crypto'
  | 'other';

export interface ZakatAsset {
  id: string;
  public_id: string;
  family: string;
  created_by: User;
  name: string;
  type: ZakatAssetType;
  value: number;
  currency: string;
  acquisition_date: string;
  is_zakatable: boolean;
  notes?: string;
  weight_grams?: number; // For gold/silver
  created: string;
  updated: string;
}

export interface ZakatCalculation {
  id: string;
  public_id: string;
  family: string;
  calculated_by: User;
  calculation_date: string;
  hijri_date?: string;
  total_assets: number;
  total_liabilities: number;
  nisab_value: number;
  nisab_type: 'gold' | 'silver';
  zakatable_amount: number;
  zakat_due: number;
  currency: string;
  assets_breakdown: Record<string, number>;
  is_paid: boolean;
  paid_amount: number;
  paid_date?: string;
  created: string;
}

export interface ZakatCalculationResult {
  total_assets: number;
  nisab_value: number;
  nisab_type: 'gold' | 'silver';
  zakatable_amount: number;
  zakat_due: number;
  assets_breakdown: Record<string, number>;
  currency: string;
  is_above_nisab: boolean;
  hijri_date: string;
  calculation_id?: string;
}

export interface Liability {
  id: string;
  public_id: string;
  family: string;
  created_by: User;
  name: string;
  type: 'loan' | 'mortgage' | 'credit_card' | 'personal' | 'other';
  total_amount: number;
  remaining_amount: number;
  currency: string;
  due_date?: string;
  is_deductible: boolean;
  notes?: string;
  created: string;
}

// ==================== Tasks ====================

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  public_id: string;
  family: string;
  created_by: User;
  assigned_to?: User;
  title: string;
  description?: string;
  category?: string;
  priority: TaskPriority;
  due_date?: string;
  reminder_at?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  status: TaskStatus;
  completed_at?: string;
  points: number;
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  created: string;
  updated: string;
}

export interface TaskComment {
  id: string;
  task: string;
  user: User;
  content: string;
  created: string;
}

export interface TaskAttachment {
  id: string;
  task: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export interface TaskLeaderboard {
  user_id: string;
  user?: User;
  full_name?: string;
  avatar?: string;
  tasks_completed: number;
  total_points: number;
  current_streak: number;
}

// ==================== Chat ====================

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file' | 'location';
export type ConversationType = 'direct' | 'group' | 'family' | 'sisters_circle';

export interface ConversationParticipant {
  id: string;
  user_id: string;
  full_name?: string;
  avatar?: string;
  role?: string;
}

export interface Conversation {
  id: string;
  public_id: string;
  family: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
  is_online?: boolean;
  is_muted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  public_id?: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  content_encrypted?: string;
  type: MessageType;
  reply_to_id?: string;
  reply_to?: Message;
  media_url?: string;
  metadata?: Record<string, any>;
  edited_at?: string;
  deleted_at?: string;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
  read_by?: MessageRead[];
}

export interface MessageRead {
  user_id: string;
  user?: User;
  read_at: string;
}

// ==================== Recipes ====================

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface Recipe {
  id: string;
  public_id: string;
  family: string;
  created_by: User;
  title: string;
  description?: string;
  cover_image?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  category?: string;
  tags: string[];
  origin_story?: string;
  original_author?: string;
  is_favorite: boolean;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  cooked_history?: RecipeCooked[];
  created: string;
  updated: string;
}

export interface Ingredient {
  id: string;
  recipe: string;
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
  order: number;
}

export interface RecipeStep {
  id: string;
  recipe: string;
  step_number: number;
  instruction: string;
  image?: string;
  video?: string;
  duration_minutes?: number;
  tips?: string;
}

export interface RecipeCooked {
  id: string;
  recipe: string;
  user: User;
  cooked_at: string;
  rating?: number;
  notes?: string;
  photo?: string;
}

// ==================== Social ====================

export type ReactionType = 'love' | 'mashallah' | 'subhanallah' | 'alhamdulillah' | 'barakallah' | 'haha';
export type PostType = 'text' | 'photo' | 'video' | 'story';

export interface Post {
  id: string;
  public_id: string;
  family: string;
  author: User;
  content?: string;
  content_encrypted?: string;
  post_type: PostType;
  media: PostMedia[];
  is_sisters_only: boolean;
  expires_at?: string;
  reactions_count: Record<ReactionType, number>;
  comments_count: number;
  user_reaction?: ReactionType;
  created: string;
  updated: string;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface Reaction {
  id: string;
  post: string;
  user: User;
  type: ReactionType;
  created: string;
}

export interface Comment {
  id: string;
  post: string;
  user: User;
  content: string;
  content_encrypted?: string;
  reply_to?: Comment;
  created: string;
}

// ==================== Calendar ====================

export interface CalendarEvent {
  id: string;
  public_id: string;
  family: string;
  created_by: User;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  location?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  event_type?: string;
  attendees: User[];
  created: string;
}

// ==================== Islamic ====================

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  hijri_date: string;
  method: PrayerMethod;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}

export interface Adhkar {
  id: string;
  category: 'morning' | 'evening' | 'sleep' | 'prayer' | 'travel' | 'other';
  arabic_text: string;
  transliteration?: string;
  translation?: string;
  repeat_count: number;
  reward?: string;
  source?: string;
}

export interface DailyVerse {
  verse_number: string;
  surah_name: string;
  surah_name_arabic: string;
  arabic_text: string;
  translation: string;
  tafsir?: string;
}

export interface IslamicDate {
  hijri_day: number;
  hijri_month: number;
  hijri_month_name: string;
  hijri_year: number;
  gregorian_date: string;
  is_special_day: boolean;
  special_day_name?: string;
}

// ==================== Notifications ====================

export type NotificationType =
  | 'message'
  | 'task_assigned'
  | 'task_reminder'
  | 'expense_added'
  | 'budget_alert'
  | 'prayer_time'
  | 'family_invite'
  | 'post_reaction'
  | 'comment';

export interface Notification {
  id: string;
  public_id: string;
  user: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  is_read: boolean;
  created: string;
}

// ==================== Pagination ====================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page?: number;
}
