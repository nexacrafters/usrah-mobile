export const Colors = {
  // Primary - Warm Teal (Islamic/Family Feel)
  primary: {
    50: '#f0f7f4',
    100: '#dceee5',
    200: '#b9ddcb',
    300: '#8bc4ab',
    400: '#5da689',
    500: '#3d8b6f', // Main Primary
    600: '#2e6f59',
    700: '#265849',
    800: '#21463c',
    900: '#1d3a33',
    950: '#0f211d',
  },

  // Gold (Tradition, Elegance)
  gold: {
    50: '#fdfbf5',
    100: '#faf6e7',
    200: '#f5ecc4',
    300: '#eedb9c',
    400: '#e5c76a',
    500: '#D8BA61', // Light Gold
    600: '#B3965A', // Bronze
    700: '#947744',
    800: '#7a5f3a',
    900: '#674f32',
    950: '#3a2b19',
  },

  // Cream (Background)
  cream: {
    50: '#fcfaf7',
    100: '#F2ECDB', // Main Background
    200: '#e8ddc4',
    300: '#dccba8',
    400: '#c9b289',
  },

  // Accent - Sky Blue (Modern Tech)
  accent: {
    400: '#38bdf8',
    500: '#1CAEEE',
    600: '#2684D9',
    700: '#1d6ab8',
  },

  // Neutral - Slate
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Navy (Dark Theme Background)
  navy: {
    700: '#1e3a5f',
    800: '#172e4d',
    900: '#0f1f33',
    950: '#0a1420',
  },

  // Status Colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Islamic Reactions
  reactions: {
    love: '#ef4444',
    mashallah: '#22c55e',
    subhanallah: '#3b82f6',
    alhamdulillah: '#D8BA61',
    barakallah: '#8b5cf6',
    jazakallah: '#8b5cf6',
    haha: '#f59e0b',
  },

  // Text colors
  text: {
    main: '#1e293b',
    secondary: '#64748b',
  },

  // Semantic
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Sisters Circle (Pink tones for women's space)
  sisters: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
  },
};

// Light Theme
export const LightTheme = {
  background: Colors.cream[100],
  surface: Colors.white,
  surfaceVariant: Colors.slate[50],
  text: Colors.slate[900],
  textSecondary: Colors.slate[600],
  textTertiary: Colors.slate[400],
  primary: Colors.primary[500],
  primaryText: Colors.white,
  border: Colors.slate[200],
  divider: Colors.slate[100],
  card: Colors.white,
  cardBorder: Colors.slate[200],
  inputBackground: Colors.white,
  inputBorder: Colors.slate[300],
  placeholder: Colors.slate[400],
  icon: Colors.slate[500],
  iconActive: Colors.primary[500],
  tabBar: Colors.white,
  tabBarBorder: Colors.slate[200],
  statusBar: 'dark-content',
};

// Dark Theme
export const DarkTheme = {
  background: Colors.slate[900],
  surface: Colors.slate[800],
  surfaceVariant: Colors.slate[700],
  text: Colors.white,
  textSecondary: Colors.slate[300],
  textTertiary: Colors.slate[400],
  primary: Colors.primary[400],
  primaryText: Colors.slate[900],
  border: Colors.slate[700],
  divider: Colors.slate[700],
  card: Colors.slate[800],
  cardBorder: Colors.slate[700],
  inputBackground: Colors.slate[800],
  inputBorder: Colors.slate[600],
  placeholder: Colors.slate[500],
  icon: Colors.slate[400],
  iconActive: Colors.primary[400],
  tabBar: Colors.slate[800],
  tabBarBorder: Colors.slate[700],
  statusBar: 'light-content',
};

export type Theme = typeof LightTheme;
