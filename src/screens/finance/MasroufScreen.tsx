/**
 * Masrouf Screen — the husband sets a monthly allowance for his wife (or any
 * member). The base amount auto-credits her private stash each month; "give
 * extra" tops it up instantly. Personal/private money she spends freely.
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
import Avatar from '../../components/ui/Avatar';
import {showConfirm, showAlert} from '../../store/dialogStore';
import {useFamilyStore, FamilyMember} from '../../store/familyStore';
import IslamicEmptyState from '../../components/ui/IslamicEmptyState';
import ScreenHeader from '../../components/ui/ScreenHeader';
import {getCurrentFamilyId} from '../../store/authStore';
import masroufService, {Masrouf} from '../../services/api/masrouf.service';
import familyService from '../../services/api/family.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

export default function MasroufScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {members, setMembers} = useFamilyStore();

  const [items, setItems] = useState<Masrouf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [recipient, setRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [extraFor, setExtraFor] = useState<string | null>(null);
  const [extraAmount, setExtraAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await masroufService.list());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const familyId = getCurrentFamilyId();
    if (familyId && members.length === 0) {
      familyService.getMembers(familyId).then(setMembers).catch(() => {});
    }
  }, [load, members.length, setMembers]);

  const save = async () => {
    if (!recipient || !amount.trim() || saving) {
      return;
    }
    setSaving(true);
    try {
      await masroufService.create({
        recipient_id: recipient,
        amount: parseFloat(amount) || 0,
        note: note.trim(),
      });
      setRecipient(null);
      setAmount('');
      setNote('');
      setShowForm(false);
      await load();
    } catch (e) {
      void showAlert({title: t('common.error'), message: e instanceof Error ? e.message : ''});
    } finally {
      setSaving(false);
    }
  };

  const sendExtra = async (item: Masrouf) => {
    const amt = parseFloat(extraAmount);
    if (!amt || amt <= 0) {
      return;
    }
    try {
      await masroufService.giveExtra(item.public_id, amt);
      setExtraFor(null);
      setExtraAmount('');
      void showAlert({
        title: t('masrouf.sentTitle'),
        message: t('masrouf.sentBody', {amount: amt, name: item.recipient_name}),
      });
    } catch (e) {
      void showAlert({title: t('common.error'), message: e instanceof Error ? e.message : ''});
    }
  };

  const stop = async (item: Masrouf) => {
    const ok = await showConfirm({
      title: t('masrouf.stopTitle'),
      message: t('masrouf.stopBody', {name: item.recipient_name}),
      confirmText: t('masrouf.stop'),
      destructive: true,
    });
    if (!ok) {
      return;
    }
    setItems((prev) => prev.filter((i) => i.public_id !== item.public_id));
    try {
      await masroufService.remove(item.public_id);
    } catch {
      load();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={t('masrouf.title')}
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
        <Text style={styles.intro}>{t('masrouf.intro')}</Text>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formLabel}>{t('masrouf.recipient')}</Text>
            <View style={styles.membersRow}>
              {members.map((m: FamilyMember) => {
                const sel = recipient === m.user.public_id;
                return (
                  <TouchableOpacity
                    key={m.public_id}
                    style={[styles.memberChip, sel && styles.memberChipOn]}
                    onPress={() => setRecipient(sel ? null : m.user.public_id)}>
                    <Avatar name={m.user.full_name} size="small" />
                    <Text style={[styles.memberName, sel && styles.memberNameOn]} numberOfLines={1}>
                      {m.user.full_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Input
              placeholder={t('masrouf.amountPlaceholder')}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              containerStyle={styles.formInput}
            />
            <Input
              placeholder={t('masrouf.notePlaceholder')}
              value={note}
              onChangeText={setNote}
              containerStyle={styles.formInput}
            />
            <Button title={t('masrouf.set')} onPress={save} loading={saving} fullWidth />
          </View>
        )}

        {loading && items.length === 0 ? (
          <ActivityIndicator style={{marginTop: spacing[8]}} color={colors.primary[500]} />
        ) : items.length === 0 ? (
          <IslamicEmptyState icon="💝" message={t('masrouf.empty')} />
        ) : (
          items.map((item) => (
            <View key={item.public_id} style={styles.card}>
              <View style={styles.cardTop}>
                <Avatar name={item.recipient_name} size="medium" />
                <View style={{flex: 1, marginLeft: spacing[3]}}>
                  <Text style={styles.cardName}>{item.recipient_name}</Text>
                  <Text style={styles.cardAmount}>
                    {item.amount} {item.currency} · {t('masrouf.perMonth')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => stop(item)} hitSlop={8}>
                  <Text style={styles.delete}>✕</Text>
                </TouchableOpacity>
              </View>
              {extraFor === item.public_id ? (
                <View style={styles.extraRow}>
                  <Input
                    placeholder={t('masrouf.extraPlaceholder')}
                    value={extraAmount}
                    onChangeText={setExtraAmount}
                    keyboardType="decimal-pad"
                    containerStyle={styles.extraInput}
                  />
                  <Button title={t('masrouf.send')} onPress={() => sendExtra(item)} size="medium" />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.extraBtn}
                  onPress={() => {
                    setExtraFor(item.public_id);
                    setExtraAmount('');
                  }}>
                  <Text style={styles.extraBtnText}>＋ {t('masrouf.giveExtra')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
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
  intro: {...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing[4]},
  form: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing[3],
  },
  formLabel: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '600'},
  formInput: {marginBottom: 0},
  membersRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2]},
  memberChip: {
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    minWidth: 76,
  },
  memberChipOn: {borderColor: colors.primary[500], backgroundColor: colors.primary[50]},
  memberName: {...typography.caption, color: colors.text.secondary, marginTop: 4, maxWidth: 70},
  memberNameOn: {color: colors.primary[700], fontWeight: '700'},
  empty: {alignItems: 'center', marginTop: spacing[10]},
  emptyEmoji: {fontSize: 52, marginBottom: spacing[3]},
  emptyText: {...typography.body, color: colors.text.secondary, textAlign: 'center'},
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing[3],
  },
  cardTop: {flexDirection: 'row', alignItems: 'center'},
  cardName: {...typography.bodyMedium, color: colors.text.primary, fontWeight: '700'},
  cardAmount: {...typography.bodySmall, color: colors.primary[600]},
  delete: {fontSize: 16, color: colors.text.tertiary, paddingHorizontal: spacing[1]},
  extraBtn: {marginTop: spacing[3], alignSelf: 'flex-start'},
  extraBtnText: {...typography.bodySmall, color: colors.primary[600], fontWeight: '700'},
  extraRow: {flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[3]},
  extraInput: {marginBottom: 0, flex: 1},
});
