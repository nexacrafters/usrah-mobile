/**
 * Prayer Times Screen
 * Live daily prayer times from /islamic/prayer-times/ with the next prayer
 * highlighted. Pull-to-refresh recalculates for the current time.
 */

import React, {useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import Card from '../../components/ui/Card';
import {usePrayerStore, PrayerTime} from '../../store/prayerStore';
import {colors, spacing, typography, borderRadius} from '../../theme';

const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LOG_OPTIONS: Array<{
  status: 'prayed' | 'qada' | 'missed';
  icon: string;
  color: string;
  labelKey: string;
}> = [
  {status: 'prayed', icon: '✓', color: colors.islamic.mashallah, labelKey: 'prayer.log.prayed'},
  {status: 'qada', icon: '⏳', color: colors.gold[500], labelKey: 'prayer.log.qada'},
  {status: 'missed', icon: '✗', color: colors.error, labelKey: 'prayer.log.missed'},
];

export default function PrayerTimesScreen() {
  const {t} = useTranslation();
  const {
    raw,
    prayerTimes,
    location,
    isLoading,
    error,
    stats,
    fetchPrayerTimes,
    fetchTodayLogs,
    fetchStats,
    logPrayer,
    getLogStatus,
    getNextPrayer,
  } = usePrayerStore();

  useEffect(() => {
    fetchPrayerTimes();
    fetchTodayLogs();
    fetchStats();
  }, [fetchPrayerTimes, fetchTodayLogs, fetchStats]);

  const onRefresh = useCallback(() => {
    fetchPrayerTimes();
    fetchTodayLogs();
    fetchStats();
  }, [fetchPrayerTimes, fetchTodayLogs, fetchStats]);

  const nextPrayer = getNextPrayer();

  // Localized display name, falling back to the store's English name.
  const prayerName = (prayer: PrayerTime) =>
    t(`prayer.names.${prayer.key}`, {defaultValue: prayer.name});

  const renderPrayerCard = (prayer: PrayerTime) => {
    const loggable = FARD.includes(prayer.key);
    const logged = loggable ? getLogStatus(prayer.key) : null;
    return (
      <View
        key={prayer.key}
        style={[
          styles.prayerCard,
          prayer.isNext && styles.prayerCardNext,
          prayer.isPassed && !prayer.isNext && !logged && styles.prayerCardPassed,
        ]}>
        <View style={styles.prayerRow}>
          <View style={styles.prayerInfo}>
            <Text style={styles.prayerEmoji}>{prayer.emoji}</Text>
            <View style={styles.prayerNames}>
              <Text
                style={[
                  styles.prayerName,
                  prayer.isNext && styles.prayerNameNext,
                ]}>
                {prayerName(prayer)}
              </Text>
              <Text style={styles.prayerArabic}>{prayer.arabicName}</Text>
            </View>
          </View>

          <View style={styles.prayerTimeContainer}>
            <Text
              style={[
                styles.prayerTime,
                prayer.isNext && styles.prayerTimeNext,
              ]}>
              {prayer.time || t('prayer.timePlaceholder')}
            </Text>
            {prayer.isNext && (
              <Text style={styles.nextLabel}>{t('prayer.next')}</Text>
            )}
          </View>
        </View>

        {loggable && (
          <View style={styles.logRow}>
            {LOG_OPTIONS.map((opt) => {
              const active = logged === opt.status;
              return (
                <TouchableOpacity
                  key={opt.status}
                  style={[
                    styles.logButton,
                    active && {backgroundColor: opt.color + '22', borderColor: opt.color},
                  ]}
                  onPress={() => logPrayer(prayer.key, opt.status)}
                  activeOpacity={0.8}>
                  <Text style={[styles.logIcon, active && {color: opt.color}]}>
                    {opt.icon}
                  </Text>
                  <Text
                    style={[
                      styles.logLabel,
                      active && {color: opt.color, fontWeight: '700'},
                    ]}>
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('prayer.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {raw?.hijri_date ?? t('prayer.loading')}
          </Text>
        </View>
      </View>

      {isLoading && prayerTimes.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.centeredText}>{t('prayer.calculating')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
            />
          }>
          {error && prayerTimes.length === 0 && (
            <Card variant="outlined" style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </Card>
          )}

          {/* Next Prayer Card */}
          {nextPrayer && (
            <Card style={styles.nextPrayerCard}>
              <LinearGradient
                colors={[colors.primary[500], colors.primary[700]]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.nextPrayerGradient}>
                <Text style={styles.nextPrayerLabel}>{t('prayer.nextPrayer')}</Text>
                <View style={styles.nextPrayerInfo}>
                  <Text style={styles.nextPrayerEmoji}>{nextPrayer.emoji}</Text>
                  <View>
                    <Text style={styles.nextPrayerName}>
                      {prayerName(nextPrayer)}
                    </Text>
                    <Text style={styles.nextPrayerArabic}>
                      {nextPrayer.arabicName}
                    </Text>
                  </View>
                </View>
                <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
              </LinearGradient>
            </Card>
          )}

          {/* Prayer consistency stats */}
          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>🔥 {stats.streak_days}</Text>
                <Text style={styles.statLabel}>{t('prayer.stats.streak')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.completion_rate}%</Text>
                <Text style={styles.statLabel}>{t('prayer.stats.completion')}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.missed}</Text>
                <Text style={styles.statLabel}>{t('prayer.stats.missed')}</Text>
              </View>
            </View>
          )}

          {/* All Prayer Times */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('prayer.todaysPrayers')}</Text>
            <View style={styles.prayersList}>
              {prayerTimes.map(renderPrayerCard)}
            </View>
          </View>

          {/* Location Card */}
          <Card variant="outlined" style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>{t('prayer.location')}</Text>
                <Text style={styles.locationName}>
                  {location.city}, {location.country}
                </Text>
              </View>
            </View>
            <Text style={styles.locationNote}>
              {t('prayer.locationNote', {
                city: location.city,
                method: raw?.method ?? 'MWL',
              })}
            </Text>
          </Card>

          {/* Islamic Quote */}
          <Card variant="outlined" style={styles.quoteCard}>
            <Text style={styles.quoteArabic}>{t('prayer.quoteArabic')}</Text>
            <Text style={styles.quoteTranslation}>
              {t('prayer.quoteTranslation')}
            </Text>
            <Text style={styles.quoteReference}>
              {t('prayer.quoteReference')}
            </Text>
          </Card>
        </ScrollView>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  centeredText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  errorCard: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error,
    marginBottom: spacing[4],
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  nextPrayerCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing[6],
  },
  nextPrayerGradient: {
    padding: spacing[6],
    alignItems: 'center',
  },
  nextPrayerLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing[3],
  },
  nextPrayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  nextPrayerEmoji: {
    fontSize: 48,
  },
  nextPrayerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  nextPrayerArabic: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nextPrayerTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[4],
  },
  prayersList: {
    gap: spacing[3],
  },
  prayerCard: {
    padding: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  statValue: {
    ...typography.h4,
    color: colors.primary[600],
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  logRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  logButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.default,
  },
  logIcon: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  logLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  prayerCardNext: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  prayerCardPassed: {
    opacity: 0.6,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  prayerEmoji: {
    fontSize: 32,
  },
  prayerNames: {
    gap: spacing[1],
  },
  prayerName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  prayerNameNext: {
    color: colors.primary[700],
    fontWeight: '700',
  },
  prayerArabic: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  prayerTimeContainer: {
    alignItems: 'flex-end',
  },
  prayerTime: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
  },
  prayerTimeNext: {
    color: colors.primary[600],
    fontWeight: '700',
  },
  nextLabel: {
    ...typography.caption,
    color: colors.primary[600],
    fontWeight: '700',
    marginTop: spacing[1],
  },
  passedIcon: {
    fontSize: 16,
    color: colors.islamic.mashallah,
    marginTop: spacing[1],
  },
  locationCard: {
    marginBottom: spacing[6],
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  locationIcon: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  locationName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  locationNote: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  quoteCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    marginBottom: spacing[6],
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
    lineHeight: 20,
  },
  quoteReference: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
