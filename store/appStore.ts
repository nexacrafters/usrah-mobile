import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerMethod, PrayerTimes } from '../types';

export type AppMode = 'family' | 'village';

interface AppState {
  // App Mode
  appMode: AppMode | null;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Language
  language: 'en' | 'ar';

  // Islamic Settings
  prayerMethod: PrayerMethod;
  prayerTimes: PrayerTimes | null;
  lastPrayerFetch: string | null;

  // Location
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;

  // Notifications
  prayerNotifications: boolean;
  adhkarNotifications: boolean;
  taskNotifications: boolean;
  chatNotifications: boolean;

  // Actions
  setAppMode: (mode: AppMode) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'en' | 'ar') => void;
  setPrayerMethod: (method: PrayerMethod) => void;
  setPrayerTimes: (times: PrayerTimes) => void;
  setLocation: (lat: number, lng: number, name?: string) => void;
  togglePrayerNotifications: () => void;
  toggleAdhkarNotifications: () => void;
  toggleTaskNotifications: () => void;
  toggleChatNotifications: () => void;
  reset: () => void;
}

const initialState = {
  appMode: null as AppMode | null,
  theme: 'system' as const,
  language: 'en' as const,
  prayerMethod: 'MWL' as PrayerMethod,
  prayerTimes: null,
  lastPrayerFetch: null,
  latitude: null,
  longitude: null,
  locationName: null,
  prayerNotifications: true,
  adhkarNotifications: true,
  taskNotifications: true,
  chatNotifications: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setAppMode: (appMode) => set({ appMode }),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setPrayerMethod: (prayerMethod) => set({ prayerMethod }),

      setPrayerTimes: (prayerTimes) =>
        set({
          prayerTimes,
          lastPrayerFetch: new Date().toISOString(),
        }),

      setLocation: (latitude, longitude, locationName) =>
        set({ latitude, longitude, locationName }),

      togglePrayerNotifications: () =>
        set((state) => ({ prayerNotifications: !state.prayerNotifications })),

      toggleAdhkarNotifications: () =>
        set((state) => ({ adhkarNotifications: !state.adhkarNotifications })),

      toggleTaskNotifications: () =>
        set((state) => ({ taskNotifications: !state.taskNotifications })),

      toggleChatNotifications: () =>
        set((state) => ({ chatNotifications: !state.chatNotifications })),

      reset: () => set(initialState),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
