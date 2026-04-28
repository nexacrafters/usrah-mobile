/**
 * Expenses API Service
 * Handles transactions, categories, budgets, and financial summaries
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  Transaction,
  Category,
  Budget,
  RecurringTransaction,
  FinancialSummary,
  PaginatedResponse,
} from '../../types/models';

// Request interfaces
interface CreateTransactionRequest {
  family_id: string;
  type: 'income' | 'expense';
  category_id?: string;
  amount: number;
  currency?: string;
  description?: string;
  notes?: string;
  date: string;
  tags?: string[];
}

interface UpdateTransactionRequest {
  type?: 'income' | 'expense';
  category_id?: string;
  amount?: number;
  description?: string;
  notes?: string;
  date?: string;
  tags?: string[];
}

interface CreateCategoryRequest {
  family_id: string;
  name: string;
  name_ar?: string;
  icon?: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  parent_id?: string;
}

interface CreateBudgetRequest {
  family_id: string;
  category_id: string;
  amount: number;
  currency?: string;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  alert_threshold?: number;
}

interface TransactionFilters {
  family_id: string;
  type?: 'income' | 'expense';
  category_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

/**
 * Expenses API Service
 */
export const expensesApi = {
  // ==================== Transactions ====================

  /**
   * Get list of transactions
   */
  async getTransactions(filters: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return apiClient.get<PaginatedResponse<Transaction>>(
      `${ENDPOINTS.expenses.transactions}?${params.toString()}`
    );
  },

  /**
   * Get a single transaction
   */
  async getTransaction(id: string): Promise<Transaction> {
    return apiClient.get<Transaction>(ENDPOINTS.expenses.transactionDetail(id));
  },

  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    return apiClient.post<Transaction>(ENDPOINTS.expenses.transactions, data);
  },

  /**
   * Update a transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionRequest): Promise<Transaction> {
    return apiClient.patch<Transaction>(ENDPOINTS.expenses.transactionDetail(id), data);
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.expenses.transactionDetail(id));
  },

  /**
   * Upload receipt for a transaction
   */
  async uploadReceipt(transactionId: string, imageUri: string): Promise<Transaction> {
    const formData = new FormData();
    formData.append('receipt', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);

    return apiClient.uploadFile<Transaction>(
      ENDPOINTS.expenses.transactionDetail(transactionId),
      formData
    );
  },

  // ==================== Categories ====================

  /**
   * Get list of categories
   */
  async getCategories(familyId?: string): Promise<Category[]> {
    const params = familyId ? `?family_id=${familyId}` : '';
    const response = await apiClient.get<{ results: Category[] } | Category[]>(
      `${ENDPOINTS.expenses.categories}${params}`
    );

    // Handle both paginated and non-paginated responses
    if (Array.isArray(response)) {
      return response;
    }
    return response.results;
  },

  /**
   * Create a custom category
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    return apiClient.post<Category>(ENDPOINTS.expenses.categories, data);
  },

  /**
   * Update a category
   */
  async updateCategory(id: string, data: Partial<CreateCategoryRequest>): Promise<Category> {
    return apiClient.patch<Category>(ENDPOINTS.expenses.categoryDetail(id), data);
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.expenses.categoryDetail(id));
  },

  // ==================== Budgets ====================

  /**
   * Get list of budgets
   */
  async getBudgets(familyId: string): Promise<Budget[]> {
    const response = await apiClient.get<{ results: Budget[] } | Budget[]>(
      `${ENDPOINTS.expenses.budgets}?family_id=${familyId}`
    );

    if (Array.isArray(response)) {
      return response;
    }
    return response.results;
  },

  /**
   * Get a single budget
   */
  async getBudget(id: string): Promise<Budget> {
    return apiClient.get<Budget>(ENDPOINTS.expenses.budgetDetail(id));
  },

  /**
   * Create a new budget
   */
  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    return apiClient.post<Budget>(ENDPOINTS.expenses.budgets, data);
  },

  /**
   * Update a budget
   */
  async updateBudget(id: string, data: Partial<CreateBudgetRequest>): Promise<Budget> {
    return apiClient.patch<Budget>(ENDPOINTS.expenses.budgetDetail(id), data);
  },

  /**
   * Delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.expenses.budgetDetail(id));
  },

  // ==================== Recurring Transactions ====================

  /**
   * Get recurring transactions
   */
  async getRecurringTransactions(familyId: string): Promise<RecurringTransaction[]> {
    const response = await apiClient.get<{ results: RecurringTransaction[] }>(
      `${ENDPOINTS.expenses.recurring}?family_id=${familyId}`
    );
    return response.results;
  },

  // ==================== Summary ====================

  /**
   * Get financial summary
   */
  async getSummary(
    familyId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<FinancialSummary> {
    return apiClient.get<FinancialSummary>(
      `${ENDPOINTS.expenses.summary}?family_id=${familyId}&period=${period}`
    );
  },
};
