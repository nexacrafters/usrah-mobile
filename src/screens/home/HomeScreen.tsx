/**
 * Home Screen
 * Family dashboard: greeting, today's prayer snapshot, tasks due today,
 * and quick links. Loads live data on focus with pull-to-refresh.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Card from '../../components/ui/Card';
import {useAuthStore} from '../../store/authStore';
import {usePrayerStore} from '../../store/prayerStore';
import {useTaskStore} from '../../store/taskStore';
import {getCurrentFamilyId} from '../../store/authStore';
import taskService from '../../services/api/task.service';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) {
    return 'home.goodMorning';
  }
  if (h < 17) {
    return 'home.goodAfternoon';
  }
  return 'home.goodEvening';
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const QUICK_LINKS: Array<{
  id: string;
  labelKey: string;
  icon: string;
  route: string;
  color: string;
}> = [
  {id: 'tasks', labelKey: 'home.tasks', icon: '✅', route: 'Tasks', color: colors.primary[500]},
  {id: 'expenses', labelKey: 'home.expenses', icon: '💰', route: 'Expenses', color: colors.gold[500]},
  {id: 'chat', labelKey: 'home.chat', icon: '💬', route: 'Chat', color: colors.skyBlue[500]},
  {id: 'more', labelKey: 'home.more', icon: '⋯', route: 'More', color: colors.islamic.barakallah},
];

export default function HomeScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const {raw, prayerTimes, fetchPrayerTimes, getNextPrayer} = usePrayerStore();
  const {setTasks} = useTaskStore();
  const tasks = useTaskStore((s) => s.tasks);

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await fetchPrayerTimes();
    if (getCurrentFamilyId()) {
      try {
        const data = await taskService.getTasks();
        setTasks(data);
      } catch {
        /* dashboard is best-effort */
      }
    } else {
      setTasks([]);
    }
  }, [fetchPrayerTimes, setTasks]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const safeNavigate = (route: string) => {
    try {
      navigation.navigate(route as never);
    } catch {
      /* route not registered yet */
    }
  };

  const nextPrayer = getNextPrayer();
  const today = todayStr();
  const tasksDueToday = tasks.filter(
    (t) => t.due_date === today && t.status !== 'completed',
  ).length;
  const activeTasks = tasks.filter((t) => t.status !== 'completed').length;

  const firstName = user?.full_name?.split(' ')[0] ?? t('home.there');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t(greetingKey())},</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <Text style={styles.brand}>أسرة</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }>
        {/* Prayer Snapshot */}
        <Card style={styles.prayerCard}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.prayerGradient}>
            <View style={styles.prayerContent}>
              <Text style={styles.prayerLabel}>{t('home.nextPrayer')}</Text>
              <Text style={styles.prayerName}>
                {nextPrayer ? t(`islamic.prayers.${nextPrayer.key}`) : '—'}
              </Text>
              <Text style={styles.prayerTime}>
                {nextPrayer?.time ?? '--:--'}
              </Text>
              {!!raw?.hijri_date && (
                <Text style={styles.prayerCountdown}>{raw.hijri_date}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.prayerLink}
              onPress={() => safeNavigate('Prayer')}>
              <Text style={styles.prayerLinkIcon}>🕌</Text>
              <Text style={styles.prayerLinkText}>{t('home.allTimes')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Card>

        {/* Today's prayer strip */}
        {prayerTimes.length > 0 && (
          <View style={styles.prayerStrip}>
            {prayerTimes
              .filter((p) => p.key !== 'sunrise')
              .map((p) => (
                <View
                  key={p.key}
                  style={[
                    styles.prayerPill,
                    p.isNext && styles.prayerPillNext,
                  ]}>
                  <Text
                    style={[
                      styles.prayerPillName,
                      p.isNext && styles.prayerPillNameNext,
                    ]}>
                    {t(`islamic.prayers.${p.key}`)}
                  </Text>
                  <Text
                    style={[
                      styles.prayerPillTime,
                      p.isNext && styles.prayerPillNameNext,
                    ]}>
                    {p.time || '--:--'}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Tasks Snapshot */}
        <Text style={styles.sectionTitle}>{t('home.today')}</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCardTouchable}
            activeOpacity={0.85}
            onPress={() => safeNavigate('Tasks')}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{tasksDueToday}</Text>
              <Text style={styles.statLabel}>{t('home.tasksDueToday')}</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCardTouchable}
            activeOpacity={0.85}
            onPress={() => safeNavigate('Tasks')}>
            <Card style={styles.statCard}>
              <Text style={[styles.statNumber, {color: colors.primary[500]}]}>
                {activeTasks}
              </Text>
              <Text style={styles.statLabel}>{t('home.activeTasks')}</Text>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>{t('home.quickLinks')}</Text>
        <View style={styles.quickGrid}>
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={styles.quickCard}
              onPress={() => safeNavigate(link.route)}>
              <View
                style={[
                  styles.quickIcon,
                  {backgroundColor: link.color + '20'},
                ]}>
                <Text style={styles.quickEmoji}>{link.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{t(link.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Islamic Quote */}
        <Card variant="outlined" style={styles.quoteCard}>
          <Text style={styles.quoteArabic}>{t('home.quoteArabic')}</Text>
          <Text style={styles.quoteTranslation}>
            {t('home.quoteTranslation')}
          </Text>
          <Text style={styles.quoteReference}>{t('home.quoteReference')}</Text>
        </Card>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  brand: {
    ...typography.h3,
    color: colors.primary[500],
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[20],
  },
  prayerCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  prayerGradient: {
    padding: spacing[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerContent: {
    flex: 1,
  },
  prayerLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing[1],
  },
  prayerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing[1],
  },
  prayerTime: {
    fontSize: 20,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  prayerCountdown: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.8,
  },
  prayerLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  prayerLinkIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  prayerLinkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  prayerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  prayerPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  prayerPillNext: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  prayerPillName: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  prayerPillNameNext: {
    color: colors.primary[700],
    fontWeight: '700',
  },
  prayerPillTime: {
    ...typography.labelSmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCardTouchable: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[5],
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.gold[600],
    marginBottom: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  quickCard: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexGrow: 1,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  quickEmoji: {
    fontSize: 24,
  },
  quickLabel: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '500',
  },
  quoteCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    ...shadows.sm,
  },
  quoteArabic: {
    fontSize: 16,
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing[2],
    lineHeight: 26,
  },
  quoteTranslation: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing[1],
  },
  quoteReference: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
