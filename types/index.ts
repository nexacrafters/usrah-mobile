/**
 * Usrah Mobile App Types
 * Re-exports all types from models.ts and adds additional client-side types
 */

// Re-export all API models
export * from './models';

// ==================== Client-Side Types ====================

// Legacy User type (for backwards compatibility with existing code)
export interface UserLegacy {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  avatar?: string;
  gender: 'male' | 'female';
  publicKey: string;
  prayerMethod: PrayerMethodLegacy;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  settings: FamilySettings;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  user: User;
  role: FamilyRole;
  nickname?: string;
  joinedAt: string;
  permissions: MemberPermissions;
}

export type FamilyRole = 'husband' | 'wife' | 'son' | 'daughter' | 'father' | 'mother' | 'brother' | 'sister' | 'other';

export interface FamilySettings {
  currency: string;
  language: string;
  prayerMethod: PrayerMethod;
  sistersCircleEnabled: boolean;
}

export interface MemberPermissions {
  canManageExpenses: boolean;
  canAssignTasks: boolean;
  canManageRecipes: boolean;
  canInviteMembers: boolean;
  canAccessSistersCircle: boolean;
}

// Chat Types
export interface Conversation {
  id: string;
  familyId: string;
  type: 'direct' | 'group' | 'sisters-circle';
  name?: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  contentEncrypted: string;
  content?: string; // Decrypted content
  messageType: MessageType;
  replyToId?: string;
  replyTo?: Message;
  reactions: MessageReaction[];
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  metadata?: MessageMetadata;
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'file' | 'location';

export interface MessageReaction {
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface MessageStatus {
  messageId: string;
  userId: string;
  deliveredAt?: string;
  readAt?: string;
}

// Social Feed Types
export interface Post {
  id: string;
  familyId: string;
  authorId: string;
  author?: User;
  contentEncrypted: string;
  content?: string;
  postType: PostType;
  media: MediaItem[];
  isSistersOnly: boolean;
  isPinned: boolean;
  expiresAt?: string;
  reactions: PostReaction[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PostType = 'text' | 'photo' | 'video' | 'story' | 'poll';

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
}

export interface PostReaction {
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export type ReactionType = 'love' | 'mashallah' | 'subhanallah' | 'alhamdulillah' | 'barakallah' | 'haha';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  contentEncrypted: string;
  content?: string;
  replyToId?: string;
  createdAt: string;
}

// Expense Types
export interface Transaction {
  id: string;
  familyId: string;
  userId: string;
  user?: User;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  categoryId: string;
  category?: Category;
  description: string;
  receiptImage?: string;
  date: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  familyId?: string;
  name: string;
  nameAr?: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  budgetLimit?: number;
}

export interface Budget {
  id: string;
  familyId: string;
  categoryId: string;
  category?: Category;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

export interface ZakatAsset {
  id: string;
  familyId: string;
  userId: string;
  assetType: ZakatAssetType;
  amount: number;
  currency: string;
  weightGrams?: number;
  dateAcquired: string;
  updatedAt: string;
}

export type ZakatAssetType = 'cash' | 'gold' | 'silver' | 'investment' | 'business' | 'property';

export interface ZakatCalculation {
  totalAssets: number;
  nisabThreshold: number;
  isZakatDue: boolean;
  zakatAmount: number;
  hawlDate: string;
  breakdown: {
    cash: number;
    gold: number;
    silver: number;
    investments: number;
    business: number;
  };
}

// Task Types
export interface Task {
  id: string;
  familyId: string;
  createdBy: string;
  creator?: User;
  assignedTo?: string;
  assignee?: User;
  title: string;
  description?: string;
  category?: string;
  priority: TaskPriority;
  dueDate?: string;
  reminderAt?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  status: TaskStatus;
  completedAt?: string;
  points: number;
  subtasks: Subtask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  createdAt: string;
}

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  uploadedAt: string;
}

// Recipe Types
export interface Recipe {
  id: string;
  familyId: string;
  createdBy: string;
  creator?: User;
  title: string;
  description?: string;
  coverImage?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: RecipeCategory;
  tags: string[];
  originStory?: string;
  originalAuthor?: string;
  isFavorite: boolean;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  cookHistory: RecipeCooked[];
  avgRating: number;
  createdAt: string;
  updatedAt: string;
}

export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'beverage' | 'ramadan' | 'eid';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  order: number;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  image?: string;
  video?: string;
  durationMinutes?: number;
  tips?: string;
}

export interface RecipeCooked {
  id: string;
  recipeId: string;
  userId: string;
  user?: User;
  cookedAt: string;
  rating: number;
  notes?: string;
  photo?: string;
}

// Islamic Types (Legacy)
export type PrayerMethodLegacy = 'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Jafari';

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  hijriDate: HijriDate;
}

export interface HijriDate {
  day: number;
  month: number;
  monthName: string;
  monthNameAr: string;
  year: number;
  formatted: string;
}

export interface SalahLog {
  id: string;
  userId: string;
  prayer: PrayerName;
  date: string;
  prayedAt: string;
  isOnTime: boolean;
  isJamaah: boolean;
}

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'tarawih' | 'tahajjud';

export interface FastingLog {
  id: string;
  userId: string;
  date: string;
  type: 'ramadan' | 'optional' | 'makeup';
  isCompleted: boolean;
  notes?: string;
}

export interface DhikrCounter {
  id: string;
  userId: string;
  type: string;
  count: number;
  goal: number;
  date: string;
}

export interface QuranProgress {
  id: string;
  userId: string;
  currentJuz: number;
  currentSurah: number;
  currentAyah: number;
  completions: number;
  lastReadAt: string;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  familyId: string;
  createdBy: string;
  title: string;
  description?: string;
  startDatetime: string;
  endDatetime: string;
  allDay: boolean;
  location?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  reminderMinutes?: number;
  eventType: EventType;
  attendees: string[];
  color?: string;
  createdAt: string;
}

export type EventType = 'family' | 'personal' | 'islamic' | 'birthday' | 'anniversary' | 'medical' | 'school';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  phone: string;
  email?: string;
  fullName: string;
  password: string;
  gender: 'male' | 'female';
}

export interface OTPVerification {
  phone: string;
  otp: string;
}
