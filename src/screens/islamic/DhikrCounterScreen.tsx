/**
 * Dhikr Counter (Tasbih) Screen
 *
 * A fully-offline tasbih counter. Tap the big number to increment; switch
 * between common dhikr presets (each with a target cycle length). The count
 * per dhikr is persisted in AsyncStorage so progress survives app restarts.
 * Completing a cycle vibrates and increments the cycle count.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {showConfirm} from '../../store/dialogStore';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import ScreenHeader from '../../components/ui/ScreenHeader';

const STORAGE_KEY = '@usrah/dhikr-counts';

interface DhikrPreset {
  id: string;
  arabic: string;
  labelKey: string;
  target: number;
}

const PRESETS: DhikrPreset[] = [
  {id: 'subhanallah', arabic: 'سُبْحَانَ ٱللَّٰه', labelKey: 'islamic.dhikrPresetSubhanAllah', target: 33},
  {id: 'alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰه', labelKey: 'islamic.dhikrPresetAlhamdulillah', target: 33},
  {id: 'allahuakbar', arabic: 'ٱللَّٰهُ أَكْبَر', labelKey: 'islamic.dhikrPresetAllahuAkbar', target: 33},
  {id: 'tahleel', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰه', labelKey: 'islamic.dhikrPresetTahleel', target: 100},
  {id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰه', labelKey: 'islamic.dhikrPresetAstaghfirullah', target: 100},
];

type Counts = Record<string, number>;

export default function DhikrCounterScreen() {
  const {t} = useTranslation();
  const [counts, setCounts] = useState<Counts>({});
  const [activeId, setActiveId] = useState<string>(PRESETS[0].id);
  const [hydrated, setHydrated] = useState(false);

  const active = PRESETS.find((p) => p.id === activeId) ?? PRESETS[0];
  const count = counts[active.id] ?? 0;
  const inCycle = count % active.target;
  const cycles = Math.floor(count / active.target);

  // Load persisted counts on mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCounts(JSON.parse(raw));
      } catch {
        // Ignore — start fresh.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist whenever counts change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(counts)).catch(() => {});
  }, [counts, hydrated]);

  const increment = useCallback(() => {
    setCounts((prev) => {
      const current = prev[active.id] ?? 0;
      const next = current + 1;
      // Vibrate at each completed cycle.
      if (next % active.target === 0) {
        Vibration.vibrate(120);
      } else {
        Vibration.vibrate(20);
      }
      return {...prev, [active.id]: next};
    });
  }, [active.id, active.target]);

  const reset = useCallback(async () => {
    const ok = await showConfirm({
      title: t('islamic.dhikrResetConfirmTitle'),
      message: t('islamic.dhikrResetConfirmBody'),
      confirmText: t('islamic.dhikrReset'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) {
      setCounts((prev) => ({...prev, [active.id]: 0}));
    }
  }, [active.id, t]);

  const justCompleted = count > 0 && inCycle === 0;
  const progress = active.target > 0 ? inCycle / active.target : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('islamic.dhikrTitle')} subtitle={t('islamic.dhikrSubtitle')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Preset chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {PRESETS.map((p) => {
            const selected = p.id === activeId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, selected && styles.chipActive]}
                activeOpacity={0.85}
                onPress={() => setActiveId(p.id)}>
                <Text
                  style={[styles.chipText, selected && styles.chipTextActive]}>
                  {t(p.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Big tappable counter */}
        <TouchableOpacity activeOpacity={0.9} onPress={increment}>
          <LinearGradient
            colors={[colors.primary[500], colors.primary[700]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.counter}>
            <Text style={styles.counterArabic}>{active.arabic}</Text>
            <Text style={styles.counterValue}>{inCycle}</Text>
            <Text style={styles.counterTarget}>/ {active.target}</Text>

            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, {width: `${progress * 100}%`}]}
              />
            </View>

            {justCompleted ? (
              <Text style={styles.cycleDone}>
                {t('islamic.dhikrCycleComplete')}
              </Text>
            ) : (
              <Text style={styles.tapHint}>{t('islamic.dhikrTapToCount')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>{t('islamic.dhikrCount')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{cycles}</Text>
            <Text style={styles.statLabel}>{t('islamic.dhikrCycles')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{active.target}</Text>
            <Text style={styles.statLabel}>{t('islamic.dhikrTarget')}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionSecondary]}
            activeOpacity={0.85}
            onPress={() => Vibration.vibrate(60)}>
            <Icon name="vibrate" size={20} color={colors.primary[600]} />
            <Text style={styles.actionSecondaryText}>
              {t('islamic.dhikrVibrate')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDanger]}
            activeOpacity={0.85}
            onPress={reset}>
            <Icon name="restart" size={20} color={colors.error} />
            <Text style={styles.actionDangerText}>
              {t('islamic.dhikrReset')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.default},
  header: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {...typography.h3, color: colors.text.primary, fontWeight: 'bold'},
  headerSubtitle: {...typography.caption, color: colors.text.secondary},
  scrollContent: {padding: spacing[4], paddingBottom: spacing[10]},
  chips: {gap: spacing[2], paddingBottom: spacing[4]},
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipActive: {backgroundColor: colors.primary[500], borderColor: colors.primary[500]},
  chipText: {...typography.label, color: colors.text.secondary},
  chipTextActive: {color: colors.white, fontWeight: '700'},
  counter: {
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    ...shadows.lg,
  },
  counterArabic: {fontSize: 24, color: 'rgba(255,255,255,0.95)', marginBottom: spacing[2]},
  counterValue: {fontSize: 96, fontWeight: 'bold', color: colors.white, lineHeight: 104},
  counterTarget: {...typography.h6, color: 'rgba(255,255,255,0.85)'},
  progressTrack: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: spacing[5],
    overflow: 'hidden',
  },
  progressFill: {height: '100%', backgroundColor: colors.gold[500], borderRadius: 3},
  tapHint: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[4],
  },
  cycleDone: {
    ...typography.label,
    color: colors.gold[300],
    fontWeight: '700',
    marginTop: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[4],
    marginTop: spacing[5],
    ...shadows.sm,
  },
  statBox: {flex: 1, alignItems: 'center', gap: spacing[1]},
  statDivider: {width: 1, height: 32, backgroundColor: colors.border.default},
  statValue: {...typography.h4, color: colors.text.primary, fontWeight: '700'},
  statLabel: {...typography.caption, color: colors.text.secondary},
  actionsRow: {flexDirection: 'row', gap: spacing[3], marginTop: spacing[5]},
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  actionSecondary: {borderColor: colors.primary[300], backgroundColor: colors.primary[50]},
  actionSecondaryText: {...typography.button, color: colors.primary[600]},
  actionDanger: {borderColor: colors.error + '55', backgroundColor: colors.error + '10'},
  actionDangerText: {...typography.button, color: colors.error},
});
