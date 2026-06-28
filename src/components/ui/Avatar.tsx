/**
 * Avatar Component
 * Profile picture with different sizes
 */

import React from 'react';
import {View, Text, StyleSheet, Image, ViewStyle} from 'react-native';
import {colors, typography} from '../../theme';

interface AvatarProps {
  source?: {uri: string} | number;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

const SIZES = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

const FONT_SIZES = {
  small: 14,
  medium: 18,
  large: 24,
  xlarge: 36,
};

export default function Avatar({
  source,
  name,
  size = 'medium',
  style,
}: AvatarProps) {
  const avatarSize = SIZES[size];
  const fontSize = FONT_SIZES[size];

  const getInitials = (fullName?: string) => {
    if (!fullName) return '?';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getBgColor = (fullName?: string) => {
    if (!fullName) return colors.slate[400];
    const colors_list = [
      colors.primary[500],
      colors.gold[500],
      colors.skyBlue[500],
      colors.islamic.mashallah,
      colors.islamic.barakallah,
    ];
    const index =
      fullName.charCodeAt(0) % colors_list.length;
    return colors_list[index];
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: source ? colors.slate[200] : getBgColor(name),
        },
        style,
      ]}>
      {source ? (
        <Image
          source={source}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          }}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {fontSize},
          ]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.white,
    fontWeight: '600',
  },
});
