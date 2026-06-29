/**
 * Add Transaction Screen
 * Clean form to record an income or expense against the active family.
 *
 * Works both as a standalone navigation screen and as an embedded sheet
 * (pass `onClose` / `onCreated` — e.g. from ExpensesScreen's modal). It posts
 * to the real API via expenseService.createTransaction and, on success, pushes
 * the new row into the zustand store before dismissing.
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DateField from '../../components/ui/DateField';
import {colors, spacing, typography, borderRadius, shadows} from '../../theme';
import expenseService, {
  CreateCategoryRequest,
} from '../../services/api/expense.service';
import recurringService from '../../services/api/recurring.service';
import receiptService from '../../services/api/receipt.service';
import {syncNow} from '../../sync/syncEngine';
import {
  useExpenseStore,
  TransactionType,
  Category,
} from '../../store/expenseStore';
import {getCurrentFamilyId} from '../../store/authStore';

/**
 * Map a free-text API icon name (e.g. "home", "car", "food") to a
 * MaterialCommunityIcons glyph. Falls back to a neutral tag icon.
 */
const ICON_ALIASES: Record<string, string> = {
  home: 'home',
  house: 'home',
  rent: 'home-city',
  mortgage: 'home-city',
  car: 'car',
  transport: 'car',
  fuel: 'gas-station',
  gas: 'gas-station',
  food: 'silverware-fork-knife',
  dining: 'silverware-fork-knife',
  restaurant: 'silverware-fork-knife',
  groceries: 'cart',
  grocery: 'cart',
  shopping: 'shopping',
  cart: 'cart',
  bills: 'file-document',
  bill: 'file-document',
  utilities: 'flash',
  electricity: 'flash',
  water: 'water',
  phone: 'cellphone',
  internet: 'wifi',
  health: 'hospital-box',
  healthcare: 'hospital-box',
  medical: 'hospital-box',
  medicine: 'pill',
  education: 'school',
  school: 'school',
  books: 'book-open-variant',
  salary: 'cash',
  income: 'cash-plus',
  wage: 'cash',
  gift: 'gift',
  charity: 'hand-heart',
  sadaqah: 'hand-heart',
  zakat: 'hand-coin',
  travel: 'airplane',
  entertainment: 'movie-open',
  clothing: 'tshirt-crew',
  clothes: 'tshirt-crew',
  savings: 'piggy-bank',
  investment: 'chart-line',
  tag: 'tag',
  other: 'dots-horizontal',
};

const resolveCategoryIcon = (icon?: string | null): string => {
  if (!icon) return 'tag';
  const key = icon.toLowerCase().trim();
  return ICON_ALIASES[key] ?? icon;
};

/** Colours cycled through when creating a category without an explicit colour. */
const CATEGORY_PALETTE = [
  colors.primary[500],
  colors.gold[600],
  colors.skyBlue[500],
  colors.islamic.barakallah,
  colors.islamic.mashallah,
  colors.error,
  colors.islamic.haha,
];

interface AddExpenseScreenProps {
  /** When embedded as a sheet, called to dismiss. Falls back to navigation.goBack(). */
  onClose?: () => void;
  /** Called after a transaction is successfully created. */
  onCreated?: () => void;
}

const DEFAULT_CURRENCY = 'TND';

