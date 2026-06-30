/**
 * Muḥāsabah — the believer's nightly self-account. Rate the day, check the acts
 * of worship kept, and note a good deed, a sin avoided, and gratitude. "Hold
 * yourselves to account before you are held to account."
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {showAlert} from '../../store/dialogStore';
import ScreenHeader from '../../components/ui/ScreenHeader';
import muhasabaService, {Reflection} from '../../services/api/muhasaba.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
};

const CHECKS: Array<{key: keyof Reflection; icon: string}> = [
  {key: 'prayed_all_fard', icon: '🕌'},
  {key: 'read_quran', icon: '📖'},
  {key: 'did_adhkar', icon: '📿'},
  {key: 'gave_sadaqah', icon: '🤲'},
];

export default function MuhasabaScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [r, setR] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setR(await muhasabaService.get(todayIso()));
    } catch {
      setR(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch: Partial<Reflection>) => setR((prev) => (prev ? {...prev, ...patch} : prev));

  const save = async () => {
    if (!r || saving) {
      return;
    }
    setSaving(true);
    try {
      await muhasabaService.save(r);
      void showAlert({title: t('muhasaba.savedTitle', {defaultValue: 'Saved'}), message: t('muhasaba.savedBody', {defaultValue: 'May Allah accept and increase you.'})});
    } catch (e) {
      void showAlert({title: t('common.error'), message: e instanceof Error ? e.message : ''});
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={t('muhasaba.title', {defaultValue: 'Muḥāsabah'})} />

      {loading || !r ? (
        <ActivityIndicator style={{marginTop: spacing[10]}} color={colors.primary[500]} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>{t('muhasaba.intro', {defaultValue: 'Hold yourself to account before you are held to account.'})}</Text>

          {/* Rating */}
          <Text style={styles.section}>{t('muhasaba.rateDay', {defaultValue: 'How was your day?'})}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => set({rating: n})}>
                <Text style={[styles.star, n <= r.rating && styles.starOn]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Worship checks */}
          <Text style={styles.section}>{t('muhasaba.worship', {defaultValue: "Today's worship"})}</Text>
          <View style={styles.card}>
            {CHECKS.map((c, i) => {
              const on = !!r[c.key];
              return (
                <TouchableOpacity
                  key={c.key as string}
                  style={[styles.checkRow, i > 0 && styles.rowBorder]}
                  onPress={() => set({[c.key]: !on} as Partial<Reflection>)}>
                  <Text style={styles.checkIcon}>{c.icon}</Text>
                  <Text style={styles.checkLabel}>{t(`muhasaba.${c.key}`)}</Text>
                  <View style={[styles.box, on && styles.boxOn]}>
                    {on && <Text style={styles.boxTick}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Reflections */}
          <Text style={styles.section}>{t('muhasaba.reflect', {defaultValue: 'Reflect'})}</Text>
          <Input placeholder={t('muhasaba.goodDeed', {defaultValue: 'A good deed I did…'})} value={r.good_deed} onChangeText={(v) => set({good_deed: v})} containerStyle={styles.field} />
          <Input placeholder={t('muhasaba.avoidedSin', {defaultValue: 'A sin I avoided…'})} value={r.avoided_sin} onChangeText={(v) => set({avoided_sin: v})} containerStyle={styles.field} />
          <Input placeholder={t('muhasaba.gratitude', {defaultValue: 'Grateful for…'})} value={r.gratitude} onChangeText={(v) => set({gratitude: v})} containerStyle={styles.field} />
          <Input placeholder={t('muhasaba.notes', {defaultValue: 'Notes…'})} value={r.notes} onChangeText={(v) => set({notes: v})} multiline numberOfLines={3} containerStyle={styles.field} />

          <Button title={t('muhasaba.save', {defaultValue: 'Save'})} onPress={save} loading={saving} fullWidth size="large" style={{marginTop: spacing[4]}} />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backIcon: {fontSize: 24, color: colors.text.primary, width: 24},
  headerTitle: {...typography.h4, color: colors.text.primary, fontWeight: '700'},
  content: {padding: spacing[4], paddingBottom: spacing[10]},
  intro: {...typography.bodySmall, color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic', marginBottom: spacing[4]},
  section: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700', marginTop: spacing[4], marginBottom: spacing[2]},
  stars: {flexDirection: 'row', justifyContent: 'center', gap: spacing[2]},
  star: {fontSize: 40, color: colors.border.default},
  starOn: {color: colors.gold[500]},
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3]},
  rowBorder: {borderTopWidth: 1, borderTopColor: colors.border.light},
  checkIcon: {fontSize: 20},
  checkLabel: {...typography.bodyMedium, color: colors.text.primary, flex: 1},
  box: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {backgroundColor: colors.islamic.mashallah, borderColor: colors.islamic.mashallah},
  boxTick: {color: colors.white, fontWeight: '800'},
  field: {marginBottom: spacing[3]},
});
