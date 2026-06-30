/**
 * Preferences Screen — the config hub. Everything here is data-driven from the
 * server: toggle which modules appear, pick finance mode (salary vs business),
 * currency, madhhab. Changes persist to the per-family/per-user JSON settings,
 * so the menu adapts with no app update.
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Input from '../../components/ui/Input';
import ScreenHeader from '../../components/ui/ScreenHeader';
import {useSettingsStore} from '../../store/settingsStore';
import i18n from '../../../i18n';
import {colors, spacing, typography, borderRadius} from '../../theme';

const HOUSEHOLD_TYPES = ['individual', 'married', 'family'] as const;
const FINANCE_MODES = ['salary', 'business'] as const;
const MADHHABS = ['standard', 'hanafi'] as const;

export default function PreferencesScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const isAr = i18n.language?.startsWith('ar');

  const modules = useSettingsStore((s) => s.modules);
  const family = useSettingsStore((s) => s.family);
  const user = useSettingsStore((s) => s.user);
  const load = useSettingsStore((s) => s.load);
  const setModuleEnabled = useSettingsStore((s) => s.setModuleEnabled);
  const setFamily = useSettingsStore((s) => s.setFamily);
  const setUser = useSettingsStore((s) => s.setUser);

  const [currency, setCurrency] = useState<string>(family.currency || 'TND');

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrency(family.currency || 'TND');
  }, [family.currency]);

  const Toggle = ({on}: {on: boolean}) => (
    <View style={[styles.toggle, on && styles.toggleOn]}>
      <View style={[styles.knob, on && styles.knobOn]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('preferences.title', {defaultValue: 'Preferences'})} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Household type — Individual / Married / Family */}
        <Text style={styles.section}>{t('preferences.household', {defaultValue: 'Household'})}</Text>
        <View style={styles.segment}>
          {HOUSEHOLD_TYPES.map((h) => {
            const active = (family.household_type || 'family') === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.segTab, active && styles.segTabOn]}
                onPress={() => setFamily({household_type: h})}>
                <Text style={[styles.segText, active && styles.segTextOn]}>
                  {t(`preferences.household_${h}`, {
                    defaultValue: h === 'individual' ? 'Individual' : h === 'married' ? 'Married' : 'Family',
                  })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {t('preferences.householdHint', {
            defaultValue: 'Sets sensible defaults — on your own hides family-only features; married enables masrouf.',
          })}
        </Text>

        {/* Finance mode */}
        <Text style={styles.section}>{t('preferences.financeMode', {defaultValue: 'Finance mode'})}</Text>
        <View style={styles.segment}>
          {FINANCE_MODES.map((m) => {
            const active = (family.finance_mode || 'salary') === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.segTab, active && styles.segTabOn]}
                onPress={() => setFamily({finance_mode: m})}>
                <Text style={[styles.segText, active && styles.segTextOn]}>
                  {t(`preferences.mode_${m}`, {defaultValue: m === 'salary' ? 'Salary' : 'Business'})}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {t('preferences.financeModeHint', {
            defaultValue:
              'Business mode is built for irregular income — averages, cash-flow and runway instead of a fixed salary.',
          })}
        </Text>

        {/* Currency */}
        <Text style={styles.section}>{t('preferences.currency', {defaultValue: 'Currency'})}</Text>
        <Input
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
          maxLength={3}
          containerStyle={{marginBottom: 0}}
          onBlur={() => currency && setFamily({currency: currency.toUpperCase()})}
        />

        {/* Madhhab (asr calculation) */}
        <Text style={styles.section}>{t('preferences.madhhab', {defaultValue: 'Madhhab (Asr)'})}</Text>
        <View style={styles.segment}>
          {MADHHABS.map((m) => {
            const active = (user.madhhab || 'standard') === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.segTab, active && styles.segTabOn]}
                onPress={() => setUser({madhhab: m})}>
                <Text style={[styles.segText, active && styles.segTextOn]}>
                  {t(`preferences.madhhab_${m}`, {defaultValue: m === 'standard' ? 'Standard' : 'Hanafi'})}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Modules */}
        <Text style={styles.section}>{t('preferences.modules', {defaultValue: 'Features shown'})}</Text>
        <Text style={styles.hint}>
          {t('preferences.modulesHint', {defaultValue: 'Turn features on or off — only what you enable appears in the app.'})}
        </Text>
        <View style={styles.card}>
          {modules.map((m, i) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.row, i > 0 && styles.rowBorder]}
              activeOpacity={0.8}
              onPress={() => setModuleEnabled(m.id, !m.enabled)}>
              <Icon name={m.icon} size={20} color={colors.primary[500]} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{isAr ? m.name_ar : m.name_en}</Text>
              <Toggle on={m.enabled} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  back: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  backIcon: {fontSize: 24, color: colors.text.primary},
  headerTitle: {...typography.h4, color: colors.text.primary, flex: 1, fontWeight: '700', textAlign: 'center'},
  content: {padding: spacing[4], paddingBottom: spacing[10]},
  section: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  hint: {...typography.caption, color: colors.text.tertiary, marginBottom: spacing[3]},
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.full,
    padding: 4,
    gap: spacing[1],
  },
  segTab: {flex: 1, paddingVertical: spacing[2], borderRadius: borderRadius.full, alignItems: 'center'},
  segTabOn: {backgroundColor: colors.primary[500]},
  segText: {...typography.bodySmall, color: colors.text.secondary, fontWeight: '600'},
  segTextOn: {color: colors.white},
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  row: {flexDirection: 'row', alignItems: 'center', padding: spacing[4]},
  rowBorder: {borderTopWidth: 1, borderTopColor: colors.border.light},
  rowIcon: {marginRight: spacing[3]},
  rowLabel: {...typography.bodyMedium, color: colors.text.primary, flex: 1},
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.default,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {backgroundColor: colors.primary[500]},
  knob: {width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white},
  knobOn: {alignSelf: 'flex-end'},
});
