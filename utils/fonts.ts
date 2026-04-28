/**
 * Font Utility for RTL/LTR support
 * Returns correct font based on current language
 */
import { I18nManager } from 'react-native';
import i18n from '../i18n';

const ARABIC_FONTS = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  semibold: 'Tajawal_500Medium', // Tajawal doesn't have semibold
  bold: 'Tajawal_700Bold',
};

const ENGLISH_FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

/**
 * Check if current language is RTL (Arabic)
 * Uses i18n language directly for immediate effect without app restart
 */
export const isRTL = (): boolean => {
  return i18n.language === 'ar' || I18nManager.isRTL;
};

/**
 * Get font family based on current language
 */
export const getFont = (weight: FontWeight = 'regular'): string => {
  return isRTL() ? ARABIC_FONTS[weight] : ENGLISH_FONTS[weight];
};

/**
 * Get text alignment based on RTL
 */
export const getTextAlign = (): 'left' | 'right' => isRTL() ? 'right' : 'left';

/**
 * Get writing direction based on RTL
 */
export const getWritingDirection = (): 'rtl' | 'ltr' => isRTL() ? 'rtl' : 'ltr';

/**
 * Get flex direction for RTL-aware rows
 */
export const getRowDirection = (): 'row' | 'row-reverse' => isRTL() ? 'row-reverse' : 'row';

/**
 * Get alignment for positioning elements (like back buttons)
 */
export const getStartAlign = (): 'flex-start' | 'flex-end' => isRTL() ? 'flex-end' : 'flex-start';
export const getEndAlign = (): 'flex-start' | 'flex-end' => isRTL() ? 'flex-start' : 'flex-end';
