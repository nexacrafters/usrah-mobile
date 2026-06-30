/**
 * Reports & Export.
 * A month's financial report (income, spending, net, by category) plus a one-tap
 * export of every transaction as CSV — "account for every penny." Sharing uses
 * the OS share sheet (built-in RN Share), so no extra native dependency.
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import expenseService from '../../services/api/expense.service';
import {Transaction} from '../../store/expenseStore';
import {formatDate} from '../../utils/datetime';
import ScreenHeader from '../../components/ui/ScreenHeader';
import {colors, spacing, typography, borderRadius} from '../../theme';

const num = (v: string | number | null | undefined) => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '0');
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number) =>
  n.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
const pad = (n: number) => String(n).padStart(2, '0');

export default function ReportsScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Offset in months from the current month (0 = this month).
  const [offset, setOffset] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTxns(await expenseService.listTransactions());
    } catch {
      setTxns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const monthKey = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - offset);
    return {
      key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
      label: formatDate(d, {month: 'long', year: 'numeric'}),
    };
  }, [offset]);

  const report = useMemo(() => {
    const inMonth = txns.filter(
      (tx) => !tx.is_private && (tx.date ?? '').slice(0, 7) === monthKey.key,
    );
    let income = 0;
    let expense = 0;
    const byCat = new Map<string, number>();
    inMonth.forEach((tx) => {
      const amt = num(tx.amount);
      if (tx.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        const cat = tx.category_name || t('reports.uncategorized', {defaultValue: 'Uncategorized'});
        byCat.set(cat, (byCat.get(cat) || 0) + amt);
      }
    });
    const categories = Array.from(byCat.entries())
      .map(([name, total]) => ({name, total}))
      .sort((a, b) => b.total - a.total);
    return {income, expense, net: income - expense, categories, count: inMonth.length};
  }, [txns, monthKey, t]);

  const shareReport = async () => {
    const lines = [
      `${t('reports.title', {defaultValue: 'Financial Report'})} — ${monthKey.label}`,
      '',
      `${t('finance.incomeMonth', {defaultValue: 'Income'})}: ${money(report.income)}`,
      `${t('finance.expensesMonth', {defaultValue: 'Expenses'})}: ${money(report.expense)}`,
      `${t('reports.net', {defaultValue: 'Net'})}: ${money(report.net)}`,
      '',
      `${t('reports.byCategory', {defaultValue: 'By category'})}:`,
      ...report.categories.map((c) => `  • ${c.name}: ${money(c.total)}`),
    ];
    try {
      await Share.share({message: lines.join('\n')});
    } catch {
      /* user cancelled */
    }
  };

  const exportCsv = async () => {
    const header = 'date,type,category,amount,currency,description';
    const rows = txns
      .filter((tx) => !tx.is_private)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .map((tx) =>
        [
          tx.date ?? '',
          tx.type,
          (tx.category_name ?? '').replace(/,/g, ' '),
          num(tx.amount).toFixed(3),
          tx.currency ?? 'TND',
          (tx.description ?? '').replace(/[\r\n,]/g, ' '),
        ].join(','),
      );
    try {
      await Share.share({
        title: 'usrah-transactions.csv',
        message: [header, ...rows].join('\n'),
      });
    } catch {
      /* cancelled */
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('reports.title', {defaultValue: 'Reports'})} />

      {loading ? (
        <ActivityIndicator style={{marginTop: spacing[10]}} color={colors.primary[500]} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Month picker */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setOffset((o) => o + 1)} style={styles.navBtn}>
              <Text style={styles.navIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthKey.label}</Text>
            <TouchableOpacity
              onPress={() => setOffset((o) => Math.max(0, o - 1))}
              style={[styles.navBtn, offset === 0 && {opacity: 0.3}]}
              disabled={offset === 0}>
              <Text style={styles.navIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Totals */}
          <View style={styles.totalsRow}>
            <View style={styles.totalCard}>
              <Text style={[styles.totalValue, {color: colors.islamic.mashallah}]}>{money(report.income)}</Text>
              <Text style={styles.totalLabel}>{t('finance.incomeMonth', {defaultValue: 'Income'})}</Text>
            </View>
            <View style={styles.totalCard}>
              <Text style={[styles.totalValue, {color: colors.error}]}>{money(report.expense)}</Text>
              <Text style={styles.totalLabel}>{t('finance.expensesMonth', {defaultValue: 'Expenses'})}</Text>
            </View>
            <View style={styles.totalCard}>
              <Text style={[styles.totalValue, {color: report.net >= 0 ? colors.primary[600] : colors.error}]}>
                {money(report.net)}
              </Text>
              <Text style={styles.totalLabel}>{t('reports.net', {defaultValue: 'Net'})}</Text>
            </View>
          </View>

          {/* By category */}
          <Text style={styles.section}>{t('reports.byCategory', {defaultValue: 'Spending by category'})}</Text>
          <View style={styles.card}>
            {report.categories.length === 0 ? (
              <Text style={styles.empty}>{t('reports.noData', {defaultValue: 'No spending this month.'})}</Text>
            ) : (
              report.categories.map((c, i) => (
                <View key={c.name} style={[styles.catRow, i > 0 && styles.catBorder]}>
                  <Text style={styles.catName}>{c.name}</Text>
                  <Text style={styles.catTotal}>{money(c.total)}</Text>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={shareReport}>
            <Text style={styles.actionText}>📤 {t('reports.shareReport', {defaultValue: 'Share report'})}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionGhost]} onPress={exportCsv}>
            <Text style={[styles.actionText, {color: colors.primary[600]}]}>
              ⬇️ {t('reports.exportCsv', {defaultValue: 'Export all (CSV)'})}
            </Text>
          </TouchableOpacity>
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
  monthNav: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4]},
  navBtn: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  navIcon: {fontSize: 28, color: colors.primary[600]},
  monthLabel: {...typography.h5, color: colors.text.primary, fontWeight: '700'},
  totalsRow: {flexDirection: 'row', gap: spacing[3], marginBottom: spacing[5]},
  totalCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  totalValue: {...typography.bodyMedium, fontWeight: '800'},
  totalLabel: {...typography.caption, color: colors.text.secondary, marginTop: 2},
  section: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', marginBottom: spacing[2]},
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[2],
    marginBottom: spacing[5],
  },
  catRow: {flexDirection: 'row', justifyContent: 'space-between', padding: spacing[3]},
  catBorder: {borderTopWidth: 1, borderTopColor: colors.border.light},
  catName: {...typography.bodyMedium, color: colors.text.primary},
  catTotal: {...typography.bodyMedium, color: colors.text.secondary, fontWeight: '700'},
  empty: {...typography.bodySmall, color: colors.text.tertiary, textAlign: 'center', padding: spacing[4]},
  actionBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  actionGhost: {backgroundColor: colors.background.paper, borderWidth: 1, borderColor: colors.primary[500]},
  actionText: {...typography.bodyMedium, color: colors.white, fontWeight: '700'},
});
