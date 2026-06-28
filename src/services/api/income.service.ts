/**
 * Income API Service (offline-first)
 *
 * Manages named income sources (e.g. "Salary - Acme", "Freelance"), each
 * recurring-monthly or one-off. Like the rest of the finance vertical this is
 * OFFLINE-FIRST: methods read and write the LOCAL SQLite database via
 * incomeSourceRepo. They are instant and work fully offline; the background
 * sync engine (src/sync/syncEngine.ts) handles all remote I/O.
 *
 * After every local write we fire `syncNow()`, which no-ops when offline and
 * pushes immediately when online.
 */

import {getCurrentFamilyId} from '../../store/authStore';
import {syncNow} from '../../sync/syncEngine';
import * as incomeSourceRepo from '../../db/repositories/incomeSourceRepo';
import type {IncomeSource} from '../../store/financeStore';

const DEFAULT_CURRENCY = 'TND';
const NO_FAMILY_MESSAGE = 'Please create or select a family first.';

export interface CreateIncomeSourceRequest {
  name: string;
  amount: number | string;
  currency?: string;
  is_recurring?: boolean;
  is_active?: boolean;
  icon?: string | null;
  color?: string | null;
  notes?: string | null;
}

/** Fire-and-forget background sync; never throws into the caller. */
const triggerSync = (): void => {
  void syncNow();
};

class IncomeService {
  async listIncomeSources(): Promise<IncomeSource[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    triggerSync();
    return incomeSourceRepo.listIncomeSources(familyId);
  }

  async createIncomeSource(
    data: CreateIncomeSourceRequest,
  ): Promise<IncomeSource> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    const created = incomeSourceRepo.createIncomeSource(familyId, {
      ...data,
      currency: data.currency ?? DEFAULT_CURRENCY,
    });
    triggerSync();
    return created;
  }

  async updateIncomeSource(
    id: string,
    data: Partial<CreateIncomeSourceRequest>,
  ): Promise<IncomeSource> {
    incomeSourceRepo.updateIncomeSource(id, data);
    triggerSync();
    return (
      incomeSourceRepo.getIncomeSource(id) ??
      ({public_id: id} as IncomeSource)
    );
  }

  async deleteIncomeSource(id: string): Promise<void> {
    incomeSourceRepo.deleteIncomeSource(id);
    triggerSync();
  }
}

export default new IncomeService();
