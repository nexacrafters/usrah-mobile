/**
 * Transaction repository — typed local-SQLite CRUD for `transactions`.
 *
 * Returns plain {@link Transaction} objects matching the expense store types.
 * Tags + created_by are stored as JSON text. All writes are local + instant;
 * the sync engine pushes `_dirty` rows later.
 */

import uuid from 'react-native-uuid';
import {getDB, nowIso} from '../database';
import type {
  Transaction,
  TransactionType,
  TransactionAuthor,
} from '../../store/expenseStore';

interface RawTransactionRow {
  public_id: string;
  family_id: string | null;
  type: string | null;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  amount: string | null;
  currency: string | null;
  description: string | null;
  notes: string | null;
  date: string | null;
  status: string | null;
  receipt: string | null;
  is_recurring: number | null;
  tags: string | null;
  created_by: string | null;
  created: string | null;
  updated: string | null;
  _dirty: number | null;
  _deleted: number | null;
}

const TABLE = 'transactions';

const parseJson = <T>(value: string | null): T | undefined => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

/** Map a raw SQLite row to the public {@link Transaction} shape. */
function mapRow(r: RawTransactionRow): Transaction {
  return {
    public_id: r.public_id,
    family: r.family_id ?? undefined,
    type: (r.type as TransactionType) ?? 'expense',
    category: r.category_id,
    category_name: r.category_name,
    category_icon: r.category_icon,
    category_color: r.category_color,
    amount: r.amount ?? '0',
    currency: r.currency ?? 'TND',
    description: r.description ?? undefined,
    notes: r.notes ?? undefined,
    date: r.date ?? '',
    status: r.status ?? undefined,
    receipt: r.receipt,
    is_recurring: r.is_recurring === 1,
    tags: parseJson<string[]>(r.tags),
    created_by: parseJson<TransactionAuthor>(r.created_by),
    created: r.created ?? undefined,
    updated: r.updated ?? undefined,
  };
}

export interface CreateTransactionInput {
  type: TransactionType;
  category_id?: string | null;
  amount: number | string;
  currency?: string;
  description?: string;
  notes?: string;
  date: string;
  tags?: string[];
  // Optional denormalised category display fields (kept fresh locally).
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

export interface ListTransactionsFilter {
  type?: TransactionType;
  category_id?: string;
  start_date?: string;
  end_date?: string;
}

/** Insert a locally-created transaction (generates public_id, marks dirty). */
export function createTransaction(
  familyId: string,
  input: CreateTransactionInput,
): Transaction {
  const now = nowIso();
  const id = uuid.v4() as string;
  const amount = String(input.amount);
  const currency = input.currency ?? 'TND';
  const tags = input.tags ? JSON.stringify(input.tags) : null;
  getDB().executeSync(
    `INSERT INTO ${TABLE}
      (public_id, family_id, type, category_id, category_name, category_icon,
       category_color, amount, currency, description, notes, date, status,
       receipt, is_recurring, tags, created_by, created, updated, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0, ?, NULL, ?, ?, 1, 0);`,
    [
      id,
      familyId,
      input.type,
      input.category_id ?? null,
      input.category_name ?? null,
      input.category_icon ?? null,
      input.category_color ?? null,
      amount,
      currency,
      input.description ?? null,
      input.notes ?? null,
      input.date,
      tags,
      now,
      now,
    ],
  );
  return {
    public_id: id,
    family: familyId,
    type: input.type,
    category: input.category_id ?? null,
    category_name: input.category_name ?? null,
    category_icon: input.category_icon ?? null,
    category_color: input.category_color ?? null,
    amount,
    currency,
    description: input.description,
    notes: input.notes,
    date: input.date,
    is_recurring: false,
    tags: input.tags,
    created: now,
    updated: now,
  };
}

/** List non-deleted transactions for a family, newest first, with filters. */
export function listTransactions(
  familyId: string,
  filter: ListTransactionsFilter = {},
): Transaction[] {
  const clauses = ['family_id = ?', '_deleted = 0'];
  const values: (string | number)[] = [familyId];
  if (filter.type) {
    clauses.push('type = ?');
    values.push(filter.type);
  }
  if (filter.category_id) {
    clauses.push('category_id = ?');
    values.push(filter.category_id);
  }
  if (filter.start_date) {
    clauses.push('date >= ?');
    values.push(filter.start_date);
  }
  if (filter.end_date) {
    clauses.push('date <= ?');
    values.push(filter.end_date);
  }
  const r = getDB().executeSync(
    `SELECT * FROM ${TABLE}
      WHERE ${clauses.join(' AND ')}
      ORDER BY date DESC, created DESC;`,
    values,
  );
  return (r.rows as unknown as RawTransactionRow[]).map(mapRow);
}

/** Fetch a single transaction or undefined. */
export function getTransaction(id: string): Transaction | undefined {
  const r = getDB().executeSync(`SELECT * FROM ${TABLE} WHERE public_id = ?;`, [id]);
  const row = (r.rows as unknown as RawTransactionRow[])[0];
  return row ? mapRow(row) : undefined;
}

/** Soft-update a transaction and re-mark it dirty. */
export function updateTransaction(
  id: string,
  updates: Partial<CreateTransactionInput>,
): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const set = (col: string, val: string | number | null | undefined) => {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val);
    }
  };
  set('type', updates.type);
  if (updates.category_id !== undefined) {
    set('category_id', updates.category_id ?? null);
  }
  set('category_name', updates.category_name ?? undefined);
  set('category_icon', updates.category_icon ?? undefined);
  set('category_color', updates.category_color ?? undefined);
  if (updates.amount !== undefined) set('amount', String(updates.amount));
  set('currency', updates.currency);
  set('description', updates.description);
  set('notes', updates.notes);
  set('date', updates.date);
  if (updates.tags !== undefined) set('tags', JSON.stringify(updates.tags));
  fields.push('updated = ?', '_dirty = 1');
  values.push(nowIso());
  values.push(id);
  getDB().executeSync(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE public_id = ?;`,
    values,
  );
}

/** Soft-delete (tombstone) a transaction so the deletion can sync. */
export function deleteTransaction(id: string): void {
  getDB().executeSync(
    `UPDATE ${TABLE} SET _deleted = 1, _dirty = 1, updated = ? WHERE public_id = ?;`,
    [nowIso(), id],
  );
}
