/**
 * Badge Component
 * Notification badge with numbers or dot
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {colors, spacing, typography} from '../../theme';

interface BadgeProps {
  count?: number;
  showDot?: boolean;
  color?: string;
  style?: ViewStyle;
  maxCount?: number;
}

export default function Badge({
  count = 0,
  showDot = false,
  color = colors.error,
  style,
  maxCount = 99,
}: BadgeProps) {
  if (count === 0 && !showDot) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  if (showDot) {
    return (
      <View style={[styles.dot, {backgroundColor: color}, style]} />
    );
  }

  return (
    <View style={[styles.badge, {backgroundColor: color}, style]}>
      <Text style={styles.count}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  count: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
