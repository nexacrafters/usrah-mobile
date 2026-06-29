/**
 * Settings store — caches the server-driven module catalog + preferences so the
 * UI (Home shortcuts, More menu, Preferences screen) renders from data. Persists
 * to AsyncStorage so the menu shows instantly offline / on cold start.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import settingsService, {AppSettings, ModuleItem} from '../services/api/settings.service';

interface SettingsState {
  modules: ModuleItem[];
  family: Record<string, any>;
  user: Record<string, any>;
  loaded: boolean;
  load: () => Promise<void>;
  setModuleEnabled: (id: string, enabled: boolean) => Promise<void>;
  setFamily: (patch: Record<string, any>) => Promise<void>;
  setUser: (patch: Record<string, any>) => Promise<void>;
  enabledModules: () => ModuleItem[];
}

const apply = (set: any, data: AppSettings) =>
  set({
    modules: data.modules ?? [],
    family: data.family ?? {},
    user: data.user ?? {},
    loaded: true,
  });

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      modules: [],
      family: {},
      user: {},
      loaded: false,

      load: async () => {
        try {
          apply(set, await settingsService.get());
        } catch {
          // keep cached values; menu still works from persisted state
        }
      },

      setModuleEnabled: async (id, enabled) => {
        // Optimistic toggle.
        set((s: SettingsState) => ({
          modules: s.modules.map((m) =>
            m.id === id ? {...m, enabled} : m,
          ),
        }));
        const modules = {...(get().family.modules || {}), [id]: enabled};
        try {
          apply(set, await settingsService.patch({family: {modules}}));
        } catch {
          get().load();
        }
      },

      setFamily: async (patch) => {
        try {
          apply(set, await settingsService.patch({family: patch}));
        } catch {
          /* ignore */
        }
      },

      setUser: async (patch) => {
        try {
          apply(set, await settingsService.patch({user: patch}));
        } catch {
          /* ignore */
        }
      },

      enabledModules: () => get().modules.filter((m) => m.enabled),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({modules: s.modules, family: s.family, user: s.user}),
    },
  ),
);
