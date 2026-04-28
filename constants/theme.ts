/**
 * Usrah Premium Design System
 * Inspired by sanid-app - Navy + Gold Islamic Theme
 */

export const Colors = {
  // Primary Brand - Deep Teal (Islamic Green-Blue)
  primary: {
    50: '#f0f7f4',
    100: '#dceee5',
    200: '#b9ddcb',
    300: '#8bc4ab',
    400: '#5da689',
    500: '#3d8b6f',  // Main brand color
    600: '#2e6f59',
    700: '#265849',
    800: '#21463c',
    900: '#1d3a33',
    950: '#0f211d',
  },

  // Gold Accent - Premium highlights
  gold: {
    50: '#fdfbf5',
    100: '#faf6e7',
    200: '#f5ecc4',
    300: '#eedb9c',
    400: '#e5c76a',
    500: '#D8BA61',  // Main gold
    600: '#d4a853',  // Sanid gold
    700: '#b8922e',
    800: '#9a7a1f',
    900: '#7a5f3a',
    950: '#3a2b19',
  },

  // Deep Navy - Backgrounds & Text
  navy: {
    50: '#f5f7fa',
    100: '#e4e9f2',
    200: '#c9d3e5',
    300: '#9eaed0',
    400: '#6d83b4',
    500: '#4a6399',
    600: '#3b4f80',
    700: '#1a365d',  // Default navy
    800: '#112845',  // Dark
    900: '#0d1f35',  // Darker
    950: '#0a1628',  // Darkest - Main background
  },

  // Sisters Circle - Pink/Rose tones
  sisters: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },

  // Semantic Colors
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#16a34a',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#2563eb',
  },

  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: '#94a3b8',
    muted: '#64748b',
    inverse: '#0a1628',
  },

  // Background Colors (Dark Theme)
  background: {
    primary: '#0a1628',
    secondary: '#0d1f35',
    tertiary: '#112845',
    card: '#0d1f35',
    elevated: '#1a365d',
  },

  // Border Colors
  border: {
    default: '#1e3a5f',
    light: '#2a4a7f',
    focus: '#d4a853',
  },

  // Islamic Reactions
  reactions: {
    mashallah: '#22c55e',
    subhanallah: '#3b82f6',
    alhamdulillah: '#d4a853',
    jazakallah: '#8b5cf6',
  },
};

export const Typography = {
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    arabic: 'Tajawal_400Regular',
    arabicMedium: 'Tajawal_500Medium',
    arabicBold: 'Tajawal_700Bold',
  },

  sizes: {
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    bodyLarge: 18,
    body: 16,
    bodySmall: 14,
    label: 14,
    labelSmall: 12,
    caption: 12,
    button: 16,
    buttonSmall: 14,
  },

  lineHeights: {
    h1: 40,
    h2: 36,
    h3: 32,
    h4: 28,
    bodyLarge: 28,
    body: 24,
    bodySmall: 20,
    label: 20,
    caption: 16,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  gold: {
    shadowColor: '#d4a853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#d4a853',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
};

export const Animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 700,
  },
};

// Gradient configurations for LinearGradient
export const Gradients = {
  primary: ['#3d8b6f', '#265849'],
  gold: ['#d4a853', '#b8922e'],
  goldShine: ['#eedb9c', '#d4a853', '#b8922e'],
  navy: ['#1a365d', '#0d1f35'],
  navyDark: ['#112845', '#0a1628'],
  premium: ['#d4a853', '#1a365d'],
  premiumReverse: ['#1a365d', '#d4a853'],
  sisters: ['#ec4899', '#be185d'],
  hero: ['#0a1628', '#112845', '#1a365d'],
  // Wisecool-inspired gradients
  progress: ['#55E0E9', '#0992FD'],
  success: ['#10B981', '#059669'],
  cardGlow: ['rgba(212, 168, 83, 0.2)', 'rgba(212, 168, 83, 0)'],
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
};

// Glass morphism styles (wisecool-inspired)
export const GlassMorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dark: {
    backgroundColor: 'rgba(10, 22, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 95, 0.5)',
  },
  gold: {
    backgroundColor: 'rgba(212, 168, 83, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 83, 0.3)',
  },
};

// Animation spring configs (wisecool-inspired)
export const SpringConfig = {
  gentle: { damping: 15, stiffness: 100 },
  bouncy: { damping: 10, stiffness: 150 },
  stiff: { damping: 20, stiffness: 200 },
  slow: { damping: 20, stiffness: 80 },
};

// Common component styles
export const ComponentStyles = {
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
  },
  cardElevated: {
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.light,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  cardGold: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.gold[600],
    padding: Spacing.lg,
    ...Shadows.gold,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text.primary,
    fontSize: Typography.sizes.body,
  },
  button: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

// Usrah-specific constants
export const UsrahConstants = {
  // Family roles
  familyRoles: ['admin', 'parent', 'member', 'child'] as const,

  // Village roles
  villageRoles: ['admin', 'moderator', 'member'] as const,

  // Gender channels
  genderChannels: ['common', 'men', 'women'] as const,

  // Islamic reactions
  islamicReactions: [
    { key: 'mashallah', label: "Masha'Allah", emoji: '✨' },
    { key: 'subhanallah', label: 'SubhanAllah', emoji: '🤲' },
    { key: 'alhamdulillah', label: 'Alhamdulillah', emoji: '🙏' },
    { key: 'jazakallah', label: 'JazakAllah', emoji: '💚' },
  ] as const,

  // Prayer times
  prayerTimes: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const,
};
