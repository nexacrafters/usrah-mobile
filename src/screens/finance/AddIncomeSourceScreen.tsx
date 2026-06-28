/**
 * Add Income Source Screen
 *
 * Records a named income source against the active family: a name
 * (e.g. "Salary - Acme"), a monthly amount, currency (default TND), a
 * recurring-monthly toggle and an optional icon. Saves via incomeService —
 * which writes the local SQLite DB and fires a background sync — then goes back.
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import incomeService from '../../services/api/income.service';
import {useFinanceStore} from '../../store/financeStore';
import {getCurrentFamilyId} from '../../store/authStore';

const DEFAULT_CURRENCY = 'TND';

/** Selectable icons for an income source. */
const INCOME_ICONS = [
  'cash',
  'briefcase',
  'laptop',
  'store',
  'hand-coin',
  'bank',
  'chart-line',
  'gift',
];

export default function AddIncomeSourceScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const addIncomeSource = useFinanceStore((s) => s.addIncomeSource);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(true);
  const [icon, setIcon] = useState<string>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountValue = parseFloat(amount.replace(',', '.'));
  const amountValid = Number.isFinite(amountValue) && amountValue > 0;
  const canSubmit = !!name.trim() && amountValid && !submitting;

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t('finance.nameRequired'));
      return;
    }
    if (!amountValid) {
      setError(t('finance.enterAmountError'));
      return;
    }
    if (!getCurrentFamilyId()) {
      setError(t('finance.selectFamilyError'));
      return;
    }
    setSubmitting(true);
    try {
      const created = await incomeService.createIncomeSource({
        name: name.trim(),
        amount: amountValue,
        currency: DEFAULT_CURRENCY,
        is_recurring: recurring,
        is_active: true,
        icon,
      });
      addIncomeSource(created);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('finance.couldNotSaveIncome'));
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.canGoBack() && navigation.goBack()}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('finance.addIncomeTitle')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Amount hero */}
            <LinearGradient
              colors={[colors.primary[500], colors.primary[700]]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.amountCard}>
              <Text style={styles.amountLabel}>
                {t('finance.monthlyAmount')}
              </Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>{DEFAULT_CURRENCY}</Text>
                <Input
                  placeholder="0.000"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  containerStyle={styles.amountInputContainer}
                  inputContainerStyle={styles.amountFieldBox}
                  style={styles.amountField}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              </View>
            </LinearGradient>

            {/* Name */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.sourceName')}</Text>
              <Input
                placeholder={t('finance.sourceNamePlaceholder')}
                value={name}
                onChangeText={setName}
                containerStyle={styles.fieldContainer}
                autoFocus
              />
            </View>

            {/* Recurring toggle */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.toggleRow}
              onPress={() => setRecurring((v) => !v)}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.toggleTitle}>
                  {t('finance.recurringMonthly')}
                </Text>
                <Text style={styles.toggleSub}>
                  {t('finance.recurringMonthlyHint')}
                </Text>
              </View>
              <View
                style={[styles.switch, recurring && styles.switchOn]}>
                <View
                  style={[styles.knob, recurring && styles.knobOn]}
                />
              </View>
            </TouchableOpacity>

            {/* Icon picker */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('finance.iconOptional')}
              </Text>
              <View style={styles.iconGrid}>
                {INCOME_ICONS.map((name2) => {
                  const selected = icon === name2;
                  return (
                    <TouchableOpacity
                      key={name2}
                      activeOpacity={0.8}
                      onPress={() => setIcon(name2)}
                      style={[
                        styles.iconChip,
                        selected && styles.iconChipSelected,
                      ]}>
                      <Icon
                        name={name2}
                        size={22}
                        color={
                          selected ? colors.white : colors.primary[600]
                        }
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title={t('finance.saveSource')}
              onPress={handleSubmit}
              variant="primary"
              size="large"
              fullWidth
              loading={submitting}
              disabled={!canSubmit}
              style={styles.saveButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background.default},
  container: {flex: 1},
  keyboardView: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  closeButton: {
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
  },
  headerSpacer: {width: 36},
  scrollView: {flex: 1},
  scrollContent: {padding: spacing[5], paddingBottom: spacing[12]},
  amountCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginBottom: spacing[6],
    ...shadows.md,
  },
  amountLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing[2],
  },
  amountRow: {flexDirection: 'row', alignItems: 'center'},
  currencySymbol: {
    ...typography.h3,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    marginRight: spacing[3],
  },
  amountInputContainer: {flex: 1, marginBottom: 0},
  amountFieldBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  amountField: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
    paddingVertical: spacing[1],
  },
  section: {marginBottom: spacing[5]},
  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  fieldContainer: {marginBottom: 0},
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  toggleTextWrap: {flex: 1},
  toggleTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  toggleSub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.default,
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: {backgroundColor: colors.primary[500]},
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  knobOn: {alignSelf: 'flex-end'},
  iconGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3]},
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    borderWidth: 1.5,
    borderColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
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
  saveButton: {marginTop: spacing[2]},
});
