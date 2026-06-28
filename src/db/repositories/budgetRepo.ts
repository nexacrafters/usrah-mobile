/**
 * Budget repository — typed local-SQLite CRUD for `budgets`.
 *
 * Returns plain {@link Budget} objects matching the expense store types. The
 * computed progress fields (spent / remaining / percentage_used) are populated
 * by the server on pull; locally-created budgets start at zero. All writes are
 * local + instant; the sync engine pushes `_dirty` rows later.
 */

import uuid from 'react-native-uuid';
import {getDB, nowIso} from '../database';
import type {Budget, BudgetPeriod} from '../../store/expenseStore';

interface RawBudgetRow {
  public_id: string;
  family_id: string | null;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  amount: string | null;
  currency: string | null;
  period: string | null;
  start_date: string | null;
  end_date: string | null;
  alert_threshold: number | null;
  spent: string | null;
  remaining: string | null;
  percentage_used: number | null;
  created: string | null;
  updated: string | null;
  _dirty: number | null;
  _deleted: number | null;
}

const TABLE = 'budgets';

/** Map a raw SQLite row to the public {@link Budget} shape. */
function mapRow(r: RawBudgetRow): Budget {
  return {
    public_id: r.public_id,
    category: r.category_id,
    category_name: r.category_name,
    category_icon: r.category_icon,
    category_color: r.category_color,
    amount: r.amount ?? '0',
    currency: r.currency ?? 'TND',
    period: (r.period as BudgetPeriod) ?? 'monthly',
    start_date: r.start_date ?? '',
    end_date: r.end_date,
    alert_threshold: r.alert_threshold ?? undefined,
    spent: r.spent ?? '0',
    remaining: r.remaining ?? '0',
    percentage_used: r.percentage_used ?? 0,
  };
}

export interface CreateBudgetInput {
  category_id: string;
  amount: number | string;
  currency?: string;
  period: BudgetPeriod;
  start_date: string;
  end_date?: string;
  alert_threshold?: number;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

/** Insert a locally-created budget (generates public_id, marks dirty). */
export function createBudget(
  familyId: string,
  input: CreateBudgetInput,
): Budget {
  const now = nowIso();
  const id = uuid.v4() as string;
  const amount = String(input.amount);
  const currency = input.currency ?? 'TND';
  getDB().executeSync(
    `INSERT INTO ${TABLE}
      (public_id, family_id, category_id, category_name, category_icon,
       category_color, amount, currency, period, start_date, end_date,
       alert_threshold, spent, remaining, percentage_used, created, updated,
       _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0', ?, 0, ?, ?, 1, 0);`,
    [
      id,
      familyId,
      input.category_id,
      input.category_name ?? null,
      input.category_icon ?? null,
      input.category_color ?? null,
      amount,
      currency,
      input.period,
      input.start_date,
      input.end_date ?? null,
      input.alert_threshold ?? null,
      amount, // remaining = full amount initially
      now,
      now,
    ],
  );
  return {
    public_id: id,
    category: input.category_id,
    category_name: input.category_name ?? null,
    category_icon: input.category_icon ?? null,
    category_color: input.category_color ?? null,
    amount,
    currency,
    period: input.period,
    start_date: input.start_date,
    end_date: input.end_date ?? null,
    alert_threshold: input.alert_threshold,
    spent: '0',
    remaining: amount,
    percentage_used: 0,
  };
}

/** List non-deleted budgets for a family. */
export function listBudgets(familyId: string): Budget[] {
  const r = getDB().executeSync(
    `SELECT * FROM ${TABLE}
      WHERE family_id = ? AND _deleted = 0
      ORDER BY created DESC;`,
    [familyId],
  );
  return (r.rows as unknown as RawBudgetRow[]).map(mapRow);
}

/** Fetch a single budget or undefined. */
export function getBudget(id: string): Budget | undefined {
  const r = getDB().executeSync(`SELECT * FROM ${TABLE} WHERE public_id = ?;`, [
    id,
  ]);
  const row = (r.rows as unknown as RawBudgetRow[])[0];
  return row ? mapRow(row) : undefined;
}

/** Soft-update a budget and re-mark it dirty. */
export function updateBudget(
  id: string,
  updates: Partial<CreateBudgetInput>,
): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const set = (col: string, val: string | number | null | undefined) => {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val);
    }
  };
  set('category_id', updates.category_id);
  if (updates.amount !== undefined) set('amount', String(updates.amount));
  set('currency', updates.currency);
  set('period', updates.period);
  set('start_date', updates.start_date);
  set('end_date', updates.end_date);
  set('alert_threshold', updates.alert_threshold);
  fields.push('updated = ?', '_dirty = 1');
  values.push(nowIso());
  values.push(id);
  getDB().executeSync(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE public_id = ?;`,
    values,
  );
}

/** Soft-delete (tombstone) a budget so the deletion can sync. */
export function deleteBudget(id: string): void {
  getDB().executeSync(
    `UPDATE ${TABLE} SET _deleted = 1, _dirty = 1, updated = ? WHERE public_id = ?;`,
    [nowIso(), id],
  );
}
