/**
 * Notification Settings Screen
 *
 * Grouped toggles for the kinds of notifications Usrah can send. The on/off
 * state for each toggle is persisted to AsyncStorage (key
 * `@usrah/notification-prefs`) so the user's choices survive app restarts.
 * State is real and device-local — there is no remote service mocked here.
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import Card from '../../components/ui/Card';
import {colors, spacing, typography, borderRadius} from '../../theme';

const STORAGE_KEY = '@usrah/notification-prefs';

type PrefKey =
  | 'prayerReminders'
  | 'taskReminders'
  | 'familyActivity'
  | 'chatMessages'
  | 'dailyDua';

type Prefs = Record<PrefKey, boolean>;

const DEFAULT_PREFS: Prefs = {
  prayerReminders: true,
  taskReminders: true,
  familyActivity: true,
  chatMessages: true,
  dailyDua: false,
};

interface ToggleDef {
  key: PrefKey;
  icon: string;
  titleKey: string;
  descKey: string;
  color: string;
}

const REMINDER_TOGGLES: ToggleDef[] = [
  {
    key: 'prayerReminders',
    icon: 'mosque',
    titleKey: 'settings.notifPrayerReminders',
    descKey: 'settings.notifPrayerRemindersDesc',
    color: colors.primary[500],
  },
  {
    key: 'taskReminders',
    icon: 'check-circle-outline',
    titleKey: 'settings.notifTaskReminders',
    descKey: 'settings.notifTaskRemindersDesc',
    color: colors.skyBlue[500],
  },
  {
    key: 'dailyDua',
    icon: 'hands-pray',
    titleKey: 'settings.notifDailyDua',
    descKey: 'settings.notifDailyDuaDesc',
    color: colors.gold[600],
  },
];

const FAMILY_TOGGLES: ToggleDef[] = [
  {
    key: 'familyActivity',
    icon: 'account-group-outline',
    titleKey: 'settings.notifFamilyActivity',
    descKey: 'settings.notifFamilyActivityDesc',
    color: colors.islamic.barakallah,
  },
  {
    key: 'chatMessages',
    icon: 'message-text-outline',
    titleKey: 'settings.notifChatMessages',
    descKey: 'settings.notifChatMessagesDesc',
    color: colors.islamic.subhanallah,
  },
];

export default function NotificationSettingsScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted prefs once on mount.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw) as Partial<Prefs>;
          setPrefs((prev) => ({...prev, ...parsed}));
        }
      } catch {
        // Ignore read errors and fall back to defaults.
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist whenever prefs change (after the initial hydrate).
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs, hydrated]);

  const toggle = (key: PrefKey) => {
    setPrefs((prev) => ({...prev, [key]: !prev[key]}));
  };

  const renderToggle = (def: ToggleDef, isLast: boolean) => (
    <View
      key={def.key}
      style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.iconWrap, {backgroundColor: def.color + '1A'}]}>
        <Icon name={def.icon} size={22} color={def.color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{t(def.titleKey)}</Text>
        <Text style={styles.rowDesc}>{t(def.descKey)}</Text>
      </View>
      <Switch
        value={prefs[def.key]}
        onValueChange={() => toggle(def.key)}
        trackColor={{false: colors.border.dark, true: colors.primary[400]}}
        thumbColor={prefs[def.key] ? colors.primary[600] : colors.background.paper}
        ios_backgroundColor={colors.border.dark}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('settings.back')}>
          <Icon name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.notificationSettings')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{t('settings.notificationSettingsDesc')}</Text>

        <Text style={styles.sectionTitle}>{t('settings.notifReminders')}</Text>
        <Card variant="outlined" style={styles.groupCard}>
          {REMINDER_TOGGLES.map((def, i) =>
            renderToggle(def, i === REMINDER_TOGGLES.length - 1),
          )}
        </Card>

        <Text style={styles.sectionTitle}>{t('settings.notifFamilySection')}</Text>
        <Card variant="outlined" style={styles.groupCard}>
          {FAMILY_TOGGLES.map((def, i) =>
            renderToggle(def, i === FAMILY_TOGGLES.length - 1),
          )}
        </Card>

        <Text style={styles.savedNote}>{t('settings.notifSavedNote')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  intro: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[5],
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing[6],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  rowContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  rowTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  savedNote: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
