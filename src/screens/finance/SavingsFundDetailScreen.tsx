/**
 * Savings Fund Detail Screen
 *
 * Shows one savings pot / goal with its balance, target progress bar (when a
 * target is set) and Deposit / Withdraw actions. Reads the fund from the local
 * SQLite DB and writes deposits/withdrawals via savingsService — which marks
 * the row dirty and fires a background sync.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import savingsService from '../../services/api/savings.service';
import {useFinanceStore, SavingsFund} from '../../store/financeStore';
import {showConfirm} from '../../store/dialogStore';
import type {AppStackScreenProps} from '../../navigation/types';

const DEFAULT_CURRENCY = 'TND';

const formatMoney = (value: number): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '0');
  return Number.isFinite(n) ? n : 0;
};

type Mode = 'deposit' | 'withdraw';

export default function SavingsFundDetailScreen() {
  const {t} = useTranslation();
  const navigation =
    useNavigation<AppStackScreenProps<'SavingsFundDetail'>['navigation']>();
  const route = useRoute<AppStackScreenProps<'SavingsFundDetail'>['route']>();
  const {id} = route.params;

  const updateSavingsFund = useFinanceStore((s) => s.updateSavingsFund);
  const removeSavingsFund = useFinanceStore((s) => s.removeSavingsFund);

  const [fund, setFund] = useState<SavingsFund | undefined>();
  const [mode, setMode] = useState<Mode>('deposit');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const f = await savingsService.getSavingsFund(id);
    setFund(f);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const amountValue = parseFloat(amount.replace(',', '.'));
  const amountValid = Number.isFinite(amountValue) && amountValue > 0;

  const handleApply = async () => {
    setError(null);
    if (!amountValid) {
      setError(t('finance.enterAmountError'));
      return;
    }
    if (!fund) return;
    if (mode === 'withdraw' && amountValue > toNumber(fund.balance)) {
      setError(t('finance.insufficientBalance'));
      return;
    }
    setBusy(true);
    try {
      const updated =
        mode === 'deposit'
          ? await savingsService.deposit(id, amountValue)
          : await savingsService.withdraw(id, amountValue);
      setFund(updated);
      updateSavingsFund(id, {balance: updated.balance, percentage: updated.percentage});
      setAmount('');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('finance.couldNotSaveFund'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = await showConfirm({
      title: t('finance.deleteFundTitle'),
      message: t('finance.deleteFundBody'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) {
      await savingsService.deleteSavingsFund(id);
      removeSavingsFund(id);
      if (navigation.canGoBack()) navigation.goBack();
    }
  };

  if (!fund) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="chevron-left" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('finance.fund')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyBody}>{t('finance.fundNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const color = fund.color || colors.primary[500];
  const balance = toNumber(fund.balance);
  const target = toNumber(fund.target_amount);
  const hasTarget = !!fund.target_amount && target > 0;
  const pct = hasTarget ? Math.min((balance / target) * 100, 100) : 0;
  const remaining = hasTarget ? Math.max(0, target - balance) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="chevron-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {fund.name}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleDelete}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Balance hero */}
        <LinearGradient
          colors={[color, color + 'CC']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name={fund.icon || 'piggy-bank'} size={28} color={colors.white} />
          </View>
          <Text style={styles.heroLabel}>
            {hasTarget ? t('finance.goal') : t('finance.safeMoney')}
          </Text>
          <Text style={styles.heroAmount}>
            {fund.currency || DEFAULT_CURRENCY} {formatMoney(balance)}
          </Text>
          {hasTarget && (
            <>
              <View style={styles.heroBarTrack}>
                <View style={[styles.heroBarFill, {width: `${pct}%`}]} />
              </View>
              <Text style={styles.heroProgress}>
                {formatMoney(balance)} / {formatMoney(target)} ·{' '}
                {Math.round(pct)}%
              </Text>
              <Text style={styles.heroRemaining}>
                {t('finance.remainingToGoal', {
                  amount: formatMoney(remaining),
                  currency: fund.currency || DEFAULT_CURRENCY,
                })}
              </Text>
              {fund.target_date ? (
                <Text style={styles.heroRemaining}>
                  {t('finance.targetBy', {date: fund.target_date})}
                </Text>
              ) : null}
            </>
          )}
        </LinearGradient>

        {/* Deposit / Withdraw */}
        <View style={styles.modeToggle}>
          {(['deposit', 'withdraw'] as const).map((m) => {
            const active = mode === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.85}
                style={[
                  styles.modeButton,
                  active && {
                    backgroundColor:
                      m === 'deposit' ? colors.primary[500] : colors.gold[600],
                  },
                ]}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}>
                <Icon
                  name={m === 'deposit' ? 'plus-circle' : 'minus-circle'}
                  size={18}
                  color={active ? colors.white : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    active && styles.modeButtonTextActive,
                  ]}>
                  {m === 'deposit'
                    ? t('finance.deposit')
                    : t('finance.withdraw')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('finance.amount')}</Text>
          <Input
            placeholder="0.000"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            containerStyle={styles.fieldContainer}
            leftIcon={
              <Text style={styles.inlineCurrency}>
                {fund.currency || DEFAULT_CURRENCY}
              </Text>
            }
          />
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title={
            mode === 'deposit' ? t('finance.deposit') : t('finance.withdraw')
          }
          onPress={handleApply}
          variant={mode === 'deposit' ? 'primary' : 'gold'}
          size="large"
          fullWidth
          loading={busy}
          disabled={!amountValid || busy}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing[2],
  },
  headerSpacer: {width: 36},
  scrollView: {flex: 1},
  scrollContent: {padding: spacing[5], paddingBottom: spacing[12]},
  hero: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginBottom: spacing[6],
    alignItems: 'center',
    ...shadows.md,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  heroLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing[1],
  },
  heroAmount: {fontSize: 30, fontWeight: 'bold', color: colors.white},
  heroBarTrack: {
    height: 10,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: spacing[4],
  },
  heroBarFill: {height: '100%', borderRadius: 5, backgroundColor: colors.white},
  heroProgress: {
    ...typography.caption,
    color: colors.white,
    marginTop: spacing[2],
    fontWeight: '600',
  },
  heroRemaining: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing[1],
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[5],
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  modeButtonText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modeButtonTextActive: {color: colors.white},
  section: {marginBottom: spacing[5]},
  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  fieldContainer: {marginBottom: 0},
  inlineCurrency: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '700',
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
  errorText: {...typography.bodySmall, color: colors.error, flex: 1},
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  emptyBody: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
