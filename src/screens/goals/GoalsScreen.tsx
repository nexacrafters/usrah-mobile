/**
 * Family Goals Screen
 *
 * Shows the SHARED goals a family saves toward together — Hajj, a car, a home.
 * Each goal is a card with a progress bar (current / target), the amount saved,
 * the deadline and status. Tapping a card opens an inline sheet to Contribute
 * (and to pause / resume). A "+ New Goal" action opens the AddGoal modal.
 *
 * Talks directly to the API via goalsService (REMOTE — no offline mirror), with
 * loading / empty / error states, pull-to-refresh and reload-on-focus.
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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useNavigation,
  useFocusEffect,
  type NavigationProp,
} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import goalsService, {
  Goal,
  GoalStatus,
  DEFAULT_CURRENCY,
} from '../../services/api/goals.service';
import {getCurrentFamilyId} from '../../store/authStore';

/**
 * The "Goals" / "AddGoal" routes are registered by the navigation owner.
 * Keep navigation loosely typed here so this screen compiles independently of
 * when those routes are wired into the param list.
 */
type GoalsNav = NavigationProp<Record<string, object | undefined>>;

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '0');
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value: number): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/** Map a goal category to an icon + accent colour. */
const CATEGORY_META: Record<string, {icon: string; color: string}> = {
  hajj: {icon: 'mosque', color: colors.primary[600]},
  emergency: {icon: 'shield-check', color: colors.skyBlue[500]},
  education: {icon: 'school', color: colors.islamic.subhanallah},
  home: {icon: 'home', color: colors.islamic.barakallah},
  vehicle: {icon: 'car', color: colors.gold[600]},
  travel: {icon: 'airplane', color: colors.skyBlue[600]},
  wedding: {icon: 'ring', color: colors.sistersCircle.primary},
  charity: {icon: 'hand-heart', color: colors.islamic.mashallah},
  other: {icon: 'star-four-points', color: colors.primary[500]},
};

const categoryMeta = (g: Goal): {icon: string; color: string} => {
  const meta = CATEGORY_META[g.category] ?? CATEGORY_META.other;
  return {icon: g.icon || meta.icon, color: g.color || meta.color};
};

const STATUS_META: Record<GoalStatus, {color: string}> = {
  active: {color: colors.success},
  paused: {color: colors.warning},
  completed: {color: colors.primary[600]},
  cancelled: {color: colors.text.tertiary},
};

