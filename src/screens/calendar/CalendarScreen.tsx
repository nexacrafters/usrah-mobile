/**
 * Calendar Screen
 * Agenda/list view of shared family events grouped by day, backed by the real
 * /calendar API. Pull-to-refresh, reload on focus, loading/empty/error states.
 */

import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import calendarService, {CalendarEvent} from '../../services/api/calendar.service';
import {getCurrentFamilyId} from '../../store/authStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import {formatDate} from '../../utils/datetime';

type Section = {key: string; title: string; data: CalendarEvent[]};

/** Local YYYY-MM-DD for a Date, avoiding UTC shifts from toISOString(). */
const ymd = (d: Date): string => {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Format a HH:MM:SS / HH:MM time string to a short HH:MM label. */
const formatTime = (time: string | null): string | null => {
  if (!time) {
    return null;
  }
  const parts = time.split(':');
  if (parts.length < 2) {
    return time;
  }
  return `${parts[0]}:${parts[1]}`;
};

const formatDayHeading = (iso: string): string => {
  // iso is YYYY-MM-DD; parse as local date
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, (m || 1) - 1, d || 1);
  return formatDate(date, {weekday: 'short', day: 'numeric', month: 'short'});
};

export default function CalendarScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFamily = !!getCurrentFamilyId();

  const loadEvents = useCallback(
    async (isRefresh = false) => {
      if (!getCurrentFamilyId()) {
        setEvents([]);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        // Show events from today onwards (agenda view).
        const data = await calendarService.listEvents({start_date: ymd(new Date())});
        setEvents(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('calendar.couldntLoad'));
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents]),
  );

  const sections = useMemo<Section[]>(() => {
    const todayStr = ymd(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = ymd(tomorrow);

    // Group by start_date (already ordered by the API).
    const byDate = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = byDate.get(ev.start_date) ?? [];
      list.push(ev);
      byDate.set(ev.start_date, list);
    }

    return Array.from(byDate.keys())
      .sort()
      .map((dateKey) => {
        let title: string;
        if (dateKey === todayStr) {
          title = t('calendar.today');
        } else if (dateKey === tomorrowStr) {
          title = t('calendar.tomorrow');
        } else {
          title = formatDayHeading(dateKey);
        }
        return {key: dateKey, title, data: byDate.get(dateKey) as CalendarEvent[]};
      });
  }, [events, t]);

  const goToAdd = useCallback(() => {
    try {
      navigation.navigate('AddEvent' as never);
    } catch {
      /* route not registered yet */
    }
  }, [navigation]);

  const renderItem = ({item}: {item: CalendarEvent}) => {
    const time = item.all_day ? t('calendar.allDay') : formatTime(item.start_time);
    return (
      <View style={styles.eventCard}>
        <View style={[styles.colorBar, {backgroundColor: item.color || colors.primary[500]}]} />
        <View style={styles.eventBody}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.eventMeta}>
            {!!time && (
              <View style={styles.metaRow}>
                <Icon
                  name="clock-outline"
                  size={13}
                  color={colors.text.tertiary}
                />
                <Text style={styles.metaText}>{time}</Text>
              </View>
            )}
            {item.is_recurring && (
              <View style={styles.metaRow}>
                <Icon name="repeat" size={13} color={colors.text.tertiary} />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({section}: {section: Section}) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const renderBody = () => {
    if (!hasFamily) {
      return (
        <View style={styles.centered}>
          <Icon name="account-group-outline" size={56} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>{t('calendar.noFamilyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('calendar.noFamilyBody')}</Text>
        </View>
      );
    }
    if (isLoading && events.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.emptySubtitle}>{t('calendar.loading')}</Text>
        </View>
      );
    }
    if (error && events.length === 0) {
      return (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={56} color={colors.error} />
          <Text style={styles.emptyTitle}>{t('calendar.couldntLoad')}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadEvents()}>
            <Text style={styles.retryText}>{t('calendar.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (events.length === 0) {
      return (
        <SectionList
          sections={[]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadEvents(true)}
              tintColor={colors.primary[500]}
            />
          }
          contentContainerStyle={styles.emptyListContainer}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Icon name="calendar-blank-outline" size={56} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>{t('calendar.noEventsTitle')}</Text>
              <Text style={styles.emptySubtitle}>{t('calendar.noEventsBody')}</Text>
            </View>
          }
        />
      );
    }
    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvents(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListHeaderComponent={
          <Text style={styles.agendaLabel}>{t('calendar.upcoming')}</Text>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('calendar.subtitle')}</Text>
        </View>
        {hasFamily && (
          <TouchableOpacity style={styles.newButton} onPress={goToAdd}>
            <Icon name="plus" size={18} color={colors.white} />
            <Text style={styles.newButtonText}>{t('calendar.newEvent')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderBody()}

      {/* Floating add button */}
      {hasFamily && (
        <TouchableOpacity style={styles.fab} onPress={goToAdd}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            style={styles.fabGradient}>
            <Icon name="plus" size={28} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  newButtonText: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[2],
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing[4],
    paddingBottom: spacing[24],
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  agendaLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  colorBar: {
    width: 5,
  },
  eventBody: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  eventTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  fab: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[6],
    ...shadows.xl,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
