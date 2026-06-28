/**
 * Chip Component
 * Selectable chip for categories and filters
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {colors, spacing, typography, borderRadius} from '../../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function Chip({
  label,
  selected = false,
  onPress,
  icon,
  color = colors.primary[500],
  style,
  textStyle,
  disabled = false,
}: ChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && {
          backgroundColor: color + '20',
          borderColor: color,
        },
        disabled && styles.chipDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.label,
          selected && {color, fontWeight: '600'},
          disabled && styles.labelDisabled,
          textStyle,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing[2],
  },
  chipDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  labelDisabled: {
    color: colors.text.tertiary,
  },
});
