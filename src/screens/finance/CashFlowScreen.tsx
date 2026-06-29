/**
 * Cash Flow Screen — built for variable / business income (not a fixed salary).
 *
 * Computes, from synced transactions + savings, the things an irregular earner
 * actually needs: month-by-month income vs expense, 3- and 6-month averages
 * (to smooth the swings), and a runway ("your savings cover X months at your
 * average spend"). All client-side from data already on the device.
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import expenseService from '../../services/api/expense.service';
import savingsService from '../../services/api/savings.service';
import {Transaction} from '../../store/expenseStore';
import {formatDate} from '../../utils/datetime';
import {colors, spacing, typography, borderRadius} from '../../theme';

const N_MONTHS = 6;
const num = (v: string | number | null | undefined) => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '0');
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number) =>
  Math.round(n).toLocaleString('en-US');

interface MonthBucket {
  key: string; // YYYY-MM
  label: string;
  income: number;
  expense: number;
  net: number;
}

export default function CashFlowScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [safe, setSafe] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tx, funds] = await Promise.all([
        expenseService.listTransactions(),
        savingsService.listSavingsFunds().catch(() => []),
      ]);
      setTxns(tx);
      setSafe(funds.filter((f) => f.is_active).reduce((s, f) => s + num(f.balance), 0));
    } catch {
      setTxns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const {months, avg3, avg6, runway} = useMemo(() => {
    const now = new Date();
    const buckets: MonthBucket[] = [];
    for (let i = N_MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
      buckets.push({
        key,
        label: formatDate(d, {month: 'short'}),
        income: 0,
        expense: 0,
        net: 0,
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    // Shared family money only (private stash excluded from business cash-flow).
    txns
      .filter((tx) => !tx.is_private)
      .forEach((tx) => {
        const k = (tx.date ?? '').slice(0, 7);
        const b = byKey.get(k);
        if (!b) {
          return;
        }
        if (tx.type === 'income') {
          b.income += num(tx.amount);
        } else {
          b.expense += num(tx.amount);
        }
      });
    buckets.forEach((b) => {
      b.net = b.income - b.expense;
    });

    const avgOf = (n: number, sel: (b: MonthBucket) => number) => {
      const slice = buckets.slice(-n);
      return slice.reduce((s, b) => s + sel(b), 0) / (slice.length || 1);
    };
    const avg3v = {
      income: avgOf(3, (b) => b.income),
      expense: avgOf(3, (b) => b.expense),
      net: avgOf(3, (b) => b.net),
    };
    const avg6v = {
      income: avgOf(6, (b) => b.income),
      expense: avgOf(6, (b) => b.expense),
      net: avgOf(6, (b) => b.net),
    };
    const runwayMonths = avg6v.expense > 0 ? safe / avg6v.expense : 0;
    return {months: buckets, avg3: avg3v, avg6: avg6v, runway: runwayMonths};
  }, [txns, safe]);

  const maxBar = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text onPress={() => navigation.goBack()} style={styles.backIcon}>
          ←
        </Text>
        <Text style={styles.headerTitle}>{t('cashflow.title', {defaultValue: 'Cash Flow'})}</Text>
        <View style={{width: 24}} />
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: spacing[10]}} color={colors.primary[500]} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary[500]} />
          }>
          {/* Runway hero */}
          <View style={styles.runwayCard}>
            <Text style={styles.runwayLabel}>
              {t('cashflow.runway', {defaultValue: 'Savings runway'})}
            </Text>
            <Text style={styles.runwayValue}>
              {runway > 0 ? runway.toFixed(1) : '0'}{' '}
              <Text style={styles.runwayUnit}>{t('cashflow.months', {defaultValue: 'months'})}</Text>
            </Text>
            <Text style={styles.runwayHint}>
              {t('cashflow.runwayHint', {
                defaultValue: 'How long your savings cover spending at your 6-month average.',
              })}
            </Text>
          </View>

          {/* Averages — smooth the variable income */}
          <Text style={styles.section}>{t('cashflow.averages', {defaultValue: 'Monthly averages'})}</Text>
          <View style={styles.avgRow}>
            <View style={styles.avgCard}>
              <Text style={[styles.avgValue, {color: colors.islamic.mashallah}]}>{money(avg6.income)}</Text>
              <Text style={styles.avgLabel}>{t('cashflow.avgIncome', {defaultValue: 'Avg income'})}</Text>
            </View>
            <View style={styles.avgCard}>
              <Text style={[styles.avgValue, {color: colors.error}]}>{money(avg6.expense)}</Text>
              <Text style={styles.avgLabel}>{t('cashflow.avgExpense', {defaultValue: 'Avg spend'})}</Text>
            </View>
            <View style={styles.avgCard}>
              <Text style={[styles.avgValue, {color: avg6.net >= 0 ? colors.primary[600] : colors.error}]}>
                {money(avg6.net)}
              </Text>
              <Text style={styles.avgLabel}>{t('cashflow.avgNet', {defaultValue: 'Avg net'})}</Text>
            </View>
          </View>
          <Text style={styles.smallHint}>
            {t('cashflow.last3', {defaultValue: 'Last 3 mo net'})}: {money(avg3.net)} · {t('cashflow.safe', {defaultValue: 'saved'})}: {money(safe)}
          </Text>

          {/* Monthly bars */}
          <Text style={styles.section}>{t('cashflow.byMonth', {defaultValue: 'Income vs spending'})}</Text>
          <View style={styles.card}>
            {months.map((m) => (
              <View key={m.key} style={styles.monthRow}>
                <Text style={styles.monthLabel}>{m.label}</Text>
                <View style={styles.bars}>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, {backgroundColor: colors.islamic.mashallah, width: `${(m.income / maxBar) * 100}%`}]}
                    />
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, {backgroundColor: colors.error, width: `${(m.expense / maxBar) * 100}%`}]}
                    />
                  </View>
                </View>
                <Text style={[styles.monthNet, {color: m.net >= 0 ? colors.primary[600] : colors.error}]}>
                  {m.net >= 0 ? '+' : ''}{money(m.net)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.smallHint}>
            🟢 {t('cashflow.income', {defaultValue: 'income'})}   🔴 {t('cashflow.spending', {defaultValue: 'spending'})}
          </Text>
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
  runwayCard: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  runwayLabel: {...typography.caption, color: 'rgba(255,255,255,0.85)'},
  runwayValue: {fontSize: 44, fontWeight: '800', color: colors.white, marginVertical: 2},
  runwayUnit: {fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.9)'},
  runwayHint: {...typography.caption, color: 'rgba(255,255,255,0.85)', textAlign: 'center'},
  section: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', marginBottom: spacing[2]},
  avgRow: {flexDirection: 'row', gap: spacing[3]},
  avgCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  avgValue: {...typography.h5, fontWeight: '800'},
  avgLabel: {...typography.caption, color: colors.text.secondary, marginTop: 2},
  smallHint: {...typography.caption, color: colors.text.tertiary, marginTop: spacing[2], marginBottom: spacing[5]},
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[3],
  },
  monthRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[2], gap: spacing[3]},
  monthLabel: {...typography.caption, color: colors.text.secondary, width: 36},
  bars: {flex: 1, gap: 3},
  barTrack: {height: 8, backgroundColor: colors.background.default, borderRadius: 4, overflow: 'hidden'},
  barFill: {height: '100%', borderRadius: 4, minWidth: 2},
  monthNet: {...typography.caption, fontWeight: '700', width: 64, textAlign: 'right'},
});
