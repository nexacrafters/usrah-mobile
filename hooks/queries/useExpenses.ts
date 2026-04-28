/**
 * Expenses Query Hooks
 * React Query hooks for expense tracking
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { expensesApi } from '../../services/api/expenses';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import {
  DEMO_MODE,
  DEMO_TRANSACTIONS,
  DEMO_CATEGORIES,
  DEMO_EXPENSE_SUMMARY,
  DEMO_GOALS,
  DEMO_DEBTS,
  DEMO_INVESTMENTS,
  DEMO_EMERGENCY_FUND,
} from '../../services/demoMode';
import type {
  Transaction,
  Category,
  Budget,
  TransactionType,
} from '../../types/models';

interface TransactionFilters {
  family_id: string;
  type?: TransactionType;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  member_id?: string;
}

/**
 * Get transactions with pagination
 */
export function useTransactions(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.expenses.transaction(filters),
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        // Filter demo transactions based on filters
        let filtered = [...DEMO_TRANSACTIONS];
        if (filters.type) {
          filtered = filtered.filter(t => t.type === filters.type);
        }
        return {
          results: filtered,
          next: null,
          page: 1,
          count: filtered.length,
        };
      }
      return expensesApi.getTransactions({ ...filters, page: pageParam });
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!filters.family_id,
  });
}

/**
 * Get single transaction
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.expenses.transactionDetail(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_TRANSACTIONS.find(t => t.id === id) || null;
      }
      return expensesApi.getTransaction(id);
    },
    enabled: !!id,
  });
}

/**
 * Create transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      type: TransactionType;
      amount: number;
      category_id: string;
      description?: string;
      date?: string;
      receipt_image?: string;
      is_recurring?: boolean;
      recurrence_pattern?: string;
    }) => {
      if (DEMO_MODE) {
        // Create mock transaction
        const category = DEMO_CATEGORIES.find(c => c.id === data.category_id);
        const newTransaction = {
          id: `demo-${Date.now()}`,
          type: data.type,
          amount: data.amount,
          currency: 'TND',
          category: category || { name: 'Other', name_ar: 'أخرى', icon: '📦' },
          description: data.description || '',
          date: data.date || new Date().toISOString().split('T')[0],
          created_by: { full_name: 'أحمد' },
          family_id: data.family_id,
        };
        DEMO_TRANSACTIONS.unshift(newTransaction as any);
        return newTransaction;
      }
      return expensesApi.createTransaction(data);
    },
    onSuccess: (transaction: any) => {
      invalidateQueries.transactions();
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.summary(transaction.family_id),
      });
    },
  });
}

/**
 * Update transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      if (DEMO_MODE) {
        const index = DEMO_TRANSACTIONS.findIndex(t => t.id === id);
        if (index !== -1) {
          DEMO_TRANSACTIONS[index] = { ...DEMO_TRANSACTIONS[index], ...data } as any;
          return DEMO_TRANSACTIONS[index];
        }
        return null;
      }
      return expensesApi.updateTransaction(id, data);
    },
    onSuccess: (transaction: any) => {
      if (transaction) {
        queryClient.setQueryData(
          queryKeys.expenses.transactionDetail(transaction.id),
          transaction
        );
        invalidateQueries.transactions();
      }
    },
  });
}

/**
 * Delete transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const index = DEMO_TRANSACTIONS.findIndex(t => t.id === id);
        if (index !== -1) {
          DEMO_TRANSACTIONS.splice(index, 1);
        }
        return { success: true };
      }
      return expensesApi.deleteTransaction(id);
    },
    onSuccess: () => {
      invalidateQueries.transactions();
      invalidateQueries.expenses();
    },
  });
}

/**
 * Get categories
 */
export function useCategories(familyId?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.categories(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_CATEGORIES;
      }
      return expensesApi.getCategories(familyId);
    },
  });
}

/**
 * Create category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: TransactionType;
      icon?: string;
      color?: string;
      family_id?: string;
    }) => {
      if (DEMO_MODE) {
        const newCategory = {
          id: `demo-cat-${Date.now()}`,
          name: data.name,
          name_ar: data.name,
          icon: data.icon || '📦',
          color: data.color || '#9E9E9E',
          type: data.type,
        };
        (DEMO_CATEGORIES as any[]).push(newCategory);
        return newCategory;
      }
      return expensesApi.createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.categories(),
      });
    },
  });
}

/**
 * Update category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      if (DEMO_MODE) {
        const index = DEMO_CATEGORIES.findIndex(c => c.id === id);
        if (index !== -1) {
          (DEMO_CATEGORIES as any[])[index] = { ...DEMO_CATEGORIES[index], ...data };
          return DEMO_CATEGORIES[index];
        }
        return null;
      }
      return expensesApi.updateCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.categories(),
      });
    },
  });
}

/**
 * Delete category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const index = DEMO_CATEGORIES.findIndex(c => c.id === id);
        if (index !== -1) {
          (DEMO_CATEGORIES as any[]).splice(index, 1);
        }
        return { success: true };
      }
      return expensesApi.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.categories(),
      });
    },
  });
}

/**
 * Get budgets
 */
