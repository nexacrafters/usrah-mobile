/**
 * Responsive Utility for Usrah App
 * Ensures UI scales properly across all Android devices:
 * - Small phones (5" - 320dp width)
 * - Medium phones (5.5"-6.5" - 360-400dp width)
 * - Large phones (6.5"+ - 400dp+ width)
 * - Tablets (600dp+ width)
 */
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design based on standard phone - 375x812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < 350;
export const isMediumDevice = SCREEN_WIDTH >= 350 && SCREEN_WIDTH < 400;
export const isLargeDevice = SCREEN_WIDTH >= 400 && SCREEN_WIDTH < 600;
export const isTablet = SCREEN_WIDTH >= 600;

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

/**
 * Scale a value based on screen width
 * Use for horizontal dimensions (width, margin-left, padding-horizontal)
 */
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale a value based on screen height
 * Use for vertical dimensions (height, margin-top, padding-vertical)
 */
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale font sizes with a moderate factor
 * Prevents fonts from being too large on tablets or too small on small phones
 */
export const scaleFont = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  // Use a moderate scaling factor (0.5) to prevent extreme scaling
  const newSize = size + (size * (scale - 1) * 0.5);
  // Ensure minimum readable size
  const minSize = size * 0.85;
  const maxSize = size * 1.3;
  return Math.round(PixelRatio.roundToNearestPixel(
    Math.max(minSize, Math.min(maxSize, newSize))
  ));
};

/**
 * Moderate scale - use for elements that should scale but not too much
 * Good for icons, buttons, cards
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (size * (scale - 1) * factor);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive value based on device type
 * Allows different values for different screen sizes
 */
export const responsiveValue = <T>(
  small: T,
  medium: T,
  large: T,
  tablet?: T
): T => {
  if (isTablet && tablet !== undefined) return tablet;
  if (isLargeDevice) return large;
  if (isMediumDevice) return medium;
  return small;
};

/**
 * Calculate number of columns for grid layouts
 * Adapts to screen width
 */
export const getGridColumns = (itemMinWidth: number = 150): number => {
  const columns = Math.floor(SCREEN_WIDTH / itemMinWidth);
  return Math.max(2, Math.min(columns, 4)); // Between 2 and 4 columns
};

/**
 * Get card width for grid layouts
 * Accounts for padding and gaps
 */
export const getCardWidth = (
  columns: number = 2,
  horizontalPadding: number = 16,
  gap: number = 12
): number => {
  const availableWidth = SCREEN_WIDTH - (horizontalPadding * 2) - (gap * (columns - 1));
  return Math.floor(availableWidth / columns);
};

/**
 * Responsive spacing values
 */
export const Spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
};

/**
 * Responsive font sizes
 */
export const FontSizes = {
  xs: scaleFont(10),
  sm: scaleFont(12),
  md: scaleFont(14),
  lg: scaleFont(16),
  xl: scaleFont(18),
  xxl: scaleFont(20),
  h3: scaleFont(22),
  h2: scaleFont(24),
  h1: scaleFont(28),
  display: scaleFont(32),
};

/**
 * Responsive icon sizes
 */
export const IconSizes = {
  xs: moderateScale(14),
  sm: moderateScale(18),
  md: moderateScale(22),
  lg: moderateScale(26),
  xl: moderateScale(32),
  xxl: moderateScale(40),
};

/**
 * Responsive border radius
 */
export const BorderRadius = {
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  xxl: moderateScale(20),
  full: 9999,
};

/**
 * Check if device has notch (for safe area handling)
 */
export const hasNotch = (): boolean => {
  return Platform.OS === 'android' && SCREEN_HEIGHT / SCREEN_WIDTH > 2;
};

/**
 * Get safe bottom padding (for devices with gesture navigation)
 */
export const getSafeBottomPadding = (): number => {
  if (Platform.OS === 'android') {
    return hasNotch() ? 34 : 16;
  }
  return 34;
};

export default {
  scaleWidth,
  scaleHeight,
  scaleFont,
  moderateScale,
  responsiveValue,
  getGridColumns,
  getCardWidth,
  screenWidth,
  screenHeight,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  Spacing,
  FontSizes,
  IconSizes,
  BorderRadius,
  hasNotch,
  getSafeBottomPadding,
};
