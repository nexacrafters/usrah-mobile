/**
 * Add Savings Fund Screen
 *
 * Creates a savings pot / goal against the active family: a name, an optional
 * starting balance, an optional target amount + target date, and an icon/color.
 * No target -> a safe-money pot (Emergency, Backup); with a target -> a goal
 * (Car, House, Land) that will show a progress bar. Saves via savingsService —
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
import savingsService from '../../services/api/savings.service';
import {useFinanceStore} from '../../store/financeStore';
import {getCurrentFamilyId} from '../../store/authStore';

const DEFAULT_CURRENCY = 'TND';

/** Selectable {icon, color} presets for a fund / goal. */
const FUND_PRESETS: Array<{icon: string; color: string}> = [
  {icon: 'shield-check', color: colors.primary[500]},
  {icon: 'piggy-bank', color: colors.gold[600]},
  {icon: 'car', color: colors.skyBlue[500]},
  {icon: 'home', color: colors.islamic.barakallah},
  {icon: 'island', color: colors.islamic.mashallah},
  {icon: 'airplane', color: colors.error},
  {icon: 'school', color: colors.primary[700]},
  {icon: 'gift', color: colors.gold[700]},
];

export default function AddSavingsFundScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const addSavingsFund = useFinanceStore((s) => s.addSavingsFund);

  const [name, setName] = useState('');
  const [startBalance, setStartBalance] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [presetIndex, setPresetIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = FUND_PRESETS[presetIndex];

  const balanceValue = parseFloat(startBalance.replace(',', '.'));
  const targetValue = parseFloat(targetAmount.replace(',', '.'));
  const hasTarget = targetAmount.trim().length > 0;
  const canSubmit = !!name.trim() && !submitting;

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError(t('finance.nameRequired'));
      return;
    }
    if (hasTarget && !(Number.isFinite(targetValue) && targetValue > 0)) {
      setError(t('finance.invalidTarget'));
      return;
    }
    if (!getCurrentFamilyId()) {
      setError(t('finance.selectFamilyError'));
      return;
    }
    setSubmitting(true);
    try {
      const created = await savingsService.createSavingsFund({
        name: name.trim(),
        balance:
          Number.isFinite(balanceValue) && balanceValue > 0
            ? balanceValue
            : 0,
        target_amount: hasTarget ? targetValue : null,
        target_date: hasTarget && targetDate.trim() ? targetDate.trim() : null,
        currency: DEFAULT_CURRENCY,
        icon: preset.icon,
        color: preset.color,
        is_active: true,
      });
      addSavingsFund(created);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('finance.couldNotSaveFund'));
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
            <Text style={styles.headerTitle}>{t('finance.addFundTitle')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Preset hero */}
            <LinearGradient
              colors={[preset.color, preset.color + 'CC']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.hero}>
              <View style={styles.heroIcon}>
                <Icon name={preset.icon} size={30} color={colors.white} />
              </View>
              <Text style={styles.heroHint}>{t('finance.fundHeroHint')}</Text>
            </LinearGradient>

            {/* Name */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('finance.fundName')}</Text>
              <Input
                placeholder={t('finance.fundNamePlaceholder')}
                value={name}
                onChangeText={setName}
                containerStyle={styles.fieldContainer}
                autoFocus
              />
            </View>

            {/* Starting balance */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('finance.startingBalance')}
              </Text>
              <Input
                placeholder="0.000"
                keyboardType="decimal-pad"
                value={startBalance}
                onChangeText={setStartBalance}
                containerStyle={styles.fieldContainer}
                leftIcon={
                  <Text style={styles.inlineCurrency}>{DEFAULT_CURRENCY}</Text>
                }
              />
            </View>

            {/* Target amount (optional -> goal) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('finance.targetAmountOptional')}
              </Text>
              <Input
                placeholder={t('finance.targetAmountPlaceholder')}
                keyboardType="decimal-pad"
                value={targetAmount}
                onChangeText={setTargetAmount}
                containerStyle={styles.fieldContainer}
                leftIcon={
                  <Text style={styles.inlineCurrency}>{DEFAULT_CURRENCY}</Text>
                }
              />
              <Text style={styles.helperText}>
                {t('finance.targetHelper')}
              </Text>
            </View>

            {/* Target date (only meaningful with a target) */}
            {hasTarget && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {t('finance.targetDateOptional')}
                </Text>
                <Input
                  placeholder="YYYY-MM-DD"
                  value={targetDate}
                  onChangeText={setTargetDate}
                  keyboardType="numbers-and-punctuation"
                  containerStyle={styles.fieldContainer}
                  leftIcon={
                    <Icon
                      name="calendar"
                      size={18}
                      color={colors.text.tertiary}
                    />
                  }
                />
              </View>
            )}

            {/* Icon / color preset picker */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('finance.iconOptional')}
              </Text>
              <View style={styles.iconGrid}>
                {FUND_PRESETS.map((p, i) => {
                  const selected = presetIndex === i;
                  return (
                    <TouchableOpacity
                      key={p.icon}
                      activeOpacity={0.8}
                      onPress={() => setPresetIndex(i)}
                      style={[
                        styles.iconChip,
                        {backgroundColor: p.color + '1A', borderColor: p.color + '40'},
                        selected && {
                          backgroundColor: p.color,
                          borderColor: p.color,
                        },
                      ]}>
                      <Icon
                        name={p.icon}
                        size={22}
                        color={selected ? colors.white : p.color}
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
              title={t('finance.saveFund')}
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
  headerTitle: {...typography.h4, color: colors.text.primary, fontWeight: '600'},
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  heroHint: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
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
  helperText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },
  iconGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3]},
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
