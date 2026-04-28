/**
 * Add Task Screen - Premium Design
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
import {
  Calendar,
  Clock,
  User,
  Flag,
  FileText,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Zap,
  Target,
  Sparkles,
  Check,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, LightTheme, DarkTheme } from '../../../constants/colors';
import { getFont, getTextAlign, isRTL as checkRTL, getWritingDirection } from '../../../utils/fonts';
import { useAuthStore } from '../../../store';
import { useThemeStore } from '../../../store/themeStore';
import { useCreateTask } from '../../../hooks/queries/useTasks';
import { useFamilyMembers } from '../../../hooks/queries/useFamilies';
import type { TaskPriority } from '../../../types/models';

const priorities = [
  { id: 'urgent' as TaskPriority, label: 'Urgent', labelAr: 'عاجل', color: Colors.error, gradient: ['#dc2626', '#b91c1c'] },
  { id: 'high' as TaskPriority, label: 'High', labelAr: 'عالية', color: Colors.warning, gradient: ['#f59e0b', '#d97706'] },
  { id: 'normal' as TaskPriority, label: 'Normal', labelAr: 'عادية', color: Colors.primary[500], gradient: [Colors.primary[500], Colors.primary[600]] },
  { id: 'low' as TaskPriority, label: 'Low', labelAr: 'منخفضة', color: Colors.slate[400], gradient: ['#64748b', '#475569'] },
];

const recurrencePatterns = [
  { id: 'daily', label: 'Daily', labelAr: 'يومي', icon: '📅' },
  { id: 'weekly', label: 'Weekly', labelAr: 'أسبوعي', icon: '📆' },
  { id: 'monthly', label: 'Monthly', labelAr: 'شهري', icon: '🗓️' },
] as const;

const pointOptions = [5, 10, 15, 20, 25, 50];

export default function AddTaskScreen() {
  const { t } = useTranslation();
  const { effectiveTheme } = useThemeStore();
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const rtl = checkRTL();
  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const { family } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [points, setPoints] = useState(10);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: familyMembers = [] } = useFamilyMembers(family?.id || '');
  const createTask = useCreateTask();

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'يرجى إدخال عنوان المهمة' : 'Please enter a task title'
      );
      return;
    }

    if (!family?.id) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        rtl ? 'لا توجد عائلة محددة' : 'No family selected'
      );
      return;
    }

    try {
      await createTask.mutateAsync({
        family_id: family.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_to: assignedTo || undefined,
        due_date: dueDate?.toISOString(),
        points,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : undefined,
      });

      Alert.alert(
        rtl ? 'نجاح' : 'Success',
        rtl ? 'تم إنشاء المهمة بنجاح' : 'Task created successfully',
        [{ text: rtl ? 'حسناً' : 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        rtl ? 'خطأ' : 'Error',
        error.message || (rtl ? 'فشل في إنشاء المهمة' : 'Failed to create task')
      );
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return rtl ? 'اختر التاريخ' : 'Select date';
    return date.toLocaleDateString(rtl ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedPriority = priorities.find(p => p.id === priority) || priorities[2];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
          {rtl ? 'إضافة مهمة' : 'Add Task'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={createTask.isPending}>
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[600]]}
            style={styles.saveButton}
          >
            {createTask.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Check size={20} color={Colors.white} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Input with Icon */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.primary[100] }]}>
              <Target size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'عنوان المهمة' : 'Task Title'} *
            </Text>
          </View>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={title}
            onChangeText={setTitle}
            placeholder={rtl ? 'ماذا تريد أن تنجز؟' : 'What do you want to accomplish?'}
            placeholderTextColor={theme.placeholder}
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.gold[100] }]}>
              <FileText size={18} color={Colors.gold[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'الوصف' : 'Description'}
            </Text>
          </View>
          <TextInput
            style={[styles.textArea, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, fontFamily: getFont('regular'), textAlign: getTextAlign() }]}
            value={description}
            onChangeText={setDescription}
            placeholder={rtl ? 'أضف تفاصيل المهمة...' : 'Add task details...'}
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            writingDirection={getWritingDirection()}
          />
        </Animated.View>

        {/* Priority Selection */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.inputGroup}>
          <Text style={[styles.sectionLabel, { color: theme.text, fontFamily: getFont('bold'), textAlign: getTextAlign() }]}>
            {rtl ? 'الأولوية' : 'Priority'}
          </Text>
          <View style={[styles.priorityGrid, rtl && styles.rowReverse]}>
            {priorities.map((p, index) => (
              <Animated.View key={p.id} entering={ZoomIn.duration(300).delay(250 + index * 50)}>
                <TouchableOpacity
                  onPress={() => setPriority(p.id)}
                  activeOpacity={0.8}
                >
                  {priority === p.id ? (
                    <LinearGradient
                      colors={p.gradient as [string, string]}
                      style={styles.priorityButton}
                    >
                      <View style={[styles.priorityDot, { backgroundColor: Colors.white }]} />
                      <Text style={[styles.priorityLabel, { color: Colors.white, fontFamily: getFont('bold') }]}>
                        {rtl ? p.labelAr : p.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.priorityButton, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.priorityLabel, { color: theme.text, fontFamily: getFont('medium') }]}>
                        {rtl ? p.labelAr : p.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Assign To */}
        {familyMembers.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.inputGroup}>
            <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
              <View style={[styles.inputIcon, { backgroundColor: Colors.sisters[100] }]}>
                <User size={18} color={Colors.sisters[600]} />
              </View>
              <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
                {rtl ? 'تعيين إلى' : 'Assign To'}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.memberRow, rtl && styles.rowReverse]}>
                {familyMembers.map((member) => {
                  const isSelected = assignedTo === member.user_id;
                  return (
                    <TouchableOpacity
                      key={member.user_id}
                      style={[
                        styles.memberButton,
                        {
                          backgroundColor: isSelected ? Colors.primary[500] : theme.card,
                          borderColor: isSelected ? Colors.primary[500] : theme.cardBorder,
                        },
                      ]}
                      onPress={() => setAssignedTo(assignedTo === member.user_id ? null : member.user_id)}
                    >
                      <View style={[styles.memberAvatar, { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : Colors.primary[100] }]}>
                        <Text style={[styles.memberAvatarText, { color: isSelected ? Colors.white : Colors.primary[600], fontFamily: getFont('bold') }]}>
                          {member.full_name?.charAt(0) || '?'}
                        </Text>
                      </View>
                      <Text style={[styles.memberName, { color: isSelected ? Colors.white : theme.text, fontFamily: getFont('medium') }]}>
                        {member.full_name || member.user_id.slice(0, 8)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Due Date */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.inputGroup}>
          <View style={[styles.inputHeader, rtl && styles.rowReverse]}>
            <View style={[styles.inputIcon, { backgroundColor: Colors.primary[100] }]}>
              <Calendar size={18} color={Colors.primary[600]} />
            </View>
            <Text style={[styles.label, { color: theme.text, fontFamily: getFont('medium') }]}>
              {rtl ? 'تاريخ الاستحقاق' : 'Due Date'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: theme.inputBackground, borderColor: dueDate ? Colors.primary[500] : theme.inputBorder }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Clock size={20} color={dueDate ? Colors.primary[500] : theme.placeholder} />
            <Text style={[styles.dateText, { color: dueDate ? theme.text : theme.placeholder, fontFamily: getFont('regular') }]}>
              {formatDate(dueDate)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </Animated.View>

        {/* Points Selection */}
        <Animated.View entering={FadeInUp.duration(500).delay(350)}>
          <LinearGradient
            colors={[Colors.gold[500], Colors.gold[600]]}
            style={styles.pointsCard}
          >
            <View style={styles.pointsHeader}>
              <View style={styles.pointsIconBg}>
                <Trophy size={24} color={Colors.gold[800]} />
              </View>
              <View style={styles.pointsHeaderText}>
                <Text style={[styles.pointsTitle, { fontFamily: getFont('bold') }]}>
                  {rtl ? 'نقاط المهمة' : 'Task Points'}
                </Text>
                <Text style={[styles.pointsSubtitle, { fontFamily: getFont('regular') }]}>
                  {rtl ? 'مكافأة إنجاز المهمة' : 'Reward for completion'}
                </Text>
              </View>
              <Sparkles size={24} color={Colors.gold[300]} />
            </View>
            <View style={styles.pointsOptions}>
              {pointOptions.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.pointOption,
                    { backgroundColor: points === p ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)' },
                  ]}
                  onPress={() => setPoints(p)}
                >
                  <Zap size={14} color={Colors.gold[900]} />
                  <Text style={[styles.pointOptionText, { color: Colors.gold[900], fontFamily: getFont('bold') }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Recurring Toggle */}
        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.inputGroup}>
          <TouchableOpacity
            style={[styles.recurringToggle, { backgroundColor: isRecurring ? Colors.primary[100] : theme.card, borderColor: isRecurring ? Colors.primary[500] : theme.cardBorder }]}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View style={[styles.checkbox, { borderColor: theme.inputBorder, backgroundColor: isRecurring ? Colors.primary[500] : 'transparent' }]}>
              {isRecurring && <Repeat size={14} color={Colors.white} />}
            </View>
            <View style={styles.recurringText}>
              <Text style={[styles.recurringTitle, { color: theme.text, fontFamily: getFont('bold') }]}>
                {rtl ? 'مهمة متكررة' : 'Recurring Task'}
              </Text>
              <Text style={[styles.recurringSubtitle, { color: theme.textSecondary, fontFamily: getFont('regular') }]}>
                {rtl ? 'ستتكرر هذه المهمة تلقائياً' : 'This task will repeat automatically'}
              </Text>
            </View>
          </TouchableOpacity>

          {isRecurring && (
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.recurrenceRow, rtl && styles.rowReverse]}>
              {recurrencePatterns.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.recurrenceButton,
                    {
                      backgroundColor: recurrencePattern === pattern.id ? Colors.primary[500] : theme.card,
                      borderColor: recurrencePattern === pattern.id ? Colors.primary[500] : theme.cardBorder,
                    },
                  ]}
                  onPress={() => setRecurrencePattern(pattern.id)}
                >
                  <Text style={styles.recurrenceEmoji}>{pattern.icon}</Text>
                  <Text style={[styles.recurrenceText2, { color: recurrencePattern === pattern.id ? Colors.white : theme.text, fontFamily: getFont('medium') }]}>
                    {rtl ? pattern.labelAr : pattern.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>

        {/* Create Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(450)}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createTask.isPending}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary[500], Colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.createButton, createTask.isPending && { opacity: 0.7 }]}
            >
              {createTask.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Target size={22} color={Colors.white} />
                  <Text style={[styles.createButtonText, { fontFamily: getFont('bold') }]}>
                    {rtl ? 'إنشاء المهمة' : 'Create Task'}
                  </Text>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 14,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
  },

  // Priority
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 10,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityLabel: {
    fontSize: 14,
  },

  // Members
  memberRow: {
    flexDirection: 'row',
    gap: 10,
  },
  memberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
  },
  memberName: {
    fontSize: 14,
  },

  // Date
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    gap: 14,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },

  // Points
  pointsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  pointsTitle: {
    fontSize: 17,
    color: Colors.gold[900],
  },
  pointsSubtitle: {
    fontSize: 13,
    color: Colors.gold[800],
    marginTop: 2,
  },
  pointsOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pointOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  pointOptionText: {
    fontSize: 16,
  },

  // Recurring
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringText: {
    flex: 1,
  },
  recurringTitle: {
    fontSize: 16,
    marginBottom: 3,
  },
  recurringSubtitle: {
    fontSize: 13,
  },
  recurrenceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  recurrenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  recurrenceEmoji: {
    fontSize: 18,
  },
  recurrenceText2: {
    fontSize: 14,
  },

  // Create Button
  createButton: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    fontSize: 18,
    color: Colors.white,
  },
});
