/**
 * Session bootstrap
 * Persists a successful auth result into the auth store and resolves the
 * user's active family context (every family-scoped API call needs a
 * family public_id).
 */

import apiClient from './client';
import {useAuthStore, ApiUser} from '../../store/authStore';
import {syncNow} from '../../sync/syncEngine';
import i18n from '../../../i18n';

interface ApiFamily {
  public_id: string;
  name: string;
  [key: string]: unknown;
}

// DRF list endpoints are paginated as {count, results}, but can also be a bare
// array depending on config — normalize to an array either way.
function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as {results?: unknown}).results)) {
    return (data as {results: T[]}).results;
  }
  return [];
}

/**
 * Call after a successful login/register response:
 *  1. Persist tokens + user via the auth store.
 *  2. Fetch the user's families and, if any, activate the first one.
 *
 * Family resolution failures are swallowed: the user is still authenticated
 * and can pick/create a family later from inside the app.
 */
export async function bootstrapSession(
  user: ApiUser,
  access: string,
  refresh: string,
): Promise<void> {
  const {login, setCurrentFamily} = useAuthStore.getState();

  // 1. Persist the auth result (also flips isAuthenticated -> true).
  login(user, access, refresh);

  // 2. Resolve active family context (best-effort).
  try {
    const response = await apiClient.get('/families/');
    let families = asArray<ApiFamily>(response.data);

    // Every feature (expenses, tasks, goals...) is scoped to a "family", which
    // doubles as a personal workspace. A solo user with no family would be
    // locked out of their own data, so auto-create one for them. They can rename
    // it or invite a spouse later; it just means "you always have a place to
    // track your life", whether you're single or a whole household.
    if (families.length === 0) {
      const first = user.full_name?.trim()?.split(' ')[0];
      const name = first
        ? i18n.t('family.defaultName', {
            name: first,
            defaultValue: `${first}'s Family`,
          })
        : i18n.t('family.defaultNameSolo', {defaultValue: 'My Family'});
      try {
        const created = await apiClient.post('/families/create/', {
          name,
          role: 'admin',
        });
        const fam = created.data as ApiFamily;
        if (fam?.public_id) {
          families = [fam];
        }
      } catch {
        // Couldn't provision (offline/already-exists race) — re-fetch so a
        // family created elsewhere is still picked up.
        try {
          const refetch = await apiClient.get('/families/');
          families = asArray<ApiFamily>(refetch.data);
        } catch {
          /* keep going; user stays signed in */
        }
      }
    }

    if (families.length > 0) {
      const first = families[0];
      setCurrentFamily(first.public_id, first.name);
      // Pull this family's data into the local DB now that we know the family.
      void syncNow();
    }
  } catch {
    // No family yet / network hiccup — keep the user signed in regardless.
  }
}
