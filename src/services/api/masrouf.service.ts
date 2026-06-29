/**
 * Masrouf API Service — the monthly allowance a husband assigns to his wife.
 * Maps to core/expenses masrouf endpoints. The base amount is auto-credited to
 * the recipient's private stash each month (and logged as the giver's expense);
 * `giveExtra` tops it up immediately.
 *
 *   GET    /expenses/masrouf/?family_id=<id>
 *   POST   /expenses/masrouf/   {family_id, recipient_id, amount, day_of_month, note}
 *   PATCH/DELETE /expenses/masrouf/<id>/
 *   POST   /expenses/masrouf/<id>/give-extra/   {amount, note}
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export interface Masrouf {
  public_id: string;
  giver_name: string;
  recipient_name: string;
  amount: string;
  currency: string;
  day_of_month: number;
  is_active: boolean;
  note: string;
  last_generated: string | null;
}

export interface CreateMasrouf {
  recipient_id: string;
  amount: number | string;
  day_of_month?: number;
  note?: string;
}

class MasroufService {
  async list(): Promise<Masrouf[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const res = await apiClient.get('/expenses/masrouf/', {
        params: {family_id: familyId},
      });
      return unwrapList<Masrouf>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async create(data: CreateMasrouf): Promise<Masrouf> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const res = await apiClient.post<Masrouf>('/expenses/masrouf/', {
        family_id: familyId,
        ...data,
      });
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async update(id: string, data: Partial<CreateMasrouf> & {is_active?: boolean}): Promise<Masrouf> {
    try {
      const res = await apiClient.patch<Masrouf>(`/expenses/masrouf/${id}/`, data);
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/masrouf/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async giveExtra(id: string, amount: number | string, note?: string): Promise<void> {
    try {
      await apiClient.post(`/expenses/masrouf/${id}/give-extra/`, {amount, note});
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new MasroufService();
