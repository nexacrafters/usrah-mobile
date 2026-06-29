/**
 * Meal Plan Screen
 * A simple, fast weekly food planner. Pick a day, then jot what's for each
 * meal (free text). Saved per (date, meal type) for the whole family to see.
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import mealPlanService, {MealPlan, MealType} from '../../services/api/mealplan.service';
import {colors, spacing, typography, borderRadius} from '../../theme';
import {formatDate} from '../../utils/datetime';

const MEAL_TYPES: Array<{id: MealType; icon: string}> = [
  {id: 'breakfast', icon: '🌅'},
  {id: 'lunch', icon: '☀️'},
  {id: 'dinner', icon: '🌙'},
  {id: 'snack', icon: '🍎'},
];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function MealPlanScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  // The next 7 days starting today.
  const week = useMemo(() => {
    const today = new Date();
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const [selected, setSelected] = useState(iso(week[0]));
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mealPlanService.list(iso(week[0]), iso(week[6]));
      setPlans(data);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    load();
  }, [load]);

  const planFor = (date: string, meal: MealType) =>
    plans.find((p) => p.date === date && p.meal_type === meal);

  const save = async (meal: MealType) => {
    const key = `${selected}:${meal}`;
    const text = (drafts[key] ?? planFor(selected, meal)?.custom_meal ?? '').trim();
    const existing = planFor(selected, meal);

    if (!text && !existing) {
      return;
    }
    try {
      if (existing) {
        const updated = await mealPlanService.update(existing.public_id, {custom_meal: text});
        setPlans((prev) =>
          prev.map((p) => (p.public_id === existing.public_id ? updated : p)),
        );
      } else {
        const created = await mealPlanService.create({
          date: selected,
          meal_type: meal,
          custom_meal: text,
        });
        setPlans((prev) => [...prev, created]);
      }
    } catch {
      load();
    }
  };

  const dayLabel = (d: Date) => formatDate(d, {weekday: 'short'});

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('mealPlan.title')}</Text>
        <View style={{width: 36}} />
      </View>

      {/* Day selector */}
      <View style={styles.daysWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {week.map((d) => {
            const key = iso(d);
            const active = key === selected;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setSelected(key)}
                style={[styles.dayChip, active && styles.dayChipOn]}>
                <Text style={[styles.dayName, active && styles.dayTextOn]}>
                  {dayLabel(d)}
                </Text>
                <Text style={[styles.dayNum, active && styles.dayTextOn]}>
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: spacing[10]}} color={colors.primary[500]} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {MEAL_TYPES.map((meal) => {
            const key = `${selected}:${meal.id}`;
            const existing = planFor(selected, meal.id);
            const value = drafts[key] ?? existing?.custom_meal ?? '';
            return (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealIcon}>{meal.icon}</Text>
                  <Text style={styles.mealName}>{t(`mealPlan.meals.${meal.id}`)}</Text>
                </View>
                <TextInput
                  style={styles.mealInput}
                  placeholder={t('mealPlan.placeholder')}
                  placeholderTextColor={colors.text.tertiary}
                  value={value}
                  onChangeText={(text) =>
                    setDrafts((prev) => ({...prev, [key]: text}))
                  }
                  onBlur={() => save(meal.id)}
                  returnKeyType="done"
                  onSubmitEditing={() => save(meal.id)}
                />
              </View>
            );
          })}

          <Text style={styles.hint}>{t('mealPlan.hint')}</Text>
        </ScrollView>
      )}
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
  daysWrap: {
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  daysRow: {paddingHorizontal: spacing[4], paddingVertical: spacing[3], gap: spacing[2]},
  dayChip: {
    width: 52,
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    marginRight: spacing[2],
  },
  dayChipOn: {backgroundColor: colors.primary[500], borderColor: colors.primary[500]},
  dayName: {...typography.caption, color: colors.text.secondary},
  dayNum: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
  dayTextOn: {color: colors.white},
  content: {padding: spacing[4], paddingBottom: spacing[10]},
  mealCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  mealHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2]},
  mealIcon: {fontSize: 18},
  mealName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
  mealInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
