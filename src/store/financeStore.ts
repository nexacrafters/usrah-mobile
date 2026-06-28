/**
 * Finance Store
 *
 * In-memory view layer for the finance vertical's two offline-first entities:
 *   - Income sources (named monthly / one-off income, e.g. "Salary - Acme")
 *   - Savings funds / goals (named pots with a running balance, optional target)
 *
 * Durable persistence lives in the local SQLite repositories
 * (src/db/repositories/incomeSourceRepo.ts + savingsFundRepo.ts), invoked
 * through income.service.ts / savings.service.ts — which also fire the
 * background sync. Types mirror the real Usrah API contract under
 * /api/expenses/income-sources/ and /api/expenses/savings-funds/. All ids are
 * public_id UUID strings and amounts arrive from the API as strings.
 */

import {create} from 'zustand';
import {syncNow} from '../sync/syncEngine';

/** Fire-and-forget background sync that never throws into the caller. */
const nudgeSync = (): void => {
  void syncNow();
};

/** Income source as returned by GET /expenses/income-sources/. */
export interface IncomeSource {
  public_id: string;
  family?: string;
  name: string;
  amount: string; // decimal string from the API
  currency: string;
  is_recurring: boolean;
  is_active: boolean;
  icon?: string | null;
  color?: string | null;
  notes?: string | null;
  created?: string;
  updated?: string;
}

/** Savings fund / goal as returned by GET /expenses/savings-funds/. */
export interface SavingsFund {
  public_id: string;
  family?: string;
  name: string;
  balance: string; // decimal string from the API
  target_amount?: string | null;
  target_date?: string | null;
  currency: string;
  icon?: string | null;
  color?: string | null;
  is_active: boolean;
  notes?: string | null;
  /** Server-computed progress (0–100) when a target is set, else null. */
  percentage?: number | null;
  created?: string;
  updated?: string;
}

/** Safely coerce an API amount (string | number) to a number. */
const toNumber = (value: string | number | null | undefined): number => {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
};

interface FinanceState {
  incomeSources: IncomeSource[];
  savingsFunds: SavingsFund[];

  setIncomeSources: (sources: IncomeSource[]) => void;
  setSavingsFunds: (funds: SavingsFund[]) => void;

  addIncomeSource: (source: IncomeSource) => void;
  removeIncomeSource: (id: string) => void;

  addSavingsFund: (fund: SavingsFund) => void;
  updateSavingsFund: (id: string, updates: Partial<SavingsFund>) => void;
  removeSavingsFund: (id: string) => void;

  /** Monthly income = active recurring sources (one-off handled at call site). */
  getRecurringMonthlyIncome: () => number;
  /** Safe money = sum of all active fund balances. */
  getTotalSafe: () => number;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  incomeSources: [],
  savingsFunds: [],

  setIncomeSources: (incomeSources) => set({incomeSources}),
  setSavingsFunds: (savingsFunds) => set({savingsFunds}),

  addIncomeSource: (source) => {
    set((state) => ({incomeSources: [source, ...state.incomeSources]}));
    nudgeSync();
  },
  removeIncomeSource: (id) => {
    set((state) => ({
      incomeSources: state.incomeSources.filter((s) => s.public_id !== id),
    }));
    nudgeSync();
  },

  addSavingsFund: (fund) => {
    set((state) => ({savingsFunds: [fund, ...state.savingsFunds]}));
    nudgeSync();
  },
  updateSavingsFund: (id, updates) => {
    set((state) => ({
      savingsFunds: state.savingsFunds.map((f) =>
        f.public_id === id ? {...f, ...updates} : f,
      ),
    }));
    nudgeSync();
  },
  removeSavingsFund: (id) => {
    set((state) => ({
      savingsFunds: state.savingsFunds.filter((f) => f.public_id !== id),
    }));
    nudgeSync();
  },

  getRecurringMonthlyIncome: () =>
    get()
      .incomeSources.filter((s) => s.is_active && s.is_recurring)
      .reduce((sum, s) => sum + toNumber(s.amount), 0),

  getTotalSafe: () =>
    get()
      .savingsFunds.filter((f) => f.is_active)
      .reduce((sum, f) => sum + toNumber(f.balance), 0),
}));
