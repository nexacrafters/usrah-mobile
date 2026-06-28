/**
 * Expense API Service (offline-first)
 *
 * The family-finance vertical (transactions, categories, budgets) is now
 * OFFLINE-FIRST: these methods read and write the LOCAL SQLite database via the
 * repositories in src/db/repositories. They are instant and work fully offline.
 * The background sync engine (src/sync/syncEngine.ts) handles all remote I/O —
 * pushing local changes and pulling remote ones whenever connectivity allows.
 *
 * After every local write we fire `syncNow()`, which no-ops when offline and
 * pushes immediately when online. The method names and return shapes are
 * unchanged so existing screens (ExpensesScreen / AddExpenseScreen) keep working.
 *
 * Zakat + Liabilities are not part of the offline scope and remain direct API
 * calls (they degrade gracefully to empty/null when there is no family).
 */

import apiClient, {handleApiError} from './client';
import {getCurrentFamilyId} from '../../store/authStore';
import {syncNow} from '../../sync/syncEngine';
import * as transactionRepo from '../../db/repositories/transactionRepo';
import * as categoryRepo from '../../db/repositories/categoryRepo';
import * as budgetRepo from '../../db/repositories/budgetRepo';
import {
  Transaction,
  Category,
  Budget,
  Summary,
  ZakatResult,
  TransactionType,
  CategoryType,
  BudgetPeriod,
  Period,
} from '../../store/expenseStore';

// --- Request payload types --------------------------------------------------

export interface ListTransactionsParams {
  type?: TransactionType;
  category_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  category_id?: string;
  amount: number | string;
  currency?: string;
  description?: string;
  notes?: string;
  date: string; // 'YYYY-MM-DD'
  tags?: string[];
}

export interface CreateCategoryRequest {
  name: string;
  name_ar?: string;
  icon?: string;
  color?: string;
  type: CategoryType;
}

export interface CreateBudgetRequest {
  category_id: string;
  amount: number | string;
  currency?: string;
  period: BudgetPeriod;
  start_date: string;
  end_date?: string;
  alert_threshold?: number;
}

export interface ZakatAsset {
  public_id: string;
  name: string;
  type: string;
  value: string;
  currency: string;
  acquisition_date: string;
  is_zakatable: boolean;
  notes?: string;
  weight_grams?: number | null;
}

export interface CreateZakatAssetRequest {
  name: string;
  type:
    | 'cash'
    | 'gold'
    | 'silver'
    | 'stock'
    | 'business'
    | 'property'
    | 'crypto'
    | 'other'
    | 'bank'
    | 'receivable';
  value: number | string;
  currency?: string;
  acquisition_date: string;
  is_zakatable: boolean;
  notes?: string;
  weight_grams?: number;
}

export interface CalculateZakatRequest {
  gold_price_per_gram: number;
  silver_price_per_gram: number;
  currency?: string;
  save_calculation?: boolean;
}

export interface Liability {
  public_id: string;
  name: string;
  type: 'loan' | 'mortgage' | 'credit_card' | 'personal' | 'other';
  total_amount: string;
  remaining_amount: string;
  currency: string;
  due_date?: string | null;
  is_deductible: boolean;
  notes?: string;
}

export interface CreateLiabilityRequest {
  name: string;
  type: 'loan' | 'mortgage' | 'credit_card' | 'personal' | 'other';
  total_amount: number | string;
  remaining_amount: number | string;
  currency?: string;
  due_date?: string;
  is_deductible: boolean;
  notes?: string;
}

const DEFAULT_CURRENCY = 'SAR';

/** Thrown by create methods when there is no active family context. */
const NO_FAMILY_MESSAGE = 'Please create or select a family first.';

const toNumber = (value: string | number | null | undefined): number => {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
};

/** Fire-and-forget background sync; never throws into the caller. */
const triggerSync = (): void => {
  void syncNow();
};

