/**
 * Recurring Screen
 *
 * Lists the family's active recurring RULES — income or bills that auto-record
 * on a schedule (a monthly salary, monthly rent...). Each row shows what it is,
 * the signed amount (+ income / − expense), the cadence and when it next fires.
 * A stop button soft-disables a rule; transactions already generated stay put.
 *
 * Talks directly to the API via recurringService (REMOTE — no offline mirror),
 * with loading / empty / error states, pull-to-refresh and reload-on-focus.
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useNavigation,
  useFocusEffect,
  type NavigationProp,
} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import recurringService, {
  RecurringRule,
  DEFAULT_CURRENCY,
} from '../../services/api/recurring.service';
import {getCurrentFamilyId} from '../../store/authStore';
import {showConfirm} from '../../store/dialogStore';

type RecurringNav = NavigationProp<Record<string, object | undefined>>;

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '0');
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value: number): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

export default function RecurringScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<RecurringNav>();

  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFamily = !!getCurrentFamilyId();

  const load = useCallback(async () => {
    if (!getCurrentFamilyId()) {
      setRules([]);
      return;
    }
    const data = await recurringService.listRecurring();
    setRules(data.filter((r) => r.is_active));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      setError(null);
      load()
        .catch((e: unknown) => {
          if (alive) {
            setError(
              e instanceof Error
                ? e.message
                : t('recurring.loadError', {
                    defaultValue: 'Could not load recurring items.',
                  }),
            );
          }
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return () => {
        alive = false;
      };
    }, [load, t]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('recurring.loadError', {
              defaultValue: 'Could not load recurring items.',
            }),
      );
    } finally {
      setRefreshing(false);
    }
  }, [load, t]);

  const handleStop = async (rule: RecurringRule) => {
    const ok = await showConfirm({
      title: t('recurring.stopTitle', {defaultValue: 'Stop recurring'}),
      message: t('recurring.stopBody', {
        defaultValue:
          'Stop auto-recording this item? Entries already created stay.',
      }),
      confirmText: t('recurring.stop', {defaultValue: 'Stop'}),
      cancelText: t('common.cancel', {defaultValue: 'Cancel'}),
      destructive: true,
    });
    if (ok) {
      try {
        await recurringService.stopRecurring(rule.public_id);
        await load();
      } catch {
        /* reload will reflect the true state on next focus */
      }
    }
  };

  const renderRule = (rule: RecurringRule) => {
    const isIncome = rule.type === 'income';
    const accent = isIncome ? colors.primary[500] : colors.gold[600];
    const sign = isIncome ? '+' : '−';
    const title =
      rule.description?.trim() ||
      rule.category_name ||
      t('recurring.untitled', {defaultValue: 'Recurring item'});
    return (
      <View key={rule.public_id} style={styles.card}>
        <View style={[styles.cardIcon, {backgroundColor: accent + '1A'}]}>
          <Icon
            name={isIncome ? 'cash-plus' : 'cash-minus'}
            size={22}
            color={accent}
          />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            <Icon name="repeat" size={12} color={colors.text.tertiary} />
            <Text style={styles.cardMeta}>
              {t('recurring.monthly', {defaultValue: 'Monthly'})}
            </Text>
            {rule.next_occurrence ? (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Icon
                  name="calendar-clock"
                  size={12}
                  color={colors.text.tertiary}
                />
                <Text style={styles.cardMeta}>{rule.next_occurrence}</Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardAmount, {color: accent}]}>
            {sign}
            {formatMoney(toNumber(rule.amount))}
          </Text>
          <Text style={styles.cardCurrency}>
            {rule.currency || DEFAULT_CURRENCY}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.stopButton}
          activeOpacity={0.7}
          onPress={() => handleStop(rule)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>
          {t('recurring.title', {defaultValue: 'Recurring'})}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!hasFamily ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="home-heart" size={40} color={colors.primary[500]} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('recurring.noFamilyTitle', {defaultValue: 'No family yet'})}
          </Text>
          <Text style={styles.emptyBody}>
            {t('recurring.noFamilyBody', {
              defaultValue:
                'Create or join a family to track recurring income and bills.',
            })}
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : error && rules.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="cloud-alert" size={40} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('recurring.errorTitle', {defaultValue: 'Something went wrong'})}
          </Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.9}
            onPress={onRefresh}>
            <Icon name="refresh" size={18} color={colors.white} />
            <Text style={styles.retryText}>
              {t('common.retry', {defaultValue: 'Retry'})}
            </Text>
          </TouchableOpacity>
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
          {rules.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon name="repeat" size={40} color={colors.primary[400]} />
              </View>
              <Text style={styles.emptyTitle}>
                {t('recurring.emptyTitle', {
                  defaultValue: 'Nothing recurring yet',
                })}
              </Text>
              <Text style={styles.emptyBody}>
                {t('recurring.emptyBody', {
                  defaultValue:
                    'When adding income or an expense, turn on “Repeats monthly” to record it automatically every month.',
                })}
              </Text>
            </View>
          ) : (
            rules.map(renderRule)
          )}
        </ScrollView>
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
  scrollContent: {padding: spacing[4], paddingBottom: spacing[24], flexGrow: 1},
  loadingState: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  cardTitleWrap: {flex: 1},
  cardTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  metaRow: {flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4},
  cardMeta: {...typography.caption, color: colors.text.tertiary},
  metaSep: {...typography.caption, color: colors.text.tertiary},
  cardRight: {alignItems: 'flex-end', marginRight: spacing[2]},
  cardAmount: {...typography.bodyMedium, fontWeight: '700'},
  cardCurrency: {...typography.caption, color: colors.text.tertiary},
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.default,
  },
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
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[5],
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  retryText: {...typography.bodyMedium, color: colors.white, fontWeight: '600'},
});
