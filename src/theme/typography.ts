/**
 * Usrah Typography System
 *
 * NOTE: Custom fonts (Inter / Tajawal / Poppins) are not bundled in the native
 * project, so we fall back to the platform system font (fontFamily: undefined)
 * and express weight via `fontWeight`. This guarantees every label renders.
 * To use the branded fonts later: add the .ttf files under assets/fonts,
 * register them (react-native.config.js + `npx react-native-asset`), then point
 * the families below back at the font names.
 *
 * IMPORTANT: in React Native `lineHeight` is in PIXELS, not a multiplier — the
 * values below are precomputed (fontSize × ratio) so text is never clipped.
 */

// Tajawal is bundled and applied app-wide (see src/utils/applyFonts). It renders
// Arabic beautifully and Latin cleanly, so it's the single family everywhere.
const TAJAWAL_REGULAR = 'Tajawal-Regular';
const TAJAWAL_MEDIUM = 'Tajawal-Medium';
const TAJAWAL_BOLD = 'Tajawal-Bold';
export const fontFamilies = {
  latin: {
    regular: TAJAWAL_REGULAR,
    medium: TAJAWAL_MEDIUM,
    semibold: TAJAWAL_BOLD,
    bold: TAJAWAL_BOLD,
  },
  arabic: {regular: TAJAWAL_REGULAR, medium: TAJAWAL_MEDIUM, bold: TAJAWAL_BOLD},
  heading: {regular: TAJAWAL_REGULAR, semibold: TAJAWAL_BOLD, bold: TAJAWAL_BOLD},
  mono: undefined,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Multipliers kept for reference / any ad-hoc use.
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

export const letterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
};

export const typography = {
  // Display
  display: {
    fontWeight: '700' as const,
    fontSize: fontSizes['5xl'],
    lineHeight: 58,
    letterSpacing: letterSpacing.tight,
  },

  // Headings
  h1: {fontWeight: '700' as const, fontSize: fontSizes['4xl'], lineHeight: 44},
  h2: {fontWeight: '700' as const, fontSize: fontSizes['3xl'], lineHeight: 38},
  h3: {fontWeight: '600' as const, fontSize: fontSizes['2xl'], lineHeight: 32},
  h4: {fontWeight: '600' as const, fontSize: fontSizes.xl, lineHeight: 28},
  h5: {fontWeight: '600' as const, fontSize: fontSizes.lg, lineHeight: 26},
  h6: {fontWeight: '600' as const, fontSize: fontSizes.base, lineHeight: 24},

  // Body
  body: {fontWeight: '400' as const, fontSize: fontSizes.base, lineHeight: 24},
  bodyMedium: {fontWeight: '500' as const, fontSize: fontSizes.base, lineHeight: 24},
  bodySmall: {fontWeight: '400' as const, fontSize: fontSizes.sm, lineHeight: 21},

  // Labels
  label: {fontWeight: '500' as const, fontSize: fontSizes.sm, lineHeight: 20},
  labelSmall: {fontWeight: '500' as const, fontSize: fontSizes.xs, lineHeight: 18},

  // Caption
  caption: {fontWeight: '400' as const, fontSize: fontSizes.xs, lineHeight: 18},

  // Button
  button: {
    fontWeight: '600' as const,
    fontSize: fontSizes.base,
    lineHeight: 22,
    textTransform: 'none' as const,
  },

  // Arabic
  arabicBody: {fontWeight: '400' as const, fontSize: fontSizes.lg, lineHeight: 32},
  arabicHeading: {fontWeight: '700' as const, fontSize: fontSizes['2xl'], lineHeight: 38},
};

export type Typography = typeof typography;
