/**
 * Pantry / Kitchen Supplies Screen
 * The shared household inventory — note down everything in the kitchen with
 * quantities, mark items "running low", and keep the family on the same page.
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
import pantryService, {
  PantryItem,
  PantryCategory,
} from '../../services/api/pantry.service';
import {colors, spacing, typography, borderRadius} from '../../theme';

const CATEGORIES: Array<{id: PantryCategory; icon: string}> = [
  {id: 'produce', icon: '🥬'},
  {id: 'dairy', icon: '🥛'},
  {id: 'meat', icon: '🍗'},
  {id: 'grains', icon: '🌾'},
  {id: 'spices', icon: '🧂'},
  {id: 'canned', icon: '🥫'},
  {id: 'frozen', icon: '🧊'},
  {id: 'bakery', icon: '🍞'},
  {id: 'beverages', icon: '🧃'},
  {id: 'cleaning', icon: '🧼'},
  {id: 'other', icon: '📦'},
];

const catIcon = (c: PantryCategory) =>
  CATEGORIES.find((x) => x.id === c)?.icon ?? '📦';

export default function PantryScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showLowOnly, setShowLowOnly] = useState(false);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState<PantryCategory>('other');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await pantryService.list());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (showLowOnly ? items.filter((i) => i.is_low) : items),
    [items, showLowOnly],
  );

  const grouped = useMemo(() => {
    const map = new Map<PantryCategory, PantryItem[]>();
    visible.forEach((i) => {
      const list = map.get(i.category) ?? [];
      list.push(i);
      map.set(i.category, list);
    });
    return Array.from(map.entries());
  }, [visible]);

  const handleAdd = async () => {
    if (!name.trim() || adding) {
      return;
    }
    setAdding(true);
    try {
      const created = await pantryService.create({
        name: name.trim(),
        quantity: quantity.trim(),
        category,
      });
      setItems((prev) => [created, ...prev]);
      setName('');
      setQuantity('');
    } catch {
      // keep the form values so the user can retry
    } finally {
      setAdding(false);
    }
  };

  const toggleLow = async (item: PantryItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.public_id === item.public_id ? {...i, is_low: !i.is_low} : i,
      ),
    );
    try {
      await pantryService.update(item.public_id, {is_low: !item.is_low});
    } catch {
      load();
    }
  };

  const handleDelete = async (item: PantryItem) => {
    const ok = await showConfirm({
      title: t('pantry.deleteTitle'),
      message: t('pantry.deleteBody', {name: item.name}),
      confirmText: t('common.delete'),
      destructive: true,
    });
    if (!ok) {
      return;
    }
    setItems((prev) => prev.filter((i) => i.public_id !== item.public_id));
    try {
      await pantryService.remove(item.public_id);
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
        <Text style={styles.headerTitle}>{t('pantry.title')}</Text>
        <TouchableOpacity
          onPress={() => setShowLowOnly((v) => !v)}
          style={[styles.lowFilter, showLowOnly && styles.lowFilterOn]}>
          <Text style={[styles.lowFilterText, showLowOnly && styles.lowFilterTextOn]}>
            {t('pantry.lowOnly')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary[500]} />
        }>
        {/* Add form */}
        <View style={styles.addCard}>
          <Input
            placeholder={t('pantry.namePlaceholder')}
            value={name}
            onChangeText={setName}
            containerStyle={styles.addInput}
          />
          <Input
            placeholder={t('pantry.qtyPlaceholder')}
            value={quantity}
            onChangeText={setQuantity}
            containerStyle={styles.addInput}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCategory(c.id)}
                style={[styles.catChip, category === c.id && styles.catChipOn]}>
                <Text style={styles.catChipIcon}>{c.icon}</Text>
                <Text
                  style={[styles.catChipText, category === c.id && styles.catChipTextOn]}>
                  {t(`pantry.categories.${c.id}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button
            title={t('pantry.add')}
            onPress={handleAdd}
            loading={adding}
            fullWidth
            size="medium"
          />
        </View>

        {loading && items.length === 0 ? (
          <ActivityIndicator style={{marginTop: spacing[8]}} color={colors.primary[500]} />
        ) : visible.length === 0 ? (
          <IslamicEmptyState icon="🧺" message={t('pantry.empty')} />
        ) : (
          grouped.map(([cat, list]) => (
            <View key={cat} style={styles.group}>
              <Text style={styles.groupTitle}>
                {catIcon(cat)} {t(`pantry.categories.${cat}`)}
              </Text>
              {list.map((item) => (
                <View key={item.public_id} style={styles.item}>
                  <TouchableOpacity
                    style={styles.lowDot}
                    onPress={() => toggleLow(item)}>
                    <View
                      style={[styles.dot, item.is_low && styles.dotLow]}
                    />
                  </TouchableOpacity>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {!!item.quantity && (
                      <Text style={styles.itemQty}>{item.quantity}</Text>
                    )}
                  </View>
                  {item.is_low && (
                    <Text style={styles.lowBadge}>{t('pantry.low')}</Text>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                    <Text style={styles.delete}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
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
    gap: spacing[2],
  },
  back: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  backIcon: {fontSize: 24, color: colors.text.primary},
  headerTitle: {...typography.h4, color: colors.text.primary, flex: 1, fontWeight: '700'},
  lowFilter: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  lowFilterOn: {backgroundColor: colors.error + '18', borderColor: colors.error},
  lowFilterText: {...typography.caption, color: colors.text.secondary},
  lowFilterTextOn: {color: colors.error, fontWeight: '700'},
  content: {padding: spacing[4], paddingBottom: spacing[10]},
  addCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing[3],
  },
  addInput: {marginBottom: 0},
  catScroll: {flexDirection: 'row'},
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
  catChipIcon: {fontSize: 14},
  catChipText: {...typography.caption, color: colors.text.secondary},
  catChipTextOn: {color: colors.primary[700], fontWeight: '700'},
  group: {marginBottom: spacing[5]},
  groupTitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '700',
    marginBottom: spacing[2],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing[2],
  },
  lowDot: {padding: 2},
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.islamic.mashallah,
  },
  dotLow: {backgroundColor: colors.error, borderColor: colors.error},
  itemInfo: {flex: 1},
  itemName: {...typography.bodyMedium, color: colors.text.primary},
  itemQty: {...typography.caption, color: colors.text.tertiary},
  lowBadge: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
  },
  delete: {fontSize: 16, color: colors.text.tertiary, paddingHorizontal: spacing[1]},
  empty: {alignItems: 'center', marginTop: spacing[10]},
  emptyEmoji: {fontSize: 52, marginBottom: spacing[3]},
  emptyText: {...typography.body, color: colors.text.secondary},
});
