/**
 * Recurring API Service (REMOTE / online)
 *
 * Manages recurring transaction RULES — income or bills that auto-record on a
 * schedule (e.g. a monthly salary, a monthly rent). Each rule remembers the
 * type, amount, category and frequency; the server generates the real
 * transactions as each occurrence comes due. Stopping a rule soft-disables it —
 * transactions already generated stay on the books.
 *
 *   GET    /expenses/recurring/?family_id=<id>   list rules
 *   POST   /expenses/recurring/create/           create a rule
 *   DELETE /expenses/recurring/<id>/             stop (soft-delete) a rule
 *
 * Money fields are decimal STRINGS (3dp millimes). `public_id` is the rule's
 * public UUID (with dashes).
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export const DEFAULT_CURRENCY = 'TND';

const NO_FAMILY_MESSAGE = 'Please create or select a family first.';

/** A single recurring rule (RecurringTransactionSerializer). */
export interface RecurringRule {
  public_id: string;
  type: 'income' | 'expense';
  category: number;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  amount: string;
  currency: string;
  description: string;
  frequency:
    | 'daily'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly';
  start_date: string;
  end_date: string | null;
  next_occurrence: string | null;
  is_active: boolean;
  created: string;
}

export interface CreateRecurringRequest {
  type: 'income' | 'expense';
  amount: number | string;
  frequency: string;
  start_date: string;
  /** A category public_id UUID, or omit. */
  category_id?: string;
  description?: string;
}

const num = (v: number | string): number =>
  typeof v === 'number' ? v : parseFloat(v) || 0;

class RecurringService {
  /** List the active family's recurring rules. Returns [] when there is no family. */
  async listRecurring(): Promise<RecurringRule[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    try {
      const response = await apiClient.get('/expenses/recurring/', {
        params: {family_id: familyId},
      });
      return unwrapList<RecurringRule>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Create a recurring rule against the active family. */
  async createRecurring(data: CreateRecurringRequest): Promise<RecurringRule> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    try {
      const response = await apiClient.post<RecurringRule>(
        '/expenses/recurring/create/',
        {
          family_id: familyId,
          type: data.type,
          amount: num(data.amount),
          currency: DEFAULT_CURRENCY,
          frequency: data.frequency,
          start_date: data.start_date,
          // Omit a blank category so DRF treats the rule as uncategorised.
          category_id: data.category_id?.trim()
            ? data.category_id.trim()
            : undefined,
          description: data.description?.trim()
            ? data.description.trim()
            : undefined,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Stop (soft-delete) a recurring rule. Already-generated transactions stay. */
  async stopRecurring(id: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/recurring/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new RecurringService();
