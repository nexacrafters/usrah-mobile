/**
 * Debts Screen
 *
 * Tracks money the family OWES — to people, banks, or shops. You can owe several
 * different people at once; each debt is its own card showing how much is left
 * to pay, how much is already paid (progress bar), the kind of debt and the due
 * date. Tapping a card lets you record a payment, settle it, or delete it. A
 * "+ New Debt" action / FAB opens an inline add sheet.
 *
 * Talks directly to the API via debtsService (REMOTE — no offline mirror), with
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
import debtsService, {
  Debt,
  DebtType,
  DEFAULT_CURRENCY,
} from '../../services/api/debts.service';
import {getCurrentFamilyId} from '../../store/authStore';
import {showConfirm} from '../../store/dialogStore';

type DebtsNav = NavigationProp<Record<string, object | undefined>>;

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '0');
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value: number): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

/** Debt kind -> icon + accent colour. */
const TYPE_META: Record<string, {icon: string; color: string}> = {
  personal: {icon: 'account-cash', color: colors.gold[600]},
  loan: {icon: 'bank', color: colors.skyBlue[600]},
  mortgage: {icon: 'home-city', color: colors.islamic.barakallah},
  credit_card: {icon: 'credit-card', color: colors.error},
  other: {icon: 'cash-multiple', color: colors.primary[500]},
};

const typeMeta = (d: Debt) => TYPE_META[d.type] ?? TYPE_META.other;

