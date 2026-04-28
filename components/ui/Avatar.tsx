/**
 * Premium Avatar Component
 * Inspired by sanid-app design system
 */
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import { Colors, Typography } from '../../constants/theme';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  verified?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  online,
  verified,
  style,
}) => {
  const getSize = () => {
    switch (size) {
      case 'xs':
        return 32;
      case 'sm':
        return 40;
      case 'lg':
        return 64;
      case 'xl':
        return 80;
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return 12;
      case 'sm':
        return 14;
      case 'lg':
        return 24;
      case 'xl':
        return 32;
      default:
        return 18;
    }
  };

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const avatarSize = getSize();
  const borderRadius = avatarSize * 0.3;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            { width: avatarSize, height: avatarSize, borderRadius },
          ]}
        />
      ) : (
        <LinearGradient
          colors={[Colors.navy[600], Colors.navy[800]]}
          style={[
            styles.fallback,
            { width: avatarSize, height: avatarSize, borderRadius },
          ]}
        >
          <Text style={[styles.initials, { fontSize: getFontSize() }]}>
            {getInitials()}
          </Text>
        </LinearGradient>
      )}

      {online && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: avatarSize * 0.25,
              height: avatarSize * 0.25,
              borderRadius: avatarSize * 0.125,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}

      {verified && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: avatarSize * 0.3,
              height: avatarSize * 0.3,
              borderRadius: avatarSize * 0.15,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Check size={avatarSize * 0.18} color={Colors.navy[950]} strokeWidth={3} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: Colors.background.tertiary,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: Typography.fonts.semibold,
    color: Colors.text.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: Colors.success.main,
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: Colors.gold[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
});
