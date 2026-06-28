/**
 * Icon Button Component
 * Circular icon button with emoji support
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import {colors, spacing, shadows} from '../../theme';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined' | 'ghost';
  color?: string;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}

const SIZES = {
  small: {
    container: 32,
    icon: 16,
  },
  medium: {
    container: 44,
    icon: 20,
  },
  large: {
    container: 56,
    icon: 24,
  },
};

export default function IconButton({
  icon,
  onPress,
  size = 'medium',
  variant = 'filled',
  color = colors.primary[500],
  style,
  disabled = false,
  loading = false,
}: IconButtonProps) {
  const dimensions = SIZES[size];

  const getBackgroundColor = () => {
    if (disabled) return colors.slate[200];
    switch (variant) {
      case 'filled':
        return color;
      case 'outlined':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      default:
        return color;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.slate[300];
    return variant === 'outlined' ? color : 'transparent';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: dimensions.container,
          height: dimensions.container,
          borderRadius: dimensions.container / 2,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outlined' ? 2 : 0,
        },
        variant === 'filled' && styles.shadow,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? colors.white : color}
        />
      ) : (
        <Text style={[styles.icon, {fontSize: dimensions.icon}]}>{icon}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    ...shadows.md,
  },
  icon: {
    textAlign: 'center',
  },
});
