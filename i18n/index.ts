/**
 * i18n Configuration for Usrah App
 * Supports Arabic and English with RTL support
 * Default: Arabic (Tunisia target market)
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

import ar from './locales/ar';
import en from './locales/en';

// Get device locale safely
const getDeviceLocale = (): string => {
  try {
    const locale = Localization.locale || Localization.getLocales()?.[0]?.languageCode || 'ar';
    return locale.split('-')[0];
  } catch {
    return 'ar'; // Default to Arabic for Tunisia
  }
};

const deviceLocale = getDeviceLocale();

// Supported languages
export const SUPPORTED_LANGUAGES = {
  ar: { name: 'العربية', nativeName: 'العربية', dir: 'rtl' },
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Default to Arabic for Tunisia market, fallback to device locale if supported
const getInitialLanguage = (): LanguageCode => {
  // If device is Arabic, use Arabic
  if (deviceLocale === 'ar') return 'ar';
  // If device is English, use English
  if (deviceLocale === 'en') return 'en';
  // Default to Arabic for Tunisia market
  return 'ar';
};

const initialLanguage = getInitialLanguage();

// Configure RTL based on initial language
const isRTL = SUPPORTED_LANGUAGES[initialLanguage].dir === 'rtl';
I18nManager.allowRTL(true);
I18nManager.forceRTL(isRTL);

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: initialLanguage,
    fallbackLng: 'ar', // Fallback to Arabic
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

/**
 * Change the app language and update RTL layout
 */
export const changeLanguage = async (languageCode: LanguageCode) => {
  const langConfig = SUPPORTED_LANGUAGES[languageCode];
  const isRTL = langConfig.dir === 'rtl';

  // Update i18n language
  await i18n.changeLanguage(languageCode);

  // Update RTL setting
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    // Note: App needs to restart for RTL changes to take effect
    return true; // Indicates restart needed
  }

  return false; // No restart needed
};

/**
 * Check if current language is RTL
 */
export const isCurrentLanguageRTL = () => {
  const currentLang = i18n.language as LanguageCode;
  return SUPPORTED_LANGUAGES[currentLang]?.dir === 'rtl';
};

/**
 * Get text alignment based on current language
 */
export const getTextAlign = () => {
  return isCurrentLanguageRTL() ? 'right' : 'left';
};

/**
 * Get flex direction based on current language
 */
export const getFlexDirection = () => {
  return isCurrentLanguageRTL() ? 'row-reverse' : 'row';
};

export default i18n;
