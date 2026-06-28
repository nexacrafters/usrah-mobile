/**
 * Sync Engine (offline-first background sync)
 *
 * Reconciles the local SQLite database with the remote API:
 *
 *   push  — send local `_dirty` rows to the server (create/update, or delete
 *           tombstones), clearing the dirty flag on success. Idempotent: every
 *           row carries its client-supplied `public_id`, so replaying a push is
 *           safe (the backend upserts on `public_id`).
 *   pull  — fetch rows changed since our last successful pull
 *           (`?updated_since=`) and merge them in. Conflicts are resolved
 *           LAST-WRITE-WINS by the `updated` timestamp.
 *
 * All network access is wrapped: when offline, failures simply leave `_dirty`
 * set so the change is retried on the next sync. Connectivity transitions are
 * watched via NetInfo, debounced, and trigger a full `syncAll()` automatically
 * — there is no manual sync button.
 */

import NetInfo from '@react-native-community/netinfo';
import apiClient from '../services/api/client';
import {getCurrentFamilyId} from '../store/authStore';
import {
  getDB,
  getLastPulled,
  setLastPulled,
  nowIso,
  type SyncEntity,
} from '../db/database';

// --- Endpoint + column configuration per entity -----------------------------

interface EntityConfig {
  table: string;
  listPath: string;
  createPath: string;
  /** Build the per-id detail path for PATCH/DELETE. */
  detailPath: (id: string) => string;
  /** Columns to send to the server on create/update (besides public_id). */
  buildCreatePayload: (row: Record<string, unknown>, familyId: string) => Record<string, unknown>;
  buildUpdatePayload: (row: Record<string, unknown>) => Record<string, unknown>;
  /** Columns to write when inserting/overwriting a remote row locally. */
  upsertLocal: (remote: Record<string, unknown>, familyId: string) => void;
}

const str = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v);

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);

// Pull `updated` from a remote payload, falling back to created/now.
const remoteUpdated = (r: Record<string, unknown>): string =>
  (r.updated as string) || (r.created as string) || nowIso();

