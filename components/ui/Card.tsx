/**
 * Premium Card Component
 * Inspired by sanid-app design system
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient' | 'gold' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: ViewStyle;
  gradientColors?: string[];
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  gradientColors,
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return Spacing.md;
      case 'lg':
        return Spacing.xl;
      default:
        return Spacing.lg;
    }
  };

  const cardStyle: ViewStyle = {
    padding: getPadding(),
    borderRadius: BorderRadius.xl,
    borderWidth: variant !== 'gradient' ? 1 : 0,
    borderColor: variant === 'outline' ? Colors.gold[500] : Colors.border.default,
    backgroundColor: Colors.background.card,
    ...(variant === 'elevated' ? Shadows.xl : {}),
    ...(variant === 'gold' ? Shadows.gold : {}),
  };

  if (variant === 'gradient') {
    const content = (
      <LinearGradient
        colors={gradientColors || ['#1a365d', '#0d1f35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[cardStyle, { borderWidth: 0 }, style]}
      >
        {children}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          {content}
        </TouchableOpacity>
      );
    }
    return content;
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({});
