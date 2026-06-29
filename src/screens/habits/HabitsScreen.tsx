/**
 * Habits Screen — everyday-life consistency tracker.
 * Track daily habits (Quran, dhikr, fitness, water, healthy eating...) and see
 * your streak. Personal by default; opt in to share consistency with family.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {showConfirm} from '../../store/dialogStore';
import IslamicEmptyState from '../../components/ui/IslamicEmptyState';
import habitService, {Habit, HabitCategory} from '../../services/api/habit.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

const CATEGORIES: Array<{id: HabitCategory; icon: string}> = [
  {id: 'worship', icon: '🕌'},
  {id: 'quran', icon: '📖'},
  {id: 'dhikr', icon: '📿'},
  {id: 'fitness', icon: '🏃'},
  {id: 'health', icon: '💧'},
  {id: 'food', icon: '🥗'},
  {id: 'learning', icon: '📚'},
  {id: 'other', icon: '⭐'},
];
const iconFor = (c: HabitCategory) => CATEGORIES.find((x) => x.id === c)?.icon ?? '⭐';

export default function HabitsScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('worship');
  const [target, setTarget] = useState('1');
  const [share, setShare] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHabits(await habitService.list());
    } catch {
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!name.trim() || adding) {
      return;
    }
    setAdding(true);
    try {
      await habitService.create({
        name: name.trim(),
        category,
        icon: iconFor(category),
        target_count: Math.max(1, parseInt(target, 10) || 1),
        shareWithFamily: share,
      });
      setName('');
      setTarget('1');
      setShare(false);
      setShowForm(false);
      await load();
    } catch {
      // keep form for retry
    } finally {
      setAdding(false);
    }
  };

  const logOne = async (habit: Habit) => {
    // Optimistic increment.
    setHabits((prev) =>
      prev.map((h) =>
        h.public_id === habit.public_id
          ? {
              ...h,
              today_count: Math.min((h.today_count ?? 0) + 1, h.target_count),
              completed_today: (h.today_count ?? 0) + 1 >= h.target_count,
            }
          : h,
      ),
    );
    try {
      const res = await habitService.log(habit.public_id);
      setHabits((prev) =>
        prev.map((h) =>
          h.public_id === habit.public_id
            ? {...h, today_count: res.count, completed_today: res.completed, streak: res.streak}
            : h,
        ),
      );
    } catch {
      load();
    }
  };

  const remove = async (habit: Habit) => {
    const ok = await showConfirm({
      title: t('habits.deleteTitle'),
      message: t('habits.deleteBody', {name: habit.name}),
      confirmText: t('common.delete'),
      destructive: true,
    });
    if (!ok) {
      return;
    }
    setHabits((prev) => prev.filter((h) => h.public_id !== habit.public_id));
    try {
      await habitService.remove(habit.public_id);
    } catch {
      load();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('habits.title')}</Text>
        <TouchableOpacity onPress={() => setShowForm((v) => !v)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>{showForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary[500]} />
        }>
        {showForm && (
          <View style={styles.form}>
            <Input
              placeholder={t('habits.namePlaceholder')}
              value={name}
              onChangeText={setName}
              containerStyle={styles.formInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[styles.catChip, category === c.id && styles.catChipOn]}>
                  <Text style={styles.catIcon}>{c.icon}</Text>
                  <Text style={[styles.catText, category === c.id && styles.catTextOn]}>
                    {t(`habits.categories.${c.id}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>{t('habits.dailyTarget')}</Text>
              <Input
                value={target}
                onChangeText={setTarget}
                keyboardType="number-pad"
                containerStyle={styles.targetInput}
              />
            </View>
            <TouchableOpacity
              style={styles.shareRow}
              onPress={() => setShare((v) => !v)}
              activeOpacity={0.8}>
              <Text style={styles.shareText}>
                {share ? '👨‍👩‍👧 ' : '🔒 '}
                {share ? t('habits.shared') : t('habits.private')}
              </Text>
              <View style={[styles.toggle, share && styles.toggleOn]}>
                <View style={[styles.knob, share && styles.knobOn]} />
              </View>
            </TouchableOpacity>
            <Button title={t('habits.add')} onPress={add} loading={adding} fullWidth />
          </View>
        )}

        {loading && habits.length === 0 ? (
          <ActivityIndicator style={{marginTop: spacing[8]}} color={colors.primary[500]} />
        ) : habits.length === 0 ? (
          <IslamicEmptyState icon="🌱" message={t('habits.empty')} />
        ) : (
          habits.map((h) => {
            const count = h.today_count ?? 0;
            const pct = Math.min(100, (count / Math.max(1, h.target_count)) * 100);
            const done = h.completed_today;
            return (
              <TouchableOpacity
                key={h.public_id}
                style={[styles.habitCard, done && styles.habitCardDone]}
                activeOpacity={0.8}
                onPress={() => logOne(h)}
                onLongPress={() => remove(h)}>
                <Text style={styles.habitIcon}>{h.icon || iconFor(h.category)}</Text>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{h.name}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, {width: `${pct}%`}]} />
                  </View>
                  <Text style={styles.habitMeta}>
                    {count}/{h.target_count}
                    {h.unit ? ` ${h.unit}` : ''} · 🔥 {h.streak ?? 0}
                  </Text>
                </View>
                <View style={[styles.check, done && styles.checkOn]}>
                  <Text style={styles.checkText}>{done ? '✓' : '+'}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        {habits.length > 0 && (
          <Text style={styles.hint}>{t('habits.hint')}</Text>
        )}
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
  headerTitle: {...typography.h4, color: colors.text.primary, flex: 1, fontWeight: '700'},
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {color: colors.white, fontSize: 20, fontWeight: '700'},
  content: {padding: spacing[4], paddingBottom: spacing[10]},
  form: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing[3],
  },
  formInput: {marginBottom: 0},
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing[2],
  },
  catChipOn: {backgroundColor: colors.primary[50], borderColor: colors.primary[500]},
  catIcon: {fontSize: 14},
  catText: {...typography.caption, color: colors.text.secondary},
  catTextOn: {color: colors.primary[700], fontWeight: '700'},
  targetRow: {flexDirection: 'row', alignItems: 'center', gap: spacing[3]},
  targetLabel: {...typography.bodyMedium, color: colors.text.primary, flex: 1},
  targetInput: {marginBottom: 0, width: 80},
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareText: {...typography.bodyMedium, color: colors.text.primary},
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
  empty: {alignItems: 'center', marginTop: spacing[10]},
  emptyEmoji: {fontSize: 52, marginBottom: spacing[3]},
  emptyText: {...typography.body, color: colors.text.secondary, textAlign: 'center'},
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing[3],
  },
  habitCardDone: {borderColor: colors.islamic.mashallah, backgroundColor: colors.primary[50]},
  habitIcon: {fontSize: 26},
  habitInfo: {flex: 1, gap: 4},
  habitName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.default,
    overflow: 'hidden',
  },
  progressFill: {height: '100%', backgroundColor: colors.primary[500], borderRadius: 3},
  habitMeta: {...typography.caption, color: colors.text.tertiary},
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {backgroundColor: colors.islamic.mashallah, borderColor: colors.islamic.mashallah},
  checkText: {color: colors.text.secondary, fontSize: 18, fontWeight: '700'},
  hint: {...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing[2]},
});
