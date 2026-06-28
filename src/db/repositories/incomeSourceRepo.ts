/**
 * Income source repository — typed local-SQLite CRUD for `income_sources`.
 *
 * Returns plain {@link IncomeSource} objects matching the finance store types.
 * All writes are local + instant; the sync engine pushes `_dirty` rows later.
 */

import uuid from 'react-native-uuid';
import {getDB, nowIso} from '../database';
import type {IncomeSource} from '../../store/financeStore';

interface RawIncomeSourceRow {
  public_id: string;
  family_id: string | null;
  name: string | null;
  amount: string | null;
  currency: string | null;
  is_recurring: number | null;
  is_active: number | null;
  icon: string | null;
  color: string | null;
  notes: string | null;
  created: string | null;
  updated: string | null;
  _dirty: number | null;
  _deleted: number | null;
}

const TABLE = 'income_sources';
const DEFAULT_CURRENCY = 'TND';

/** Map a raw SQLite row to the public {@link IncomeSource} shape. */
function mapRow(r: RawIncomeSourceRow): IncomeSource {
  return {
    public_id: r.public_id,
    family: r.family_id ?? undefined,
    name: r.name ?? '',
    amount: r.amount ?? '0',
    currency: r.currency ?? DEFAULT_CURRENCY,
    is_recurring: r.is_recurring !== 0,
    is_active: r.is_active !== 0,
    icon: r.icon,
    color: r.color,
    notes: r.notes,
    created: r.created ?? undefined,
    updated: r.updated ?? undefined,
  };
}

export interface CreateIncomeSourceInput {
  name: string;
  amount: number | string;
  currency?: string;
  is_recurring?: boolean;
  is_active?: boolean;
  icon?: string | null;
  color?: string | null;
  notes?: string | null;
}

/** Insert a locally-created income source (generates public_id, marks dirty). */
export function createIncomeSource(
  familyId: string,
  input: CreateIncomeSourceInput,
): IncomeSource {
  const now = nowIso();
  const id = uuid.v4() as string;
  const amount = String(input.amount);
  const currency = input.currency ?? DEFAULT_CURRENCY;
  const isRecurring = input.is_recurring === false ? 0 : 1;
  const isActive = input.is_active === false ? 0 : 1;
  getDB().executeSync(
    `INSERT INTO ${TABLE}
      (public_id, family_id, name, amount, currency, is_recurring, is_active,
       icon, color, notes, created, updated, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0);`,
    [
      id,
      familyId,
      input.name,
      amount,
      currency,
      isRecurring,
      isActive,
      input.icon ?? null,
      input.color ?? null,
      input.notes ?? null,
      now,
      now,
    ],
  );
  return {
    public_id: id,
    family: familyId,
    name: input.name,
    amount,
    currency,
    is_recurring: isRecurring === 1,
    is_active: isActive === 1,
    icon: input.icon ?? null,
    color: input.color ?? null,
    notes: input.notes ?? null,
    created: now,
    updated: now,
  };
}

/** List non-deleted income sources for a family, newest first. */
export function listIncomeSources(familyId: string): IncomeSource[] {
  const r = getDB().executeSync(
    `SELECT * FROM ${TABLE}
      WHERE family_id = ? AND _deleted = 0
      ORDER BY is_active DESC, created DESC;`,
    [familyId],
  );
  return (r.rows as unknown as RawIncomeSourceRow[]).map(mapRow);
}

/** Fetch a single income source or undefined. */
export function getIncomeSource(id: string): IncomeSource | undefined {
  const r = getDB().executeSync(`SELECT * FROM ${TABLE} WHERE public_id = ?;`, [
    id,
  ]);
  const row = (r.rows as unknown as RawIncomeSourceRow[])[0];
  return row ? mapRow(row) : undefined;
}

/** Soft-update an income source and re-mark it dirty. */
export function updateIncomeSource(
  id: string,
  updates: Partial<CreateIncomeSourceInput>,
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
  if (updates.amount !== undefined) set('amount', String(updates.amount));
  set('currency', updates.currency);
  if (updates.is_recurring !== undefined) {
    set('is_recurring', updates.is_recurring ? 1 : 0);
  }
  if (updates.is_active !== undefined) {
    set('is_active', updates.is_active ? 1 : 0);
  }
  set('icon', updates.icon);
  set('color', updates.color);
  set('notes', updates.notes);
  fields.push('updated = ?', '_dirty = 1');
  values.push(nowIso());
  values.push(id);
  getDB().executeSync(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE public_id = ?;`,
    values,
  );
}

/** Soft-delete (tombstone) an income source so the deletion can sync. */
export function deleteIncomeSource(id: string): void {
  getDB().executeSync(
    `UPDATE ${TABLE} SET _deleted = 1, _dirty = 1, updated = ? WHERE public_id = ?;`,
    [nowIso(), id],
  );
}
