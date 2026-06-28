/**
 * Expense Store
 * Manages the family finance vertical: transactions (income & expense),
 * categories, budgets and the dashboard summary.
 *
 * Types mirror the real Usrah API contract under /api/expenses/. All ids are
 * public_id UUID strings and amounts arrive from the API as strings.
 *
 * OFFLINE-FIRST: this store is the in-memory view layer. Durable persistence
 * lives in the local SQLite repositories (src/db/repositories), invoked through
 * expense.service.ts — which also fires the background sync. The store
 * mutations below additionally nudge a background sync so any direct in-store
 * write is reconciled with the server as soon as connectivity allows.
 */

import {create} from 'zustand';
import {syncNow} from '../sync/syncEngine';

/** Fire-and-forget background sync that never throws into the caller. */
const nudgeSync = (): void => {
  void syncNow();
};

export type TransactionType = 'income' | 'expense';
export type CategoryType = 'income' | 'expense' | 'both';
export type Period = 'week' | 'month' | 'year';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

/** Lightweight author info embedded on a transaction. */
export interface TransactionAuthor {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

/** Category as returned by GET /expenses/categories/. */
export interface Category {
  public_id: string;
  name: string;
  name_ar?: string;
  icon?: string;
  color?: string;
  type: CategoryType;
  is_system?: boolean;
  parent?: string | null;
}

/** Transaction (income or expense) as returned by GET /expenses/transactions/. */
export interface Transaction {
  public_id: string;
  family?: string;
  created_by?: TransactionAuthor;
  type: TransactionType;
  category?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
  amount: string; // decimal string from the API
  currency: string;
  description?: string;
  notes?: string;
  date: string; // 'YYYY-MM-DD'
  status?: string;
  receipt?: string | null;
  is_recurring?: boolean;
  is_private?: boolean;
  tags?: string[];
  created?: string;
  updated?: string;
}

/** Budget with computed progress fields from GET /expenses/budgets/. */
export interface Budget {
  public_id: string;
  category?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
  amount: string;
  currency: string;
  period: BudgetPeriod;
  start_date: string;
  end_date?: string | null;
  alert_threshold?: number;
  spent: string | number;
  remaining: string | number;
  percentage_used: number;
}

/** A row of the summary's top-expense-categories breakdown. */
export interface TopExpenseCategory {
  category__name: string;
  category__color?: string;
  category__icon?: string;
  total: number;
}

/** A row of the summary's budget-status breakdown. */
export interface BudgetStatus {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  color?: string;
}

/** Dashboard summary from GET /expenses/summary/. */
export interface Summary {
  period: Period;
  start_date: string;
  end_date: string;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  top_expense_categories: TopExpenseCategory[];
  budget_status: BudgetStatus[];
}

/** Result of POST /expenses/zakat/calculate/. */
export interface ZakatResult {
  total_assets: number;
  nisab_value: number;
  nisab_type: string;
  zakatable_amount: number;
  zakat_due: number;
  assets_breakdown: Record<string, number>;
  currency: string;
  is_above_nisab: boolean;
  hijri_date?: string;
}

interface ExpenseState {
  // State
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  summary: Summary | null;
  selectedPeriod: Period;

  // Setters
  setTransactions: (transactions: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setSummary: (summary: Summary | null) => void;
  setSelectedPeriod: (period: Period) => void;

  // Transaction mutations
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  // Category mutations
  addCategory: (category: Category) => void;

  // Budget mutations
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  removeBudget: (id: string) => void;

  // Computed selectors
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getNetBalance: () => number;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getExpenseByCategory: () => Array<{
    categoryId: string | null;
    name: string;
    icon?: string | null;
    color?: string | null;
    total: number;
  }>;
}

/** Safely coerce an API amount (string | number) to a number. */
const toNumber = (value: string | number | null | undefined): number => {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  // Initial state
  transactions: [],
  categories: [],
  budgets: [],
  summary: null,
  selectedPeriod: 'month',

  // Setters
  setTransactions: (transactions) => set({transactions}),
  setCategories: (categories) => set({categories}),
  setBudgets: (budgets) => set({budgets}),
  setSummary: (summary) => set({summary}),
  setSelectedPeriod: (selectedPeriod) => set({selectedPeriod}),

  // Transaction mutations
  addTransaction: (transaction) => {
    set((state) => ({transactions: [transaction, ...state.transactions]}));
    nudgeSync();
  },

  updateTransaction: (id, updates) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.public_id === id ? {...t, ...updates} : t,
      ),
    }));
    nudgeSync();
  },

  removeTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.public_id !== id),
    }));
    nudgeSync();
  },

  // Category mutations
  addCategory: (category) => {
    set((state) => ({categories: [...state.categories, category]}));
    nudgeSync();
  },

  // Budget mutations
  addBudget: (budget) => {
    set((state) => ({budgets: [budget, ...state.budgets]}));
    nudgeSync();
  },

  updateBudget: (id, updates) => {
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.public_id === id ? {...b, ...updates} : b,
      ),
    }));
    nudgeSync();
  },

  removeBudget: (id) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.public_id !== id),
    }));
    nudgeSync();
  },

  // Computed selectors
  getTotalIncome: () =>
    get()
      .transactions.filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + toNumber(t.amount), 0),

  getTotalExpenses: () =>
    get()
      .transactions.filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + toNumber(t.amount), 0),

  getNetBalance: () => {
    const {getTotalIncome, getTotalExpenses} = get();
    return getTotalIncome() - getTotalExpenses();
  },

  getTransactionsByCategory: (categoryId) =>
    get().transactions.filter((t) => t.category === categoryId),

  getExpenseByCategory: () => {
    const buckets = new Map<
      string,
      {
        categoryId: string | null;
        name: string;
        icon?: string | null;
        color?: string | null;
        total: number;
      }
    >();

    get()
      .transactions.filter((t) => t.type === 'expense')
      .forEach((t) => {
        const key = t.category ?? 'uncategorized';
        const existing = buckets.get(key);
        if (existing) {
          existing.total += toNumber(t.amount);
        } else {
          buckets.set(key, {
            categoryId: t.category ?? null,
            name: t.category_name ?? 'Uncategorized',
            icon: t.category_icon,
            color: t.category_color,
            total: toNumber(t.amount),
          });
        }
      });

    return Array.from(buckets.values()).sort((a, b) => b.total - a.total);
  },
}));
