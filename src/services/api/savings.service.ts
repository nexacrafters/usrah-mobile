/**
 * Savings API Service (offline-first)
 *
 * Manages named savings pots / goals: each fund has a running balance and an
 * OPTIONAL target_amount + target_date. No target = a safe-money pot
 * (Emergency, Backup); with a target = a goal (Car, House, Land) with a
 * progress bar. Supports deposit / withdraw.
 *
 * Like the rest of the finance vertical this is OFFLINE-FIRST: methods read and
 * write the LOCAL SQLite database via savingsFundRepo. They are instant and
 * work fully offline; the background sync engine handles all remote I/O. After
 * every local write we fire `syncNow()`, which no-ops when offline.
 */

import {getCurrentFamilyId} from '../../store/authStore';
import {syncNow} from '../../sync/syncEngine';
import * as savingsFundRepo from '../../db/repositories/savingsFundRepo';
import type {SavingsFund} from '../../store/financeStore';

const DEFAULT_CURRENCY = 'TND';
const NO_FAMILY_MESSAGE = 'Please create or select a family first.';

export interface CreateSavingsFundRequest {
  name: string;
  balance?: number | string;
  target_amount?: number | string | null;
  target_date?: string | null;
  currency?: string;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean;
  notes?: string | null;
}

/** Fire-and-forget background sync; never throws into the caller. */
const triggerSync = (): void => {
  void syncNow();
};

class SavingsService {
  async listSavingsFunds(): Promise<SavingsFund[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    triggerSync();
    return savingsFundRepo.listSavingsFunds(familyId);
  }

  async getSavingsFund(id: string): Promise<SavingsFund | undefined> {
    return savingsFundRepo.getSavingsFund(id);
  }

  async createSavingsFund(
    data: CreateSavingsFundRequest,
  ): Promise<SavingsFund> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    const created = savingsFundRepo.createSavingsFund(familyId, {
      ...data,
      currency: data.currency ?? DEFAULT_CURRENCY,
    });
    triggerSync();
    return created;
  }

  async updateSavingsFund(
    id: string,
    data: Partial<CreateSavingsFundRequest>,
  ): Promise<SavingsFund> {
    savingsFundRepo.updateSavingsFund(id, data);
    triggerSync();
    return (
      savingsFundRepo.getSavingsFund(id) ?? ({public_id: id} as SavingsFund)
    );
  }

  /** Add money to a fund. Returns the updated fund. */
  async deposit(id: string, amount: number): Promise<SavingsFund> {
    const updated = savingsFundRepo.deposit(id, amount);
    triggerSync();
    return updated ?? ({public_id: id} as SavingsFund);
  }

  /** Take money out of a fund (clamped at zero). Returns the updated fund. */
  async withdraw(id: string, amount: number): Promise<SavingsFund> {
    const updated = savingsFundRepo.withdraw(id, amount);
    triggerSync();
    return updated ?? ({public_id: id} as SavingsFund);
  }

  async deleteSavingsFund(id: string): Promise<void> {
    savingsFundRepo.deleteSavingsFund(id);
    triggerSync();
  }
}

export default new SavingsService();
