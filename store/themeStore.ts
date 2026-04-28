/**
 * Theme Store for Usrah App
 * Handles dark/light mode preferences with system default option
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  isHydrated: boolean;

  // Actions
  setMode: (mode: ThemeMode) => void;
  setEffectiveTheme: (theme: 'light' | 'dark') => void;
  setHydrated: (hydrated: boolean) => void;
  toggleTheme: () => void;
}

const getEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return Appearance.getColorScheme() || 'light';
  }
  return mode;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      effectiveTheme: getEffectiveTheme('system'),
      isHydrated: false,

      setMode: (mode) => {
        const effectiveTheme = getEffectiveTheme(mode);
        set({ mode, effectiveTheme });
      },

      setEffectiveTheme: (effectiveTheme) => set({ effectiveTheme }),

      setHydrated: (isHydrated) => set({ isHydrated }),

      toggleTheme: () => {
        const currentMode = get().mode;
        let newMode: ThemeMode;

        if (currentMode === 'light') {
          newMode = 'dark';
        } else if (currentMode === 'dark') {
          newMode = 'system';
        } else {
          newMode = 'light';
        }

        const effectiveTheme = getEffectiveTheme(newMode);
        set({ mode: newMode, effectiveTheme });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setEffectiveTheme(getEffectiveTheme(state.mode));
          state.setHydrated(true);
        }
      },
    }
  )
);

// Initialize system theme listener
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode, setEffectiveTheme } = useThemeStore.getState();
  if (mode === 'system') {
    setEffectiveTheme(colorScheme || 'light');
  }
});
