/**
 * Expenses / Finance Dashboard
 * The family finance hub: month income / expense / net hero cards, a
 * week / month / year period switcher backed by the summary endpoint, a
 * date-grouped transactions list with category icons, budget progress bars
 * and an add-transaction flow (presented as a full-screen modal).
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Swipeable} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import expenseService from '../../services/api/expense.service';
import incomeService from '../../services/api/income.service';
import savingsService from '../../services/api/savings.service';
import {
  useExpenseStore,
  Transaction,
  Period,
} from '../../store/expenseStore';
import {
  useFinanceStore,
  IncomeSource,
  SavingsFund,
} from '../../store/financeStore';
import {getCurrentFamilyId} from '../../store/authStore';
import {showConfirm} from '../../store/dialogStore';
import {onSyncComplete} from '../../sync/syncEngine';
import type {AppStackScreenProps} from '../../navigation/types';
import AddExpenseScreen from './AddExpenseScreen';

const DEFAULT_CURRENCY = 'TND';

// --- Icon helpers -----------------------------------------------------------

const ICON_ALIASES: Record<string, string> = {
  home: 'home',
  house: 'home',
  rent: 'home-city',
  mortgage: 'home-city',
  car: 'car',
  transport: 'car',
  fuel: 'gas-station',
  gas: 'gas-station',
  food: 'silverware-fork-knife',
  dining: 'silverware-fork-knife',
  restaurant: 'silverware-fork-knife',
  groceries: 'cart',
  grocery: 'cart',
  shopping: 'shopping',
  cart: 'cart',
  bills: 'file-document',
  bill: 'file-document',
  utilities: 'flash',
  electricity: 'flash',
  water: 'water',
  phone: 'cellphone',
  internet: 'wifi',
  health: 'hospital-box',
  healthcare: 'hospital-box',
  medical: 'hospital-box',
  medicine: 'pill',
  education: 'school',
  school: 'school',
  books: 'book-open-variant',
  salary: 'cash',
  income: 'cash-plus',
  wage: 'cash',
  gift: 'gift',
  charity: 'hand-heart',
  sadaqah: 'hand-heart',
  zakat: 'hand-coin',
  travel: 'airplane',
  entertainment: 'movie-open',
  clothing: 'tshirt-crew',
  clothes: 'tshirt-crew',
  savings: 'piggy-bank',
  investment: 'chart-line',
  tag: 'tag',
  other: 'dots-horizontal',
};

const resolveCategoryIcon = (icon?: string | null): string => {
  if (!icon) return 'tag';
  const key = icon.toLowerCase().trim();
  return ICON_ALIASES[key] ?? icon;
};

// --- Formatting helpers -----------------------------------------------------

const formatMoney = (value: number): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '0');
  return Number.isFinite(n) ? n : 0;
};

/** Human-friendly group label for a YYYY-MM-DD date. */
const groupLabel = (
  iso: string,
  todayLabel: string,
  yesterdayLabel: string,
): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return todayLabel;
  if (sameDay(d, yesterday)) return yesterdayLabel;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

interface DateGroup {
  key: string;
  label: string;
  items: Transaction[];
}

/** Local-date YYYY-MM-DD (transaction dates are stored this way). */
const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Inclusive start date for the selected period (week = last 7 days, month =
 * this calendar month, year = this calendar year). */
const periodStartIso = (period: Period): string => {
  const d = new Date();
  if (period === 'week') {
    d.setDate(d.getDate() - 6);
  } else if (period === 'month') {
    d.setDate(1);
  } else {
    d.setMonth(0, 1);
  }
  return isoDate(d);
};

const groupByDate = (
  transactions: Transaction[],
  todayLabel: string,
  yesterdayLabel: string,
): DateGroup[] => {
  const map = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({
      key,
      label: groupLabel(key, todayLabel, yesterdayLabel),
      items,
    }));
};