export function useBudgets(familyId: string) {
  return useQuery({
    queryKey: queryKeys.expenses.budgets(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', category: DEMO_CATEGORIES[0], amount: 500, spent: 150, period: 'monthly' },
          { id: '2', category: DEMO_CATEGORIES[2], amount: 300, spent: 200, period: 'monthly' },
        ];
      }
      return expensesApi.getBudgets(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get single budget
 */
export function useBudget(id: string) {
  return useQuery({
    queryKey: queryKeys.expenses.budget(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return { id, category: DEMO_CATEGORIES[0], amount: 500, spent: 150, period: 'monthly' };
      }
      return expensesApi.getBudget(id);
    },
    enabled: !!id,
  });
}

/**
 * Create budget
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      category_id?: string;
      amount: number;
      period: 'weekly' | 'monthly' | 'yearly';
      start_date: string;
      end_date?: string;
      alert_threshold?: number;
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-budget-${Date.now()}`, ...data, spent: 0 };
      }
      return expensesApi.createBudget(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.budgets(),
      });
    },
  });
}

/**
 * Update budget
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Budget> }) => {
      if (DEMO_MODE) {
        return { id, ...data };
      }
      return expensesApi.updateBudget(id, data);
    },
    onSuccess: (budget: any) => {
      queryClient.setQueryData(queryKeys.expenses.budget(budget.id), budget);
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.budgets(),
      });
    },
  });
}

/**
 * Delete budget
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return expensesApi.deleteBudget(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.budgets(),
      });
    },
  });
}

/**
 * Get expense summary
 */
export function useExpenseSummary(
  familyId: string,
  period?: 'day' | 'week' | 'month' | 'year',
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: queryKeys.expenses.summary(familyId, period),
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_EXPENSE_SUMMARY;
      }
      return expensesApi.getSummary(familyId, period, startDate, endDate);
    },
    enabled: !!familyId,
  });
}

/**
 * Get recurring transactions
 */
