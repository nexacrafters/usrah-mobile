/**
 * Memorization (Hifz) Screen.
 * For students of knowledge & huffaz: track new memorization and revise on a
 * spaced schedule so nothing is forgotten. Shows what's due for revision today.
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import ScreenHeader from '../../components/ui/ScreenHeader';
import memorizationService, {
  Memorization,
  MemorizationType,
  RevisionQuality,
} from '../../services/api/memorization.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

const TYPES: Array<{id: MemorizationType; icon: string}> = [
  {id: 'quran', icon: '📖'},
  {id: 'matn', icon: '📜'},
  {id: 'hadith', icon: '🕌'},
  {id: 'dua', icon: '🤲'},
  {id: 'poem', icon: '✒️'},
  {id: 'other', icon: '⭐'},
];
const iconFor = (ty: MemorizationType) => TYPES.find((x) => x.id === ty)?.icon ?? '⭐';

const QUALITIES: Array<{q: RevisionQuality; color: string}> = [
  {q: 'again', color: colors.error},
  {q: 'hard', color: colors.gold[600]},
  {q: 'good', color: colors.islamic.mashallah},
  {q: 'easy', color: colors.primary[500]},
];

export default function MemorizationScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [items, setItems] = useState<Memorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState<MemorizationType>('quran');
  const [title, setTitle] = useState('');
  const [reference, setReference] = useState('');
  const [share, setShare] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await memorizationService.list());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const due = useMemo(() => items.filter((i) => i.is_due), [items]);
  const rest = useMemo(() => items.filter((i) => !i.is_due), [items]);

  const add = async () => {
    if (!title.trim() || adding) {
      return;
    }
    setAdding(true);
    try {
      await memorizationService.create({
        type,
        title: title.trim(),
        reference: reference.trim(),
        shareWithFamily: share,
      });
      setTitle('');
      setReference('');
      setShare(false);
      setShowForm(false);
      await load();
    } catch {
      // keep form
    } finally {
      setAdding(false);
    }
  };

  const revise = async (item: Memorization, quality: RevisionQuality) => {
    try {
      const updated = await memorizationService.revise(item.public_id, quality);
      setItems((prev) =>
        prev.map((i) => (i.public_id === item.public_id ? updated : i)),
      );
    } catch {
      load();
    }
  };

  const remove = async (item: Memorization) => {
    const ok = await showConfirm({
      title: t('hifz.deleteTitle'),
      message: t('hifz.deleteBody', {name: item.title}),
      confirmText: t('common.delete'),
      destructive: true,
    });
    if (!ok) {
      return;
    }
    setItems((prev) => prev.filter((i) => i.public_id !== item.public_id));
    try {
      await memorizationService.remove(item.public_id);
    } catch {
      load();
    }
  };

  const renderItem = (item: Memorization, isDue: boolean) => (
    <View key={item.public_id} style={[styles.card, isDue && styles.cardDue]}>
      <View style={styles.cardTop}>
        <Text style={styles.cardIcon}>{iconFor(item.type)}</Text>
        <View style={{flex: 1}}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {!!item.reference && <Text style={styles.cardRef}>{item.reference}</Text>}
          <Text style={styles.cardMeta}>
            {t('hifz.strength')}: {item.strength} ·{' '}
            {item.next_revision
              ? `${t('hifz.next')}: ${item.next_revision}`
              : t('hifz.notScheduled')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => remove(item)} hitSlop={8}>
          <Text style={styles.delete}>✕</Text>
        </TouchableOpacity>
      </View>
      {isDue && (
        <View style={styles.qualityRow}>
          {QUALITIES.map((qq) => (
            <TouchableOpacity
              key={qq.q}
              style={[styles.qualityBtn, {borderColor: qq.color}]}
              onPress={() => revise(item, qq.q)}>
              <Text style={[styles.qualityText, {color: qq.color}]}>
                {t(`hifz.quality.${qq.q}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={t('hifz.title')}
        right={
          <TouchableOpacity onPress={() => setShowForm((v) => !v)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{showForm ? '✕' : '+'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary[500]} />
        }>
        {showForm && (
          <View style={styles.form}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TYPES.map((ty) => (
                <TouchableOpacity
                  key={ty.id}
                  onPress={() => setType(ty.id)}
                  style={[styles.typeChip, type === ty.id && styles.typeChipOn]}>
                  <Text style={styles.typeIcon}>{ty.icon}</Text>
                  <Text style={[styles.typeText, type === ty.id && styles.typeTextOn]}>
                    {t(`hifz.types.${ty.id}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Input
              placeholder={t('hifz.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              containerStyle={styles.formInput}
            />
            <Input
              placeholder={t('hifz.refPlaceholder')}
              value={reference}
              onChangeText={setReference}
              containerStyle={styles.formInput}
            />
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
            <Button title={t('hifz.add')} onPress={add} loading={adding} fullWidth />
          </View>
        )}

        {loading && items.length === 0 ? (
          <ActivityIndicator style={{marginTop: spacing[8]}} color={colors.primary[500]} />
        ) : items.length === 0 ? (
          <IslamicEmptyState icon="📖" message={t('hifz.empty')} />
        ) : (
          <>
            {due.length > 0 && (
              <>
                <Text style={styles.section}>🔔 {t('hifz.dueToday')} ({due.length})</Text>
                {due.map((i) => renderItem(i, true))}
              </>
            )}
            {rest.length > 0 && (
              <>
                <Text style={styles.section}>{t('hifz.allItems')}</Text>
                {rest.map((i) => renderItem(i, false))}
              </>
            )}
          </>
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
  typeChip: {
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
  typeChipOn: {backgroundColor: colors.primary[50], borderColor: colors.primary[500]},
  typeIcon: {fontSize: 14},
  typeText: {...typography.caption, color: colors.text.secondary},
  typeTextOn: {color: colors.primary[700], fontWeight: '700'},
  shareRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
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
  section: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '700',
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing[3],
  },
  cardDue: {borderColor: colors.gold[500], backgroundColor: colors.gold[50]},
  cardTop: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3]},
  cardIcon: {fontSize: 24},
  cardTitle: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
  cardRef: {...typography.bodySmall, color: colors.text.secondary},
  cardMeta: {...typography.caption, color: colors.text.tertiary, marginTop: 2},
  delete: {fontSize: 16, color: colors.text.tertiary, paddingHorizontal: spacing[1]},
  qualityRow: {flexDirection: 'row', gap: spacing[2], marginTop: spacing[3]},
  qualityBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  qualityText: {...typography.caption, fontWeight: '700'},
  empty: {alignItems: 'center', marginTop: spacing[10]},
  emptyEmoji: {fontSize: 52, marginBottom: spacing[3]},
  emptyText: {...typography.body, color: colors.text.secondary, textAlign: 'center'},
});