export default function ExpensesScreen() {
  const {t} = useTranslation();
  const navigation =
    useNavigation<AppStackScreenProps<'Tabs'>['navigation']>();
  const transactions = useExpenseStore((s) => s.transactions);
  const budgets = useExpenseStore((s) => s.budgets);
  const summary = useExpenseStore((s) => s.summary);
  const selectedPeriod = useExpenseStore((s) => s.selectedPeriod);
  const setTransactions = useExpenseStore((s) => s.setTransactions);
  const setCategories = useExpenseStore((s) => s.setCategories);
  const setBudgets = useExpenseStore((s) => s.setBudgets);
  const setSummary = useExpenseStore((s) => s.setSummary);
  const setSelectedPeriod = useExpenseStore((s) => s.setSelectedPeriod);

  const incomeSources = useFinanceStore((s) => s.incomeSources);
  const savingsFunds = useFinanceStore((s) => s.savingsFunds);
  const setIncomeSources = useFinanceStore((s) => s.setIncomeSources);
  const setSavingsFunds = useFinanceStore((s) => s.setSavingsFunds);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Edit / delete transaction sheet.
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const hasFamily = !!getCurrentFamilyId();

  const loadAll = useCallback(
    async (period: Period) => {
      if (!getCurrentFamilyId()) {
        setLoading(false);
        return;
      }
      setError(null);
      try {
        const [tx, cats, buds, sum, sources, funds] = await Promise.all([
          expenseService.listTransactions(),
          expenseService.listCategories(),
          expenseService.listBudgets(),
          expenseService.getSummary(period),
          incomeService.listIncomeSources(),
          savingsService.listSavingsFunds(),
        ]);
        setTransactions(tx);
        setCategories(cats);
        setBudgets(buds);
        setSummary(sum);
        setIncomeSources(sources);
        setSavingsFunds(funds);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('expenses.loadError'));
      }
    },
    [
      setTransactions,
      setCategories,
      setBudgets,
      setSummary,
      setIncomeSources,
      setSavingsFunds,
      t,
    ],
  );

  // Initial load.
  useEffect(() => {
    setLoading(true);
    loadAll(selectedPeriod).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-read the local DB whenever a sync cycle finishes — this is what makes the
  // server data reappear after a cold start (the launch sync pulls it in, then
  // this refreshes the screen without the user having to pull-to-refresh).
  useEffect(() => {
    const unsub = onSyncComplete(() => {
      loadAll(selectedPeriod);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const handleSelectPeriod = useCallback(
    async (period: Period) => {
      if (period === selectedPeriod) return;
      setSelectedPeriod(period);
      if (!getCurrentFamilyId()) return;
      try {
        const sum = await expenseService.getSummary(period);
        setSummary(sum);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('expenses.summaryError'));
      }
    },
    [selectedPeriod, setSelectedPeriod, setSummary, t],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll(selectedPeriod);
    setRefreshing(false);
  }, [loadAll, selectedPeriod]);

  const groups = useMemo(() => {
    // Show only transactions inside the selected period (the switcher used to
    // change just the summary, leaving the whole history in the list).
    const start = periodStartIso(selectedPeriod);
    const inPeriod = transactions.filter((tx) => (tx.date ?? '') >= start);
    return groupByDate(
      inPeriod,
      t('expenses.today'),
      t('expenses.yesterday'),
    );
  }, [transactions, selectedPeriod, t]);

  // Finance hub totals — always THIS MONTH, independent of the period switcher.
  // Monthly income = active recurring sources + this-month one-off source income
  //                  + this-month income transactions.
  // Safe = sum of active fund balances.
  // Spendable = income − expenses − safe.
  const finance = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(
      2,
      '0',
    )}`;
    const inThisMonth = (iso: string) => iso?.startsWith(monthPrefix);

    const recurringIncome = incomeSources
      .filter((s) => s.is_active && s.is_recurring)
      .reduce((sum, s) => sum + toNumber(s.amount), 0);
    const oneOffIncome = incomeSources
      .filter(
        (s) =>
          s.is_active &&
          !s.is_recurring &&
          !!s.created &&
          inThisMonth(s.created.slice(0, 7)),
      )
      .reduce((sum, s) => sum + toNumber(s.amount), 0);
    const txIncome = transactions
      .filter((tx) => tx.type === 'income' && inThisMonth(tx.date))
      .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
    const expenses = transactions
      .filter((tx) => tx.type === 'expense' && inThisMonth(tx.date))
      .reduce((sum, tx) => sum + toNumber(tx.amount), 0);

    const income = recurringIncome + oneOffIncome + txIncome;
    const safe = savingsFunds
      .filter((f) => f.is_active)
      .reduce((sum, f) => sum + toNumber(f.balance), 0);
    const spendable = income - expenses - safe;
    return {income, expenses, safe, spendable};
  }, [incomeSources, savingsFunds, transactions]);

  const handleAddCreated = useCallback(() => {
    // Refresh budgets + summary so progress bars stay accurate.
    if (!getCurrentFamilyId()) return;
    Promise.all([
      expenseService.listBudgets(),
      expenseService.getSummary(selectedPeriod),
    ])
      .then(([buds, sum]) => {
        setBudgets(buds);
        setSummary(sum);
      })
      .catch(() => {
        /* non-fatal */
      });
  }, [selectedPeriod, setBudgets, setSummary]);

  // --- Edit / delete transaction -------------------------------------------

  const openEdit = useCallback((tx: Transaction) => {
    setEditing(tx);
    setEditAmount(String(tx.amount ?? ''));
    setEditDescription(tx.description ?? '');
    setEditError(null);
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(null);
    setEditBusy(false);
    setEditError(null);
  }, []);

  const editAmountValue = parseFloat(editAmount.replace(',', '.'));
  const editValid = Number.isFinite(editAmountValue) && editAmountValue > 0;

  const handleSaveEdit = useCallback(async () => {
    if (!editing) return;
    setEditError(null);
    if (!editValid) {
      setEditError(
        t('expenses.amountError', {defaultValue: 'Enter a valid amount.'}),
      );
      return;
    }
    setEditBusy(true);
    try {
      await expenseService.updateTransaction(editing.public_id, {
        amount: editAmountValue,
        description: editDescription.trim() || undefined,
      });
      await loadAll(selectedPeriod);
      closeEdit();
    } catch (e) {
      setEditError(
        e instanceof Error
          ? e.message
          : t('expenses.saveError', {
              defaultValue: 'Could not save the transaction.',
            }),
      );
      setEditBusy(false);
    }
  }, [
    editing,
    editValid,
    editAmountValue,
    editDescription,
    loadAll,
    selectedPeriod,
    closeEdit,
    t,
  ]);

  const handleDeleteEdit = useCallback(async () => {
    if (!editing) return;
    const ok = await showConfirm({
      title: t('expenses.deleteTitle', {defaultValue: 'Delete this transaction?'}),
      message: t('expenses.deleteBody', {
        defaultValue: 'This cannot be undone.',
      }),
      confirmText: t('common.delete', {defaultValue: 'Delete'}),
      cancelText: t('common.cancel', {defaultValue: 'Cancel'}),
      destructive: true,
    });
    if (ok) {
      const id = editing.public_id;
      closeEdit();
      try {
        await expenseService.deleteTransaction(id);
        await loadAll(selectedPeriod);
      } catch {
        /* a later sync / refresh will reflect the true state */
      }
    }
  }, [editing, closeEdit, loadAll, selectedPeriod, t]);

  // Delete a transaction directly (e.g. via swipe), with a custom confirm.
  const handleDeleteTx = useCallback(
    async (tx: Transaction) => {
      const ok = await showConfirm({
        title: t('expenses.deleteTitle', {
          defaultValue: 'Delete this transaction?',
        }),
        message: t('expenses.deleteBody', {
          defaultValue: 'This cannot be undone.',
        }),
        confirmText: t('common.delete', {defaultValue: 'Delete'}),
        cancelText: t('common.cancel', {defaultValue: 'Cancel'}),
        destructive: true,
      });
      if (ok) {
        try {
          await expenseService.deleteTransaction(tx.public_id);
          await loadAll(selectedPeriod);
        } catch {
          /* a later sync / refresh will reflect the true state */
        }
      }
    },
    [loadAll, selectedPeriod, t],
  );

  // --- Renderers ------------------------------------------------------------

  const renderHeroCards = () => (
    <View>
      {/* Spendable hero — the headline number. */}
      <LinearGradient
        colors={[colors.primary[500], colors.primary[700]]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.spendableCard}>
        <View style={styles.spendableHeader}>
          <View style={styles.heroIconBubble}>
            <Icon name="wallet" size={18} color={colors.white} />
          </View>
          <Text style={styles.spendableLabel}>{t('finance.spendable')}</Text>
        </View>
        <Text style={styles.spendableAmount}>
          {finance.spendable < 0 ? '-' : ''}
          {DEFAULT_CURRENCY} {formatMoney(Math.abs(finance.spendable))}
        </Text>
        <Text style={styles.spendableSub}>{t('finance.spendableHint')}</Text>
      </LinearGradient>

      {/* Income / Expenses / Safe breakdown. */}
      <View style={styles.statRow}>
        <View style={[styles.statCard, styles.statIncome]}>
          <Icon
            name="arrow-down-circle"
            size={18}
            color={colors.primary[600]}
          />
          <Text style={styles.statLabel}>{t('finance.incomeMonth')}</Text>
          <Text style={[styles.statAmount, {color: colors.primary[700]}]}>
            {formatMoney(finance.income)}
          </Text>
        </View>
        <View style={[styles.statCard, styles.statExpense]}>
          <Icon name="arrow-up-circle" size={18} color={colors.gold[700]} />
          <Text style={styles.statLabel}>{t('finance.expensesMonth')}</Text>
          <Text style={[styles.statAmount, {color: colors.gold[700]}]}>
            {formatMoney(finance.expenses)}
          </Text>
        </View>
        <View style={[styles.statCard, styles.statSafe]}>
          <Icon name="shield-check" size={18} color={colors.skyBlue[600]} />
          <Text style={styles.statLabel}>{t('finance.safe')}</Text>
          <Text style={[styles.statAmount, {color: colors.skyBlue[600]}]}>
            {formatMoney(finance.safe)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMoneySources = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('finance.moneySources')}</Text>
        <TouchableOpacity
          style={styles.addLink}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AddIncomeSource')}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="plus" size={16} color={colors.primary[600]} />
          <Text style={styles.addLinkText}>{t('common.add')}</Text>
        </TouchableOpacity>
      </View>
      {incomeSources.length === 0 ? (
        <TouchableOpacity
          style={styles.inlineEmpty}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddIncomeSource')}>
          <Icon name="cash-plus" size={24} color={colors.primary[400]} />
          <Text style={styles.inlineEmptyText}>
            {t('finance.noSourcesBody')}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.listCard}>
          {incomeSources.map((src, i) => renderSource(src, i))}
        </View>
      )}
    </View>
  );

  const renderSource = (src: IncomeSource, index: number) => {
    const color = src.color || colors.primary[500];
    return (
      <View
        key={src.public_id}
        style={[
          styles.rowItem,
          index < incomeSources.length - 1 && styles.rowDivider,
          !src.is_active && styles.rowInactive,
        ]}>
        <View style={[styles.rowIcon, {backgroundColor: color + '1A'}]}>
          <Icon name={src.icon || 'cash'} size={20} color={color} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {src.name}
          </Text>
          {src.is_recurring ? (
            <View style={styles.monthlyBadge}>
              <Text style={styles.monthlyBadgeText}>
                {t('finance.monthlyBadge')}
              </Text>
            </View>
          ) : (
            <Text style={styles.rowSub}>{t('finance.oneOff')}</Text>
          )}
        </View>
        <Text style={[styles.rowAmount, {color: colors.primary[700]}]}>
          {formatMoney(toNumber(src.amount))}
        </Text>
      </View>
    );
  };

  const renderSavings = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('finance.savingsGoals')}</Text>
        <View style={styles.sectionHeaderActions}>
          {savingsFunds.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('SavingsFunds')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.addLinkText}>{t('common.seeAll')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addLink}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddSavingsFund')}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="plus" size={16} color={colors.primary[600]} />
            <Text style={styles.addLinkText}>{t('common.add')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {savingsFunds.length === 0 ? (
        <TouchableOpacity
          style={styles.inlineEmpty}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddSavingsFund')}>
          <Icon name="piggy-bank-outline" size={24} color={colors.primary[400]} />
          <Text style={styles.inlineEmptyText}>{t('finance.noFundsBody')}</Text>
        </TouchableOpacity>
      ) : (
        savingsFunds.map(renderFund)
      )}
    </View>
  );

  const renderFund = (fund: SavingsFund) => {
    const color = fund.color || colors.primary[500];
    const balance = toNumber(fund.balance);
    const target = toNumber(fund.target_amount);
    const hasTarget = !!fund.target_amount && target > 0;
    const pct = hasTarget ? Math.min((balance / target) * 100, 100) : 0;
    return (
      <TouchableOpacity
        key={fund.public_id}
        activeOpacity={0.85}
        style={styles.fundCard}
        onPress={() =>
          navigation.navigate('SavingsFundDetail', {id: fund.public_id})
        }>
        <View style={styles.fundHeaderRow}>
          <View style={[styles.rowIcon, {backgroundColor: color + '1A'}]}>
            <Icon name={fund.icon || 'piggy-bank'} size={20} color={color} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {fund.name}
            </Text>
            <Text style={styles.rowSub}>
              {hasTarget ? t('finance.goal') : t('finance.safeMoney')}
            </Text>
          </View>
          <Text style={[styles.rowAmount, {color}]}>
            {formatMoney(balance)}
          </Text>
        </View>
        {hasTarget && (
          <>
            <View style={styles.fundBarTrack}>
              <View
                style={[
                  styles.fundBarFill,
                  {width: `${pct}%`, backgroundColor: color},
                ]}
              />
            </View>
            <View style={styles.fundTargetRow}>
              <Text style={styles.fundTargetText}>
                {formatMoney(balance)} / {formatMoney(target)}
              </Text>
              <Text style={[styles.fundTargetPct, {color}]}>
                {Math.round(pct)}%
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderPeriodSwitcher = () => (
    <View style={styles.periodSwitcher}>
      {(['week', 'month', 'year'] as const).map((period) => {
        const active = selectedPeriod === period;
        return (
          <TouchableOpacity
            key={period}
            style={[styles.periodChip, active && styles.periodChipActive]}
            onPress={() => handleSelectPeriod(period)}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.periodChipText,
                active && styles.periodChipTextActive,
              ]}>
              {t(`expenses.${period}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderBudgets = () => {
    if (budgets.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('expenses.budgets')}</Text>
        <View style={styles.budgetCard}>
          {budgets.map((b, i) => {
            const pct = Math.min(b.percentage_used ?? 0, 100);
            const over = (b.percentage_used ?? 0) >= 100;
            const near = (b.percentage_used ?? 0) >= (b.alert_threshold ?? 80);
            const barColor = over
              ? colors.error
              : near
              ? colors.warning
              : b.category_color || colors.primary[500];
            return (
              <View
                key={b.public_id}
                style={[
                  styles.budgetRow,
                  i < budgets.length - 1 && styles.budgetRowDivider,
                ]}>
                <View style={styles.budgetHeader}>
                  <View
                    style={[
                      styles.budgetIcon,
                      {
                        backgroundColor:
                          (b.category_color || colors.primary[500]) + '1A',
                      },
                    ]}>
                    <Icon
                      name={resolveCategoryIcon(b.category_icon)}
                      size={16}
                      color={b.category_color || colors.primary[500]}
                    />
                  </View>
                  <Text style={styles.budgetName} numberOfLines={1}>
                    {b.category_name || t('expenses.budgetLabel')}
                  </Text>
                  <Text style={styles.budgetAmount}>
                    {formatMoney(toNumber(b.spent))} /{' '}
                    {formatMoney(toNumber(b.amount))}
                  </Text>
                </View>
                <View style={styles.budgetBarTrack}>
                  <View
                    style={[
                      styles.budgetBarFill,
                      {width: `${pct}%`, backgroundColor: barColor},
                    ]}
                  />
                </View>
                <Text style={[styles.budgetPct, over && {color: colors.error}]}>
                  {t('expenses.percentUsed', {
                    percent: (b.percentage_used ?? 0).toFixed(0),
                  })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSwipeDelete = (tx: Transaction) => (
    <TouchableOpacity
      style={styles.swipeDelete}
      activeOpacity={0.85}
      onPress={() => handleDeleteTx(tx)}>
      <Icon name="trash-can-outline" size={22} color={colors.white} />
      <Text style={styles.swipeDeleteText}>
        {t('common.delete', {defaultValue: 'Delete'})}
      </Text>
    </TouchableOpacity>
  );

  const renderTransaction = (tx: Transaction) => {
    const isIncome = tx.type === 'income';
    const color = tx.category_color || (isIncome ? colors.primary[500] : colors.gold[600]);
    return (
      // Swipe a transaction sideways to reveal a Delete action (tap still opens
      // the edit sheet). overshoot off so it feels crisp.
      <Swipeable
        key={tx.public_id}
        renderRightActions={() => renderSwipeDelete(tx)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}>
        <TouchableOpacity
          style={styles.txItem}
          activeOpacity={0.7}
          onPress={() => openEdit(tx)}>
          <View style={[styles.txIcon, {backgroundColor: color + '1A'}]}>
            <Icon
              name={resolveCategoryIcon(tx.category_icon)}
              size={20}
              color={color}
            />
          </View>
          <View style={styles.txContent}>
            <Text style={styles.txTitle} numberOfLines={1}>
              {tx.description ||
                tx.category_name ||
                (isIncome ? t('expenses.income') : t('expenses.title'))}
            </Text>
            <Text style={styles.txCategory} numberOfLines={1}>
              {tx.category_name || t('expenses.uncategorized')}
              {tx.created_by?.full_name ? `  •  ${tx.created_by.full_name}` : ''}
            </Text>
          </View>
          <Text
            style={[
              styles.txAmount,
              {color: isIncome ? colors.primary[600] : colors.gold[700]},
            ]}>
            {isIncome ? '+' : '-'}
            {formatMoney(toNumber(tx.amount))}
          </Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // --- States ---------------------------------------------------------------

  if (!hasFamily) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>{t('expenses.finances')}</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="home-heart" size={40} color={colors.primary[500]} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('expenses.noFamilyTitle')}
          </Text>
          <Text style={styles.emptyBody}>{t('expenses.noFamilyBody')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>{t('expenses.finances')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('expenses.familyBudgetTracker')}
          </Text>
        </View>
        {renderPeriodSwitcher()}
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }>
          {renderHeroCards()}

          {error && (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {renderMoneySources()}

          {renderSavings()}

          {renderBudgets()}

          {/* Transactions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('expenses.transactions')}
            </Text>
            {groups.length === 0 ? (
              <View style={styles.txEmpty}>
                <View style={styles.emptyIconCircle}>
                  <Icon
                    name="receipt"
                    size={36}
                    color={colors.primary[400]}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {t('expenses.noTransactionsTitle')}
                </Text>
                <Text style={styles.emptyBody}>
                  {t('expenses.noTransactionsBody')}
                </Text>
              </View>
            ) : (
              groups.map((group) => (
                <View key={group.key} style={styles.txGroup}>
                  <Text style={styles.txGroupLabel}>{group.label}</Text>
                  <View style={styles.txGroupCard}>
                    {group.items.map(renderTransaction)}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Reminder verse */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteArabic}>
              وَلَا تُسْرِفُوا ۚ إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ
            </Text>
            <Text style={styles.quoteTranslation}>
              “And do not waste, for Allah does not love the wasteful.”
            </Text>
            <Text style={styles.quoteReference}>Quran 7:31</Text>
          </View>
        </ScrollView>
      )}

      {/* Add FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => setShowAdd(true)}>
        <LinearGradient
          colors={['#987022', '#C4912F', '#F3BB45']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.fabGradient}>
          <Icon name="plus" size={28} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add transaction sheet */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAdd(false)}>
        <AddExpenseScreen
          onClose={() => setShowAdd(false)}
          onCreated={handleAddCreated}
        />
      </Modal>

      {/* Edit / delete transaction sheet */}
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeEdit}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableOpacity activeOpacity={1} style={styles.sheet}>
              {editing && (
                <>
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {t('expenses.editTransaction', {
                      defaultValue: 'Edit transaction',
                    })}
                  </Text>
                  <Text style={styles.sheetSub} numberOfLines={1}>
                    {editing.category_name ||
                      t('expenses.uncategorized')}{' '}
                    ·{' '}
                    {editing.type === 'income' ? '+' : '-'}
                    {formatMoney(toNumber(editing.amount))}{' '}
                    {editing.currency || DEFAULT_CURRENCY}
                  </Text>

                  {!!editing.receipt && (
                    <Image
                      source={{uri: editing.receipt}}
                      style={styles.receiptImage}
                      resizeMode="cover"
                    />
                  )}

                  <Text style={styles.sheetLabel}>
                    {t('expenses.amountLabel', {defaultValue: 'Amount'})}
                  </Text>
                  <Input
                    placeholder="0.000"
                    keyboardType="decimal-pad"
                    value={editAmount}
                    onChangeText={setEditAmount}
                    containerStyle={styles.fieldContainer}
                    autoFocus
                    leftIcon={
                      <Text style={styles.inlineCurrency}>
                        {editing.currency || DEFAULT_CURRENCY}
                      </Text>
                    }
                  />

                  <Text style={styles.sheetLabel}>
                    {t('expenses.descriptionLabel', {
                      defaultValue: 'Description',
                    })}
                  </Text>
                  <Input
                    placeholder={t('expenses.descriptionPlaceholder', {
                      defaultValue: 'Description (optional)',
                    })}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    containerStyle={styles.fieldContainer}
                  />

                  {editError && (
                    <View style={styles.errorBanner}>
                      <Icon
                        name="alert-circle"
                        size={16}
                        color={colors.error}
                      />
                      <Text style={styles.errorText}>{editError}</Text>
                    </View>
                  )}

                  <Button
                    title={t('common.save', {defaultValue: 'Save'})}
                    onPress={handleSaveEdit}
                    variant="primary"
                    size="large"
                    fullWidth
                    loading={editBusy}
                    disabled={!editValid || editBusy}
                    style={styles.sheetButton}
                  />
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    activeOpacity={0.85}
                    onPress={handleDeleteEdit}
                    disabled={editBusy}>
                    <Icon
                      name="trash-can-outline"
                      size={18}
                      color={colors.error}
                    />
                    <Text
                      style={[
                        styles.secondaryActionText,
                        {color: colors.error},
                      ]}>
                      {t('common.delete', {defaultValue: 'Delete'})}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
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
  periodSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  periodChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  periodChipActive: {
    backgroundColor: colors.primary[500],
    ...shadows.sm,
  },
  periodChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  periodChipTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[24],
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shared icon bubble (used on the spendable hero)
  heroIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Finance hub — spendable hero
  spendableCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[3],
    ...shadows.md,
  },
  spendableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  spendableLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  spendableAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.white,
  },
  spendableSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[1],
  },

  // Finance hub — income / expenses / safe stat cards
  statRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    ...shadows.sm,
  },
  statIncome: {
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },
  statExpense: {
    borderColor: colors.gold[200],
    backgroundColor: colors.gold[50],
  },
  statSafe: {
    borderColor: '#bfe6f9',
    backgroundColor: '#eaf7fd',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: spacing[2],
  },
  statAmount: {
    ...typography.bodyMedium,
    fontWeight: 'bold',
    marginTop: spacing[1],
  },

  // Sections
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addLinkText: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '600',
  },

  // Generic list card + rows (sources)
  listCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rowInactive: {
    opacity: 0.5,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  rowSub: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  rowAmount: {
    ...typography.bodyMedium,
    fontWeight: '700',
    marginLeft: spacing[2],
  },
  monthlyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  monthlyBadgeText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '600',
    fontSize: 11,
  },

  // Inline empty (within a section)
  inlineEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    padding: spacing[4],
  },
  inlineEmptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },

  // Savings fund cards
  fundCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  fundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fundBarTrack: {
    height: 8,
    backgroundColor: colors.background.default,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing[3],
  },
  fundBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  fundTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  fundTargetText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  fundTargetPct: {
    ...typography.caption,
    fontWeight: '700',
  },

  // Budgets
  budgetCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  budgetRow: {
    paddingVertical: spacing[3],
  },
  budgetRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  budgetIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  budgetName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  budgetAmount: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  budgetBarTrack: {
    height: 8,
    backgroundColor: colors.background.default,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing[1],
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPct: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'right',
  },

  // Transactions
  txGroup: {
    marginBottom: spacing[4],
  },
  txGroupLabel: {
    ...typography.label,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  txGroupCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[1],
    // Opaque so the red Delete action only shows as the row is swiped aside.
    backgroundColor: colors.background.paper,
  },
  swipeDelete: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 96,
    gap: 2,
  },
  swipeDeleteText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  txContent: {
    flex: 1,
  },
  txTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  txCategory: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  txAmount: {
    ...typography.bodyMedium,
    fontWeight: '700',
    marginLeft: spacing[2],
  },
  txEmpty: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
  },

  // Empty / quote
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  emptyBody: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },
  quoteCard: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    alignItems: 'center',
  },
  quoteArabic: {
    fontSize: 17,
    color: colors.primary[700],
    textAlign: 'center',
    marginBottom: spacing[2],
    lineHeight: 28,
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
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[5],
    ...shadows.glowGold,
  },
  fabGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edit / delete transaction sheet
  backdrop: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing[5],
    paddingBottom: spacing[8],
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.dark,
    marginBottom: spacing[4],
  },
  sheetTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },
  sheetSub: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  sheetLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  receiptImage: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.default,
    marginBottom: spacing[4],
  },
  fieldContainer: {marginBottom: spacing[3]},
  inlineCurrency: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '700',
  },
  sheetButton: {marginTop: spacing[1]},
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    marginTop: spacing[1],
  },
  secondaryActionText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