export default function GoalsScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<GoalsNav>();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline contribute / action sheet
  const [active, setActive] = useState<Goal | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const hasFamily = !!getCurrentFamilyId();

  const load = useCallback(async () => {
    if (!getCurrentFamilyId()) {
      setGoals([]);
      return;
    }
    const data = await goalsService.listGoals();
    setGoals(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      setError(null);
      load()
        .catch((e: unknown) => {
          if (alive) {
            setError(e instanceof Error ? e.message : t('goals.loadError'));
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
      setError(e instanceof Error ? e.message : t('goals.loadError'));
    } finally {
      setRefreshing(false);
    }
  }, [load, t]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    load()
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : t('goals.loadError')),
      )
      .finally(() => setLoading(false));
  }, [load, t]);

  const openSheet = (goal: Goal) => {
    setActive(goal);
    setAmount('');
    setNote('');
    setSheetError(null);
  };

  const closeSheet = () => {
    setActive(null);
    setBusy(false);
  };

  const amountValue = parseFloat(amount.replace(',', '.'));
  const amountValid = Number.isFinite(amountValue) && amountValue > 0;

  const handleContribute = async () => {
    if (!active) return;
    setSheetError(null);
    if (!amountValid) {
      setSheetError(t('goals.enterAmountError'));
      return;
    }
    setBusy(true);
    try {
      await goalsService.contribute(active.id, amountValue, note);
      await load();
      closeSheet();
    } catch (e) {
      setSheetError(e instanceof Error ? e.message : t('goals.contributeError'));
      setBusy(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!active) return;
    setSheetError(null);
    setBusy(true);
    try {
      if (active.status === 'active') {
        await goalsService.pauseGoal(active.id);
      } else if (active.status === 'paused') {
        await goalsService.resumeGoal(active.id);
      }
      await load();
      closeSheet();
    } catch (e) {
      setSheetError(e instanceof Error ? e.message : t('goals.actionError'));
      setBusy(false);
    }
  };

  const statusLabel = (s: GoalStatus): string =>
    t(`goals.status.${s}`, {defaultValue: s});

  const renderGoal = (goal: Goal) => {
    const {icon, color} = categoryMeta(goal);
    const current = toNumber(goal.current_amount);
    const target = toNumber(goal.target_amount);
    const pct =
      target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const statusColor = STATUS_META[goal.status]?.color ?? colors.text.tertiary;
    return (
      <TouchableOpacity
        key={goal.id}
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => openSheet(goal)}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, {backgroundColor: color + '1A'}]}>
            <Icon name={icon} size={22} color={color} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {goal.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
              <Text style={styles.cardMeta}>{statusLabel(goal.status)}</Text>
              {goal.deadline ? (
                <>
                  <Text style={styles.metaSep}>·</Text>
                  <Icon
                    name="calendar"
                    size={12}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.cardMeta}>{goal.deadline}</Text>
                </>
              ) : null}
            </View>
          </View>
          <Text style={[styles.cardPct, {color}]}>{Math.round(pct)}%</Text>
        </View>

        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, {width: `${pct}%`, backgroundColor: color}]}
          />
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.savedText}>
            {formatMoney(current)}
            <Text style={styles.targetText}>
              {' '}
              / {formatMoney(target)} {goal.currency || DEFAULT_CURRENCY}
            </Text>
          </Text>
          <Text style={styles.remainingText}>
            {t('goals.remaining', {
              amount: formatMoney(Math.max(0, target - current)),
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const totalTarget = goals.reduce((s, g) => s + toNumber(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + toNumber(g.current_amount), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.canGoBack() && navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="chevron-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('goals.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!hasFamily ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="home-heart" size={40} color={colors.primary[500]} />
          </View>
          <Text style={styles.emptyTitle}>{t('goals.noFamilyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('goals.noFamilyBody')}</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : error && goals.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="cloud-alert" size={40} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>{t('goals.errorTitle')}</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.9}
            onPress={retry}>
            <Icon name="refresh" size={18} color={colors.white} />
            <Text style={styles.retryText}>{t('common.retry')}</Text>
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
          {goals.length > 0 && (
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.totalCard}>
              <View style={styles.totalIconBubble}>
                <Icon name="bullseye-arrow" size={20} color={colors.white} />
              </View>
              <Text style={styles.totalLabel}>{t('goals.totalSaved')}</Text>
              <Text style={styles.totalAmount}>
                {DEFAULT_CURRENCY} {formatMoney(totalSaved)}
              </Text>
              <Text style={styles.totalSub}>
                {t('goals.ofTarget', {amount: formatMoney(totalTarget)})}
              </Text>
            </LinearGradient>
          )}

          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon
                  name="bullseye-arrow"
                  size={40}
                  color={colors.primary[400]}
                />
              </View>
              <Text style={styles.emptyTitle}>{t('goals.noGoalsTitle')}</Text>
              <Text style={styles.emptyBody}>{t('goals.noGoalsBody')}</Text>
              <TouchableOpacity
                style={styles.emptyCta}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AddGoal')}>
                <Icon name="plus" size={18} color={colors.white} />
                <Text style={styles.emptyCtaText}>{t('goals.newGoal')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.newGoalButton}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AddGoal')}>
                <Icon name="plus" size={18} color={colors.primary[600]} />
                <Text style={styles.newGoalText}>{t('goals.newGoal')}</Text>
              </TouchableOpacity>
              {goals.map(renderGoal)}
            </>
          )}
        </ScrollView>
      )}

      {/* Inline contribute / actions sheet */}
      <Modal
        visible={!!active}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeSheet}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableOpacity activeOpacity={1} style={styles.sheet}>
              {active && (
                <>
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {active.title}
                  </Text>
                  <Text style={styles.sheetSub}>
                    {formatMoney(toNumber(active.current_amount))} /{' '}
                    {formatMoney(toNumber(active.target_amount))}{' '}
                    {active.currency || DEFAULT_CURRENCY}
                  </Text>

                  {active.status === 'active' ? (
                    <>
                      <Text style={styles.sheetLabel}>
                        {t('goals.contributeAmount')}
                      </Text>
                      <Input
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                        containerStyle={styles.fieldContainer}
                        autoFocus
                        leftIcon={
                          <Text style={styles.inlineCurrency}>
                            {active.currency || DEFAULT_CURRENCY}
                          </Text>
                        }
                      />
                      <Input
                        placeholder={t('goals.notePlaceholder')}
                        value={note}
                        onChangeText={setNote}
                        containerStyle={styles.fieldContainer}
                      />

                      {sheetError && (
                        <View style={styles.errorBanner}>
                          <Icon
                            name="alert-circle"
                            size={16}
                            color={colors.error}
                          />
                          <Text style={styles.errorText}>{sheetError}</Text>
                        </View>
                      )}

                      <Button
                        title={t('goals.contribute')}
                        onPress={handleContribute}
                        variant="primary"
                        size="large"
                        fullWidth
                        loading={busy}
                        disabled={!amountValid || busy}
                        style={styles.sheetButton}
                      />
                    </>
                  ) : (
                    <View style={styles.statusNotice}>
                      <Icon
                        name={
                          active.status === 'completed'
                            ? 'check-circle'
                            : 'pause-circle'
                        }
                        size={18}
                        color={
                          STATUS_META[active.status]?.color ??
                          colors.text.tertiary
                        }
                      />
                      <Text style={styles.statusNoticeText}>
                        {active.status === 'completed'
                          ? t('goals.completedNotice')
                          : t('goals.pausedNotice')}
                      </Text>
                    </View>
                  )}

                  {(active.status === 'active' ||
                    active.status === 'paused') && (
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      activeOpacity={0.85}
                      onPress={handleToggleStatus}
                      disabled={busy}>
                      <Icon
                        name={
                          active.status === 'active'
                            ? 'pause'
                            : 'play'
                        }
                        size={18}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.secondaryActionText}>
                        {active.status === 'active'
                          ? t('goals.pause')
                          : t('goals.resume')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {hasFamily && goals.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AddGoal')}>
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
  totalSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing[1],
  },
  newGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  newGoalText: {
    ...typography.bodyMedium,
    color: colors.primary[600],
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'center'},
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
  statusDot: {width: 7, height: 7, borderRadius: 4},
  cardMeta: {...typography.caption, color: colors.text.tertiary},
  metaSep: {...typography.caption, color: colors.text.tertiary},
  cardPct: {...typography.bodyMedium, fontWeight: '700'},
  barTrack: {
    height: 8,
    backgroundColor: colors.background.default,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing[3],
  },
  barFill: {height: '100%', borderRadius: 4},
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  savedText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '700',
  },
  targetText: {color: colors.text.secondary, fontWeight: '400'},
  remainingText: {...typography.caption, color: colors.text.tertiary},
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
  retryText: {
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
  // Sheet
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
  fieldContainer: {marginBottom: spacing[3]},
  inlineCurrency: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '700',
  },
  sheetButton: {marginTop: spacing[1]},
  statusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  statusNoticeText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  secondaryActionText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#fef2f2',
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  errorText: {...typography.bodySmall, color: colors.error, flex: 1},
});
