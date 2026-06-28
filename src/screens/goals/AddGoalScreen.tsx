/**
 * Add Family Goal Screen (modal)
 *
 * Creates a shared family goal — a title, a target amount, an optional deadline
 * and a category (Hajj, vehicle, home, ...). Categories are loaded from the API
 * (with a sensible built-in fallback) and drive the goal's icon + accent colour.
 * Saves via goalsService.createGoal (REMOTE) then pops back to the list.
 */

import React, {useCallback, useEffect, useState} from 'react';
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
import goalsService, {
  GoalCategoryOption,
  DEFAULT_CURRENCY,
} from '../../services/api/goals.service';
import {getCurrentFamilyId} from '../../store/authStore';

/** Icon + colour for each known category value. */
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

/** Fallback list mirroring Goal.CATEGORY_CHOICES if the API call fails. */
const FALLBACK_CATEGORIES: GoalCategoryOption[] = [
  {value: 'hajj', label: 'Hajj/Umrah'},
  {value: 'emergency', label: 'Emergency Fund'},
  {value: 'education', label: 'Education'},
  {value: 'home', label: 'Home Purchase'},
  {value: 'vehicle', label: 'Vehicle'},
  {value: 'travel', label: 'Travel'},
  {value: 'wedding', label: 'Wedding'},
  {value: 'charity', label: 'Charity'},
  {value: 'other', label: 'Other'},
];

const metaFor = (value: string) => CATEGORY_META[value] ?? CATEGORY_META.other;

export default function AddGoalScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [categories, setCategories] =
    useState<GoalCategoryOption[]>(FALLBACK_CATEGORIES);
  const [category, setCategory] = useState<string>('hajj');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    goalsService
      .listCategories()
      .then((cats) => {
        if (alive && cats.length) setCategories(cats);
      })
      .catch(() => {
        /* keep the fallback list */
      });
    return () => {
      alive = false;
    };
  }, []);

  const targetValue = parseFloat(targetAmount.replace(',', '.'));
  const targetValid = Number.isFinite(targetValue) && targetValue > 0;
  const canSubmit = !!title.trim() && targetValid && !submitting;

  const selectedMeta = metaFor(category);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!title.trim()) {
      setError(t('goals.titleRequired'));
      return;
    }
    if (!targetValid) {
      setError(t('goals.invalidTarget'));
      return;
    }
    if (!getCurrentFamilyId()) {
      setError(t('goals.selectFamilyError'));
      return;
    }
    setSubmitting(true);
    try {
      const meta = metaFor(category);
      await goalsService.createGoal({
        title: title.trim(),
        target_amount: targetValue,
        deadline: deadline.trim() || undefined,
        category,
        currency: DEFAULT_CURRENCY,
        color: meta.color,
        icon: meta.icon,
      });
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('goals.createError'));
      setSubmitting(false);
    }
  }, [category, deadline, navigation, t, targetValid, targetValue, title]);

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
            <Text style={styles.headerTitle}>{t('goals.addTitle')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Hero reflecting the chosen category */}
            <LinearGradient
              colors={[selectedMeta.color, selectedMeta.color + 'CC']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.hero}>
              <View style={styles.heroIcon}>
                <Icon name={selectedMeta.icon} size={30} color={colors.white} />
              </View>
              <Text style={styles.heroHint}>{t('goals.heroHint')}</Text>
            </LinearGradient>

            {/* Title */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('goals.goalTitle')}</Text>
              <Input
                placeholder={t('goals.titlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                containerStyle={styles.fieldContainer}
                autoFocus
              />
            </View>

            {/* Target amount */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('goals.targetAmount')}</Text>
              <Input
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={targetAmount}
                onChangeText={setTargetAmount}
                containerStyle={styles.fieldContainer}
                leftIcon={
                  <Text style={styles.inlineCurrency}>{DEFAULT_CURRENCY}</Text>
                }
              />
            </View>

            {/* Deadline (optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('goals.deadlineOptional')}
              </Text>
              <Input
                placeholder="YYYY-MM-DD"
                value={deadline}
                onChangeText={setDeadline}
                keyboardType={
                  Platform.OS === 'ios'
                    ? 'numbers-and-punctuation'
                    : 'default'
                }
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

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('goals.category')}</Text>
              <View style={styles.catGrid}>
                {categories.map((c) => {
                  const meta = metaFor(c.value);
                  const selected = category === c.value;
                  return (
                    <TouchableOpacity
                      key={c.value}
                      activeOpacity={0.85}
                      onPress={() => setCategory(c.value)}
                      style={[
                        styles.catChip,
                        {borderColor: meta.color + '40'},
                        selected && {
                          backgroundColor: meta.color + '14',
                          borderColor: meta.color,
                        },
                      ]}>
                      <Icon
                        name={meta.icon}
                        size={18}
                        color={meta.color}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          selected && {color: meta.color, fontWeight: '700'},
                        ]}
                        numberOfLines={1}>
                        {c.label}
                      </Text>
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
              title={t('goals.saveGoal')}
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
  catGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2]},
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    backgroundColor: colors.background.paper,
  },
  catChipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
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
