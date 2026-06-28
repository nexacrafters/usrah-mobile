/**
 * i18n Configuration for Usrah App (bare React Native)
 * Supports Arabic and English with RTL support.
 * Default: Arabic (Tunisia target market). One language at a time, switchable.
 */
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {I18nManager, NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ar from './locales/ar';
import en from './locales/en';

// Feature i18n fragments (each default-exports {namespace: {...}}).
import calendarEn from './locales/calendar.en';
import calendarAr from './locales/calendar.ar';
import socialEn from './locales/social.en';
import socialAr from './locales/social.ar';
import knowledgeEn from './locales/knowledge.en';
import knowledgeAr from './locales/knowledge.ar';
import notesdocsEn from './locales/notesdocs.en';
import notesdocsAr from './locales/notesdocs.ar';
import taskscollabEn from './locales/taskscollab.en';
import taskscollabAr from './locales/taskscollab.ar';

// DEEP-merge feature namespaces into the base translation objects. A shallow
// spread would let a fragment's top-level block (e.g. `tasks`) REPLACE the
// base block of the same name, silently dropping all the base keys — which is
// exactly why the Tasks page showed raw keys. Deep merge keeps both.
type Dict = Record<string, unknown>;
const isObj = (v: unknown): v is Dict =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const deepMerge = (...sources: Dict[]): Dict => {
  const out: Dict = {};
  for (const src of sources) {
    for (const key of Object.keys(src)) {
      const a = out[key];
      const b = src[key];
      out[key] = isObj(a) && isObj(b) ? deepMerge(a, b) : b;
    }
  }
  return out;
};

const enResources = deepMerge(
  en as Dict,
  calendarEn as Dict,
  socialEn as Dict,
  knowledgeEn as Dict,
  notesdocsEn as Dict,
  taskscollabEn as Dict,
);
const arResources = deepMerge(
  ar as Dict,
  calendarAr as Dict,
  socialAr as Dict,
  knowledgeAr as Dict,
  notesdocsAr as Dict,
  taskscollabAr as Dict,
);

const STORAGE_KEY = 'app-language';

// Hermes ships without Intl.PluralRules, which i18next v4 needs to resolve
// `_one`/`_other` plural keys. Provide a minimal en + ar polyfill so plural
// strings (counts) work and i18next doesn't emit a runtime warning.
if (typeof (Intl as {PluralRules?: unknown}).PluralRules === 'undefined') {
  (Intl as {PluralRules?: unknown}).PluralRules = class {
    private lng: string;
    constructor(lng?: string) {
      this.lng = (lng || 'en').split('-')[0];
    }
    select(n: number): string {
      const x = Math.abs(n);
      if (this.lng === 'ar') {
        if (x === 0) return 'zero';
        if (x === 1) return 'one';
        if (x === 2) return 'two';
        if (x % 100 >= 3 && x % 100 <= 10) return 'few';
        if (x % 100 >= 11) return 'many';
        return 'other';
      }
      return x === 1 ? 'one' : 'other';
    }
    resolvedOptions() {
      return {pluralCategories: ['one', 'other']};
    }
  } as unknown as typeof Intl.PluralRules;
}

// Best-effort device locale without expo (used only the very first launch).
const getDeviceLocale = (): string => {
  try {
    const raw =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    return (raw || 'ar').toLowerCase().split(/[-_]/)[0];
  } catch {
    return 'ar';
  }
};

export const SUPPORTED_LANGUAGES = {
  ar: {name: 'العربية', nativeName: 'العربية', dir: 'rtl' as const},
  en: {name: 'English', nativeName: 'English', dir: 'ltr' as const},
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

const deviceLang: LanguageCode = getDeviceLocale() === 'en' ? 'en' : 'ar';

// Initialize synchronously with the device default; the persisted choice (if any)
// is applied right after, in loadPersistedLanguage().
I18nManager.allowRTL(true);

i18n.use(initReactI18next).init({
  resources: {
    ar: {translation: arResources},
    en: {translation: enResources},
  },
  lng: deviceLang,
  fallbackLng: 'en',
  interpolation: {escapeValue: false},
  react: {useSuspense: false},
});

// Apply RTL for the initial language.
I18nManager.forceRTL(SUPPORTED_LANGUAGES[deviceLang].dir === 'rtl');

/** Load the user's previously chosen language (call once on app start). */
export const loadPersistedLanguage = async (): Promise<void> => {
  try {
    const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as LanguageCode | null;
    if (saved && saved !== i18n.language && SUPPORTED_LANGUAGES[saved]) {
      await i18n.changeLanguage(saved);
      I18nManager.forceRTL(SUPPORTED_LANGUAGES[saved].dir === 'rtl');
    }
  } catch {
    // ignore — keep default
  }
};

/**
 * Change the app language, persist it, and update RTL.
 * Returns true if a restart is needed for the RTL direction to fully apply.
 */
export const changeLanguage = async (languageCode: LanguageCode): Promise<boolean> => {
  const isRTL = SUPPORTED_LANGUAGES[languageCode].dir === 'rtl';
  await i18n.changeLanguage(languageCode);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, languageCode);
  } catch {
    // non-fatal
  }
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    return true; // direction change needs an app reload to fully apply
  }
  return false;
};

export const isCurrentLanguageRTL = () =>
  SUPPORTED_LANGUAGES[i18n.language as LanguageCode]?.dir === 'rtl';

export const getTextAlign = (): 'right' | 'left' =>
  isCurrentLanguageRTL() ? 'right' : 'left';

export const getFlexDirection = (): 'row-reverse' | 'row' =>
  isCurrentLanguageRTL() ? 'row-reverse' : 'row';

export default i18n;
