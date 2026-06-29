/**
 * App Settings API Service — the config-driven menu + preferences.
 * The server owns the module catalog and the per-family/per-user JSON settings,
 * so what the app shows is data (not hardcoded) and adding an option is a PATCH,
 * never a schema/code change.
 *
 *   GET   /families/settings/?family_id=<id>   -> {family, user, modules[]}
 *   PATCH /families/settings/  {family_id, family:{...}, user:{...}}
 */

import apiClient, {handleApiError} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export interface ModuleItem {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  route: string;
  group: string;
  default_enabled: boolean;
  enabled: boolean;
}

export interface AppSettings {
  family: Record<string, any>;
  user: Record<string, any>;
  modules: ModuleItem[];
}

class SettingsService {
  async get(): Promise<AppSettings> {
    try {
      const res = await apiClient.get('/families/settings/', {
        params: {family_id: getCurrentFamilyId() || undefined},
      });
      return res.data as AppSettings;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async patch(patch: {
    family?: Record<string, any>;
    user?: Record<string, any>;
  }): Promise<AppSettings> {
    try {
      const res = await apiClient.patch('/families/settings/', {
        family_id: getCurrentFamilyId() || undefined,
        ...patch,
      });
      return res.data as AppSettings;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new SettingsService();
