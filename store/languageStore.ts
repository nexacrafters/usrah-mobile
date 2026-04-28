/**
 * Language Store for Usrah App
 * Handles language preferences with RTL support
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import i18n, { LanguageCode, SUPPORTED_LANGUAGES } from '../i18n';

// Re-export LanguageCode for use in other files
export type { LanguageCode } from '../i18n';

interface LanguageState {
  language: LanguageCode;
  isRTL: boolean;
  isHydrated: boolean;
  needsRestart: boolean;

  // Actions
  setLanguage: (language: LanguageCode) => Promise<boolean>;
  setHydrated: (hydrated: boolean) => void;
  clearRestartFlag: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'ar', // Default to Arabic for Tunisia
      isRTL: true,
      isHydrated: false,
      needsRestart: false,

      setLanguage: async (language) => {
        const langConfig = SUPPORTED_LANGUAGES[language];
        const isRTL = langConfig.dir === 'rtl';
        const currentIsRTL = get().isRTL;

        // Update i18n
        await i18n.changeLanguage(language);

        // Check if RTL change requires restart
        const needsRestart = I18nManager.isRTL !== isRTL;

        if (needsRestart) {
          I18nManager.forceRTL(isRTL);
        }

        set({ language, isRTL, needsRestart });

        return needsRestart;
      },

      setHydrated: (isHydrated) => set({ isHydrated }),

      clearRestartFlag: () => set({ needsRestart: false }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        isRTL: state.isRTL,
      }),
      onRehydrateStorage: () => async (state) => {
        if (state) {
          // Sync i18n with stored language
          await i18n.changeLanguage(state.language);
          state.setHydrated(true);
        }
      },
    }
  )
);
