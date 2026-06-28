/**
 * Zakat Calculator Screen
 *
 * Fully-local Zakat calculator. The user enters cash, gold value, silver value,
 * business assets, liabilities and the nisab threshold (in TND). We compute the
 * net zakatable wealth (assets − liabilities) and, when it meets/exceeds the
 * nisab, the Zakat due at 2.5%. No network calls.
 */

import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import Card from '../../components/ui/Card';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';

const ZAKAT_RATE = 0.025;
// Default nisab ≈ value of 85g gold; editable by the user to match local prices.
const DEFAULT_NISAB = 25000;

interface FieldKey {
  key: 'cash' | 'gold' | 'silver' | 'business' | 'liabilities';
  labelKey: string;
  icon: string;
}

const ASSET_FIELDS: FieldKey[] = [
  {key: 'cash', labelKey: 'islamic.zakatCash', icon: 'cash'},
  {key: 'gold', labelKey: 'islamic.zakatGold', icon: 'gold'},
  {key: 'silver', labelKey: 'islamic.zakatSilver', icon: 'circle-multiple'},
  {key: 'business', labelKey: 'islamic.zakatBusiness', icon: 'store'},
];

const num = (v: string): number => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function ZakatScreen() {
  const {t, i18n} = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const currency = t('islamic.zakatCurrency');

  const money = (n: number): string =>
    n.toLocaleString(isArabic ? 'ar-u-nu-latn' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [values, setValues] = useState<Record<string, string>>({
    cash: '',
    gold: '',
    silver: '',
    business: '',
    liabilities: '',
    nisab: String(DEFAULT_NISAB),
  });

  const set = (key: string, val: string) =>
    setValues((prev) => ({...prev, [key]: val.replace(/[^0-9.,]/g, '')}));

  const result = useMemo(() => {
    const totalAssets =
      num(values.cash) + num(values.gold) + num(values.silver) + num(values.business);
    const liabilities = num(values.liabilities);
    const nisab = num(values.nisab) || DEFAULT_NISAB;
    const zakatable = Math.max(0, totalAssets - liabilities);
    const aboveNisab = zakatable >= nisab && zakatable > 0;
    const due = aboveNisab ? zakatable * ZAKAT_RATE : 0;
    const hasInput = totalAssets > 0 || liabilities > 0;
    return {totalAssets, liabilities, nisab, zakatable, aboveNisab, due, hasInput};
  }, [values]);

  const resetAll = () =>
    setValues({
      cash: '',
      gold: '',
      silver: '',
      business: '',
      liabilities: '',
      nisab: String(DEFAULT_NISAB),
    });

  const renderInput = (key: string, labelKey: string, icon: string) => (
    <View key={key} style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Icon name={icon} size={18} color={colors.primary[500]} />
        <Text style={styles.fieldLabel}>{t(labelKey)}</Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={values[key]}
          onChangeText={(v) => set(key, v)}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.text.tertiary}
        />
        <Text style={styles.currency}>{currency}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('islamic.zakatTitle')}</Text>
        <Text style={styles.headerSubtitle}>{t('islamic.zakatSubtitle')}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Result card */}
          <Card style={styles.resultCard}>
            <LinearGradient
              colors={
                result.aboveNisab
                  ? [colors.primary[500], colors.primary[700]]
                  : [colors.slate[500], colors.slate[700]]
              }
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.resultGradient}>
              <Text style={styles.resultLabel}>{t('islamic.zakatDueLabel')}</Text>
              <Text style={styles.resultValue}>
                {money(result.due)} {currency}
              </Text>
              {result.hasInput ? (
                <View style={styles.resultBadge}>
                  <Icon
                    name={result.aboveNisab ? 'check-circle' : 'information'}
                    size={14}
                    color={colors.white}
                  />
                  <Text style={styles.resultBadgeText}>
                    {result.aboveNisab
                      ? t('islamic.zakatAboveNisab')
                      : t('islamic.zakatBelowNisab')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.resultHint}>
                  {t('islamic.zakatEnterValues')}
                </Text>
              )}
            </LinearGradient>
          </Card>

          {/* Asset inputs */}
          {ASSET_FIELDS.map((f) => renderInput(f.key, f.labelKey, f.icon))}

          {/* Liabilities */}
          {renderInput('liabilities', 'islamic.zakatLiabilities', 'credit-card-minus')}

          {/* Nisab */}
          {renderInput('nisab', 'islamic.zakatNisabLabel', 'scale-balance')}

          {/* Breakdown */}
          <Card variant="outlined" style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>{t('islamic.zakatBreakdown')}</Text>
            <Row label={t('islamic.zakatTotalAssets')} value={`${money(result.totalAssets)} ${currency}`} />
            <Row label={t('islamic.zakatLiabilities')} value={`− ${money(result.liabilities)} ${currency}`} />
            <View style={styles.divider} />
            <Row
              label={t('islamic.zakatNetZakatable')}
              value={`${money(result.zakatable)} ${currency}`}
              strong
            />
            <Row label={t('islamic.zakatNisabLabel')} value={`${money(result.nisab)} ${currency}`} />
            <View style={styles.divider} />
            <Row
              label={t('islamic.zakatDueLabel')}
              value={`${money(result.due)} ${currency}`}
              accent
            />
          </Card>

          {/* Nisab note */}
          <View style={styles.note}>
            <Icon name="information-outline" size={16} color={colors.text.tertiary} />
            <Text style={styles.noteText}>{t('islamic.zakatNisabNote')}</Text>
          </View>

          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.85}
            onPress={resetAll}>
            <Icon name="restart" size={18} color={colors.error} />
            <Text style={styles.resetText}>{t('islamic.zakatReset')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowLabelStrong]}>
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          strong && styles.rowValueStrong,
          accent && styles.rowValueAccent,
        ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  flex: {flex: 1},
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {...typography.h3, color: colors.text.primary, fontWeight: 'bold'},
  headerSubtitle: {...typography.caption, color: colors.text.secondary},
  scrollContent: {padding: spacing[4], paddingBottom: spacing[16]},
  resultCard: {padding: 0, overflow: 'hidden', marginBottom: spacing[6]},
  resultGradient: {padding: spacing[6], alignItems: 'center'},
  resultLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultValue: {fontSize: 40, fontWeight: 'bold', color: colors.white, marginVertical: spacing[2]},
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    maxWidth: '100%',
  },
  resultBadgeText: {...typography.caption, color: colors.white, flexShrink: 1},
  resultHint: {...typography.bodySmall, color: 'rgba(255,255,255,0.85)'},
  field: {marginBottom: spacing[4]},
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  fieldLabel: {...typography.label, color: colors.text.secondary},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
  },
  input: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
  },
  currency: {...typography.label, color: colors.text.tertiary},
  breakdownCard: {marginTop: spacing[2], marginBottom: spacing[4]},
  breakdownTitle: {
    ...typography.h6,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing[2]},
  rowLabel: {...typography.bodySmall, color: colors.text.secondary, flex: 1},
  rowLabelStrong: {color: colors.text.primary, fontWeight: '600'},
  rowValue: {...typography.bodySmall, color: colors.text.primary, fontWeight: '500'},
  rowValueStrong: {fontWeight: '700'},
  rowValueAccent: {color: colors.primary[600], fontWeight: '700'},
  divider: {height: 1, backgroundColor: colors.border.default, marginVertical: spacing[2]},
  note: {
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: colors.gold[50],
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  noteText: {...typography.caption, color: colors.text.secondary, flex: 1, lineHeight: 18},
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.error + '55',
    backgroundColor: colors.error + '10',
    ...shadows.sm,
  },
  resetText: {...typography.button, color: colors.error},
});
