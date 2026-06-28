/**
 * Local SQLite Database (offline-first)
 *
 * Opens a single on-device SQLite database (via @op-engineering/op-sqlite) and
 * runs idempotent migrations. Every screen in the expenses vertical reads and
 * writes this local DB instantly — the sync engine pushes/pulls to the remote
 * API in the background whenever connectivity is available.
 *
 * Each synced table mirrors the API fields plus four bookkeeping columns:
 *   - updated   TEXT  ISO8601 of the last local/remote write (drives LWW)
 *   - created   TEXT  ISO8601 of creation
 *   - _dirty    INT   1 = local change not yet pushed to the server
 *   - _deleted  INT   1 = tombstone, needs a delete-push then local removal
 *
 * A `sync_meta(entity, last_pulled)` table records the high-water mark used for
 * incremental `?updated_since=` pulls.
 */

import {Platform} from 'react-native';
import {
  open,
  ANDROID_DATABASE_PATH,
  IOS_LIBRARY_PATH,
  type DB,
} from '@op-engineering/op-sqlite';

export const DB_NAME = 'usrah.db';

// Pin the database to the platform's PERSISTENT app storage. Without an explicit
// location some setups place the file in a volatile path, so data vanished on
// every cold start. These paths survive app restarts (and are excluded from
// cloud backup churn), so the local DB is now durable.
const DB_LOCATION =
  Platform.OS === 'ios' ? IOS_LIBRARY_PATH : ANDROID_DATABASE_PATH;

/** Logical entities that participate in sync. */
export type SyncEntity =
  | 'categories'
  | 'transactions'
  | 'budgets'
  | 'income_sources'
  | 'savings_funds';

let db: DB | null = null;

/** Statements that create the schema. Safe to run repeatedly. */
const MIGRATIONS: string[] = [
  // --- categories -----------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS categories (
    public_id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT,
    name TEXT,
    name_ar TEXT,
    icon TEXT,
    color TEXT,
    type TEXT,
    is_system INTEGER DEFAULT 0,
    parent TEXT,
    created TEXT,
    updated TEXT,
    _dirty INTEGER DEFAULT 0,
    _deleted INTEGER DEFAULT 0
  );`,

  // --- transactions ---------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS transactions (
    public_id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT,
    type TEXT,
    category_id TEXT,
    category_name TEXT,
    category_icon TEXT,
    category_color TEXT,
    amount TEXT,
    currency TEXT,
    description TEXT,
    notes TEXT,
    date TEXT,
    status TEXT,
    receipt TEXT,
    is_recurring INTEGER DEFAULT 0,
    tags TEXT,
    created_by TEXT,
    created TEXT,
    updated TEXT,
    _dirty INTEGER DEFAULT 0,
    _deleted INTEGER DEFAULT 0
  );`,

  // --- budgets --------------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS budgets (
    public_id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT,
    category_id TEXT,
    category_name TEXT,
    category_icon TEXT,
    category_color TEXT,
    amount TEXT,
    currency TEXT,
    period TEXT,
    start_date TEXT,
    end_date TEXT,
    alert_threshold INTEGER,
    spent TEXT,
    remaining TEXT,
    percentage_used REAL,
    created TEXT,
    updated TEXT,
    _dirty INTEGER DEFAULT 0,
    _deleted INTEGER DEFAULT 0
  );`,

  // --- income_sources -------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS income_sources (
    public_id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT,
    name TEXT,
    amount TEXT,
    currency TEXT,
    is_recurring INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    icon TEXT,
    color TEXT,
    notes TEXT,
    created TEXT,
    updated TEXT,
    _dirty INTEGER DEFAULT 0,
    _deleted INTEGER DEFAULT 0
  );`,

  // --- savings_funds --------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS savings_funds (
    public_id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT,
    name TEXT,
    balance TEXT,
    target_amount TEXT,
    target_date TEXT,
    currency TEXT,
    icon TEXT,
    color TEXT,
    is_active INTEGER DEFAULT 1,
    notes TEXT,
    created TEXT,
    updated TEXT,
    _dirty INTEGER DEFAULT 0,
    _deleted INTEGER DEFAULT 0
  );`,

  // --- sync bookkeeping -----------------------------------------------------
  `CREATE TABLE IF NOT EXISTS sync_meta (
    entity TEXT PRIMARY KEY NOT NULL,
    last_pulled TEXT
  );`,

  // Helpful indexes for the common queries (by family / type / date).
  `CREATE INDEX IF NOT EXISTS idx_tx_family ON transactions (family_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions (date);`,
  `CREATE INDEX IF NOT EXISTS idx_cat_family ON categories (family_id);`,
  `CREATE INDEX IF NOT EXISTS idx_budget_family ON budgets (family_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tx_dirty ON transactions (_dirty);`,
  `CREATE INDEX IF NOT EXISTS idx_cat_dirty ON categories (_dirty);`,
  `CREATE INDEX IF NOT EXISTS idx_budget_dirty ON budgets (_dirty);`,
  `CREATE INDEX IF NOT EXISTS idx_income_family ON income_sources (family_id);`,
  `CREATE INDEX IF NOT EXISTS idx_income_dirty ON income_sources (_dirty);`,
  `CREATE INDEX IF NOT EXISTS idx_savings_family ON savings_funds (family_id);`,
  `CREATE INDEX IF NOT EXISTS idx_savings_dirty ON savings_funds (_dirty);`,
];

/**
 * Open the database (if not already) and run idempotent migrations.
 * Safe to call multiple times — returns the same singleton handle.
 */
export function initDatabase(): DB {
  if (!db) {
    db = DB_LOCATION
      ? open({name: DB_NAME, location: DB_LOCATION})
      : open({name: DB_NAME});
  }
  for (const stmt of MIGRATIONS) {
    db.executeSync(stmt);
  }
  return db;
}

/**
 * Get the open database singleton, opening + migrating lazily on first use so
 * repositories never crash if they run before App's init effect.
 */
export function getDB(): DB {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/** Current timestamp in ISO8601 (UTC) — the canonical format for `updated`. */
export function nowIso(): string {
  return new Date().toISOString();
}

// --- sync_meta helpers ------------------------------------------------------

/** Read the high-water mark for an entity's incremental pull (or null). */
export function getLastPulled(entity: SyncEntity): string | null {
  const r = getDB().executeSync(
    'SELECT last_pulled FROM sync_meta WHERE entity = ?;',
    [entity],
  );
  const row = r.rows?.[0] as {last_pulled?: string | null} | undefined;
  return row?.last_pulled ?? null;
}

/** Persist the high-water mark for an entity's incremental pull. */
export function setLastPulled(entity: SyncEntity, value: string): void {
  getDB().executeSync(
    `INSERT INTO sync_meta (entity, last_pulled) VALUES (?, ?)
     ON CONFLICT(entity) DO UPDATE SET last_pulled = excluded.last_pulled;`,
    [entity, value],
  );
}
