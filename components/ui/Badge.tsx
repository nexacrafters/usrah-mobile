/**
 * Premium Badge Component
 * Inspired by sanid-app design system
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'sisters';
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  dot,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: 'rgba(34, 197, 94, 0.2)', text: Colors.success.main };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: Colors.warning.main };
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: Colors.error.main };
      case 'info':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: Colors.info.main };
      case 'gold':
        return { bg: 'rgba(212, 168, 83, 0.2)', text: Colors.gold[500] };
      case 'sisters':
        return { bg: 'rgba(236, 72, 153, 0.2)', text: Colors.sisters[500] };
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: Colors.text.secondary };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingVertical: size === 'sm' ? 4 : 6,
          paddingHorizontal: size === 'sm' ? 8 : 12,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: colors.text },
          ]}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: size === 'sm' ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  label: {
    fontFamily: Typography.fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
