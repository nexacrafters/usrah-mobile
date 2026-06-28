/**
 * App Navigator
 * Main app bottom tab navigation with a custom, premium docked tab bar
 * (rounded top, soft elevation, and an active "pill" highlight).
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {AppTabParamList} from './types';
import HomeScreen from '../screens/home/HomeScreen';
import ChatNavigator from './ChatNavigator';
import ExpensesScreen from '../screens/expenses/ExpensesScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import MoreScreen from '../screens/settings/MoreScreen';
import {colors, spacing, borderRadius, shadows, typography} from '../theme';

const Tab = createBottomTabNavigator<AppTabParamList>();

/** Active (filled) + inactive (outline) glyphs per tab. */
const TAB_ICONS: Record<string, {on: string; off: string}> = {
  Home: {on: 'home-variant', off: 'home-variant-outline'},
  Chat: {on: 'chat', off: 'chat-outline'},
  Expenses: {on: 'wallet', off: 'wallet-outline'},
  Tasks: {on: 'checkbox-marked-circle', off: 'checkbox-marked-circle-outline'},
  More: {on: 'view-grid', off: 'view-grid-outline'},
};

function CustomTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, {paddingBottom: Math.max(insets.bottom, 10)}]}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label =
          typeof options.title === 'string' ? options.title : route.name;
        const focused = state.index === index;
        const glyph = TAB_ICONS[route.name] ?? {
          on: 'circle',
          off: 'circle-outline',
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? {selected: true} : {}}
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.item}>
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon
                name={focused ? glyph.on : glyph.off}
                size={23}
                color={focused ? colors.primary[600] : colors.text.tertiary}
              />
            </View>
            <Text
              style={[styles.label, focused && styles.labelActive]}
              numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppNavigator() {
  const {t} = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: t('nav.home')}}
      />
      <Tab.Screen
        name="Chat"
        component={ChatNavigator}
        options={{title: t('nav.chat')}}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{title: t('nav.expenses')}}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{title: t('nav.tasks')}}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{title: t('nav.more')}}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing[2],
    paddingHorizontal: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: colors.primary[50],
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.primary[600],
  },
});
