/**
 * Fasting tracker — log voluntary & obligatory fasts (Ramadan, Mon/Thu, white
 * days, ʿArafah, ʿĀshūrāʾ...). Pairs with the sunnah-of-the-day engine which
 * tells you when a fast is recommended.
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import fastingService, {FastingLog, FastType} from '../../services/api/fasting.service';
import {formatDate} from '../../utils/datetime';
import {colors, spacing, typography, borderRadius} from '../../theme';

const TYPES: FastType[] = ['sunnah', 'voluntary', 'qada', 'ramadan'];
const iso = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;

export default function FastingScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [logs, setLogs] = useState<FastingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<FastType>('sunnah');
  const today = iso(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await fastingService.list());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fastedToday = useMemo(() => logs.some((l) => l.date === today), [logs, today]);
  const thisMonth = useMemo(() => {
    const prefix = today.slice(0, 7);
    return logs.filter((l) => (l.date ?? '').startsWith(prefix)).length;
  }, [logs, today]);

  const logToday = async () => {
    if (fastedToday) {
      return;
    }
    const optimistic: FastingLog = {
      public_id: `temp-${today}`,
      date: today,
      type,
      status: 'completed',
      created: new Date().toISOString(),
    };
    setLogs((prev) => [optimistic, ...prev]);
    try {
      const saved = await fastingService.log(today, type);
      setLogs((prev) => prev.map((l) => (l.public_id === optimistic.public_id ? saved : l)));
    } catch {
      load();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text onPress={() => navigation.goBack()} style={styles.backIcon}>←</Text>
        <Text style={styles.headerTitle}>{t('fasting.title', {defaultValue: 'Fasting'})}</Text>
        <View style={{width: 24}} />
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: spacing[10]}} color={colors.primary[500]} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary[500]} />}>
          {/* Today */}
          <View style={[styles.todayCard, fastedToday && styles.todayCardDone]}>
            <Text style={styles.todayIcon}>{fastedToday ? '✅' : '🌙'}</Text>
            <Text style={styles.todayText}>
              {fastedToday
                ? t('fasting.fastedToday', {defaultValue: 'You fasted today — taqabbal Allah'})
                : t('fasting.notYet', {defaultValue: 'Fasting today?'})}
            </Text>
            {!fastedToday && (
              <>
                <View style={styles.typeRow}>
                  {TYPES.map((ty) => (
                    <TouchableOpacity
                      key={ty}
                      onPress={() => setType(ty)}
                      style={[styles.typeChip, type === ty && styles.typeChipOn]}>
                      <Text style={[styles.typeText, type === ty && styles.typeTextOn]}>
                        {t(`fasting.type_${ty}`, {defaultValue: ty})}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.logBtn} onPress={logToday}>
                  <Text style={styles.logBtnText}>{t('fasting.logToday', {defaultValue: 'Log today as fasting'})}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{thisMonth}</Text>
              <Text style={styles.statLabel}>{t('fasting.thisMonth', {defaultValue: 'This month'})}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{logs.length}</Text>
              <Text style={styles.statLabel}>{t('fasting.total', {defaultValue: 'Total fasts'})}</Text>
            </View>
          </View>

          <Text style={styles.section}>{t('fasting.recent', {defaultValue: 'Recent fasts'})}</Text>
          {logs.length === 0 ? (
            <Text style={styles.empty}>{t('fasting.empty', {defaultValue: 'No fasts logged yet.'})}</Text>
          ) : (
            <View style={styles.card}>
              {logs.slice(0, 30).map((l, i) => (
                <View key={l.public_id} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <Text style={styles.rowDate}>{formatDate(l.date, {day: 'numeric', month: 'short', year: 'numeric'})}</Text>
                  <Text style={styles.rowType}>{t(`fasting.type_${l.type}`, {defaultValue: l.type})}</Text>
                </View>
              ))}
            </View>
          )}
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
  todayCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[5],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  todayCardDone: {backgroundColor: colors.primary[50], borderColor: colors.islamic.mashallah},
  todayIcon: {fontSize: 40, marginBottom: spacing[2]},
  todayText: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', textAlign: 'center', marginBottom: spacing[3]},
  typeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center', marginBottom: spacing[3]},
  typeChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  typeChipOn: {backgroundColor: colors.primary[50], borderColor: colors.primary[500]},
  typeText: {...typography.caption, color: colors.text.secondary},
  typeTextOn: {color: colors.primary[700], fontWeight: '700'},
  logBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
  },
  logBtnText: {...typography.bodyMedium, color: colors.white, fontWeight: '700'},
  statRow: {flexDirection: 'row', gap: spacing[3], marginBottom: spacing[5]},
  statCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  statValue: {...typography.h4, color: colors.primary[600], fontWeight: '800'},
  statLabel: {...typography.caption, color: colors.text.secondary, marginTop: 2},
  section: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', marginBottom: spacing[2]},
  empty: {...typography.bodySmall, color: colors.text.tertiary, textAlign: 'center', padding: spacing[4]},
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  row: {flexDirection: 'row', justifyContent: 'space-between', padding: spacing[3]},
  rowBorder: {borderTopWidth: 1, borderTopColor: colors.border.light},
  rowDate: {...typography.bodySmall, color: colors.text.primary},
  rowType: {...typography.caption, color: colors.text.secondary},
});