/** Format a Date as YYYY-MM-DD (the API's date format). */
const toIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function AddExpenseScreen({
  onClose,
  onCreated,
}: AddExpenseScreenProps = {}) {
  const {t, i18n} = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const navigation = useNavigation();

  const categories = useExpenseStore((s) => s.categories);
  const setCategories = useExpenseStore((s) => s.setCategories);
  const addCategory = useExpenseStore((s) => s.addCategory);
  const addTransaction = useExpenseStore((s) => s.addTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // The chosen top-level category whose subcategories are currently shown.
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [receipt, setReceipt] = useState<Asset | null>(null);

  // Inline category creation
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const dismiss = () => {
    if (onClose) {
      onClose();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Load categories if the store is empty (e.g. opened directly).
  useEffect(() => {
    if (categories.length > 0) return;
    let active = true;
    expenseService
      .listCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch(() => {
        /* non-fatal — user can still create one */
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Categories relevant to the selected transaction type.
  const visibleCategories = useMemo(
    () =>
      categories.filter((c) => c.type === type || c.type === 'both'),
    [categories, type],
  );

  // Top-level categories (no parent) are the primary chips.
  const topCategories = useMemo(
    () => visibleCategories.filter((c) => !c.parent),
    [visibleCategories],
  );

  // Subcategories of the currently-selected parent (a second chip row).
  const subCategories = useMemo(
    () =>
      selectedParent
        ? visibleCategories.filter((c) => c.parent === selectedParent)
        : [],
    [visibleCategories, selectedParent],
  );

  /** Does this top-level category have any subcategories to drill into? */
  const hasChildren = (id: string) =>
    visibleCategories.some((c) => c.parent === id);

  /** Tap a top-level chip: select it (default the expense to it) + reveal subs. */
  const handleSelectParent = (id: string) => {
    if (selectedParent === id || selectedCategory === id) {
      // Toggle the whole category off.
      setSelectedParent(null);
      setSelectedCategory(null);
      return;
    }
    setSelectedParent(id);
    setSelectedCategory(id);
  };

  /** Tap a subcategory chip: refine the selection (or revert to the parent). */
  const handleSelectSub = (id: string) => {
    setSelectedCategory((prev) => (prev === id ? selectedParent : id));
  };

  const amountValue = parseFloat(amount.replace(',', '.'));
  const amountValid = Number.isFinite(amountValue) && amountValue > 0;
  const canSubmit = amountValid && !!date && !submitting;

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setSavingCategory(true);
    setError(null);
    try {
      const payload: CreateCategoryRequest = {
        name,
        type,
        icon: 'tag',
        color: CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length],
      };
      const created = await expenseService.createCategory(payload);
      addCategory(created);
      setSelectedParent(null);
      setSelectedCategory(created.public_id);
      setNewCategoryName('');
      setCreatingCategory(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('expenses.couldNotCreateCategory'),
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const res = await launchCamera({
        mediaType: 'photo',
        quality: 0.7,
        saveToPhotos: false,
      });
      if (res.assets?.[0]?.uri) setReceipt(res.assets[0]);
    } catch {
      /* user cancelled / camera unavailable — non-fatal */
    }
  };

  const handleChoosePhoto = async () => {
    try {
      const res = await launchImageLibrary({mediaType: 'photo', quality: 0.7});
      if (res.assets?.[0]?.uri) setReceipt(res.assets[0]);
    } catch {
      /* user cancelled — non-fatal */
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!amountValid) {
      setError(t('expenses.enterAmountError'));
      return;
    }
    if (!date) {
      setError(t('expenses.chooseDateError'));
      return;
    }
    if (!getCurrentFamilyId()) {
      setError(t('expenses.selectFamilyError'));
      return;
    }

    setSubmitting(true);
    try {
      if (recurring) {
        // A recurring rule auto-records every month; the server owns the
        // generated transactions, so we don't push one into the store here.
        await recurringService.createRecurring({
          type,
          amount: amountValue,
          frequency: 'monthly',
          start_date: date,
          category_id: selectedCategory ?? undefined,
          description: description.trim() || undefined,
        });
        onCreated?.();
        dismiss();
        return;
      }
      const created = await expenseService.createTransaction({
        type,
        amount: amountValue,
        currency: DEFAULT_CURRENCY,
        category_id: selectedCategory ?? undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        date,
        is_private: isPrivate,
      });
      addTransaction(created);
      // Best-effort receipt upload: push the new transaction to the server
      // first (so its public_id exists remotely), then attach the photo. A
      // failure here must NOT block saving the expense.
      if (receipt?.uri) {
        try {
          await syncNow();
          await receiptService.uploadReceipt(created.public_id, {
            uri: receipt.uri,
            fileName: receipt.fileName,
            type: receipt.type,
          });
        } catch {
          /* receipt is optional — ignore upload failures */
        }
      }
      onCreated?.();
      dismiss();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('expenses.couldNotSaveTransaction'),
      );
      setSubmitting(false);
    }
  };

  const accent = type === 'income' ? colors.primary[500] : colors.gold[600];
  const accentDark = type === 'income' ? colors.primary[700] : colors.gold[700];

  const renderCategoryChip = (
    category: Category,
    selected: boolean,
    onPress: () => void,
    showChevron = false,
  ) => {
    const color = category.color || colors.primary[500];
    return (
      <TouchableOpacity
        key={category.public_id}
        activeOpacity={0.8}
        style={[
          styles.categoryChip,
          selected && {backgroundColor: color + '1A', borderColor: color},
        ]}
        onPress={onPress}>
        <View
          style={[styles.categoryChipIcon, {backgroundColor: color + '22'}]}>
          <Icon
            name={resolveCategoryIcon(category.icon)}
            size={16}
            color={color}
          />
        </View>
        <Text
          style={[
            styles.categoryChipText,
            selected && {color, fontWeight: '600'},
          ]}
          numberOfLines={1}>
          {isArabic && category.name_ar ? category.name_ar : category.name}
        </Text>
        {showChevron && (
          <Icon
            name="chevron-down"
            size={14}
            color={selected ? color : colors.text.tertiary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismiss}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icon name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t('expenses.addTransaction')}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Income / Expense toggle */}
            <View style={styles.typeToggle}>
              {(['expense', 'income'] as const).map((option) => {
                const active = type === option;
                return (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.85}
                    style={[
                      styles.typeButton,
                      active && {
                        backgroundColor:
                          option === 'income'
                            ? colors.primary[500]
                            : colors.gold[600],
                      },
                    ]}
                    onPress={() => {
                      setType(option);
                      setSelectedCategory(null);
                      setSelectedParent(null);
                    }}>
                    <Icon
                      name={
                        option === 'income'
                          ? 'arrow-down-circle'
                          : 'arrow-up-circle'
                      }
                      size={18}
                      color={active ? colors.white : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        active && styles.typeButtonTextActive,
                      ]}>
                      {option === 'income'
                        ? t('expenses.income')
                        : t('expenses.title')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount hero */}
            <LinearGradient
              colors={[accent, accentDark]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.amountCard}>
              <Text style={styles.amountLabel}>
                {type === 'income'
                  ? t('expenses.incomeAmount')
                  : t('expenses.expenseAmount')}
              </Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>{DEFAULT_CURRENCY}</Text>
                <Input
                  placeholder="0.000"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  containerStyle={styles.amountInputContainer}
                  inputContainerStyle={styles.amountFieldBox}
                  style={styles.amountField}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />
              </View>
            </LinearGradient>

            {/* Personal (private) money toggle — kept near the top so it's not
                buried; flips this whole transaction to the member's private stash. */}
            <TouchableOpacity
              style={[
                styles.recurringRow,
                isPrivate && {
                  backgroundColor: accent + '14',
                  borderColor: accent,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => setIsPrivate((v) => !v)}>
              <View
                style={[styles.recurringIcon, {backgroundColor: accent + '22'}]}>
                <Icon name="lock" size={18} color={accent} />
              </View>
              <View style={styles.recurringTextWrap}>
                <Text style={styles.recurringTitle}>
                  {t('expenses.privateMoney', {defaultValue: 'Personal money'})}
                </Text>
                <Text style={styles.recurringHint}>
                  {t('expenses.privateMoneyHint', {
                    defaultValue: 'Only you can see this — hidden from the family',
                  })}
                </Text>
              </View>
              <View
                style={[
                  styles.recurringCheck,
                  isPrivate
                    ? {backgroundColor: accent, borderColor: accent}
                    : {borderColor: colors.border.dark},
                ]}>
                {isPrivate && <Icon name="check" size={16} color={colors.white} />}
              </View>
            </TouchableOpacity>

            {/* Category picker */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>
                  {t('expenses.category')} ({t('common.optional', {defaultValue: 'optional'})})
                </Text>
                <TouchableOpacity
                  onPress={() => setCreatingCategory((v) => !v)}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={styles.addCategoryLink}>
                    {creatingCategory
                      ? t('common.cancel')
                      : t('expenses.newCategory')}
                  </Text>
                </TouchableOpacity>
              </View>

              {creatingCategory && (
                <View style={styles.newCategoryRow}>
                  <Input
                    placeholder={t('expenses.categoryName')}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    containerStyle={styles.newCategoryInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[
                      styles.newCategorySave,
                      (!newCategoryName.trim() || savingCategory) &&
                        styles.disabled,
                    ]}
                    disabled={!newCategoryName.trim() || savingCategory}
                    onPress={handleCreateCategory}>
                    {savingCategory ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Icon name="check" size={20} color={colors.white} />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {topCategories.length === 0 && !creatingCategory ? (
                <Text style={styles.emptyCategories}>
                  {t('expenses.noCategoriesYet')}
                </Text>
              ) : (
                <View style={styles.categoriesGrid}>
                  {topCategories.map((c) =>
                    renderCategoryChip(
                      c,
                      selectedParent === c.public_id ||
                        (!selectedParent && selectedCategory === c.public_id),
                      () => handleSelectParent(c.public_id),
                      hasChildren(c.public_id),
                    ),
                  )}
                </View>
              )}

              {/* Subcategory drill-down (e.g. Car -> Fuel / Vidange / Parts). */}
              {subCategories.length > 0 && (
                <View style={styles.subcategoryBlock}>
                  <Text style={styles.subcategoryLabel}>
                    {t('expenses.subcategory', {defaultValue: 'Subcategory'})}
                  </Text>
                  <View style={styles.categoriesGrid}>
                    {subCategories.map((c) =>
                      renderCategoryChip(
                        c,
                        selectedCategory === c.public_id,
                        () => handleSelectSub(c.public_id),
                      ),
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('expenses.description')}
              </Text>
              <Input
                placeholder={
                  type === 'income'
                    ? t('expenses.incomeDescPlaceholder')
                    : t('expenses.expenseDescPlaceholder')
                }
                value={description}
                onChangeText={setDescription}
                containerStyle={styles.fieldContainer}
              />
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('expenses.date')}</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <DateField
                    mode="date"
                    value={date}
                    onChange={setDate}
                  />
                </View>
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={() => setDate(toIsoDate(new Date()))}>
                  <Text style={styles.todayButtonText}>
                    {t('expenses.today')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('expenses.notesOptional')}
              </Text>
              <Input
                placeholder={t('expenses.notesPlaceholder')}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                containerStyle={styles.fieldContainer}
                style={styles.notesField}
              />
            </View>

            {/* Receipt photo */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {t('expenses.receipt', {defaultValue: 'Receipt'})}
              </Text>
              {receipt?.uri ? (
                <View style={styles.receiptThumbWrap}>
                  <Image
                    source={{uri: receipt.uri}}
                    style={styles.receiptThumb}
                  />
                  <TouchableOpacity
                    style={styles.receiptRemove}
                    onPress={() => setReceipt(null)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Icon name="close" size={14} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.receiptButtonsRow}>
                  <TouchableOpacity
                    style={styles.receiptButton}
                    activeOpacity={0.8}
                    onPress={handleTakePhoto}>
                    <Icon
                      name="camera"
                      size={18}
                      color={colors.primary[600]}
                    />
                    <Text style={styles.receiptButtonText}>
                      {t('expenses.takePhoto', {defaultValue: 'Take photo'})}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.receiptButton}
                    activeOpacity={0.8}
                    onPress={handleChoosePhoto}>
                    <Icon
                      name="image"
                      size={18}
                      color={colors.primary[600]}
                    />
                    <Text style={styles.receiptButtonText}>
                      {t('expenses.choosePhoto', {defaultValue: 'Choose photo'})}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Repeats monthly toggle */}
            <TouchableOpacity
              style={[
                styles.recurringRow,
                recurring && {
                  backgroundColor: accent + '14',
                  borderColor: accent,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => setRecurring((v) => !v)}>
              <View
                style={[
                  styles.recurringIcon,
                  {backgroundColor: accent + '22'},
                ]}>
                <Icon name="repeat" size={18} color={accent} />
              </View>
              <View style={styles.recurringTextWrap}>
                <Text style={styles.recurringTitle}>
                  {t('expenses.repeatsMonthly', {
                    defaultValue: 'Repeats monthly',
                  })}
                </Text>
                <Text style={styles.recurringHint}>
                  {t('expenses.repeatsHint', {
                    defaultValue: 'Auto-recorded every month',
                  })}
                </Text>
              </View>
              <View
                style={[
                  styles.recurringCheck,
                  recurring
                    ? {backgroundColor: accent, borderColor: accent}
                    : {borderColor: colors.border.dark},
                ]}>
                {recurring && (
                  <Icon name="check" size={16} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title={
                type === 'income'
                  ? t('expenses.addIncome')
                  : t('expenses.addExpenseBtn')
              }
              onPress={handleSubmit}
              variant={type === 'income' ? 'primary' : 'gold'}
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
  root: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
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
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[5],
    paddingBottom: spacing[12],
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing[5],
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  typeButtonText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  amountCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginBottom: spacing[6],
    ...shadows.md,
  },
  amountLabel: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing[2],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    ...typography.h3,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    marginRight: spacing[3],
  },
  amountInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  // Transparent box so the big white amount sits directly on the gradient
  // (no white-on-white input chrome).
  amountFieldBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  amountField: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
    paddingVertical: spacing[1],
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  addCategoryLink: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '600',
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  newCategoryInput: {
    flex: 1,
    marginBottom: 0,
  },
  newCategorySave: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCategories: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  subcategoryBlock: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  subcategoryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    gap: spacing[2],
  },
  categoryChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    maxWidth: 110,
  },
  fieldContainer: {
    marginBottom: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  todayButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  todayButtonText: {
    ...typography.bodySmall,
    color: colors.primary[700],
    fontWeight: '600',
  },
  notesField: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  receiptButtonsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  receiptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.background.paper,
  },
  receiptButtonText: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '600',
  },
  receiptThumbWrap: {
    width: 80,
    height: 80,
  },
  receiptThumb: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.paper,
  },
  receiptRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.background.paper,
    marginBottom: spacing[5],
  },
  recurringIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringTextWrap: {
    flex: 1,
  },
  recurringTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  recurringHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  recurringCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },
  saveButton: {
    marginTop: spacing[2],
  },
  disabled: {
    opacity: 0.5,
  },
});
