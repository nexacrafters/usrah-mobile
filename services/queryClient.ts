/**
 * React Query Client Configuration
 * Centralized query client setup with default options
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Query Key Factory
 * Structured keys for cache invalidation and prefetching
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Families
  families: {
    all: ['families'] as const,
    lists: () => [...queryKeys.families.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.families.lists(), filters] as const,
    details: () => [...queryKeys.families.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.families.details(), id] as const,
    members: (familyId: string) =>
      [...queryKeys.families.detail(familyId), 'members'] as const,
    invitations: (familyId: string) =>
      [...queryKeys.families.detail(familyId), 'invitations'] as const,
    myInvitations: () => [...queryKeys.families.all, 'my-invitations'] as const,
  },

  // Expenses
  expenses: {
    all: ['expenses'] as const,
    transactions: () => [...queryKeys.expenses.all, 'transactions'] as const,
    transaction: (filters?: Record<string, unknown>) =>
      [...queryKeys.expenses.transactions(), filters] as const,
    transactionDetail: (id: string) =>
      [...queryKeys.expenses.transactions(), id] as const,
    categories: () => [...queryKeys.expenses.all, 'categories'] as const,
    budgets: () => [...queryKeys.expenses.all, 'budgets'] as const,
    budget: (id: string) => [...queryKeys.expenses.budgets(), id] as const,
    summary: (familyId: string, period?: string) =>
      [...queryKeys.expenses.all, 'summary', familyId, period] as const,
    recurring: () => [...queryKeys.expenses.all, 'recurring'] as const,
  },

  // Zakat
  zakat: {
    all: ['zakat'] as const,
    assets: (familyId: string) =>
      [...queryKeys.zakat.all, 'assets', familyId] as const,
    asset: (id: string) => [...queryKeys.zakat.all, 'asset', id] as const,
    calculations: (familyId: string) =>
      [...queryKeys.zakat.all, 'calculations', familyId] as const,
    calculation: (id: string) =>
      [...queryKeys.zakat.all, 'calculation', id] as const,
    liabilities: (familyId: string) =>
      [...queryKeys.zakat.all, 'liabilities', familyId] as const,
    nisab: () => [...queryKeys.zakat.all, 'nisab'] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.tasks.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    leaderboard: (familyId: string) =>
      [...queryKeys.tasks.all, 'leaderboard', familyId] as const,
    myTasks: (userId: string) =>
      [...queryKeys.tasks.all, 'my-tasks', userId] as const,
  },

  // Chat
  chat: {
    all: ['chat'] as const,
    conversations: () => [...queryKeys.chat.all, 'conversations'] as const,
    conversation: (id: string) =>
      [...queryKeys.chat.conversations(), id] as const,
    messages: (conversationId: string) =>
      [...queryKeys.chat.all, 'messages', conversationId] as const,
    unreadCount: () => [...queryKeys.chat.all, 'unread'] as const,
  },

  // Recipes
  recipes: {
    all: ['recipes'] as const,
    lists: () => [...queryKeys.recipes.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.recipes.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.recipes.all, 'detail', id] as const,
    mealPlans: (familyId: string) =>
      [...queryKeys.recipes.all, 'meal-plans', familyId] as const,
    shoppingList: (familyId: string) =>
      [...queryKeys.recipes.all, 'shopping-list', familyId] as const,
  },

  // Islamic
  islamic: {
    all: ['islamic'] as const,
    prayerTimes: (lat: number, lng: number, date?: string) =>
      [...queryKeys.islamic.all, 'prayer-times', lat, lng, date] as const,
    adhkar: (category: string) =>
      [...queryKeys.islamic.all, 'adhkar', category] as const,
    dailyVerse: () => [...queryKeys.islamic.all, 'daily-verse'] as const,
    islamicDates: (start?: string, end?: string) =>
      [...queryKeys.islamic.all, 'dates', start, end] as const,
    upcomingEvents: (days: number) =>
      [...queryKeys.islamic.all, 'events', days] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    lists: () => [...queryKeys.calendar.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.calendar.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.calendar.all, 'detail', id] as const,
  },

  // Social
  social: {
    all: ['social'] as const,
    posts: () => [...queryKeys.social.all, 'posts'] as const,
    post: (filters?: Record<string, unknown>) =>
      [...queryKeys.social.posts(), filters] as const,
    postDetail: (id: string) => [...queryKeys.social.posts(), id] as const,
    comments: (postId: string) =>
      [...queryKeys.social.all, 'comments', postId] as const,
    reactions: (postId: string) =>
      [...queryKeys.social.all, 'reactions', postId] as const,
    stories: (familyId: string) =>
      [...queryKeys.social.all, 'stories', familyId] as const,
    sistersCircle: (familyId: string) =>
      [...queryKeys.social.all, 'sisters-circle', familyId] as const,
  },
};

/**
 * Default Query Client Options
 */
export const defaultQueryOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 1,
  },
};

/**
 * Create Query Client
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: defaultQueryOptions,
  });

/**
 * Query Client Instance
 */
export const queryClient = createQueryClient();

/**
 * Invalidation Helpers
 */
export const invalidateQueries = {
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),

  families: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.families.all }),

  family: (id: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.families.detail(id) }),

  expenses: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),

  transactions: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.transactions() }),

  zakat: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.zakat.all }),

  tasks: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),

  chat: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.all }),

  conversation: (id: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversation(id) }),

  recipes: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all }),

  islamic: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.islamic.all }),

  social: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.social.all }),

  calendar: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all }),

  post: (id: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.social.postDetail(id) }),

  all: () => queryClient.invalidateQueries(),
};

/**
 * Prefetch Helpers
 */
export const prefetchQueries = {
  familyData: async (familyId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.families.detail(familyId),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.families.members(familyId),
      }),
    ]);
  },

  homeData: async (familyId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.expenses.summary(familyId),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.tasks.list({ family_id: familyId, status: 'pending' }),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.chat.unreadCount(),
      }),
    ]);
  },
};
