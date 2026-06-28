/**
 * Savings fund repository — typed local-SQLite CRUD for `savings_funds`.
 *
 * A savings fund is a named pot with a running `balance`. With no target it is
 * a safe-money pot (Emergency, Backup); with a `target_amount` (+ optional
 * `target_date`) it is a goal (Car, House, Land) that shows a progress bar.
 *
 * Returns plain {@link SavingsFund} objects matching the finance store types.
 * `deposit` / `withdraw` adjust the balance locally and re-mark the row dirty.
 * The local `percentage` is recomputed from balance/target so progress bars are
 * accurate offline; the server's authoritative value overwrites on the next
 * pull. All writes are local + instant; the sync engine pushes `_dirty` rows.
 */

import uuid from 'react-native-uuid';
import {getDB, nowIso} from '../database';
import type {SavingsFund} from '../../store/financeStore';

interface RawSavingsFundRow {
  public_id: string;
  family_id: string | null;
  name: string | null;
  balance: string | null;
  target_amount: string | null;
  target_date: string | null;
  currency: string | null;
  icon: string | null;
  color: string | null;
  is_active: number | null;
  notes: string | null;
  created: string | null;
  updated: string | null;
  _dirty: number | null;
  _deleted: number | null;
}

const TABLE = 'savings_funds';
const DEFAULT_CURRENCY = 'TND';

const toNumber = (value: string | number | null | undefined): number => {
  const n = typeof value === 'number' ? value : parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
};

/** Local progress (0–100) when a target is set, else null. */
function computePercentage(
  balance: string | null,
  target: string | null,
): number | null {
  const t = toNumber(target);
  if (!target || t <= 0) return null;
  const pct = (toNumber(balance) / t) * 100;
  return Math.max(0, Math.round(pct));
}

/** Map a raw SQLite row to the public {@link SavingsFund} shape. */
function mapRow(r: RawSavingsFundRow): SavingsFund {
  return {
    public_id: r.public_id,
    family: r.family_id ?? undefined,
    name: r.name ?? '',
    balance: r.balance ?? '0',
    target_amount: r.target_amount,
    target_date: r.target_date,
    currency: r.currency ?? DEFAULT_CURRENCY,
    icon: r.icon,
    color: r.color,
    is_active: r.is_active !== 0,
    notes: r.notes,
    percentage: computePercentage(r.balance, r.target_amount),
    created: r.created ?? undefined,
    updated: r.updated ?? undefined,
  };
}

export interface CreateSavingsFundInput {
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

/** Insert a locally-created savings fund (generates public_id, marks dirty). */
export function createSavingsFund(
  familyId: string,
  input: CreateSavingsFundInput,
): SavingsFund {
  const now = nowIso();
  const id = uuid.v4() as string;
  const balance = String(input.balance ?? 0);
  const currency = input.currency ?? DEFAULT_CURRENCY;
  const target =
    input.target_amount === undefined || input.target_amount === null
      ? null
      : String(input.target_amount);
  const isActive = input.is_active === false ? 0 : 1;
  getDB().executeSync(
    `INSERT INTO ${TABLE}
      (public_id, family_id, name, balance, target_amount, target_date,
       currency, icon, color, is_active, notes, created, updated, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0);`,
    [
      id,
      familyId,
      input.name,
      balance,
      target,
      input.target_date ?? null,
      currency,
      input.icon ?? null,
      input.color ?? null,
      isActive,
      input.notes ?? null,
      now,
      now,
    ],
  );
  return {
    public_id: id,
    family: familyId,
    name: input.name,
    balance,
    target_amount: target,
    target_date: input.target_date ?? null,
    currency,
    icon: input.icon ?? null,
    color: input.color ?? null,
    is_active: isActive === 1,
    notes: input.notes ?? null,
    percentage: computePercentage(balance, target),
    created: now,
    updated: now,
  };
}

/** List non-deleted savings funds for a family, newest first. */
export function listSavingsFunds(familyId: string): SavingsFund[] {
  const r = getDB().executeSync(
    `SELECT * FROM ${TABLE}
      WHERE family_id = ? AND _deleted = 0
      ORDER BY is_active DESC, created DESC;`,
    [familyId],
  );
  return (r.rows as unknown as RawSavingsFundRow[]).map(mapRow);
}

/** Fetch a single savings fund or undefined. */
export function getSavingsFund(id: string): SavingsFund | undefined {
  const r = getDB().executeSync(`SELECT * FROM ${TABLE} WHERE public_id = ?;`, [
    id,
  ]);
  const row = (r.rows as unknown as RawSavingsFundRow[])[0];
  return row ? mapRow(row) : undefined;
}

/** Soft-update a savings fund and re-mark it dirty. */
export function updateSavingsFund(
  id: string,
  updates: Partial<CreateSavingsFundInput>,
): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const set = (col: string, val: string | number | null | undefined) => {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val);
    }
  };
  set('name', updates.name);
  if (updates.balance !== undefined) set('balance', String(updates.balance));
  if (updates.target_amount !== undefined) {
    set(
      'target_amount',
      updates.target_amount === null ? null : String(updates.target_amount),
    );
  }
  set('target_date', updates.target_date);
  set('currency', updates.currency);
  set('icon', updates.icon);
  set('color', updates.color);
  if (updates.is_active !== undefined) {
    set('is_active', updates.is_active ? 1 : 0);
  }
  set('notes', updates.notes);
  fields.push('updated = ?', '_dirty = 1');
  values.push(nowIso());
  values.push(id);
  getDB().executeSync(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE public_id = ?;`,
    values,
  );
}

/**
 * Add `amount` to a fund's balance (deposit). Marks the row dirty so the new
 * balance syncs. Returns the updated fund, or undefined if it doesn't exist.
 */
export function deposit(id: string, amount: number): SavingsFund | undefined {
  const current = getSavingsFund(id);
  if (!current) return undefined;
  const next = toNumber(current.balance) + amount;
  getDB().executeSync(
    `UPDATE ${TABLE} SET balance = ?, updated = ?, _dirty = 1 WHERE public_id = ?;`,
    [String(next), nowIso(), id],
  );
  return getSavingsFund(id);
}

/**
 * Subtract `amount` from a fund's balance (withdraw), clamped at zero. Marks
 * the row dirty. Returns the updated fund, or undefined if it doesn't exist.
 */
export function withdraw(id: string, amount: number): SavingsFund | undefined {
  const current = getSavingsFund(id);
  if (!current) return undefined;
  const next = Math.max(0, toNumber(current.balance) - amount);
  getDB().executeSync(
    `UPDATE ${TABLE} SET balance = ?, updated = ?, _dirty = 1 WHERE public_id = ?;`,
    [String(next), nowIso(), id],
  );
  return getSavingsFund(id);
}

/** Soft-delete (tombstone) a savings fund so the deletion can sync. */
export function deleteSavingsFund(id: string): void {
  getDB().executeSync(
    `UPDATE ${TABLE} SET _deleted = 1, _dirty = 1, updated = ? WHERE public_id = ?;`,
    [nowIso(), id],
  );
}
