/**
 * Today in Islam — the sunnah acts & occasions for today, computed from the
 * Hijri date by the server (white days, Mon/Thu fasting, Jumuʿah, ʿArafah,
 * ʿĀshūrāʾ, Eids, Ramadan...). The app running on the Islamic calendar.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import sunnahService, {SunnahToday, SunnahItem} from '../../services/api/sunnah.service';
import i18n from '../../../i18n';
import {formatHijri} from '../../utils/datetime';
import ScreenHeader from '../../components/ui/ScreenHeader';
import {colors, spacing, typography, borderRadius} from '../../theme';

const KIND_META: Record<string, {icon: string; color: string}> = {
  fast: {icon: '🌙', color: colors.gold[600]},
  occasion: {icon: '⭐', color: colors.primary[600]},
  sunnah: {icon: '🕌', color: colors.islamic.mashallah},
  eid: {icon: '🎉', color: colors.error},
};

export default function SunnahScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const isAr = i18n.language?.startsWith('ar');

  const [data, setData] = useState<SunnahToday | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await sunnahService.today());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const title = (it: SunnahItem) => (isAr ? it.title_ar : it.title_en);
  const note = (it: SunnahItem) => (isAr ? it.note_ar : it.note_en);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('sunnahDay.title', {defaultValue: 'Today in Islam'})} />

      {loading ? (
        <ActivityIndicator style={{marginTop: spacing[10]}} color={colors.primary[500]} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary[500]} />}>
          {/* Hijri date hero */}
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.hero}>
            <Text style={styles.heroWeekday}>{data?.hijri.weekday ?? ''}</Text>
            <Text style={styles.heroDate}>
              {data ? formatHijri(data.hijri.day, data.hijri.month, data.hijri.year, data.hijri.month_name) : ''}
            </Text>
          </LinearGradient>

          {data && data.items.length > 0 ? (
            data.items.map((it) => {
              const meta = KIND_META[it.kind] || KIND_META.sunnah;
              // Link the recommendation to where you act on it.
              const route =
                it.kind === 'fast'
                  ? 'Fasting'
                  : it.id === 'adhkar_daily'
                  ? 'Dhikr'
                  : null;
              return (
                <TouchableOpacity
                  key={it.id}
                  activeOpacity={route ? 0.7 : 1}
                  disabled={!route}
                  onPress={() => route && navigation.navigate(route as never)}
                  style={[styles.card, {borderLeftColor: meta.color}]}>
                  <View style={styles.cardHead}>
                    <Text style={styles.cardIcon}>{meta.icon}</Text>
                    <Text style={styles.cardTitle}>{title(it)}</Text>
                    {!!route && <Text style={styles.cardChevron}>›</Text>}
                  </View>
                  {!!note(it) && <Text style={styles.cardNote}>{note(it)}</Text>}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.empty}>{t('sunnahDay.none', {defaultValue: 'No special recommendations today.'})}</Text>
          )}
          <Text style={styles.disclaimer}>{t('sunnahDay.disclaimer', {defaultValue: 'Guidance surfaced from the Hijri date — follow your local moon sighting and scholars.'})}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backIcon: {fontSize: 24, color: colors.text.primary, width: 24},
  headerTitle: {...typography.h4, color: colors.text.primary, fontWeight: '700'},
  content: {padding: spacing[4], paddingBottom: spacing[10]},
  hero: {borderRadius: borderRadius.lg, padding: spacing[6], alignItems: 'center', marginBottom: spacing[5]},
  heroWeekday: {...typography.bodyMedium, color: 'rgba(255,255,255,0.9)'},
  heroDate: {fontSize: 26, fontWeight: '800', color: colors.white, marginTop: 4, textAlign: 'center'},
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderLeftWidth: 4,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: spacing[2]},
  cardIcon: {fontSize: 20},
  cardTitle: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', flex: 1},
  cardChevron: {fontSize: 22, color: colors.text.tertiary},
  cardNote: {...typography.bodySmall, color: colors.text.secondary, marginTop: spacing[2], lineHeight: 20},
  empty: {...typography.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing[6]},
  disclaimer: {...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing[5], fontStyle: 'italic'},
});