const ENTITIES: Record<SyncEntity, EntityConfig> = {
  categories: {
    table: 'categories',
    listPath: '/expenses/categories/',
    createPath: '/expenses/categories/create/',
    detailPath: (id) => `/expenses/categories/${id}/`,
    buildCreatePayload: (row, familyId) => ({
      public_id: row.public_id,
      family_id: familyId,
      name: row.name,
      name_ar: row.name_ar ?? undefined,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      type: row.type,
      updated: row.updated,
    }),
    buildUpdatePayload: (row) => ({
      name: row.name,
      name_ar: row.name_ar ?? undefined,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      type: row.type,
      updated: row.updated,
    }),
    upsertLocal: (remote, familyId) => {
      // Upsert one category row. `parentId` overrides the remote parent linkage
      // (the API serialises `parent` as an integer PK, so for nested
      // subcategories we pass the parent's public_id UUID explicitly instead).
      const upsertOne = (
        cat: Record<string, unknown>,
        parentId: string | null,
      ) => {
        getDB().executeSync(
          `INSERT INTO categories
            (public_id, family_id, name, name_ar, icon, color, type, is_system,
             parent, created, updated, _dirty, _deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
           ON CONFLICT(public_id) DO UPDATE SET
             family_id=excluded.family_id, name=excluded.name,
             name_ar=excluded.name_ar, icon=excluded.icon, color=excluded.color,
             type=excluded.type, is_system=excluded.is_system,
             parent=excluded.parent, created=excluded.created,
             updated=excluded.updated, _dirty=0, _deleted=0;`,
          [
            str(cat.public_id),
            familyId,
            str(cat.name),
            str(cat.name_ar),
            str(cat.icon),
            str(cat.color),
            str(cat.type),
            cat.is_system ? 1 : 0,
            parentId,
            str(cat.created),
            remoteUpdated(cat),
          ],
        );
      };

      upsertOne(remote, null);
      // The list endpoint nests subcategories under each top-level category.
      // Persist them as their own flat rows so the picker can drill into them
      // offline; link each to the parent by its public_id UUID.
      const subs = remote.subcategories;
      if (Array.isArray(subs)) {
        for (const sub of subs as Array<Record<string, unknown>>) {
          upsertOne(sub, str(remote.public_id));
        }
      }
    },
  },

  transactions: {
    table: 'transactions',
    listPath: '/expenses/transactions/',
    createPath: '/expenses/transactions/create/',
    detailPath: (id) => `/expenses/transactions/${id}/`,
    buildCreatePayload: (row, familyId) => ({
      public_id: row.public_id,
      family_id: familyId,
      type: row.type,
      category_id: row.category_id ?? undefined,
      amount: row.amount,
      currency: row.currency,
      description: row.description ?? undefined,
      notes: row.notes ?? undefined,
      date: row.date,
      is_private: !!row.is_private,
      tags: row.tags ? safeParseArray(row.tags as string) : undefined,
      updated: row.updated,
    }),
    buildUpdatePayload: (row) => ({
      type: row.type,
      category_id: row.category_id ?? undefined,
      amount: row.amount,
      currency: row.currency,
      description: row.description ?? undefined,
      notes: row.notes ?? undefined,
      date: row.date,
      is_private: !!row.is_private,
      tags: row.tags ? safeParseArray(row.tags as string) : undefined,
      updated: row.updated,
    }),
    upsertLocal: (remote, familyId) => {
      getDB().executeSync(
        `INSERT INTO transactions
          (public_id, family_id, type, category_id, category_name,
           category_icon, category_color, amount, currency, description, notes,
           date, status, receipt, is_recurring, is_private, tags, created_by, created,
           updated, _dirty, _deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
         ON CONFLICT(public_id) DO UPDATE SET
           family_id=excluded.family_id, type=excluded.type,
           category_id=excluded.category_id, category_name=excluded.category_name,
           category_icon=excluded.category_icon, category_color=excluded.category_color,
           amount=excluded.amount, currency=excluded.currency,
           description=excluded.description, notes=excluded.notes,
           date=excluded.date, status=excluded.status, receipt=excluded.receipt,
           is_recurring=excluded.is_recurring, is_private=excluded.is_private,
           tags=excluded.tags,
           created_by=excluded.created_by, created=excluded.created,
           updated=excluded.updated, _dirty=0, _deleted=0;`,
        [
          str(remote.public_id),
          // Pulls are family-scoped, so the row belongs to `familyId` (a UUID).
          // The API serialises `family` as an integer PK, which must NOT be
          // written to the UUID family_id column (it would never match queries).
          familyId,
          str(remote.type),
          str(remote.category),
          str(remote.category_name),
          str(remote.category_icon),
          str(remote.category_color),
          str(remote.amount),
          str(remote.currency),
          str(remote.description),
          str(remote.notes),
          str(remote.date),
          str(remote.status),
          str(remote.receipt),
          remote.is_recurring ? 1 : 0,
          remote.is_private ? 1 : 0,
          remote.tags ? JSON.stringify(remote.tags) : null,
          remote.created_by ? JSON.stringify(remote.created_by) : null,
          str(remote.created),
          remoteUpdated(remote),
        ],
      );
    },
  },

  budgets: {
    table: 'budgets',
    listPath: '/expenses/budgets/',
    createPath: '/expenses/budgets/create/',
    detailPath: (id) => `/expenses/budgets/${id}/`,
    buildCreatePayload: (row, familyId) => ({
      public_id: row.public_id,
      family_id: familyId,
      category_id: row.category_id,
      amount: row.amount,
      currency: row.currency,
      period: row.period,
      start_date: row.start_date,
      alert_threshold: row.alert_threshold ?? undefined,
      updated: row.updated,
    }),
    buildUpdatePayload: (row) => ({
      category_id: row.category_id,
      amount: row.amount,
      currency: row.currency,
      period: row.period,
      start_date: row.start_date,
      alert_threshold: row.alert_threshold ?? undefined,
      updated: row.updated,
    }),
    upsertLocal: (remote, familyId) => {
      getDB().executeSync(
        `INSERT INTO budgets
          (public_id, family_id, category_id, category_name, category_icon,
           category_color, amount, currency, period, start_date, end_date,
           alert_threshold, spent, remaining, percentage_used, created, updated,
           _dirty, _deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
         ON CONFLICT(public_id) DO UPDATE SET
           family_id=excluded.family_id, category_id=excluded.category_id,
           category_name=excluded.category_name, category_icon=excluded.category_icon,
           category_color=excluded.category_color, amount=excluded.amount,
           currency=excluded.currency, period=excluded.period,
           start_date=excluded.start_date, end_date=excluded.end_date,
           alert_threshold=excluded.alert_threshold, spent=excluded.spent,
           remaining=excluded.remaining, percentage_used=excluded.percentage_used,
           created=excluded.created, updated=excluded.updated, _dirty=0, _deleted=0;`,
        [
          str(remote.public_id),
          // Pulls are family-scoped, so the row belongs to `familyId` (a UUID).
          // The API serialises `family` as an integer PK, which must NOT be
          // written to the UUID family_id column (it would never match queries).
          familyId,
          str(remote.category),
          str(remote.category_name),
          str(remote.category_icon),
          str(remote.category_color),
          str(remote.amount),
          str(remote.currency),
          str(remote.period),
          str(remote.start_date),
          str(remote.end_date),
          num(remote.alert_threshold),
          str(remote.spent),
          str(remote.remaining),
          num(remote.percentage_used),
          str(remote.created),
          remoteUpdated(remote),
        ],
      );
    },
  },

  income_sources: {
    table: 'income_sources',
    listPath: '/expenses/income-sources/',
    createPath: '/expenses/income-sources/create/',
    detailPath: (id) => `/expenses/income-sources/${id}/`,
    buildCreatePayload: (row, familyId) => ({
      public_id: row.public_id,
      family_id: familyId,
      name: row.name,
      amount: row.amount,
      currency: row.currency,
      is_recurring: row.is_recurring === 1,
      is_active: row.is_active === 1,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      notes: row.notes ?? undefined,
      updated: row.updated,
    }),
    buildUpdatePayload: (row) => ({
      name: row.name,
      amount: row.amount,
      currency: row.currency,
      is_recurring: row.is_recurring === 1,
      is_active: row.is_active === 1,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      notes: row.notes ?? undefined,
      updated: row.updated,
    }),
    upsertLocal: (remote, familyId) => {
      getDB().executeSync(
        `INSERT INTO income_sources
          (public_id, family_id, name, amount, currency, is_recurring,
           is_active, icon, color, notes, created, updated, _dirty, _deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
         ON CONFLICT(public_id) DO UPDATE SET
           family_id=excluded.family_id, name=excluded.name,
           amount=excluded.amount, currency=excluded.currency,
           is_recurring=excluded.is_recurring, is_active=excluded.is_active,
           icon=excluded.icon, color=excluded.color, notes=excluded.notes,
           created=excluded.created, updated=excluded.updated,
           _dirty=0, _deleted=0;`,
        [
          str(remote.public_id),
          // Pulls are family-scoped, so the row belongs to `familyId` (a UUID).
          // The API serialises `family` as an integer PK, which must NOT be
          // written to the UUID family_id column (it would never match queries).
          familyId,
          str(remote.name),
          str(remote.amount),
          str(remote.currency),
          remote.is_recurring ? 1 : 0,
          remote.is_active === false ? 0 : 1,
          str(remote.icon),
          str(remote.color),
          str(remote.notes),
          str(remote.created),
          remoteUpdated(remote),
        ],
      );
    },
  },

  savings_funds: {
    table: 'savings_funds',
    listPath: '/expenses/savings-funds/',
    createPath: '/expenses/savings-funds/create/',
    detailPath: (id) => `/expenses/savings-funds/${id}/`,
    buildCreatePayload: (row, familyId) => ({
      public_id: row.public_id,
      family_id: familyId,
      name: row.name,
      balance: row.balance,
      target_amount: row.target_amount ?? undefined,
      target_date: row.target_date ?? undefined,
      currency: row.currency,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      is_active: row.is_active === 1,
      notes: row.notes ?? undefined,
      updated: row.updated,
    }),
    buildUpdatePayload: (row) => ({
      name: row.name,
      balance: row.balance,
      target_amount: row.target_amount ?? undefined,
      target_date: row.target_date ?? undefined,
      currency: row.currency,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      is_active: row.is_active === 1,
      notes: row.notes ?? undefined,
      updated: row.updated,
    }),
    upsertLocal: (remote, familyId) => {
      getDB().executeSync(
        `INSERT INTO savings_funds
          (public_id, family_id, name, balance, target_amount, target_date,
           currency, icon, color, is_active, notes, created, updated, _dirty,
           _deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
         ON CONFLICT(public_id) DO UPDATE SET
           family_id=excluded.family_id, name=excluded.name,
           balance=excluded.balance, target_amount=excluded.target_amount,
           target_date=excluded.target_date, currency=excluded.currency,
           icon=excluded.icon, color=excluded.color,
           is_active=excluded.is_active, notes=excluded.notes,
           created=excluded.created, updated=excluded.updated,
           _dirty=0, _deleted=0;`,
        [
          str(remote.public_id),
          // Pulls are family-scoped, so the row belongs to `familyId` (a UUID).
          // The API serialises `family` as an integer PK, which must NOT be
          // written to the UUID family_id column (it would never match queries).
          familyId,
          str(remote.name),
          str(remote.balance),
          str(remote.target_amount),
          str(remote.target_date),
          str(remote.currency),
          str(remote.icon),
          str(remote.color),
          remote.is_active === false ? 0 : 1,
          str(remote.notes),
          str(remote.created),
          remoteUpdated(remote),
        ],
      );
    },
  },
};

