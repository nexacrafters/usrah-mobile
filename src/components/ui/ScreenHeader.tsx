/**
 * ScreenHeader — one consistent, premium header for every screen: a soft
 * surface, a circular back button, a centered title, and an optional right
 * action. Using this everywhere is what makes the app feel cohesive instead of
 * each screen rolling its own header.
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({title, subtitle, onBack, right}: Props) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.back}
        activeOpacity={0.7}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        onPress={onBack ?? (() => navigation.goBack())}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.right}>{right ?? <View style={styles.rightSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backIcon: {
    fontSize: 30,
    lineHeight: 32,
    color: colors.text.primary,
    marginTop: -2,
  },
  titleWrap: {flex: 1, alignItems: 'center', paddingHorizontal: spacing[2]},
  title: {...typography.h4, color: colors.text.primary, fontWeight: '700'},
  subtitle: {...typography.caption, color: colors.text.secondary, marginTop: 1},
  right: {minWidth: 40, alignItems: 'flex-end'},
  rightSpacer: {width: 40, height: 40},
});