export function useRecurringTransactions(familyId: string) {
  return useQuery({
    queryKey: queryKeys.expenses.recurring(),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return expensesApi.getRecurringTransactions(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Create recurring transaction
 */
export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      type: TransactionType;
      amount: number;
      category_id: string;
      description?: string;
      recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
      start_date: string;
      end_date?: string;
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-recurring-${Date.now()}`, ...data };
      }
      return expensesApi.createRecurringTransaction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.recurring(),
      });
    },
  });
}

/**
 * Cancel recurring transaction
 */
export function useCancelRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return expensesApi.cancelRecurringTransaction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.recurring(),
      });
    },
  });
}

/**
 * Get transactions by category
 */
export function useTransactionsByCategory(
  familyId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'by-category', familyId, startDate, endDate],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_EXPENSE_SUMMARY.by_category;
      }
      return expensesApi.getByCategory(familyId, startDate, endDate);
    },
    enabled: !!familyId,
  });
}

/**
 * Get transactions by member
 */
export function useTransactionsByMember(
  familyId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'by-member', familyId, startDate, endDate],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { member: 'أحمد', amount: 230, percentage: 48 },
          { member: 'فاطمة', amount: 250, percentage: 52 },
        ];
      }
      return expensesApi.getByMember(familyId, startDate, endDate);
    },
    enabled: !!familyId,
  });
}

/**
 * Get expense trends
 */
export function useExpenseTrends(
  familyId: string,
  months: number = 6
) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'trends', familyId, months],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { month: 'يناير', income: 3000, expenses: 1200 },
          { month: 'فبراير', income: 3000, expenses: 1500 },
          { month: 'مارس', income: 3200, expenses: 1100 },
          { month: 'أبريل', income: 3000, expenses: 480 },
        ];
      }
      return expensesApi.getTrends(familyId, months);
    },
    enabled: !!familyId,
  });
}

/**
 * Get savings goals
 */
export function useSavingsGoals(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'goals', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_GOALS;
      }
      return [];
    },
    enabled: !!familyId,
  });
}

// ==================== DEBTS (Borrowed/Lent Money) ====================

/**
 * Get all debts (borrowed and lent)
 */
export function useDebts(familyId: string, type?: 'borrowed' | 'lent') {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'debts', familyId, type],
    queryFn: async () => {
      if (DEMO_MODE) {
        let debts = [...DEMO_DEBTS];
        if (type) {
          debts = debts.filter(d => d.type === type);
        }
        return debts;
      }
      return [];
    },
    enabled: !!familyId,
  });
}

/**
 * Get debt summary
 */
export function useDebtSummary(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'debt-summary', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        const borrowed = DEMO_DEBTS.filter(d => d.type === 'borrowed' && d.status === 'pending');
        const lent = DEMO_DEBTS.filter(d => d.type === 'lent' && d.status === 'pending');
        return {
          total_borrowed: borrowed.reduce((sum, d) => sum + d.amount - d.paid_amount, 0),
          total_lent: lent.reduce((sum, d) => sum + d.amount - d.paid_amount, 0),
          borrowed_count: borrowed.length,
          lent_count: lent.length,
          currency: 'TND',
        };
      }
      return { total_borrowed: 0, total_lent: 0, borrowed_count: 0, lent_count: 0, currency: 'TND' };
    },
    enabled: !!familyId,
  });
}

/**
 * Create new debt
 */
export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      type: 'borrowed' | 'lent';
      amount: number;
      person: string;
      description?: string;
      due_date?: string;
    }) => {
      if (DEMO_MODE) {
        const newDebt = {
          id: `demo-debt-${Date.now()}`,
          ...data,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          paid_amount: 0,
          currency: 'TND',
        };
        (DEMO_DEBTS as any[]).push(newDebt);
        return newDebt;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'debts'] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'debt-summary'] });
    },
  });
}

/**
 * Update debt payment
 */
export function useUpdateDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      if (DEMO_MODE) {
        const index = DEMO_DEBTS.findIndex(d => d.id === id);
        if (index !== -1) {
          (DEMO_DEBTS as any[])[index].paid_amount += amount;
          if ((DEMO_DEBTS as any[])[index].paid_amount >= DEMO_DEBTS[index].amount) {
            (DEMO_DEBTS as any[])[index].status = 'paid';
          }
          return DEMO_DEBTS[index];
        }
        return null;
      }
      return { id, amount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'debts'] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'debt-summary'] });
    },
  });
}

// ==================== INVESTMENTS ====================

/**
 * Get all investments
 */
export function useInvestments(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'investments', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_INVESTMENTS;
      }
      return [];
    },
    enabled: !!familyId,
  });
}

/**
 * Get investment summary
 */
export function useInvestmentSummary(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'investment-summary', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        const active = DEMO_INVESTMENTS.filter(i => i.status === 'active');
        return {
          total_invested: active.reduce((sum, i) => sum + i.initial_amount, 0),
          current_value: active.reduce((sum, i) => sum + i.current_value, 0),
          total_profit_loss: active.reduce((sum, i) => sum + i.profit_loss, 0),
          count: active.length,
          currency: 'TND',
        };
      }
      return { total_invested: 0, current_value: 0, total_profit_loss: 0, count: 0, currency: 'TND' };
    },
    enabled: !!familyId,
  });
}

/**
 * Create investment
 */
export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      name: string;
      type: string;
      initial_amount: number;
    }) => {
      if (DEMO_MODE) {
        const newInvestment = {
          id: `demo-inv-${Date.now()}`,
          ...data,
          current_value: data.initial_amount,
          profit_loss: 0,
          percentage: 0,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active',
          currency: 'TND',
        };
        (DEMO_INVESTMENTS as any[]).push(newInvestment);
        return newInvestment;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'investments'] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'investment-summary'] });
    },
  });
}

// ==================== EMERGENCY FUND ====================

/**
 * Get emergency fund
 */
export function useEmergencyFund(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.expenses.all, 'emergency-fund', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return DEMO_EMERGENCY_FUND;
      }
      return null;
    },
    enabled: !!familyId,
  });
}

/**
 * Deposit to emergency fund
 */
export function useDepositEmergencyFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, amount }: { familyId: string; amount: number }) => {
      if (DEMO_MODE) {
        (DEMO_EMERGENCY_FUND as any).current_amount += amount;
        (DEMO_EMERGENCY_FUND as any).history.unshift({
          id: `demo-ef-${Date.now()}`,
          amount,
          date: new Date().toISOString().split('T')[0],
          type: 'deposit',
        });
        return DEMO_EMERGENCY_FUND;
      }
      return { familyId, amount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'emergency-fund'] });
    },
  });
}

/**
 * Withdraw from emergency fund
 */
export function useWithdrawEmergencyFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, amount, reason }: { familyId: string; amount: number; reason: string }) => {
      if (DEMO_MODE) {
        (DEMO_EMERGENCY_FUND as any).current_amount -= amount;
        (DEMO_EMERGENCY_FUND as any).history.unshift({
          id: `demo-ef-${Date.now()}`,
          amount,
          date: new Date().toISOString().split('T')[0],
          type: 'withdraw',
          reason,
        });
        return DEMO_EMERGENCY_FUND;
      }
      return { familyId, amount, reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.expenses.all, 'emergency-fund'] });
    },
  });
}
