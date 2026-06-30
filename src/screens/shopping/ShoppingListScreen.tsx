/**
 * Shared Family Shopping List
 * The core collaboration screen: husband & wife both add items to one list,
 * either spouse checks them off at the store, and both see the live state.
 * Backed by the real /recipes/shopping-list API — no mock data.
 *
 * - Quick-add row (name + optional quantity) with optimistic insert.
 * - Unpurchased items first (tap the checkbox to mark purchased -> moves to a
 *   struck-through "Done" section), each row shows who added it.
 * - Swipe-free delete via a trash icon; "Clear purchased" when relevant.
 * - Loading / empty / error states, pull-to-refresh, and reload on focus so a
 *   spouse's additions appear when you return to the screen.
 */

import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  ListRenderItemInfo,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import ScreenHeader from '../../components/ui/ScreenHeader';
import shoppingService, {ShoppingItem} from '../../services/api/shopping.service';
import {getCurrentFamilyId, useAuthStore} from '../../store/authStore';
import {showAlert, showConfirm} from '../../store/dialogStore';

/** A temporary, not-yet-persisted optimistic row. */
const isOptimistic = (item: ShoppingItem) => item.public_id.startsWith('temp-');

/** Section markers so a single FlatList can render headers + rows. */
type Row =
  | {kind: 'header'; key: string; label: string; count: number}
  | {kind: 'item'; key: string; item: ShoppingItem};

