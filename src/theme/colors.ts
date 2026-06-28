/**
 * Usrah Color System
 * Based on SPECIFICATION.md design system
 * Islamic-themed colors with warm teal and gold accents
 */

export const colors = {
  // Primary - Warm Teal (Islamic/Family Feel)
  primary: {
    50: '#f0f7f4',
    100: '#dceee5',
    200: '#b9ddcb',
    300: '#8bc4ab',
    400: '#5da689',
    500: '#3d8b6f', // Primary
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

  // Cream (Background) — soft, warm parchment tones
  cream: {
    50: '#fcfaf7',
    100: '#F2ECDB', // Logo cream accent
    200: '#e8ddc4',
    300: '#dcc9a3',
    400: '#cdb17d',
    500: '#c19b60',
  },

  // Sage — earthy, calming green (talaqqi peaceful brand)
  sage: {
    50: '#f6f7f6',
    100: '#e3e8e3',
    200: '#c7d1c8',
    300: '#a3b3a5',
    400: '#7f927f',
    500: '#637765',
    600: '#4e5f50',
    700: '#3f4d41',
    800: '#353e37',
    900: '#2e342f',
  },

  // Sand — warm, grounding neutral (talaqqi peaceful brand)
  sand: {
    50: '#faf9f7',
    100: '#f2ede6',
    200: '#e6dbc9',
    300: '#d4c1a4',
    400: '#bfa47a',
    500: '#af8d5e',
    600: '#a17952',
    700: '#856246',
    800: '#6d513d',
    900: '#594334',
  },

  // Accent - Sky Blue (Modern Tech)
  skyBlue: {
    500: '#1CAEEE',
    600: '#2684D9',
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
  },

  // Islamic Reactions
  islamic: {
    mashallah: '#22c55e', // green
    subhanallah: '#3b82f6', // blue
    alhamdulillah: '#D8BA61', // gold
    barakallah: '#8b5cf6', // purple
    love: '#ef4444', // red
    haha: '#f59e0b', // amber
  },

  // Status Colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Text Colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    disabled: '#cbd5e1',
    inverse: '#ffffff',
  },

  // Background Colors — softer, airier "peaceful" parchment (talaqqi brand)
  background: {
    default: '#F7F3E9', // soft warm cream, calmer than the heavy logo cream
    paper: '#FFFDF8', // warm off-white cards (less stark than pure white)
    elevated: '#FFFFFF',
    overlay: 'rgba(46, 52, 47, 0.45)', // sage-tinted scrim
  },

  // Border Colors — gentle sage-tinted neutrals
  border: {
    default: '#E7EBE6',
    light: '#F1F4F0',
    dark: '#CFD6CE',
  },

  // Sisters Circle (Female-only content)
  sistersCircle: {
    primary: '#ec4899', // Pink
    light: '#fce7f3',
    dark: '#be185d',
  },

  // Brothers Circle (Male-only content)
  brothersCircle: {
    primary: '#3b82f6', // Blue
    light: '#dbeafe',
    dark: '#1e40af',
  },

  // Common
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export type ColorPalette = typeof colors;