export default function DebtsScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<DebtsNav>();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Record-payment sheet (an existing debt is "active").
  const [active, setActive] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Add-debt sheet
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [paid, setPaid] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('personal');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const hasFamily = !!getCurrentFamilyId();

  const load = useCallback(async () => {
    if (!getCurrentFamilyId()) {
      setDebts([]);
      return;
    }
    const data = await debtsService.listDebts();
    setDebts(data);
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
                : t('debts.loadError', {defaultValue: 'Could not load debts.'}),
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
          : t('debts.loadError', {defaultValue: 'Could not load debts.'}),
      );
    } finally {
      setRefreshing(false);
    }
  }, [load, t]);

  // ---- Add debt -----------------------------------------------------------
  const openAdd = () => {
    setName('');
    setTotal('');
    setPaid('');
    setDebtType('personal');
    setDueDate('');
    setNotes('');
    setSheetError(null);
    setAdding(true);
  };

  const totalValue = parseFloat(total.replace(',', '.'));
  const paidValue = paid.trim() ? parseFloat(paid.replace(',', '.')) : 0;
  const addValid =
    !!name.trim() && Number.isFinite(totalValue) && totalValue > 0;

  const handleAdd = async () => {
    setSheetError(null);
    if (!addValid) {
      setSheetError(
        t('debts.addError', {
          defaultValue: 'Enter who you owe and a valid amount.',
        }),
      );
      return;
    }
    const safePaid = Number.isFinite(paidValue)
      ? Math.min(Math.max(paidValue, 0), totalValue)
      : 0;
    setBusy(true);
    try {
      await debtsService.createDebt({
        name: name.trim(),
        type: debtType,
        total_amount: totalValue,
        remaining_amount: totalValue - safePaid,
        due_date: dueDate.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      await load();
      setAdding(false);
      setBusy(false);
    } catch (e) {
      setSheetError(
        e instanceof Error
          ? e.message
          : t('debts.saveError', {defaultValue: 'Could not save the debt.'}),
      );
      setBusy(false);
    }
  };

  // ---- Record payment -----------------------------------------------------
  const openPay = (debt: Debt) => {
    setActive(debt);
    setPayAmount('');
    setSheetError(null);
  };

  const closePay = () => {
    setActive(null);
    setBusy(false);
  };

  const payValue = parseFloat(payAmount.replace(',', '.'));
  const payValid = Number.isFinite(payValue) && payValue > 0;

  const handlePay = async () => {
    if (!active) return;
    setSheetError(null);
    if (!payValid) {
      setSheetError(
        t('debts.enterAmountError', {defaultValue: 'Enter a valid amount.'}),
      );
      return;
    }
    setBusy(true);
    try {
      await debtsService.recordPayment(
        active.public_id,
        active.remaining_amount,
        payValue,
      );
      await load();
      closePay();
    } catch (e) {
      setSheetError(
        e instanceof Error
          ? e.message
          : t('debts.payError', {defaultValue: 'Could not record payment.'}),
      );
      setBusy(false);
    }
  };

  const handleSettle = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await debtsService.settleDebt(active.public_id);
      await load();
      closePay();
    } catch (e) {
      setSheetError(
        e instanceof Error
          ? e.message
          : t('debts.payError', {defaultValue: 'Could not record payment.'}),
      );
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!active) return;
    const ok = await showConfirm({
      title: t('debts.deleteTitle', {defaultValue: 'Delete debt'}),
      message: t('debts.deleteBody', {
        defaultValue: 'Remove this debt from your records?',
      }),
      confirmText: t('common.delete', {defaultValue: 'Delete'}),
      cancelText: t('common.cancel', {defaultValue: 'Cancel'}),
      destructive: true,
    });
    if (ok) {
      const id = active.public_id;
      closePay();
      try {
        await debtsService.deleteDebt(id);
        await load();
      } catch {
        /* reload will reflect the true state on next focus */
      }
    }
  };

  const typeLabel = (ty: string): string =>
    t(`debts.type.${ty}`, {
      defaultValue:
        ty === 'personal'
          ? 'Personal'
          : ty === 'credit_card'
          ? 'Credit card'
          : ty.charAt(0).toUpperCase() + ty.slice(1),
    });

  const renderDebt = (debt: Debt) => {
    const {icon, color} = typeMeta(debt);
    const total = toNumber(debt.total_amount);
    const remaining = toNumber(debt.remaining_amount);
    const paid = Math.max(0, total - remaining);
    const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
    const settled = remaining <= 0;
    return (
      <TouchableOpacity
        key={debt.public_id}
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => openPay(debt)}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, {backgroundColor: color + '1A'}]}>
            <Icon name={icon} size={22} color={color} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {debt.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.cardMeta}>{typeLabel(debt.type)}</Text>
              {debt.due_date ? (
                <>
                  <Text style={styles.metaSep}>·</Text>
                  <Icon
                    name="calendar-clock"
                    size={12}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.cardMeta}>{debt.due_date}</Text>
                </>
              ) : null}
            </View>
          </View>
          {settled ? (
            <View style={styles.settledPill}>
              <Icon name="check-circle" size={14} color={colors.success} />
              <Text style={styles.settledText}>
                {t('debts.settled', {defaultValue: 'Paid'})}
              </Text>
            </View>
          ) : (
            <Text style={[styles.cardRemaining, {color}]}>
              {formatMoney(remaining)}
            </Text>
          )}
        </View>

        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pct}%`,
                backgroundColor: settled ? colors.success : color,
              },
            ]}
          />
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.savedText}>
            {t('debts.paidLabel', {defaultValue: 'Paid'})}{' '}
            {formatMoney(paid)}
            <Text style={styles.targetText}>
              {' '}
              / {formatMoney(total)} {debt.currency || DEFAULT_CURRENCY}
            </Text>
          </Text>
          {!settled && (
            <Text style={styles.remainingText}>
              {t('debts.left', {
                defaultValue: '{{amount}} left',
                amount: formatMoney(remaining),
              })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const totalOwed = debts.reduce(
    (s, d) => s + toNumber(d.remaining_amount),
    0,
  );
  const activeDebts = debts.filter((d) => toNumber(d.remaining_amount) > 0);

  const TYPE_OPTIONS: DebtType[] = [
    'personal',
    'loan',
    'credit_card',
    'mortgage',
    'other',
  ];

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
          {t('debts.title', {defaultValue: 'Debts'})}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!hasFamily ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="home-heart" size={40} color={colors.primary[500]} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('debts.noFamilyTitle', {defaultValue: 'No family yet'})}
          </Text>
          <Text style={styles.emptyBody}>
            {t('debts.noFamilyBody', {
              defaultValue: 'Create or join a family to track shared debts.',
            })}
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : error && debts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="cloud-alert" size={40} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('debts.errorTitle', {defaultValue: 'Something went wrong'})}
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
          {debts.length > 0 && (
            <LinearGradient
              colors={['#8a5a3c', '#6d4530']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.totalCard}>
              <View style={styles.totalIconBubble}>
                <Icon name="cash-remove" size={20} color={colors.white} />
              </View>
              <Text style={styles.totalLabel}>
                {t('debts.totalOwed', {defaultValue: 'Total still owed'})}
              </Text>
              <Text style={styles.totalAmount}>
                {DEFAULT_CURRENCY} {formatMoney(totalOwed)}
              </Text>
              <Text style={styles.totalSub}>
                {t('debts.acrossCount', {
                  defaultValue: 'across {{count}} active debt(s)',
                  count: activeDebts.length,
                })}
              </Text>
            </LinearGradient>
          )}

          {debts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon
                  name="cash-check"
                  size={40}
                  color={colors.primary[400]}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {t('debts.noDebtsTitle', {defaultValue: 'No debts — alhamdulillah'})}
              </Text>
              <Text style={styles.emptyBody}>
                {t('debts.noDebtsBody', {
                  defaultValue:
                    'Track money you owe to people, banks or shops so nothing is forgotten.',
                })}
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                activeOpacity={0.9}
                onPress={openAdd}>
                <Icon name="plus" size={18} color={colors.white} />
                <Text style={styles.emptyCtaText}>
                  {t('debts.newDebt', {defaultValue: 'New Debt'})}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.newGoalButton}
                activeOpacity={0.9}
                onPress={openAdd}>
                <Icon name="plus" size={18} color={colors.primary[600]} />
                <Text style={styles.newGoalText}>
                  {t('debts.newDebt', {defaultValue: 'New Debt'})}
                </Text>
              </TouchableOpacity>
              {debts.map(renderDebt)}
            </>
          )}
        </ScrollView>
      )}

      {/* Record-payment sheet */}
      <Modal
        visible={!!active}
        transparent
        animationType="slide"
        onRequestClose={closePay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closePay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableOpacity activeOpacity={1} style={styles.sheet}>
              {active && (
                <>
                  <View style={styles.sheetHandle} />
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {active.name}
                  </Text>
                  <Text style={styles.sheetSub}>
                    {t('debts.remainingLabel', {defaultValue: 'Remaining'})}:{' '}
                    {formatMoney(toNumber(active.remaining_amount))}{' '}
                    {active.currency || DEFAULT_CURRENCY}
                  </Text>

                  {toNumber(active.remaining_amount) > 0 ? (
                    <>
                      <Text style={styles.sheetLabel}>
                        {t('debts.paymentAmount', {
                          defaultValue: 'Payment amount',
                        })}
                      </Text>
                      <Input
                        placeholder="0.000"
                        keyboardType="decimal-pad"
                        value={payAmount}
                        onChangeText={setPayAmount}
                        containerStyle={styles.fieldContainer}
                        autoFocus
                        leftIcon={
                          <Text style={styles.inlineCurrency}>
                            {active.currency || DEFAULT_CURRENCY}
                          </Text>
                        }
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
                        title={t('debts.recordPayment', {
                          defaultValue: 'Record payment',
                        })}
                        onPress={handlePay}
                        variant="primary"
                        size="large"
                        fullWidth
                        loading={busy}
                        disabled={!payValid || busy}
                        style={styles.sheetButton}
                      />
                      <TouchableOpacity
                        style={styles.secondaryAction}
                        activeOpacity={0.85}
                        onPress={handleSettle}
                        disabled={busy}>
                        <Icon
                          name="check-all"
                          size={18}
                          color={colors.success}
                        />
                        <Text
                          style={[
                            styles.secondaryActionText,
                            {color: colors.success},
                          ]}>
                          {t('debts.markPaid', {defaultValue: 'Mark fully paid'})}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.statusNotice}>
                      <Icon
                        name="check-circle"
                        size={18}
                        color={colors.success}
                      />
                      <Text style={styles.statusNoticeText}>
                        {t('debts.settledNotice', {
                          defaultValue: 'This debt is fully paid. Alhamdulillah.',
                        })}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.secondaryAction}
                    activeOpacity={0.85}
                    onPress={handleDelete}
                    disabled={busy}>
                    <Icon name="trash-can-outline" size={18} color={colors.error} />
                    <Text
                      style={[styles.secondaryActionText, {color: colors.error}]}>
                      {t('common.delete', {defaultValue: 'Delete'})}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Add-debt sheet */}
      <Modal
        visible={adding}
        transparent
        animationType="slide"
        onRequestClose={() => setAdding(false)}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setAdding(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableOpacity activeOpacity={1} style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {t('debts.newDebt', {defaultValue: 'New Debt'})}
              </Text>
              <Text style={styles.sheetSub}>
                {t('debts.newDebtSub', {
                  defaultValue: 'Who do you owe, and how much?',
                })}
              </Text>

              <Text style={styles.sheetLabel}>
                {t('debts.whoLabel', {defaultValue: 'Who / what for'})}
              </Text>
              <Input
                placeholder={t('debts.whoPlaceholder', {
                  defaultValue: 'e.g. Ahmed — borrowed money',
                })}
                value={name}
                onChangeText={setName}
                containerStyle={styles.fieldContainer}
              />

              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <Text style={styles.sheetLabel}>
                    {t('debts.totalLabel', {defaultValue: 'Total amount'})}
                  </Text>
                  <Input
                    placeholder="0.000"
                    keyboardType="decimal-pad"
                    value={total}
                    onChangeText={setTotal}
                    containerStyle={styles.fieldContainer}
                    leftIcon={
                      <Text style={styles.inlineCurrency}>
                        {DEFAULT_CURRENCY}
                      </Text>
                    }
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.sheetLabel}>
                    {t('debts.paidAlready', {defaultValue: 'Already paid'})}
                  </Text>
                  <Input
                    placeholder="0.000"
                    keyboardType="decimal-pad"
                    value={paid}
                    onChangeText={setPaid}
                    containerStyle={styles.fieldContainer}
                  />
                </View>
              </View>

              <Text style={styles.sheetLabel}>
                {t('debts.typeLabel', {defaultValue: 'Type'})}
              </Text>
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((ty) => {
                  const sel = debtType === ty;
                  const meta = TYPE_META[ty];
                  return (
                    <TouchableOpacity
                      key={ty}
                      activeOpacity={0.8}
                      onPress={() => setDebtType(ty)}
                      style={[
                        styles.typeChip,
                        sel && {
                          backgroundColor: meta.color + '1A',
                          borderColor: meta.color,
                        },
                      ]}>
                      <Icon
                        name={meta.icon}
                        size={15}
                        color={sel ? meta.color : colors.text.tertiary}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          sel && {color: meta.color, fontWeight: '600'},
                        ]}>
                        {typeLabel(ty)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sheetLabel}>
                {t('debts.dueLabel', {defaultValue: 'Due date (optional)'})}
              </Text>
              <Input
                placeholder="YYYY-MM-DD"
                value={dueDate}
                onChangeText={setDueDate}
                keyboardType="numbers-and-punctuation"
                containerStyle={styles.fieldContainer}
                leftIcon={
                  <Icon name="calendar" size={18} color={colors.text.tertiary} />
                }
              />

              <Input
                placeholder={t('debts.notesPlaceholder', {
                  defaultValue: 'Notes (optional)',
                })}
                value={notes}
                onChangeText={setNotes}
                containerStyle={styles.fieldContainer}
              />

              {sheetError && (
                <View style={styles.errorBanner}>
                  <Icon name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{sheetError}</Text>
                </View>
              )}

              <Button
                title={t('debts.saveDebt', {defaultValue: 'Save debt'})}
                onPress={handleAdd}
                variant="primary"
                size="large"
                fullWidth
                loading={busy}
                disabled={!addValid || busy}
                style={styles.sheetButton}
              />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {hasFamily && debts.length > 0 && (
        <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={openAdd}>
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
  cardMeta: {...typography.caption, color: colors.text.tertiary},
  metaSep: {...typography.caption, color: colors.text.tertiary},
  cardRemaining: {...typography.bodyMedium, fontWeight: '700'},
  settledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf3',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  settledText: {...typography.caption, color: colors.success, fontWeight: '700'},
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
  retryText: {...typography.bodyMedium, color: colors.white, fontWeight: '600'},
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
  sheetTitle: {...typography.h4, color: colors.text.primary, fontWeight: '600'},
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
  row2: {flexDirection: 'row', gap: spacing[3]},
  flex1: {flex: 1},
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  typeChipText: {...typography.bodySmall, color: colors.text.primary},
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
  statusNoticeText: {...typography.bodySmall, color: colors.text.secondary, flex: 1},
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
