/**
 * Add Transaction Screen - Premium UI
 * Beautiful form for adding income/expense transactions
 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Repeat,
  ChevronLeft,
  Check,
  ShoppingCart,
  Car,
  Zap,
  Heart,
  GraduationCap,
  Briefcase,
  Home,
  Utensils,
  Gift,
  Stethoscope,
  Smartphone,
  Plane,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useAuthStore } from '../../../store';
import { useThemeStore } from '../../../store/themeStore';
import {
  useCreateTransaction,
  useCategories,
} from '../../../hooks/queries/useExpenses';
import { useFamilyMembers } from '../../../hooks/queries/useFamilies';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import type { TransactionType } from '../../../types/models';

const { width } = Dimensions.get('window');

// Category configurations with icons
const categoryConfig: Record<string, { icon: any; gradient: string[] }> = {
  food: { icon: Utensils, gradient: ['#f59e0b', '#d97706'] },
  groceries: { icon: ShoppingCart, gradient: ['#10b981', '#059669'] },
  transport: { icon: Car, gradient: ['#3b82f6', '#2563eb'] },
  utilities: { icon: Zap, gradient: ['#8b5cf6', '#7c3aed'] },
  health: { icon: Stethoscope, gradient: ['#ef4444', '#dc2626'] },
  education: { icon: GraduationCap, gradient: ['#06b6d4', '#0891b2'] },
  work: { icon: Briefcase, gradient: ['#64748b', '#475569'] },
  housing: { icon: Home, gradient: ['#f97316', '#ea580c'] },
  charity: { icon: Heart, gradient: ['#ec4899', '#db2777'] },
  shopping: { icon: Gift, gradient: ['#a855f7', '#9333ea'] },
  entertainment: { icon: Smartphone, gradient: ['#14b8a6', '#0d9488'] },
  travel: { icon: Plane, gradient: ['#0ea5e9', '#0284c7'] },
  other: { icon: Sparkles, gradient: ['#64748b', '#475569'] },
};

// Default categories
const defaultCategories = [
  { id: 'food', name: 'Food', name_ar: 'طعام', color: '#f59e0b', type: 'expense' },
  { id: 'transport', name: 'Transport', name_ar: 'مواصلات', color: '#3b82f6', type: 'expense' },
  { id: 'utilities', name: 'Utilities', name_ar: 'خدمات', color: '#8b5cf6', type: 'expense' },
  { id: 'health', name: 'Health', name_ar: 'صحة', color: '#ef4444', type: 'expense' },
  { id: 'education', name: 'Education', name_ar: 'تعليم', color: '#06b6d4', type: 'expense' },
  { id: 'shopping', name: 'Shopping', name_ar: 'تسوق', color: '#a855f7', type: 'expense' },
  { id: 'charity', name: 'Charity', name_ar: 'صدقة', color: '#ec4899', type: 'expense' },
  { id: 'other', name: 'Other', name_ar: 'أخرى', color: '#64748b', type: 'expense' },
];

const incomeCategories = [
  { id: 'salary', name: 'Salary', name_ar: 'راتب', color: '#10b981', type: 'income' },
  { id: 'business', name: 'Business', name_ar: 'عمل', color: '#3b82f6', type: 'income' },
  { id: 'investment', name: 'Investment', name_ar: 'استثمار', color: '#f59e0b', type: 'income' },
  { id: 'gift', name: 'Gift', name_ar: 'هدية', color: '#ec4899', type: 'income' },
  { id: 'other', name: 'Other', name_ar: 'أخرى', color: '#64748b', type: 'income' },
];

export default function AddExpenseScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();

  const { selectedFamily, user } = useAuthStore();
  const familyId = selectedFamily?.id || '';

  // Form state
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // API calls
  const { data: apiCategories, isLoading: categoriesLoading } = useCategories(familyId);
  const { data: members, isLoading: membersLoading } = useFamilyMembers(familyId);
  const createTransaction = useCreateTransaction();

  // Use API categories or defaults
  const categories = useMemo(() => {
    if (transactionType === 'income') return incomeCategories;
    if (apiCategories && apiCategories.length > 0) {
      return apiCategories.filter((c) => c.type === 'expense');
    }
    return defaultCategories;
  }, [apiCategories, transactionType]);

  // Family members for "Paid By"
  const familyMembers = useMemo(() => {
    if (members && members.length > 0) {
      return members.map((m) => ({
        id: m.user.id,
        name: m.user.full_name || m.nickname,
        name_ar: m.user.full_name || m.nickname,
      }));
    }
    return [{ id: user?.id || '1', name: user?.fullName || 'Me', name_ar: 'أنا' }];
  }, [members, user]);

  const handleSave = () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount'
      );
      return;
    }

    if (!categoryId) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'يرجى اختيار فئة' : 'Please select a category'
      );
      return;
    }

    createTransaction.mutate(
      {
        family_id: familyId,
        type: transactionType,
        amount: amountNum,
        category_id: categoryId,
        description: description.trim() || undefined,
        date: date.toISOString().split('T')[0],
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            rtl ? 'تم بنجاح' : 'Success',
            rtl
              ? `تم إضافة ${transactionType === 'income' ? 'الدخل' : 'المصروف'} بنجاح`
              : `${transactionType === 'income' ? 'Income' : 'Expense'} added successfully`,
            [{ text: rtl ? 'حسناً' : 'OK', onPress: () => router.back() }]
          );
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            (rtl ? 'فشل الحفظ' : 'Failed to save');
          Alert.alert(rtl ? 'خطأ' : 'Error', message);
        },
      }
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const getCatConfig = (catId: string) => {
    return categoryConfig[catId] || categoryConfig.other;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <TouchableOpacity
          style={[styles.saveButton, createTransaction.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={createTransaction.isPending}
        >
          {createTransaction.isPending ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <LinearGradient
              colors={transactionType === 'income' ? ['#10b981', '#059669'] : [Colors.primary[500], Colors.primary[600]]}
              style={styles.saveButtonGradient}
            >
              <Check size={20} color={Colors.white} strokeWidth={2.5} />
            </LinearGradient>
          )}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl
            ? transactionType === 'income' ? 'إضافة دخل' : 'إضافة مصروف'
            : transactionType === 'income' ? 'Add Income' : 'Add Expense'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Transaction Type Toggle */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <View style={[styles.typeToggle, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={[styles.typeButton, transactionType === 'expense' && styles.typeButtonActive]}
                onPress={() => {
                  setTransactionType('expense');
                  setCategoryId('');
                }}
              >
                {transactionType === 'expense' ? (
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.typeButtonGradient}
                  >
                    <ArrowDownCircle size={22} color={Colors.white} />
                    <Text style={[styles.typeButtonTextActive, { fontFamily: getFont('bold') }]}>
                      {rtl ? 'مصروف' : 'Expense'}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.typeButtonInner}>
                    <ArrowDownCircle size={22} color={theme.textSecondary} />
                    <Text style={[styles.typeButtonText, { color: theme.textSecondary, fontFamily: getFont('semibold') }]}>
                      {rtl ? 'مصروف' : 'Expense'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, transactionType === 'income' && styles.typeButtonActive]}
                onPress={() => {
                  setTransactionType('income');
                  setCategoryId('');
                }}
              >
                {transactionType === 'income' ? (
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.typeButtonGradient}
                  >
                    <ArrowUpCircle size={22} color={Colors.white} />
                    <Text style={[styles.typeButtonTextActive, { fontFamily: getFont('bold') }]}>
                      {rtl ? 'دخل' : 'Income'}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.typeButtonInner}>
                    <ArrowUpCircle size={22} color={theme.textSecondary} />
                    <Text style={[styles.typeButtonText, { color: theme.textSecondary, fontFamily: getFont('semibold') }]}>
                      {rtl ? 'دخل' : 'Income'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Amount Input */}
          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: getFont('medium'), textAlign: getTextAlign() }]}>
                {rtl ? 'المبلغ' : 'Amount'}
              </Text>
              <View style={styles.amountRow}>
                <Text style={[styles.currencyLabel, { color: transactionType === 'income' ? Colors.success : Colors.primary[500], fontFamily: getFont('bold') }]}>
                  {rtl ? 'د.ت' : 'TND'}
                </Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.text, fontFamily: getFont('bold') }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="decimal-pad"
                  editable={!createTransaction.isPending}
                  textAlign="center"
                />
              </View>
            </View>
          </Animated.View>

          {/* Category Selection */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                {rtl ? 'الفئة' : 'Category'}
              </Text>
              {categoriesLoading ? (
                <ActivityIndicator color={Colors.primary[500]} />
              ) : (
                <View style={styles.categoryGrid}>
                  {categories.map((cat, index) => {
                    const config = getCatConfig(cat.id);
                    const Icon = config.icon;
                    const isSelected = categoryId === cat.id;

                    return (
                      <Animated.View
                        key={cat.id}
                        entering={ZoomIn.duration(300).delay(250 + index * 30)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.categoryItem,
                            { backgroundColor: isSelected ? `${cat.color}15` : theme.inputBackground, borderColor: isSelected ? cat.color : theme.inputBorder },
                          ]}
                          onPress={() => setCategoryId(cat.id)}
                          disabled={createTransaction.isPending}
                        >
                          <LinearGradient
                            colors={isSelected ? config.gradient : [theme.inputBackground, theme.inputBackground]}
                            style={styles.categoryIcon}
                          >
                            <Icon size={20} color={isSelected ? Colors.white : theme.textSecondary} />
                          </LinearGradient>
                          <Text
                            style={[
                              styles.categoryLabel,
                              { color: isSelected ? cat.color : theme.textSecondary, fontFamily: getFont(isSelected ? 'semibold' : 'medium') },
                            ]}
                            numberOfLines={1}
                          >
                            {rtl ? (cat as any).name_ar || cat.name : cat.name}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </View>
          </Animated.View>

          {/* Description Input */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)}>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                {rtl ? 'الوصف (اختياري)' : 'Description (Optional)'}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }, rtl && styles.rowReverse]}>
                <FileText size={20} color={theme.placeholder} />
                <TextInput
                  style={[styles.textInput, { color: theme.text, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={rtl ? 'أدخل وصف المعاملة...' : 'Enter description...'}
                  placeholderTextColor={theme.placeholder}
                  writingDirection={getWritingDirection()}
                  editable={!createTransaction.isPending}
                />
              </View>
            </View>
          </Animated.View>

          {/* Date Selection */}
          <Animated.View entering={FadeInUp.duration(400).delay(350)}>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                {rtl ? 'التاريخ' : 'Date'}
              </Text>
              <TouchableOpacity
                style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }, rtl && styles.rowReverse]}
                onPress={() => setShowDatePicker(true)}
                disabled={createTransaction.isPending}
              >
                <Calendar size={20} color={Colors.primary[500]} />
                <Text style={[styles.dateText, { color: theme.text, fontFamily: getFont('medium') }]}>
                  {date.toLocaleDateString(rtl ? 'ar' : 'en', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Recurring Toggle */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)}>
            <View style={styles.section}>
              <TouchableOpacity
                style={[
                  styles.recurringCard,
                  { backgroundColor: theme.inputBackground, borderColor: isRecurring ? Colors.primary[500] : theme.inputBorder },
                  rtl && styles.rowReverse,
                ]}
                onPress={() => setIsRecurring(!isRecurring)}
                disabled={createTransaction.isPending}
              >
                <View style={[styles.recurringIcon, { backgroundColor: isRecurring ? Colors.primary[100] : theme.card }]}>
                  <Repeat size={20} color={isRecurring ? Colors.primary[500] : theme.textSecondary} />
                </View>
                <View style={[styles.recurringTextBox, rtl && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.recurringTitle, { color: theme.text, fontFamily: getFont('semibold'), textAlign: getTextAlign() }]}>
                    {rtl ? 'معاملة متكررة' : 'Recurring Transaction'}
                  </Text>
                  <Text style={[styles.recurringDesc, { color: theme.textSecondary, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}>
                    {rtl ? 'سيتم إضافتها تلقائياً' : 'Will be added automatically'}
                  </Text>
                </View>
                <View style={[styles.checkbox, { borderColor: isRecurring ? Colors.primary[500] : theme.inputBorder, backgroundColor: isRecurring ? Colors.primary[500] : 'transparent' }]}>
                  {isRecurring && <Check size={14} color={Colors.white} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Recurrence Pattern */}
          {isRecurring && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
                  {rtl ? 'نمط التكرار' : 'Recurrence Pattern'}
                </Text>
                <View style={[styles.patternRow, rtl && styles.rowReverse]}>
                  {(['daily', 'weekly', 'monthly'] as const).map((pattern) => (
                    <TouchableOpacity
                      key={pattern}
                      style={[
                        styles.patternButton,
                        { backgroundColor: recurrencePattern === pattern ? Colors.primary[100] : theme.inputBackground, borderColor: recurrencePattern === pattern ? Colors.primary[500] : theme.inputBorder },
                      ]}
                      onPress={() => setRecurrencePattern(pattern)}
                      disabled={createTransaction.isPending}
                    >
                      <Text
                        style={[
                          styles.patternText,
                          { color: recurrencePattern === pattern ? Colors.primary[600] : theme.textSecondary, fontFamily: getFont(recurrencePattern === pattern ? 'bold' : 'medium') },
                        ]}
                      >
                        {rtl
                          ? pattern === 'daily' ? 'يومي' : pattern === 'weekly' ? 'أسبوعي' : 'شهري'
                          : pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(450)}>
            <TouchableOpacity
              style={[styles.submitButton, createTransaction.isPending && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={createTransaction.isPending}
            >
              <LinearGradient
                colors={transactionType === 'income' ? ['#10b981', '#059669'] : [Colors.primary[500], Colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {createTransaction.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    {transactionType === 'income' ? (
                      <ArrowUpCircle size={22} color={Colors.white} />
                    ) : (
                      <ArrowDownCircle size={22} color={Colors.white} />
                    )}
                    <Text style={[styles.submitText, { fontFamily: getFont('bold') }]}>
                      {rtl
                        ? transactionType === 'income' ? 'إضافة الدخل' : 'إضافة المصروف'
                        : transactionType === 'income' ? 'Add Income' : 'Add Expense'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18 },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  rowReverse: { flexDirection: 'row-reverse' },

  // Type Toggle
  typeToggle: {
    flexDirection: 'row-reverse',
    borderRadius: 20,
    padding: 6,
    marginBottom: 24,
    borderWidth: 1,
  },
  typeButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  typeButtonActive: {},
  typeButtonGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  typeButtonInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  typeButtonText: {
    fontSize: 16,
  },
  typeButtonTextActive: {
    fontSize: 16,
    color: Colors.white,
  },

  // Amount Card
  amountCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currencyLabel: {
    fontSize: 20,
  },
  amountInput: {
    fontSize: 52,
    minWidth: 150,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    marginBottom: 12,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 13,
  },

  // Input Wrapper
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },

  // Recurring Card
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 14,
  },
  recurringIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringTextBox: {
    flex: 1,
  },
  recurringTitle: {
    fontSize: 15,
    marginBottom: 3,
  },
  recurringDesc: {
    fontSize: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pattern Row
  patternRow: {
    flexDirection: 'row',
    gap: 10,
  },
  patternButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  patternText: {
    fontSize: 14,
  },

  // Submit Button
  submitButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 4,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitText: {
    fontSize: 18,
    color: Colors.white,
  },
});