/** Look up category display fields so locally-created rows render immediately. */
const categoryDisplay = (
  categoryId: string | undefined | null,
): {name: string | null; icon: string | null; color: string | null} => {
  if (!categoryId) return {name: null, icon: null, color: null};
  const cat = categoryRepo.getCategory(categoryId);
  return {
    name: cat?.name ?? null,
    icon: cat?.icon ?? null,
    color: cat?.color ?? null,
  };
};

class ExpenseService {
  // --- Transactions (LOCAL) -------------------------------------------------

  async listTransactions(
    params: ListTransactionsParams = {},
  ): Promise<Transaction[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    // Kick off a background refresh; results land via the store on next read.
    triggerSync();
    return transactionRepo.listTransactions(familyId, params);
  }

  async createTransaction(
    data: CreateTransactionRequest,
  ): Promise<Transaction> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    const display = categoryDisplay(data.category_id);
    const created = transactionRepo.createTransaction(familyId, {
      type: data.type,
      category_id: data.category_id ?? null,
      amount: data.amount,
      currency: data.currency ?? DEFAULT_CURRENCY,
      description: data.description,
      notes: data.notes,
      date: data.date,
      tags: data.tags,
      category_name: display.name,
      category_icon: display.icon,
      category_color: display.color,
    });
    triggerSync();
    return created;
  }

  async updateTransaction(
    id: string,
    data: Partial<CreateTransactionRequest>,
  ): Promise<Transaction> {
    const display =
      data.category_id !== undefined
        ? categoryDisplay(data.category_id)
        : undefined;
    transactionRepo.updateTransaction(id, {
      ...data,
      ...(display
        ? {
            category_name: display.name,
            category_icon: display.icon,
            category_color: display.color,
          }
        : {}),
    });
    triggerSync();
    return (
      transactionRepo.getTransaction(id) ??
      ({public_id: id} as Transaction)
    );
  }

  async deleteTransaction(id: string): Promise<void> {
    transactionRepo.deleteTransaction(id);
    triggerSync();
  }

  // --- Categories (LOCAL) ---------------------------------------------------

  async listCategories(): Promise<Category[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    triggerSync();
    return categoryRepo.listCategories(familyId);
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    const created = categoryRepo.createCategory(familyId, data);
    triggerSync();
    return created;
  }

  // --- Budgets (LOCAL) ------------------------------------------------------

  async listBudgets(): Promise<Budget[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    triggerSync();
    const budgets = budgetRepo.listBudgets(familyId);
    return this.withBudgetProgress(familyId, budgets);
  }

  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    const display = categoryDisplay(data.category_id);
    const created = budgetRepo.createBudget(familyId, {
      ...data,
      currency: data.currency ?? DEFAULT_CURRENCY,
      category_name: display.name,
      category_icon: display.icon,
      category_color: display.color,
    });
    triggerSync();
    return created;
  }

  async updateBudget(
    id: string,
    data: Partial<CreateBudgetRequest>,
  ): Promise<Budget> {
    budgetRepo.updateBudget(id, data);
    triggerSync();
    return budgetRepo.getBudget(id) ?? ({public_id: id} as Budget);
  }

  /**
   * Recompute spent / remaining / percentage_used for each budget from local
   * transactions so the dashboard's progress bars are accurate offline. The
   * server's authoritative values overwrite these on the next pull.
   */
  private withBudgetProgress(familyId: string, budgets: Budget[]): Budget[] {
    if (budgets.length === 0) return budgets;
    const expenses = transactionRepo.listTransactions(familyId, {
      type: 'expense',
    });
    return budgets.map((b) => {
      const spent = expenses
        .filter((t) => b.category && t.category === b.category)
        .reduce((sum, t) => sum + toNumber(t.amount), 0);
      const limit = toNumber(b.amount);
      const remaining = limit - spent;
      const percentage_used = limit > 0 ? (spent / limit) * 100 : 0;
      return {...b, spent, remaining, percentage_used};
    });
  }

  // --- Summary (LOCAL, computed) --------------------------------------------

  /**
   * Build the dashboard summary locally from on-device transactions so the
   * Expenses screen works fully offline. Mirrors the API Summary shape.
   */
  async getSummary(period: Period): Promise<Summary | null> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return null;

    const {start, end} = periodRange(period);
    const txns = transactionRepo.listTransactions(familyId, {
      start_date: start,
      end_date: end,
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const byCategory = new Map<
      string,
      {name: string; color?: string; icon?: string; total: number}
    >();

    for (const t of txns) {
      const amt = toNumber(t.amount);
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
        const key = t.category ?? 'uncategorized';
        const existing = byCategory.get(key);
        if (existing) {
          existing.total += amt;
        } else {
          byCategory.set(key, {
            name: t.category_name ?? 'Uncategorized',
            color: t.category_color ?? undefined,
            icon: t.category_icon ?? undefined,
            total: amt,
          });
        }
      }
    }

    const net = totalIncome - totalExpenses;
    const budgets = this.withBudgetProgress(
      familyId,
      budgetRepo.listBudgets(familyId),
    );

    return {
      period,
      start_date: start,
      end_date: end,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_savings: net,
      savings_rate: totalIncome > 0 ? (net / totalIncome) * 100 : 0,
      top_expense_categories: Array.from(byCategory.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map((c) => ({
          category__name: c.name,
          category__color: c.color,
          category__icon: c.icon,
          total: c.total,
        })),
      budget_status: budgets.map((b) => ({
        category: b.category_name ?? 'Budget',
        limit: toNumber(b.amount),
        spent: toNumber(b.spent),
        remaining: toNumber(b.remaining),
        percentage: b.percentage_used ?? 0,
        color: b.category_color ?? undefined,
      })),
    };
  }

  // --- Zakat (REMOTE) -------------------------------------------------------

  async listZakatAssets(): Promise<ZakatAsset[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    try {
      const response = await apiClient.get<ZakatAsset[]>(
        '/expenses/zakat/assets/',
        {params: {family_id: familyId}},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createZakatAsset(
    data: CreateZakatAssetRequest,
  ): Promise<ZakatAsset> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    try {
      const response = await apiClient.post<ZakatAsset>(
        '/expenses/zakat/assets/create/',
        {
          family_id: familyId,
          currency: DEFAULT_CURRENCY,
          ...data,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async calculateZakat(
    data: CalculateZakatRequest,
  ): Promise<ZakatResult | null> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return null;
    try {
      const response = await apiClient.post<ZakatResult>(
        '/expenses/zakat/calculate/',
        {
          family_id: familyId,
          currency: DEFAULT_CURRENCY,
          ...data,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // --- Liabilities (REMOTE) -------------------------------------------------

  async listLiabilities(): Promise<Liability[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    try {
      const response = await apiClient.get<Liability[]>(
        '/expenses/liabilities/',
        {params: {family_id: familyId}},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createLiability(
    data: CreateLiabilityRequest,
  ): Promise<Liability> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    try {
      const response = await apiClient.post<Liability>(
        '/expenses/liabilities/create/',
        {
          family_id: familyId,
          currency: DEFAULT_CURRENCY,
          ...data,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// --- Helpers ----------------------------------------------------------------

/** Format a Date as YYYY-MM-DD. */
const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Inclusive [start, end] date range for a summary period, anchored on today. */
function periodRange(period: Period): {start: string; end: string} {
  const now = new Date();
  const end = isoDate(now);
  const start = new Date(now);
  if (period === 'week') {
    start.setDate(now.getDate() - 6);
  } else if (period === 'year') {
    start.setFullYear(now.getFullYear(), 0, 1);
  } else {
    // month
    start.setDate(1);
  }
  return {start: isoDate(start), end};
}

export default new ExpenseService();
