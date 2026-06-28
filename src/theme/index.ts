/**
 * Usrah Theme
 * Complete design system export
 */

import {MD3LightTheme} from 'react-native-paper';
import {colors} from './colors';
import {typography, fontFamilies, fontSizes} from './typography';
import {spacing, layout} from './spacing';
import {shadows} from './shadows';
import {borderRadius} from './borderRadius';

// React Native Paper theme
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary[500],
    secondary: colors.gold[500],
    tertiary: colors.skyBlue[500],
    error: colors.error,
    background: colors.background.default,
    surface: colors.background.paper,
    surfaceVariant: colors.slate[100],
    onPrimary: colors.white,
    onSecondary: colors.white,
    onBackground: colors.text.primary,
    onSurface: colors.text.primary,
    outline: colors.border.default,
  },
  fonts: {
    regular: {
      fontFamily: fontFamilies.latin.regular,
      fontWeight: '400',
    },
    medium: {
      fontFamily: fontFamilies.latin.medium,
      fontWeight: '500',
    },
    bold: {
      fontFamily: fontFamilies.latin.bold,
      fontWeight: '700',
    },
  },
  roundness: borderRadius.md,
};

// Complete theme object
export const theme = {
  colors,
  typography,
  fontFamilies,
  fontSizes,
  spacing,
  layout,
  shadows,
  borderRadius,
  paper: paperTheme,
};

export type Theme = typeof theme;

// Component styles
export const componentStyles = {
  // Button Primary
  buttonPrimary: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    ...shadows.glow,
  },

  // Button Gold
  buttonGold: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    ...shadows.glowGold,
  },

  // Card
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // Input
  input: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.latin.regular,
  },

  // Modal
  modal: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[6],
  },

  // Glassmorphism
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.xl,
  },
};

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './borderRadius';
