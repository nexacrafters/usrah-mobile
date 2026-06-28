/**
 * Debts API Service (REMOTE / online)
 *
 * Tracks money the family OWES — debts to be paid back to people, banks, shops.
 * You can owe several different people at once; each debt is its own record with
 * a name (who/what), the total, and how much is still remaining. Recording a
 * payment lowers the remaining balance; a debt is "settled" when it hits zero.
 *
 * Backed by the server `Liability` model (it doubles as the Zakat-deductible
 * liability used by the Zakat calculator).
 *
 *   GET    /expenses/liabilities/?family_id=<id>      list debts
 *   POST   /expenses/liabilities/create/              create a debt
 *   PATCH  /expenses/liabilities/<id>/                update / record a payment
 *   DELETE /expenses/liabilities/<id>/                remove a debt
 *
 * Money fields are decimal STRINGS. `id` is the debt's public UUID (with dashes).
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export const DEFAULT_CURRENCY = 'TND';

const NO_FAMILY_MESSAGE = 'Please create or select a family first.';

/** Debt kind (mirrors the server Liability.TYPE_CHOICES). */
export type DebtType =
  | 'personal'
  | 'loan'
  | 'mortgage'
  | 'credit_card'
  | 'other';

export interface DebtUser {
  public_id?: string;
  full_name?: string;
  avatar?: string | null;
}

/** A single debt (LiabilitySerializer). */
export interface Debt {
  public_id: string;
  created_by: DebtUser | null;
  name: string;
  type: DebtType | string;
  total_amount: string;
  remaining_amount: string;
  currency: string;
  due_date: string | null;
  is_deductible: boolean;
  notes: string;
  created: string;
  updated: string;
}

export interface CreateDebtRequest {
  name: string;
  total_amount: number | string;
  /** Defaults to total_amount (nothing paid yet) when omitted. */
  remaining_amount?: number | string;
  type?: DebtType;
  due_date?: string | null;
  notes?: string;
  currency?: string;
  /** Deductible from Zakat (default true for genuine debts). */
  is_deductible?: boolean;
}

const num = (v: number | string): number =>
  typeof v === 'number' ? v : parseFloat(v) || 0;

class DebtsService {
  /** List the active family's debts. Returns [] when there is no family. */
  async listDebts(): Promise<Debt[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    try {
      const response = await apiClient.get('/expenses/liabilities/', {
        params: {family_id: familyId},
      });
      return unwrapList<Debt>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Create a debt against the active family. */
  async createDebt(data: CreateDebtRequest): Promise<Debt> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    const total = num(data.total_amount);
    try {
      const response = await apiClient.post<Debt>(
        '/expenses/liabilities/create/',
        {
          family_id: familyId,
          name: data.name,
          type: data.type ?? 'personal',
          total_amount: total,
          remaining_amount:
            data.remaining_amount != null ? num(data.remaining_amount) : total,
          currency: data.currency ?? DEFAULT_CURRENCY,
          is_deductible: data.is_deductible ?? true,
          // Omit a blank due_date so DRF stores null, not an invalid date.
          due_date: data.due_date?.trim() ? data.due_date.trim() : undefined,
          notes: data.notes?.trim() ? data.notes.trim() : undefined,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Patch arbitrary fields of a debt (name, amounts, due date, notes...). */
  async updateDebt(
    id: string,
    patch: Partial<CreateDebtRequest>,
  ): Promise<Debt> {
    try {
      const response = await apiClient.patch<Debt>(
        `/expenses/liabilities/${id}/`,
        patch,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Record a repayment: lower the remaining balance by `amount`
   * (never below zero). Returns the updated debt.
   */
  async recordPayment(
    id: string,
    currentRemaining: number | string,
    amount: number | string,
  ): Promise<Debt> {
    const next = Math.max(0, num(currentRemaining) - num(amount));
    return this.updateDebt(id, {remaining_amount: next});
  }

  /** Mark a debt fully settled (remaining = 0). */
  async settleDebt(id: string): Promise<Debt> {
    return this.updateDebt(id, {remaining_amount: 0});
  }

  /** Delete a debt. */
  async deleteDebt(id: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/liabilities/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new DebtsService();
