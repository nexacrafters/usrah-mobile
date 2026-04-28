/**
 * useAppStyles Hook
 * Provides consistent fonts, RTL support, and theme-aware styles
 */
import { useMemo } from 'react';
import { StyleSheet, TextStyle, ViewStyle, I18nManager } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { Colors, LightTheme, DarkTheme } from '../constants/colors';
import { Typography } from '../constants/theme';

// Font weights mapping
const FONTS = {
  ar: {
    regular: 'Tajawal_400Regular',
    medium: 'Tajawal_500Medium',
    semibold: 'Tajawal_500Medium', // Tajawal doesn't have semibold
    bold: 'Tajawal_700Bold',
  },
  en: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
};

export interface AppStyles {
  // Theme
  theme: typeof LightTheme;
  isDark: boolean;

  // Language & RTL
  language: 'ar' | 'en';
  isRTL: boolean;

  // Fonts
  fonts: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };

  // Text styles with proper font
  textStyles: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    body: TextStyle;
    bodyLarge: TextStyle;
    bodySmall: TextStyle;
    label: TextStyle;
    labelSmall: TextStyle;
    caption: TextStyle;
    button: TextStyle;
  };

  // RTL-aware layout helpers
  row: ViewStyle;
  rowReverse: ViewStyle;
  flexStart: 'flex-start' | 'flex-end';
  flexEnd: 'flex-start' | 'flex-end';
  textAlign: 'left' | 'right';
  marginStart: 'marginLeft' | 'marginRight';
  marginEnd: 'marginLeft' | 'marginRight';
  paddingStart: 'paddingLeft' | 'paddingRight';
  paddingEnd: 'paddingLeft' | 'paddingRight';

  // Writing direction
  writingDirection: 'rtl' | 'ltr';
}

export function useAppStyles(): AppStyles {
  const { effectiveTheme } = useThemeStore();
  const { language, isRTL } = useLanguageStore();

  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const lang = language === 'ar' ? 'ar' : 'en';
  const fonts = FONTS[lang];

  // Use actual RTL from I18nManager for layout
  const systemRTL = I18nManager.isRTL;

  return useMemo(() => ({
    theme,
    isDark,
    language: lang,
    isRTL: systemRTL,
    fonts,

    // Text styles with proper font family
    textStyles: {
      h1: {
        fontFamily: fonts.bold,
        fontSize: Typography.sizes.h1,
        lineHeight: Typography.lineHeights.h1,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      h2: {
        fontFamily: fonts.bold,
        fontSize: Typography.sizes.h2,
        lineHeight: Typography.lineHeights.h2,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      h3: {
        fontFamily: fonts.semibold,
        fontSize: Typography.sizes.h3,
        lineHeight: Typography.lineHeights.h3,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      h4: {
        fontFamily: fonts.semibold,
        fontSize: Typography.sizes.h4,
        lineHeight: Typography.lineHeights.h4,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      body: {
        fontFamily: fonts.regular,
        fontSize: Typography.sizes.body,
        lineHeight: Typography.lineHeights.body,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      bodyLarge: {
        fontFamily: fonts.regular,
        fontSize: Typography.sizes.bodyLarge,
        lineHeight: Typography.lineHeights.bodyLarge,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      bodySmall: {
        fontFamily: fonts.regular,
        fontSize: Typography.sizes.bodySmall,
        lineHeight: Typography.lineHeights.bodySmall,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      label: {
        fontFamily: fonts.medium,
        fontSize: Typography.sizes.label,
        lineHeight: Typography.lineHeights.label,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      labelSmall: {
        fontFamily: fonts.medium,
        fontSize: Typography.sizes.labelSmall,
        color: theme.textSecondary,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      caption: {
        fontFamily: fonts.regular,
        fontSize: Typography.sizes.caption,
        lineHeight: Typography.lineHeights.caption,
        color: theme.textSecondary,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: systemRTL ? 'right' : 'left',
      },
      button: {
        fontFamily: fonts.semibold,
        fontSize: Typography.sizes.button,
        color: theme.text,
        writingDirection: systemRTL ? 'rtl' : 'ltr',
        textAlign: 'center',
      },
    },

    // RTL-aware layout helpers
    row: {
      flexDirection: systemRTL ? 'row-reverse' : 'row',
    } as ViewStyle,
    rowReverse: {
      flexDirection: systemRTL ? 'row' : 'row-reverse',
    } as ViewStyle,
    flexStart: systemRTL ? 'flex-end' : 'flex-start',
    flexEnd: systemRTL ? 'flex-start' : 'flex-end',
    textAlign: systemRTL ? 'right' : 'left',
    marginStart: systemRTL ? 'marginRight' : 'marginLeft',
    marginEnd: systemRTL ? 'marginLeft' : 'marginRight',
    paddingStart: systemRTL ? 'paddingRight' : 'paddingLeft',
    paddingEnd: systemRTL ? 'paddingLeft' : 'paddingRight',
    writingDirection: systemRTL ? 'rtl' : 'ltr',
  }), [theme, isDark, lang, systemRTL, fonts]);
}

// Helper function to get font based on language
export function getFont(language: 'ar' | 'en', weight: 'regular' | 'medium' | 'semibold' | 'bold' = 'regular'): string {
  return FONTS[language][weight];
}

// Helper to create RTL-aware styles
export function createRTLStyles<T extends StyleSheet.NamedStyles<T>>(
  isRTL: boolean,
  styleCreator: (rtl: boolean) => T
): T {
  return StyleSheet.create(styleCreator(isRTL));
}