export default function ShoppingListScreen() {
  const {t} = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const hasFamily = !!getCurrentFamilyId();

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [adding, setAdding] = useState(false);
  // Ids currently mid-flight on a purchase toggle (to disable double taps).
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState(false);

  const tempCounter = useRef(0);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      if (!getCurrentFamilyId()) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (mode === 'initial') {
        setLoading(true);
      }
      if (mode === 'refresh') {
        setRefreshing(true);
      }
      try {
        const data = await shoppingService.listItems();
        setItems(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('shopping.loadError'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  // Reload whenever the screen regains focus so a spouse's additions appear.
  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load]),
  );

  const handleAdd = useCallback(async () => {
    const name = nameInput.trim();
    const quantity = qtyInput.trim();
    if (!name || adding) {
      return;
    }

    tempCounter.current += 1;
    const tempId = `temp-${tempCounter.current}`;
    const optimistic: ShoppingItem = {
      public_id: tempId,
      name,
      quantity,
      is_purchased: false,
      added_by: currentUser
        ? {
            public_id: currentUser.public_id,
            full_name: currentUser.full_name,
            avatar: currentUser.avatar,
            gender: currentUser.gender,
          }
        : null,
      purchased_by: null,
      purchased_at: null,
      notes: '',
      from_recipe: null,
      created: new Date().toISOString(),
    };

    setItems((prev) => [optimistic, ...prev]);
    setNameInput('');
    setQtyInput('');
    setAdding(true);
    Keyboard.dismiss();

    try {
      const created = await shoppingService.addItem({name, quantity});
      // Swap the optimistic row for the server item.
      setItems((prev) => prev.map((it) => (it.public_id === tempId ? created : it)));
    } catch (e) {
      // Roll back the optimistic insert and surface the error.
      setItems((prev) => prev.filter((it) => it.public_id !== tempId));
      void showAlert({
        title: t('shopping.addFailedTitle'),
        message: e instanceof Error ? e.message : t('shopping.addError'),
      });
    } finally {
      setAdding(false);
    }
  }, [nameInput, qtyInput, adding, currentUser, t]);

  const handleToggle = useCallback(
    async (item: ShoppingItem) => {
      if (isOptimistic(item) || pendingIds.has(item.public_id)) {
        return;
      }
      const id = item.public_id;
      const wasPurchased = item.is_purchased;

      // Optimistic flip.
      setItems((prev) =>
        prev.map((it) =>
          it.public_id === id ? {...it, is_purchased: !wasPurchased} : it,
        ),
      );
      setPendingIds((prev) => new Set(prev).add(id));

      try {
        const updated = await shoppingService.togglePurchased(id, wasPurchased);
        setItems((prev) => prev.map((it) => (it.public_id === id ? updated : it)));
      } catch (e) {
        // Revert on failure.
        setItems((prev) =>
          prev.map((it) =>
            it.public_id === id ? {...it, is_purchased: wasPurchased} : it,
          ),
        );
        void showAlert({
          title: t('shopping.error'),
          message: e instanceof Error ? e.message : t('shopping.toggleError'),
        });
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [pendingIds, t],
  );

  const handleDelete = useCallback(
    async (item: ShoppingItem) => {
      if (isOptimistic(item)) {
        return;
      }
      const remove = async () => {
        const id = item.public_id;
        const snapshot = items;
        setItems((prev) => prev.filter((it) => it.public_id !== id));
        try {
          await shoppingService.deleteItem(id);
        } catch (e) {
          // Restore on failure.
          setItems(snapshot);
          void showAlert({
            title: t('shopping.error'),
            message: e instanceof Error ? e.message : t('shopping.deleteError'),
          });
        }
      };

      const ok = await showConfirm({
        title: t('shopping.deleteTitle'),
        message: t('shopping.deleteConfirm', {name: item.name}),
        confirmText: t('common.delete'),
        cancelText: t('common.cancel'),
        destructive: true,
      });
      if (ok) {
        remove();
      }
    },
    [items, t],
  );

  const handleClearPurchased = useCallback(async () => {
    const clear = async () => {
      const snapshot = items;
      setClearing(true);
      setItems((prev) => prev.filter((it) => !it.is_purchased));
      try {
        await shoppingService.clearPurchased();
      } catch (e) {
        setItems(snapshot);
        void showAlert({
          title: t('shopping.error'),
          message: e instanceof Error ? e.message : t('shopping.clearError'),
        });
      } finally {
        setClearing(false);
      }
    };

    const ok = await showConfirm({
      title: t('shopping.clearTitle'),
      message: t('shopping.clearConfirm'),
      confirmText: t('shopping.clearPurchased'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) {
      clear();
    }
  }, [items, t]);

  // Split into pending / done, newest first within each group.
  const {pending, purchased} = useMemo(() => {
    const p: ShoppingItem[] = [];
    const d: ShoppingItem[] = [];
    items.forEach((it) => (it.is_purchased ? d.push(it) : p.push(it)));
    return {pending: p, purchased: d};
  }, [items]);

  // Build a flat row list with section headers for the FlatList.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    out.push({
      kind: 'header',
      key: 'h-pending',
      label: t('shopping.toBuy'),
      count: pending.length,
    });
    pending.forEach((item) => out.push({kind: 'item', key: item.public_id, item}));
    if (purchased.length > 0) {
      out.push({
        kind: 'header',
        key: 'h-done',
        label: t('shopping.done'),
        count: purchased.length,
      });
      purchased.forEach((item) =>
        out.push({kind: 'item', key: item.public_id, item}),
      );
    }
    return out;
  }, [pending, purchased, t]);

  const addedByLabel = useCallback(
    (item: ShoppingItem): string | null => {
      const name = item.added_by?.full_name;
      if (!name) {
        return null;
      }
      if (item.added_by?.public_id === currentUser?.public_id) {
        return t('shopping.addedByYou');
      }
      return t('shopping.addedBy', {name});
    },
    [currentUser, t],
  );

  const renderItem = useCallback(
    (item: ShoppingItem) => {
      const done = item.is_purchased;
      const pendingToggle = pendingIds.has(item.public_id);
      const optimistic = isOptimistic(item);
      const hint = addedByLabel(item);
      const purchasedHint =
        done && item.purchased_by?.full_name
          ? item.purchased_by.public_id === currentUser?.public_id
            ? t('shopping.gotByYou')
            : t('shopping.gotBy', {name: item.purchased_by.full_name})
          : null;

      return (
        <View style={[styles.itemCard, done && styles.itemCardDone]}>
          <TouchableOpacity
            style={styles.checkbox}
            activeOpacity={0.7}
            disabled={optimistic || pendingToggle}
            onPress={() => handleToggle(item)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            {pendingToggle ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Icon
                name={done ? 'check-circle' : 'checkbox-blank-circle-outline'}
                size={26}
                color={done ? colors.primary[500] : colors.slate[300]}
              />
            )}
          </TouchableOpacity>

          <View style={styles.itemBody}>
            <View style={styles.itemTitleRow}>
              <Text
                style={[styles.itemName, done && styles.itemNameDone]}
                numberOfLines={2}>
                {item.name}
              </Text>
              {!!item.quantity && (
                <View style={[styles.qtyBadge, done && styles.qtyBadgeDone]}>
                  <Text style={[styles.qtyText, done && styles.qtyTextDone]}>
                    {item.quantity}
                  </Text>
                </View>
              )}
            </View>

            {!!item.from_recipe && !!item.recipe_title && (
              <View style={styles.recipeHintRow}>
                <Icon
                  name="silverware-fork-knife"
                  size={11}
                  color={colors.gold[600]}
                />
                <Text style={styles.recipeHintText} numberOfLines={1}>
                  {item.recipe_title}
                </Text>
              </View>
            )}

            {(purchasedHint || hint) && (
              <Text style={styles.metaText} numberOfLines={1}>
                {purchasedHint || hint}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.7}
            disabled={optimistic}
            onPress={() => handleDelete(item)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon
              name="trash-can-outline"
              size={20}
              color={optimistic ? colors.slate[300] : colors.slate[400]}
            />
          </TouchableOpacity>
        </View>
      );
    },
    [
      pendingIds,
      addedByLabel,
      currentUser,
      handleToggle,
      handleDelete,
      t,
    ],
  );

  const renderRow = useCallback(
    ({item: row}: ListRenderItemInfo<Row>) => {
      if (row.kind === 'header') {
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{row.label}</Text>
            <Text style={styles.sectionCount}>{row.count}</Text>
          </View>
        );
      }
      return renderItem(row.item);
    },
    [renderItem],
  );

  // --- Quick-add row (always visible above the list) ------------------------
  const renderAddRow = () => (
    <View style={styles.addRow}>
      <View style={styles.nameInputWrap}>
        <Icon name="cart-plus" size={20} color={colors.primary[500]} />
        <TextInput
          style={styles.nameInput}
          value={nameInput}
          onChangeText={setNameInput}
          placeholder={t('shopping.addPlaceholder')}
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          editable={hasFamily}
        />
      </View>
      <TextInput
        style={styles.qtyInput}
        value={qtyInput}
        onChangeText={setQtyInput}
        placeholder={t('shopping.qtyPlaceholder')}
        placeholderTextColor={colors.text.tertiary}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
        editable={hasFamily}
      />
      <TouchableOpacity
        style={[
          styles.addButton,
          (!nameInput.trim() || adding) && styles.addButtonDisabled,
        ]}
        activeOpacity={0.85}
        disabled={!nameInput.trim() || adding}
        onPress={handleAdd}>
        {adding ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Icon name="plus" size={24} color={colors.white} />
        )}
      </TouchableOpacity>
    </View>
  );

  // --- Body states ----------------------------------------------------------
  let body: React.ReactNode;

  if (!hasFamily) {
    body = (
      <View style={styles.centered}>
        <View style={styles.emptyIconCircle}>
          <Icon name="home-heart" size={40} color={colors.primary[500]} />
        </View>
        <Text style={styles.emptyTitle}>{t('shopping.noFamilyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('shopping.noFamilyBody')}</Text>
      </View>
    );
  } else if (loading && items.length === 0) {
    body = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  } else if (error && items.length === 0) {
    body = (
      <View style={styles.centered}>
        <View style={styles.emptyIconCircle}>
          <Icon name="alert-circle-outline" size={40} color={colors.error} />
        </View>
        <Text style={styles.emptyTitle}>{t('shopping.couldntLoad')}</Text>
        <Text style={styles.emptyBody}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.85}
          onPress={() => load('initial')}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (items.length === 0) {
    body = (
      <View style={styles.centered}>
        <View style={styles.emptyIconCircle}>
          <Icon name="cart-outline" size={40} color={colors.primary[400]} />
        </View>
        <Text style={styles.emptyTitle}>{t('shopping.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('shopping.emptyBody')}</Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
        ListFooterComponent={
          purchased.length > 0 ? (
            <TouchableOpacity
              style={styles.clearButton}
              activeOpacity={0.85}
              disabled={clearing}
              onPress={handleClearPurchased}>
              {clearing ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Icon name="broom" size={18} color={colors.error} />
                  <Text style={styles.clearButtonText}>
                    {t('shopping.clearPurchased')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <ScreenHeader title={t('shopping.title')} subtitle={t('shopping.subtitle')} />

      {hasFamily && renderAddRow()}

      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  // Quick-add row
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  nameInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[3],
    height: 46,
  },
  nameInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  qtyInput: {
    width: 64,
    height: 46,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[2],
    textAlign: 'center',
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  addButtonDisabled: {
    backgroundColor: colors.slate[300],
  },

  // List
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[24],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    ...typography.caption,
    color: colors.white,
    backgroundColor: colors.slate[400],
    minWidth: 20,
    textAlign: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 1,
    overflow: 'hidden',
    fontWeight: '700',
  },

  // Item card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  itemCardDone: {
    backgroundColor: colors.background.default,
    borderColor: colors.border.light,
  },
  checkbox: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  itemBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  itemName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    flexShrink: 1,
  },
  itemNameDone: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  qtyBadge: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  qtyBadgeDone: {
    backgroundColor: colors.slate[100],
  },
  qtyText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '600',
  },
  qtyTextDone: {
    color: colors.text.tertiary,
  },
  recipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  recipeHintText: {
    ...typography.caption,
    color: colors.gold[700],
    fontWeight: '600',
    flexShrink: 1,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[1],
  },

  // Clear purchased
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
    backgroundColor: '#fef2f2',
  },
  clearButtonText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },

  // Centered states
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    ...typography.h5,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: spacing[5],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
});
