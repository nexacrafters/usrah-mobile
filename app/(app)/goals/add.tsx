/**
 * Add Goal Screen - Premium UI
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Target, Calendar, DollarSign, BookOpen, Heart, Plane, Home, Car, AlertCircle, ChevronLeft, ChevronRight, Sparkles, Check } from 'lucide-react-native';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { useCreateGoal } from '../../../hooks/queries/useGoals';
import type { GoalCategory } from '../../../services/api/goals';

const categories: Array<{ id: GoalCategory; label: string; labelAr: string; icon: any; color: string; gradient: [string, string] }> = [
  { id: 'hajj', label: 'Hajj', labelAr: 'الحج', icon: Plane, color: Colors.gold[500], gradient: [Colors.gold[400], Colors.gold[600]] },
  { id: 'umrah', label: 'Umrah', labelAr: 'العمرة', icon: Plane, color: Colors.primary[500], gradient: [Colors.primary[400], Colors.primary[600]] },
  { id: 'education', label: 'Education', labelAr: 'تعليم', icon: BookOpen, color: Colors.sisters[500], gradient: [Colors.sisters[400], Colors.sisters[600]] },
  { id: 'home', label: 'Home', labelAr: 'منزل', icon: Home, color: '#f59e0b', gradient: ['#fbbf24', '#d97706'] },
  { id: 'car', label: 'Car', labelAr: 'سيارة', icon: Car, color: '#3b82f6', gradient: ['#60a5fa', '#2563eb'] },
  { id: 'emergency', label: 'Emergency', labelAr: 'طوارئ', icon: AlertCircle, color: Colors.error, gradient: ['#f87171', '#dc2626'] },
  { id: 'wedding', label: 'Wedding', labelAr: 'زفاف', icon: Heart, color: '#ec4899', gradient: ['#f472b6', '#db2777'] },
  { id: 'charity', label: 'Charity', labelAr: 'صدقة', icon: Heart, color: Colors.success, gradient: ['#4ade80', '#16a34a'] },
  { id: 'other', label: 'Other', labelAr: 'أخرى', icon: Target, color: Colors.slate[500], gradient: ['#94a3b8', '#475569'] },
];

export default function AddGoalScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const { family } = useAuthStore();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('hajj');
  const [targetValue, setTargetValue] = useState('');
  const [currency, setCurrency] = useState('TND');
  const [deadline, setDeadline] = useState('');

  const createGoalMutation = useCreateGoal();

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'يرجى إدخال عنوان الهدف' : 'Please enter goal title');
      return;
    }

    if (!targetValue || isNaN(Number(targetValue))) {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'يرجى إدخال المبلغ المستهدف' : 'Please enter target amount');
      return;
    }

    if (!family?.id) {
      Alert.alert(rtl ? 'خطأ' : 'Error', rtl ? 'لم يتم العثور على العائلة' : 'Family not found');
      return;
    }

    try {
      await createGoalMutation.mutateAsync({
        family_id: family.id,
        title: title.trim(),
        description: description.trim() || undefined,
        target_amount: Number(targetValue),
        currency,
        category,
        deadline: deadline || undefined,
      });

      Alert.alert(
        rtl ? 'نجاح' : 'Success',
        rtl ? 'تم إضافة الهدف بنجاح' : 'Goal added successfully',
        [{ text: rtl ? 'حسناً' : 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        error.message || (rtl ? 'فشل في إضافة الهدف' : 'Failed to add goal')
      );
    }
  };

  const selectedCat = categories.find(c => c.id === category);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Premium Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={selectedCat?.gradient || [Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />

          <View style={[styles.headerContent, rtl && styles.rowReverse]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <BackIcon size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={[styles.headerCenter, rtl && styles.alignEnd]}>
              <View style={[styles.headerTitleRow, rtl && styles.rowReverse]}>
                <Target size={24} color={Colors.gold[300]} />
                <Text style={[styles.headerTitle, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'هدف جديد' : 'New Goal'}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { fontFamily: getFont('regular') }]}>
                {rtl ? 'حدد هدفك المالي وابدأ التوفير' : 'Set your financial goal and start saving'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSave}
              disabled={createGoalMutation.isPending}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                style={styles.saveButton}
              >
                {createGoalMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Check size={22} color={Colors.white} strokeWidth={3} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Goal Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.primary[100] }]}>
              <Target size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'عنوان الهدف' : 'Goal Title'} *
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={title}
            onChangeText={setTitle}
            placeholder={rtl ? 'مثال: التوفير للحج' : 'e.g., Save for Hajj'}
            placeholderTextColor={theme.placeholder}
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.gold[100] }]}>
              <Sparkles size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'الوصف' : 'Description'}
            </Text>
          </View>
          <TextInput
            style={[styles.textArea, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={description}
            onChangeText={setDescription}
            placeholder={rtl ? 'وصف الهدف...' : 'Describe your goal...'}
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inputGroup}>
          <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {rtl ? 'الفئة' : 'Category'}
          </Text>
          <View style={[styles.categoryGrid, rtl && styles.rowReverse]}>
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <Animated.View
                  key={cat.id}
                  entering={ZoomIn.delay(250 + index * 30).duration(300)}
                >
                  <TouchableOpacity onPress={() => setCategory(cat.id)}>
                    {isSelected ? (
                      <LinearGradient
                        colors={cat.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.categoryButtonSelected}
                      >
                        <Icon size={20} color={Colors.white} />
                        <Text style={[styles.categoryText, { color: Colors.white, fontFamily: getFont('bold') }]}>
                          {rtl ? cat.labelAr : cat.label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.categoryButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <Icon size={20} color={cat.color} />
                        <Text style={[styles.categoryText, { color: theme.text, fontFamily: getFont('medium') }]}>
                          {rtl ? cat.labelAr : cat.label}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Target Amount */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.success + '20' }]}>
              <DollarSign size={18} color={Colors.success} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'المبلغ المستهدف' : 'Target Amount'} *
            </Text>
          </View>
          <View style={[styles.targetRow, rtl && styles.rowReverse]}>
            <TextInput
              style={[styles.targetInput, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('bold') }]}
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder="10,000"
              placeholderTextColor={theme.placeholder}
              keyboardType="number-pad"
              textAlign="center"
            />
            <View style={[styles.currencySelector, { backgroundColor: theme.card, borderColor: theme.cardBorder }, rtl && styles.rowReverse]}>
              {['TND', 'SAR', 'USD'].map((cur) => (
                <TouchableOpacity
                  key={cur}
                  onPress={() => setCurrency(cur)}
                >
                  {currency === cur ? (
                    <LinearGradient
                      colors={[Colors.primary[500], Colors.primary[600]]}
                      style={styles.currencyOptionActive}
                    >
                      <Text style={[styles.currencyText, { color: Colors.white, fontFamily: getFont('bold') }]}>
                        {cur}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.currencyOption}>
                      <Text style={[styles.currencyText, { color: theme.textSecondary, fontFamily: getFont('medium') }]}>
                        {cur}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Deadline */}
        <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.sisters[100] }]}>
              <Calendar size={18} color={Colors.sisters[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
              {rtl ? 'الموعد النهائي' : 'Deadline'}
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={deadline}
            onChangeText={setDeadline}
            placeholder={rtl ? 'YYYY-MM-DD مثال: 2025-12-31' : 'e.g., 2025-12-31'}
            placeholderTextColor={theme.placeholder}
          />
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createGoalMutation.isPending}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={selectedCat?.gradient || [Colors.primary[500], Colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveButtonLarge, createGoalMutation.isPending && { opacity: 0.7 }]}
            >
              {createGoalMutation.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Target size={22} color={Colors.white} />
                  <Text style={[styles.saveButtonText, { fontFamily: getFont('bold') }]}>
                    {rtl ? 'إنشاء الهدف' : 'Create Goal'}
                  </Text>
                  <Sparkles size={20} color={Colors.white} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 140,
    height: 140,
    top: -40,
    right: -20,
  },
  decorCircle2: {
    width: 90,
    height: 90,
    bottom: -20,
    left: -20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 24 },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 15 },
  sectionLabel: { fontSize: 16, marginBottom: 14 },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    lineHeight: 24,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  categoryButtonSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 10,
  },
  categoryText: { fontSize: 14 },

  // Target Row
  targetRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 24,
  },
  currencySelector: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  currencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  currencyOptionActive: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  currencyText: { fontSize: 14 },

  // Save Button Large
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 20,
    gap: 12,
    marginTop: 16,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 18,
    color: Colors.white,
  },
});
