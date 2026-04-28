/**
 * API Configuration for Usrah Mobile App
 */

// Detect development environment
const isDev = __DEV__;

// API Base URLs
export const API_CONFIG = {
  // REST API base URL
  baseUrl: isDev
    ? 'http://10.0.2.2:8000/api/v1' // Android emulator -> host machine
    : 'https://api.usrah.app/api/v1',

  // WebSocket URL for real-time chat
  wsUrl: isDev
    ? 'ws://10.0.2.2:8000/ws'
    : 'wss://api.usrah.app/ws',

  // Request timeout (30 seconds)
  timeout: 30000,

  // Retry configuration
  retries: 2,
  retryDelay: 1000, // 1 second base delay
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login/',
    register: '/auth/register/',
    logout: '/auth/logout/',
    refresh: '/auth/token/refresh/',
    sendOtp: '/auth/otp/send/',
    verifyOtp: '/auth/otp/verify/',
    checkPhone: '/auth/check-phone/',
    changePassword: '/auth/password/change/',
    resetPasswordRequest: '/auth/password/reset/',
    resetPasswordConfirm: '/auth/password/reset/confirm/',
    // Security & Sessions
    sessions: '/auth/sessions/',
    terminateSession: (id: string) => `/auth/sessions/${id}/terminate/`,
    terminateAllSessions: '/auth/sessions/terminate-all/',
    securityAlerts: '/auth/security/alerts/',
    securityAlertDetail: (id: string) => `/auth/security/alerts/${id}/`,
    // Biometric & PIN
    biometricRegister: '/auth/biometric/register/',
    biometricVerify: '/auth/biometric/verify/',
    pinSet: '/auth/pin/set/',
    pinVerify: '/auth/pin/verify/',
    // Device Trust
    trustDevice: '/auth/devices/trust/',
    removeDevice: (id: string) => `/auth/devices/${id}/`,
  },

  // Users
  users: {
    me: '/users/me/',
    profile: '/users/profile/',
    updateProfile: '/users/profile/',
    sessions: '/users/sessions/',
  },

  // Families
  families: {
    list: '/families/',
    create: '/families/',
    detail: (id: string) => `/families/${id}/`,
    join: '/families/join/',
    members: (id: string) => `/families/${id}/members/`,
    invite: (id: string) => `/families/${id}/invite/`,
    invitations: '/families/invitations/',
  },

  // Expenses
  expenses: {
    transactions: '/expenses/transactions/',
    transactionDetail: (id: string) => `/expenses/transactions/${id}/`,
    categories: '/expenses/categories/',
    categoryDetail: (id: string) => `/expenses/categories/${id}/`,
    budgets: '/expenses/budgets/',
    budgetDetail: (id: string) => `/expenses/budgets/${id}/`,
    summary: '/expenses/summary/',
    recurring: '/expenses/recurring/',
  },

  // Zakat
  zakat: {
    assets: '/expenses/zakat/assets/',
    assetDetail: (id: string) => `/expenses/zakat/assets/${id}/`,
    calculate: '/expenses/zakat/calculate/',
    calculations: '/expenses/zakat/calculations/',
    markPaid: (id: string) => `/expenses/zakat/calculations/${id}/paid/`,
    liabilities: '/expenses/liabilities/',
  },

  // Tasks
  tasks: {
    list: '/tasks/',
    create: '/tasks/',
    detail: (id: string) => `/tasks/${id}/`,
    complete: (id: string) => `/tasks/${id}/complete/`,
    assign: (id: string) => `/tasks/${id}/assign/`,
    subtasks: (id: string) => `/tasks/${id}/subtasks/`,
    toggleSubtask: (taskId: string, subtaskId: string) => `/tasks/${taskId}/subtasks/${subtaskId}/toggle/`,
    comments: (id: string) => `/tasks/${id}/comments/`,
    attachments: (id: string) => `/tasks/${id}/attachments/`,
    leaderboard: '/tasks/leaderboard/',
    stats: '/tasks/stats/',
    myTasks: '/tasks/my-tasks/',
    assignedByMe: '/tasks/assigned-by-me/',
    templates: '/tasks/templates/',
    fromTemplate: (id: string) => `/tasks/from-template/${id}/`,
    voiceToTask: '/tasks/voice-to-task/',
    kanban: '/tasks/kanban/',
    categories: '/tasks/categories/',
  },

  // Achievements
  achievements: {
    list: '/achievements/',
    mine: '/achievements/mine/',
  },

  // Chat
  chat: {
    conversations: '/chat/conversations/',
    conversationDetail: (id: string) => `/chat/conversations/${id}/`,
    messages: (conversationId: string) => `/chat/conversations/${conversationId}/messages/`,
    messageDetail: (id: string) => `/chat/messages/${id}/`,
    markRead: (id: string) => `/chat/messages/${id}/read/`,
    unread: '/chat/unread/',
    // Voice messages
    sendVoice: (conversationId: string) => `/chat/conversations/${conversationId}/voice/`,
    // Location sharing
    shareLocation: (conversationId: string) => `/chat/conversations/${conversationId}/location/`,
    // Contact sharing
    shareContact: (conversationId: string) => `/chat/conversations/${conversationId}/contact/`,
    // Calls
    startCall: '/chat/calls/start/',
    answerCall: (id: string) => `/chat/calls/${id}/answer/`,
    rejectCall: (id: string) => `/chat/calls/${id}/reject/`,
    endCall: (id: string) => `/chat/calls/${id}/end/`,
    callHistory: '/chat/calls/history/',
  },

  // Recipes
  recipes: {
    list: '/recipes/',
    create: '/recipes/',
    detail: (id: string) => `/recipes/${id}/`,
    cooked: (id: string) => `/recipes/${id}/cooked/`,
    history: (id: string) => `/recipes/${id}/history/`,
    shoppingList: '/recipes/shopping-list/',
    // Meal planning
    mealPlan: '/recipes/meal-plan/',
    mealPlanWeek: '/recipes/meal-plan/week/',
    // Video/voice instructions
    addVideo: (id: string) => `/recipes/${id}/video/`,
    addVoice: (id: string) => `/recipes/${id}/voice/`,
  },

  // Islamic
  islamic: {
    prayerTimes: '/islamic/prayer-times/',
    adhkar: '/islamic/adhkar/',
    dailyVerse: '/islamic/daily-verse/',
    dailyHadith: '/islamic/daily-hadith/',
    islamicDates: '/islamic/dates/',
    // Salah Tracking
    logPrayer: '/islamic/prayer/log/',
    prayerToday: '/islamic/prayer/today/',
    prayerStreak: '/islamic/prayer/streak/',
    prayerFamily: '/islamic/prayer/family/',
    // Fasting
    logFast: '/islamic/fasting/log/',
    fastingRamadan: '/islamic/fasting/ramadan/',
    fastingMissed: '/islamic/fasting/missed/',
    fastingKaffarah: '/islamic/fasting/kaffarah/',
    // Dhikr
    dhikrCount: '/islamic/dhikr/count/',
    dhikrToday: '/islamic/dhikr/today/',
    dhikrTypes: '/islamic/dhikr/types/',
    // Quran
    quranProgress: '/islamic/quran/progress/',
    quranRead: '/islamic/quran/read/',
    quranFamily: '/islamic/quran/family/',
    quranGoal: '/islamic/quran/goal/',
    // Duas & Names
    duas: '/islamic/duas/',
    duasByCategory: (category: string) => `/islamic/duas/${category}/`,
    allahNames: '/islamic/allah-names/',
    // Hajj/Umrah
    hajjPlan: '/islamic/hajj-plan/',
    hajjPlanDetail: (id: string) => `/islamic/hajj-plan/${id}/`,
    hajjChecklist: (id: string) => `/islamic/hajj-plan/${id}/checklist/`,
    hajjChecklistToggle: (planId: string, itemId: string) => `/islamic/hajj-plan/${planId}/checklist/${itemId}/`,
    // Sadaqah
    sadaqah: '/islamic/sadaqah/',
    sadaqahStats: '/islamic/sadaqah/stats/',
    sadaqahGoals: '/islamic/sadaqah/goals/',
  },

  // Social
  social: {
    posts: '/social/posts/',
    postDetail: (id: string) => `/social/posts/${id}/`,
    reactions: (postId: string) => `/social/posts/${postId}/reactions/`,
    comments: (postId: string) => `/social/posts/${postId}/comments/`,
    savePost: (id: string) => `/social/posts/${id}/save/`,
    pinPost: (id: string) => `/social/posts/${id}/pin/`,
    stories: '/social/stories/',
    storyView: (id: string) => `/social/stories/${id}/view/`,
    sistersCircle: '/social/sisters-circle/',
    brothersCircle: '/social/brothers-circle/',
    anonymousPost: '/social/posts/anonymous/',
  },

  // Calendar
  calendar: {
    events: '/calendar/events/',
    eventDetail: (id: string) => `/calendar/events/${id}/`,
    respond: (id: string) => `/calendar/events/${id}/respond/`,
    upcoming: '/calendar/upcoming/',
    today: '/calendar/today/',
    week: '/calendar/week/',
    month: '/calendar/month/',
    islamic: '/calendar/islamic/',
    categories: '/calendar/categories/',
  },

  // Notifications
  notifications: {
    list: '/notifications/',
    markRead: (id: string) => `/notifications/${id}/read/`,
    markAllRead: '/notifications/read-all/',
    delete: (id: string) => `/notifications/${id}/`,
    registerDevice: '/notifications/register-device/',
    unregisterDevice: '/notifications/unregister-device/',
    preferences: '/notifications/preferences/',
  },

  // Goals
  goals: {
    list: '/goals/',
    create: '/goals/',
    detail: (id: string) => `/goals/${id}/`,
    pause: (id: string) => `/goals/${id}/pause/`,
    resume: (id: string) => `/goals/${id}/resume/`,
    contributions: (id: string) => `/goals/${id}/contributions/`,
    milestones: (id: string) => `/goals/${id}/milestones/`,
    categories: '/goals/categories/',
  },

  // Halaqat (Study Circles)
  halaqat: {
    list: '/halaqat/',
    create: '/halaqat/',
    detail: (id: string) => `/halaqat/${id}/`,
    enroll: (id: string) => `/halaqat/${id}/enroll/`,
    unenroll: (id: string) => `/halaqat/${id}/unenroll/`,
    myEnrollments: '/halaqat/my-enrollments/',
    sessions: (id: string) => `/halaqat/${id}/sessions/`,
    upcomingSessions: '/halaqat/upcoming-sessions/',
    reviews: (id: string) => `/halaqat/${id}/reviews/`,
    progress: (id: string) => `/halaqat/${id}/progress/`,
  },

  // Forum
  forum: {
    posts: '/forum/posts/',
    postDetail: (id: string) => `/forum/posts/${id}/`,
    like: (id: string) => `/forum/posts/${id}/like/`,
    bookmark: (id: string) => `/forum/posts/${id}/bookmark/`,
    comments: (id: string) => `/forum/posts/${id}/comments/`,
    categories: '/forum/categories/',
    bookmarked: '/forum/posts/bookmarked/',
    trending: '/forum/trending/',
  },

  // Documents
  documents: {
    list: '/documents/',
    upload: '/documents/',
    detail: (id: string) => `/documents/${id}/`,
    download: (id: string) => `/documents/${id}/download/`,
    storage: '/documents/storage/',
    folders: '/documents/folders/',
    folderDetail: (id: string) => `/documents/folders/${id}/`,
    recent: '/documents/recent/',
    search: '/documents/search/',
    share: (id: string) => `/documents/${id}/share/`,
  },

  // Notes
  notes: {
    list: '/notes/',
    create: '/notes/',
    detail: (id: string) => `/notes/${id}/`,
    share: (id: string) => `/notes/${id}/share/`,
    voice: '/notes/voice/',
    voiceDetail: (id: string) => `/notes/voice/${id}/`,
  },

  // Village (Inter-Family)
  village: {
    members: '/village/members/',
    announcements: '/village/announcements/',
    items: '/village/items/',
    itemRequest: (id: string) => `/village/items/${id}/request/`,
    helpers: '/village/helpers/',
    helperRequest: '/village/helpers/request/',
    emergency: '/village/emergency/',
    emergencyActive: '/village/emergency/active/',
  },

  // Encryption
  encryption: {
    generateKeys: '/encryption/keys/generate/',
    publicKey: (userId: string) => `/encryption/keys/public/${userId}/`,
    exchangeKeys: '/encryption/keys/exchange/',
    rotateKeys: '/encryption/keys/rotate/',
  },
} as const;

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request options
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  cache?: boolean;
  dedupe?: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Error
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}
