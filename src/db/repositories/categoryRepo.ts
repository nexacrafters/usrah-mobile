/**
 * Category repository — typed local-SQLite CRUD for `categories`.
 *
 * Returns plain {@link Category} objects matching the expense store types. All
 * writes are local + instant; the sync engine pushes `_dirty` rows later.
 */

import uuid from 'react-native-uuid';
import {getDB, nowIso} from '../database';
import type {Category, CategoryType} from '../../store/expenseStore';

/** Local row + bookkeeping columns. */
export interface CategoryRow extends Category {
  family_id?: string | null;
  created?: string;
  updated?: string;
  _dirty?: number;
  _deleted?: number;
}

interface RawCategoryRow {
  public_id: string;
  family_id: string | null;
  name: string | null;
  name_ar: string | null;
  icon: string | null;
  color: string | null;
  type: string | null;
  is_system: number | null;
  parent: string | null;
  created: string | null;
  updated: string | null;
  _dirty: number | null;
  _deleted: number | null;
}

const TABLE = 'categories';

/** Map a raw SQLite row to the public {@link Category} shape. */
function mapRow(r: RawCategoryRow): Category {
  return {
    public_id: r.public_id,
    name: r.name ?? '',
    name_ar: r.name_ar ?? undefined,
    icon: r.icon ?? undefined,
    color: r.color ?? undefined,
    type: (r.type as CategoryType) ?? 'expense',
    is_system: r.is_system === 1,
    parent: r.parent,
  };
}

export interface CreateCategoryInput {
  name: string;
  name_ar?: string;
  icon?: string;
  color?: string;
  type: CategoryType;
}

/** Insert a locally-created category (generates public_id, marks dirty). */
export function createCategory(
  familyId: string,
  input: CreateCategoryInput,
): Category {
  const now = nowIso();
  const id = uuid.v4() as string;
  getDB().executeSync(
    `INSERT INTO ${TABLE}
      (public_id, family_id, name, name_ar, icon, color, type, is_system,
       parent, created, updated, _dirty, _deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, 1, 0);`,
    [
      id,
      familyId,
      input.name,
      input.name_ar ?? null,
      input.icon ?? null,
      input.color ?? null,
      input.type,
      now,
      now,
    ],
  );
  return {
    public_id: id,
    name: input.name,
    name_ar: input.name_ar,
    icon: input.icon,
    color: input.color,
    type: input.type,
    is_system: false,
    parent: null,
  };
}

/** List non-deleted categories for a family. */
export function listCategories(familyId: string): Category[] {
  const r = getDB().executeSync(
    `SELECT * FROM ${TABLE}
      WHERE family_id = ? AND _deleted = 0
      ORDER BY name COLLATE NOCASE ASC;`,
    [familyId],
  );
  return (r.rows as unknown as RawCategoryRow[]).map(mapRow);
}

/** Fetch a single category (including deleted/dirty) or undefined. */
export function getCategory(id: string): Category | undefined {
  const r = getDB().executeSync(`SELECT * FROM ${TABLE} WHERE public_id = ?;`, [id]);
  const row = (r.rows as unknown as RawCategoryRow[])[0];
  return row ? mapRow(row) : undefined;
}

/** Soft-update a category and re-mark it dirty. */
export function updateCategory(
  id: string,
  updates: Partial<CreateCategoryInput>,
): void {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  const set = (col: string, val: string | null | undefined) => {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val ?? null);
    }
  };
  set('name', updates.name);
  set('name_ar', updates.name_ar);
  set('icon', updates.icon);
  set('color', updates.color);
  set('type', updates.type);
  fields.push('updated = ?', '_dirty = 1');
  values.push(nowIso());
  values.push(id);
  getDB().executeSync(
    `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE public_id = ?;`,
    values,
  );
}

/** Soft-delete (tombstone) a category so the deletion can sync. */
export function deleteCategory(id: string): void {
  getDB().executeSync(
    `UPDATE ${TABLE} SET _deleted = 1, _dirty = 1, updated = ? WHERE public_id = ?;`,
    [nowIso(), id],
  );
}
