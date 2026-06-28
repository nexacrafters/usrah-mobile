/**
 * Savings & Goals List Screen
 *
 * Lists the family's savings pots / goals from the local SQLite DB. Each card
 * shows the running balance; goals (with a target) also show a progress bar and
 * "balance / target" with a percentage. Tapping a card opens its detail screen
 * (deposit / withdraw). A friendly empty state with a call-to-action is shown
 * when there are no funds yet.
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import savingsService from '../../services/api/savings.service';
import {useFinanceStore, SavingsFund} from '../../store/financeStore';
import {getCurrentFamilyId} from '../../store/authStore';
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

export default function SavingsFundScreen() {
  const {t} = useTranslation();
  const navigation =
    useNavigation<AppStackScreenProps<'SavingsFunds'>['navigation']>();
  const funds = useFinanceStore((s) => s.savingsFunds);
  const setSavingsFunds = useFinanceStore((s) => s.setSavingsFunds);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hasFamily = !!getCurrentFamilyId();

  const load = useCallback(async () => {
    if (!getCurrentFamilyId()) return;
    const data = await savingsService.listSavingsFunds();
    setSavingsFunds(data);
  }, [setSavingsFunds]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load()
        .catch(() => {
          /* non-fatal — empty state covers it */
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load().catch(() => {});
    setRefreshing(false);
  }, [load]);

  const totalSafe = funds
    .filter((f) => f.is_active)
    .reduce((sum, f) => sum + toNumber(f.balance), 0);

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
        <View style={styles.fundHeader}>
          <View style={[styles.fundIcon, {backgroundColor: color + '1A'}]}>
            <Icon name={fund.icon || 'piggy-bank'} size={22} color={color} />
          </View>
          <View style={styles.fundTitleWrap}>
            <Text style={styles.fundName} numberOfLines={1}>
              {fund.name}
            </Text>
            <Text style={styles.fundType}>
              {hasTarget ? t('finance.goal') : t('finance.safeMoney')}
            </Text>
          </View>
          <View style={styles.fundBalanceWrap}>
            <Text style={[styles.fundBalance, {color}]}>
              {formatMoney(balance)}
            </Text>
            <Text style={styles.fundCurrency}>
              {fund.currency || DEFAULT_CURRENCY}
            </Text>
          </View>
        </View>
        {hasTarget && (
          <>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {width: `${pct}%`, backgroundColor: color},
                ]}
              />
            </View>
            <View style={styles.targetRow}>
              <Text style={styles.targetText}>
                {formatMoney(balance)} / {formatMoney(target)}
              </Text>
              <Text style={[styles.targetPct, {color}]}>
                {Math.round(pct)}%
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="chevron-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('finance.savingsGoals')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!hasFamily ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="home-heart" size={40} color={colors.primary[500]} />
          </View>
          <Text style={styles.emptyTitle}>{t('finance.noFamilyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('finance.noFamilyBody')}</Text>
        </View>
      ) : loading ? (
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
          {funds.length > 0 && (
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.totalCard}>
              <View style={styles.totalIconBubble}>
                <Icon name="shield-check" size={20} color={colors.white} />
              </View>
              <Text style={styles.totalLabel}>{t('finance.totalSafe')}</Text>
              <Text style={styles.totalAmount}>
                {DEFAULT_CURRENCY} {formatMoney(totalSafe)}
              </Text>
            </LinearGradient>
          )}

          {funds.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon
                  name="piggy-bank-outline"
                  size={40}
                  color={colors.primary[400]}
                />
              </View>
              <Text style={styles.emptyTitle}>{t('finance.noFundsTitle')}</Text>
              <Text style={styles.emptyBody}>{t('finance.noFundsBody')}</Text>
              <TouchableOpacity
                style={styles.emptyCta}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AddSavingsFund')}>
                <Icon name="plus" size={18} color={colors.white} />
                <Text style={styles.emptyCtaText}>{t('finance.addFund')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            funds.map(renderFund)
          )}
        </ScrollView>
      )}

      {hasFamily && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AddSavingsFund')}>
          <LinearGradient
            colors={['#987022', '#C4912F', '#F3BB45']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.fabGradient}>
            <Icon name="plus" size={28} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
  headerTitle: {...typography.h4, color: colors.text.primary, fontWeight: '600'},
  headerSpacer: {width: 36},
  scrollView: {flex: 1},
  scrollContent: {padding: spacing[4], paddingBottom: spacing[24]},
  loadingState: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  totalCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[5],
    ...shadows.md,
  },
  totalIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  totalLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing[1],
  },
  totalAmount: {fontSize: 24, fontWeight: 'bold', color: colors.white},
  fundCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  fundHeader: {flexDirection: 'row', alignItems: 'center'},
  fundIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  fundTitleWrap: {flex: 1},
  fundName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  fundType: {...typography.caption, color: colors.text.tertiary, marginTop: 2},
  fundBalanceWrap: {alignItems: 'flex-end'},
  fundBalance: {...typography.bodyMedium, fontWeight: '700'},
  fundCurrency: {...typography.caption, color: colors.text.tertiary},
  barTrack: {
    height: 8,
    backgroundColor: colors.background.default,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing[3],
  },
  barFill: {height: '100%', borderRadius: 4},
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  targetText: {...typography.caption, color: colors.text.secondary},
  targetPct: {...typography.caption, fontWeight: '700'},
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
    flexGrow: 1,
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
    marginBottom: spacing[5],
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  emptyCtaText: {
    ...typography.bodyMedium,
    color: colors.white,
    fontWeight: '600',
  },
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
});
