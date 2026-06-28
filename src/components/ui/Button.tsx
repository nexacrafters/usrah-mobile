/**
 * Button Component
 * Beautiful buttons with Islamic-themed design
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, spacing, borderRadius, shadows, typography} from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    textStyle,
  ];

  if (variant === 'gold') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}>
        <LinearGradient
          colors={['#987022', '#C4912F', '#F3BB45']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={buttonStyle}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={labelStyle}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? colors.primary[500] : colors.white}
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
  },

  // Variants
  primary: {
    backgroundColor: colors.primary[500],
    ...shadows.glow,
  },
  gold: {
    ...shadows.glowGold,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  text: {
    backgroundColor: 'transparent',
  },

  // Sizes
  small: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    minHeight: 48,
  },
  large: {
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[5],
    minHeight: 56,
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },

  // Label (text) styles
  label: {
    ...typography.button,
    textAlign: 'center',
  },
  text_primary: {
    color: colors.white,
  },
  text_gold: {
    color: colors.white,
  },
  text_outline: {
    color: colors.primary[500],
  },
  text_text: {
    color: colors.primary[500],
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
});
