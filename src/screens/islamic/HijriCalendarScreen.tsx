/**
 * Hijri Calendar Screen
 *
 * Shows today's Hijri date (via Intl's Umm al-Qura Islamic calendar, with a
 * graceful fallback if the engine lacks the calendar) alongside the Gregorian
 * date, plus a static reference list of the 12 Hijri months and their notable
 * Islamic observances. All data is computed locally / static reference data.
 */

import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import Card from '../../components/ui/Card';
import {colors, spacing, typography, borderRadius} from '../../theme';

interface HijriMonth {
  number: number;
  name: string;
  arabic: string;
  // i18n key suffixes under `islamic.hijriEvents` — translated at render time.
  notable: string[];
}

// Static, accurate reference data for the 12 Hijri months.
const HIJRI_MONTHS: HijriMonth[] = [
  {number: 1, name: 'Muharram', arabic: 'مُحَرَّم', notable: ['islamicNewYear', 'ashura']},
  {number: 2, name: 'Safar', arabic: 'صَفَر', notable: []},
  {number: 3, name: "Rabi' al-Awwal", arabic: 'رَبِيع ٱلْأَوَّل', notable: ['mawlid']},
  {number: 4, name: "Rabi' al-Thani", arabic: 'رَبِيع ٱلثَّانِي', notable: []},
  {number: 5, name: 'Jumada al-Awwal', arabic: 'جُمَادَىٰ ٱلْأُولَىٰ', notable: []},
  {number: 6, name: 'Jumada al-Thani', arabic: 'جُمَادَىٰ ٱلثَّانِيَة', notable: []},
  {number: 7, name: 'Rajab', arabic: 'رَجَب', notable: ['israMiraj']},
  {number: 8, name: "Sha'ban", arabic: 'شَعْبَان', notable: ['midShaban']},
  {number: 9, name: 'Ramadan', arabic: 'رَمَضَان', notable: ['ramadanStart', 'laylatAlQadr']},
  {number: 10, name: 'Shawwal', arabic: 'شَوَّال', notable: ['eidFitr']},
  {number: 11, name: "Dhu al-Qa'dah", arabic: 'ذُو ٱلْقَعْدَة', notable: []},
  {number: 12, name: 'Dhu al-Hijjah', arabic: 'ذُو ٱلْحِجَّة', notable: ['arafah', 'eidAdha', 'hajjDays']},
];

function formatHijri(date: Date, isArabic: boolean): string | null {
  const locale = isArabic
    ? 'ar-SA-u-ca-islamic-umalqura-nu-latn'
    : 'en-US-u-ca-islamic-umalqura';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    }).format(date);
  } catch {
    return null;
  }
}

function formatGregorian(date: Date, isArabic: boolean): string {
  try {
    return new Intl.DateTimeFormat(isArabic ? 'ar-u-nu-latn' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

export default function HijriCalendarScreen() {
  const {t, i18n} = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');

  const {hijri, gregorian} = useMemo(() => {
    const now = new Date();
    return {
      hijri: formatHijri(now, isArabic),
      gregorian: formatGregorian(now, isArabic),
    };
  }, [isArabic]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('islamic.hijriTitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Today card */}
        <Card style={styles.todayCard}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.todayGradient}>
            <Icon name="moon-waning-crescent" size={32} color={colors.gold[300]} />
            <Text style={styles.todayLabel}>{t('islamic.hijriToday')}</Text>
            <Text style={styles.todayHijri}>
              {hijri ?? t('islamic.hijriUnavailable')}
            </Text>
            <View style={styles.gregRow}>
              <Icon name="calendar" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.todayGregorian}>{gregorian}</Text>
            </View>
          </LinearGradient>
        </Card>

        {/* Months list */}
        <Text style={styles.sectionTitle}>{t('islamic.hijriMonths')}</Text>
        {HIJRI_MONTHS.map((m) => (
          <Card key={m.number} variant="outlined" style={styles.monthCard}>
            <View style={styles.monthHeader}>
              <View style={styles.monthNumberBadge}>
                <Text style={styles.monthNumber}>{m.number}</Text>
              </View>
              <View style={styles.monthNames}>
                <Text style={styles.monthName}>
                  {isArabic ? m.arabic : m.name}
                </Text>
                <Text style={styles.monthArabic}>
                  {isArabic ? m.name : m.arabic}
                </Text>
              </View>
            </View>
            <View style={styles.notableWrap}>
              {m.notable.length > 0 ? (
                m.notable.map((n) => (
                  <View key={n} style={styles.notableRow}>
                    <Icon name="star-four-points" size={12} color={colors.gold[600]} />
                    <Text style={styles.notableText}>
                      {t(`islamic.hijriEvents.${n}`)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noNotable}>
                  {t('islamic.hijriNoNotable')}
                </Text>
              )}
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {...typography.h3, color: colors.text.primary, fontWeight: 'bold'},
  scrollContent: {padding: spacing[4], paddingBottom: spacing[10]},
  todayCard: {padding: 0, overflow: 'hidden', marginBottom: spacing[6]},
  todayGradient: {padding: spacing[6], alignItems: 'center'},
  todayLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  todayHijri: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  gregRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  todayGregorian: {...typography.bodySmall, color: 'rgba(255,255,255,0.9)'},
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[4],
  },
  monthCard: {marginBottom: spacing[3], padding: spacing[4]},
  monthHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing[3]},
  monthNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNumber: {...typography.bodyMedium, color: colors.primary[600], fontWeight: '700'},
  monthNames: {flex: 1},
  monthName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
  monthArabic: {...typography.bodySmall, color: colors.text.secondary},
  notableWrap: {marginTop: spacing[3], gap: spacing[2]},
  notableRow: {flexDirection: 'row', alignItems: 'center', gap: spacing[2]},
  notableText: {...typography.bodySmall, color: colors.text.secondary, flex: 1},
  noNotable: {...typography.caption, color: colors.text.tertiary, fontStyle: 'italic'},
});
