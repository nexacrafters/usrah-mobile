/**
 * Card Component
 * Beautiful card with Islamic design
 */

import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {colors, spacing, borderRadius, shadows} from '../../theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Card({
  children,
  variant = 'default',
  style,
}: CardProps) {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
  },
  default: {
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  elevated: {
    ...shadows.lg,
  },
  outlined: {
    borderWidth: 2,
    borderColor: colors.border.default,
  },
});