/** Entities are synced in dependency order (categories before their refs). */
const ENTITY_ORDER: SyncEntity[] = [
  'categories',
  'transactions',
  'budgets',
  'income_sources',
  'savings_funds',
];

function safeParseArray(value: string): string[] | undefined {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** True for HTTP 404 (already-gone resource — safe to treat as success). */
function isNotFound(error: unknown): boolean {
  const e = error as {response?: {status?: number}};
  return e?.response?.status === 404;
}

/**
 * Mark every local (non-deleted) row dirty so the next sync RE-PUSHES all local
 * data to the server. Recovers data that never reached the cloud — e.g. rows
 * created while the server was rate-limiting sync uploads, which then sit in a
 * "clean" local state and would otherwise never re-push. The backend upsert is
 * idempotent (keyed on public_id), so re-pushing is safe. System categories are
 * skipped (they belong to the server, not the family).
 */
export function markAllLocalDirty(): void {
  try {
    getDB().executeSync(
      `UPDATE categories SET _dirty = 1 WHERE _deleted = 0 AND is_system = 0;`,
    );
  } catch {
    /* table may not exist yet */
  }
  for (const tbl of ['transactions', 'budgets', 'income_sources', 'savings_funds']) {
    try {
      getDB().executeSync(`UPDATE ${tbl} SET _dirty = 1 WHERE _deleted = 0;`);
    } catch {
      /* ignore */
    }
  }
}

// --- Push -------------------------------------------------------------------

/**
 * Push all `_dirty` rows of one entity to the server.
 * Deletes are pushed first (tombstones), then creates/updates. Each row is
 * handled independently so one failure doesn't block the rest.
 */
export async function pushEntity(entity: SyncEntity): Promise<void> {
  const cfg = ENTITIES[entity];
  const familyId = getCurrentFamilyId();
  if (!familyId) return;

  const result = getDB().executeSync(
    `SELECT * FROM ${cfg.table} WHERE _dirty = 1;`,
  );
  const rows = result.rows as Array<Record<string, unknown>>;

  for (const row of rows) {
    const id = String(row.public_id);
    try {
      if (row._deleted === 1) {
        // Tombstone -> DELETE remotely, then drop the local row entirely.
        try {
          await apiClient.delete(cfg.detailPath(id));
        } catch (error) {
          if (!isNotFound(error)) throw error; // 404 = already gone, OK
        }
        getDB().executeSync(
          `DELETE FROM ${cfg.table} WHERE public_id = ?;`,
          [id],
        );
      } else {
        // Idempotent create with the client public_id. The backend upserts on
        // public_id and applies LWW from the `updated` we send, so this also
        // covers updates of previously-synced rows.
        await apiClient.post(cfg.createPath, cfg.buildCreatePayload(row, familyId));
        getDB().executeSync(
          `UPDATE ${cfg.table} SET _dirty = 0 WHERE public_id = ?;`,
          [id],
        );
      }
    } catch (error) {
      // Leave _dirty set; it will be retried on the next sync.
      logSync(`push ${entity} ${id} failed`, error);
    }
  }
}

// --- Pull -------------------------------------------------------------------

/**
 * Pull rows changed since the last successful pull and merge them locally.
 * Merge rules per remote row:
 *   - no local row              -> insert
 *   - local row, not dirty      -> overwrite with remote
 *   - local row, dirty          -> LWW: remote.updated > local.updated ?
 *                                  take remote (clear dirty) : keep local
 */
export async function pullEntity(
  entity: SyncEntity,
  familyId: string,
): Promise<void> {
  const cfg = ENTITIES[entity];
  const since = getLastPulled(entity);

  let remoteRows: Array<Record<string, unknown>>;
  try {
    const response = await apiClient.get(cfg.listPath, {
      params: {
        family_id: familyId,
        ...(since ? {updated_since: since} : {}),
      },
    });
    const data = response.data;
    remoteRows = Array.isArray(data)
      ? data
      : (data?.results as Array<Record<string, unknown>>) ?? [];
  } catch (error) {
    logSync(`pull ${entity} failed`, error);
    return;
  }

  let maxUpdated = since ?? '';

  for (const remote of remoteRows) {
    const id = String(remote.public_id);
    const rUpdated = remoteUpdated(remote);
    if (rUpdated > maxUpdated) maxUpdated = rUpdated;

    const localResult = getDB().executeSync(
      `SELECT updated, _dirty FROM ${cfg.table} WHERE public_id = ?;`,
      [id],
    );
    const local = localResult.rows[0] as
      | {updated: string | null; _dirty: number | null}
      | undefined;

    if (!local) {
      cfg.upsertLocal(remote, familyId);
      continue;
    }

    if (local._dirty !== 1) {
      // Clean local row -> always take the remote copy.
      cfg.upsertLocal(remote, familyId);
      continue;
    }

    // Dirty local row -> last-write-wins by `updated`.
    const localUpdated = local.updated ?? '';
    if (rUpdated > localUpdated) {
      cfg.upsertLocal(remote, familyId); // upsertLocal clears _dirty
    }
    // else keep the local dirty row; it will be pushed next time.
  }

  // Advance the high-water mark (max remote `updated`, or now if nothing seen).
  setLastPulled(entity, maxUpdated || nowIso());
}

// --- Orchestration ----------------------------------------------------------

let syncing = false;

// Listeners notified after every completed sync cycle, so screens can re-read
// the local DB and show data freshly pulled from the server (e.g. on cold start).
const syncCompleteListeners = new Set<() => void>();

/** Subscribe to "a sync cycle just finished". Returns an unsubscribe function. */
export function onSyncComplete(listener: () => void): () => void {
  syncCompleteListeners.add(listener);
  return () => syncCompleteListeners.delete(listener);
}

function notifySyncComplete(): void {
  syncCompleteListeners.forEach((l) => {
    try {
      l();
    } catch {
      /* a bad listener must not break sync */
    }
  });
}

/**
 * Run a full sync cycle: for each entity push local changes then pull remote
 * changes. Guarded by an in-flight lock so concurrent triggers coalesce.
 * Network errors are swallowed (offline is the normal case).
 */
export async function syncAll(): Promise<void> {
  if (syncing) return;
  const familyId = getCurrentFamilyId();
  if (!familyId) return;

  syncing = true;
  try {
    for (const entity of ENTITY_ORDER) {
      await pushEntity(entity);
      await pullEntity(entity, familyId);
    }
  } catch (error) {
    logSync('syncAll failed', error);
  } finally {
    syncing = false;
  }
  // Tell screens to re-read the local DB now that it reflects the server.
  notifySyncComplete();
}

/**
 * Trigger a sync only if we appear to be online. No-ops silently when offline,
 * so callers can fire-and-forget after every local write.
 */
export async function syncNow(): Promise<void> {
  try {
    const state = await NetInfo.fetch();
    if (state.isConnected && state.isInternetReachable !== false) {
      await syncAll();
    }
  } catch (error) {
    logSync('syncNow failed', error);
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Subscribe to connectivity changes; when the device comes online, debounce
 * (~1.5s) and run a full sync. Returns an unsubscribe function.
 */
export function startAutoSync(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && state.isInternetReachable !== false;
    if (!online) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void syncAll();
    }, 1500);
  });

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    unsubscribe();
  };
}

/** Internal: dev-only logging that never throws. */
function logSync(message: string, error?: unknown): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[sync] ${message}`, error ?? '');
  }
}
